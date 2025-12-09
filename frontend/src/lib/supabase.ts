
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase 客戶端設定 (Supabase Client Configuration)
 * 
 * 安全實作 (Security Implementation):
 * - 完全依賴環境變數 (Fully relies on environment variables)
 * - 不包含任何硬編碼憑證 (No hardcoded credentials)
 * - 適用於開發與生產環境 (Works for both dev and production)
 * 
 * 使用說明 (Usage):
 * 1. 本地開發 (Local Development): 在 `.env` 檔案中設定 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY
 * 2. 生產環境 (Production): 在 Render/Vercel 設定環境變數
 * 
 * 注意 (Note):
 * 若環境變數未設定，將會拋出錯誤以避免應用程式在不安全的狀態下運行
 */

/**
 * 安全地獲取環境變數 (Safely Get Environment Variable)
 * 
 * 改善重點 (Improvements):
 * 1. 提供開發模式的優雅降級
 * 2. 避免生產環境直接崩潰
 * 3. 提供清晰的錯誤提示
 * 
 * @param {string} key - 環境變數名稱 (Environment variable name)
 * @param {string} [fallback] - 備用值 (Fallback value)
 * @returns {string} 環境變數值 (Environment variable value)
 */
const getRequiredEnv = (key: string, fallback?: string): string => {
  try {
    // @ts-ignore - Vite 環境變數存取 (Vite environment variable access)
    const value = import.meta.env?.[key];

    if (!value) {
      const isDevelopment = import.meta.env?.MODE === 'development';
      
      if (fallback) {
        console.warn(
          `⚠️ 環境變數 ${key} 未設定，使用備用值。\n` +
          `Environment variable ${key} is not set, using fallback.`
        );
        return fallback;
      }

      const errorMsg = 
        `❌ 環境變數 ${key} 未設定！\n\n` +
        `設定步驟 (Setup Steps):\n` +
        `1. 複製 .env.example 為 .env\n` +
        `2. 填入您的 Supabase 憑證\n` +
        `3. 重新啟動開發伺服器\n\n` +
        `Environment variable ${key} is not set!\n` +
        `Please check your .env file.`;

      console.error(errorMsg);

      // 開發模式：顯示錯誤但不崩潰
      if (isDevelopment) {
        console.warn('⚠️ 開發模式：使用空字串作為備用值');
        return '';
      }

      // 生產模式：拋出錯誤
      throw new Error(`Missing required environment variable: ${key}`);
    }

    return value;
  } catch (error) {
    console.error(`❌ Supabase 設定錯誤 (Configuration Error):`, error);
    throw error;
  }
};

const supabaseUrl = getRequiredEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getRequiredEnv('VITE_SUPABASE_ANON_KEY');

/**
 * 全域 Supabase Client 實例 (Global Supabase Client Instance)
 * 
 * 重要設定 (Important Settings):
 * - persistSession: 啟用 Session 持久化到 localStorage
 * - autoRefreshToken: 自動刷新過期的 Token
 * - detectSessionInUrl: 從 URL 偵測 Session（用於 Email 驗證回調）
 * 
 * 如果配置無效，使用 placeholder 值以避免 createClient 拋出錯誤
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      // 啟用 Session 持久化到 localStorage（防止重新整理後登出）
      persistSession: true,
      // 自動刷新過期的 Access Token（防止一段時間後自動登出）
      autoRefreshToken: true,
      // 從 URL 偵測 Session（用於 Email 驗證回調）
      detectSessionInUrl: true,
      // 使用 localStorage 作為儲存
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      // Session 持久化的 key
      storageKey: 'virtual-coach-auth',
      // 使用 PKCE 流程以提高安全性
      flowType: 'pkce',
    },
    // 全域設定：較長的請求超時
    global: {
      fetch: (url, options) => {
        return fetch(url, { ...options, signal: AbortSignal.timeout(30000) });
      },
    },
  }
);

/**
 * Session 管理模組
 * 
 * 解決的問題：
 * 1. Token 過期導致自動登出
 * 2. 瀏覽器休眠/閒置後 Session 失效
 * 3. setInterval 在背景 tab 不可靠的問題
 */

let sessionRefreshInterval: ReturnType<typeof setInterval> | null = null;
let visibilityChangeHandler: (() => void) | null = null;
let lastRefreshTime: number = 0;

// Token 刷新間隔：2 分鐘（更頻繁檢查，確保不會意外過期）
// Supabase 預設 Token 有效期約 1 小時
const REFRESH_INTERVAL_MS = 2 * 60 * 1000;
// 最小刷新間隔：防止過於頻繁刷新
const MIN_REFRESH_INTERVAL_MS = 30 * 1000;

/**
 * 執行 Session 刷新
 * 帶有防抖動機制，避免短時間內重複刷新
 * 
 * 🔧 修復：Supabase JS v2 的 refreshSession() 不需要傳入參數
 * 它會自動使用當前 session 中的 refresh_token
 */
const performSessionRefresh = async (force: boolean = false): Promise<boolean> => {
  const now = Date.now();
  
  // 防抖動：如果距離上次刷新時間太短，跳過（除非強制刷新）
  if (!force && (now - lastRefreshTime) < MIN_REFRESH_INTERVAL_MS) {
    return true;
  }
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('⚠️ 無有效 Session，跳過刷新');
      return false;
    }
    
    // 檢查 Token 是否即將過期（提前 10 分鐘刷新，更保守的策略）
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const expiresInMs = expiresAt * 1000 - now;
      const tenMinutesMs = 10 * 60 * 1000;
      
      // 如果 Token 還有超過 10 分鐘才過期，且不是強制刷新，可以跳過
      if (!force && expiresInMs > tenMinutesMs) {
        console.log(`✓ Token 仍有效（剩餘 ${Math.round(expiresInMs / 60000)} 分鐘）`);
        lastRefreshTime = now;
        return true;
      }
      
      console.log(`⏰ Token 即將過期（剩餘 ${Math.round(expiresInMs / 60000)} 分鐘），執行刷新...`);
    }
    
    // 🔧 修復：Supabase JS v2 的 refreshSession() 不需要傳入參數
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.warn('❌ Session 刷新失敗:', error.message);
      
      // 如果是 refresh_token 無效，嘗試重新取得 Session
      if (error.message.includes('refresh_token') || error.message.includes('invalid') || error.message.includes('expired')) {
        console.log('嘗試從 storage 恢復 Session...');
        const { data: recoveredSession } = await supabase.auth.getSession();
        if (recoveredSession.session) {
          console.log('✅ 從 storage 恢復 Session 成功');
          lastRefreshTime = now;
          return true;
        }
      }
      return false;
    }
    
    if (data.session) {
      console.log('✅ Session 已成功刷新，新 Token 有效期至:', new Date(data.session.expires_at! * 1000).toLocaleString());
      lastRefreshTime = now;
      return true;
    }
    
    return false;
  } catch (e) {
    console.warn('Session 刷新發生錯誤:', e);
    return false;
  }
};

/**
 * 處理頁面可見性變化
 * 當使用者從其他 tab 切換回來，或從休眠中恢復時觸發
 */
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible') {
    console.log('📱 頁面重新可見，檢查 Session 狀態...');
    
    // 強制刷新 Session（因為可能已經休眠很久）
    const success = await performSessionRefresh(true);
    
    if (!success) {
      console.warn('⚠️ 頁面恢復後 Session 刷新失敗');
    }
  }
};

/**
 * 開始 Session 自動刷新
 * 使用多重機制確保 Session 不會意外過期
 */
export const startSessionRefresh = () => {
  // 避免重複註冊
  if (sessionRefreshInterval) return;
  
  console.log('🔄 啟動 Session 自動刷新機制');
  
  // 立即執行一次刷新檢查
  performSessionRefresh(false);
  
  // 機制 1：定時刷新（每 3 分鐘）
  sessionRefreshInterval = setInterval(() => {
    performSessionRefresh(false);
  }, REFRESH_INTERVAL_MS);
  
  // 機制 2：監聽頁面可見性變化（處理休眠/切換 tab）
  if (typeof document !== 'undefined' && !visibilityChangeHandler) {
    visibilityChangeHandler = handleVisibilityChange;
    document.addEventListener('visibilitychange', visibilityChangeHandler);
  }
  
  // 機制 3：監聯網路恢復事件
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      console.log('🌐 網路已恢復，刷新 Session...');
      performSessionRefresh(true);
    });
  }
};

/**
 * 停止 Session 自動刷新
 */
export const stopSessionRefresh = () => {
  if (sessionRefreshInterval) {
    clearInterval(sessionRefreshInterval);
    sessionRefreshInterval = null;
  }
  
  if (visibilityChangeHandler && typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', visibilityChangeHandler);
    visibilityChangeHandler = null;
  }
  
  console.log('⏹️ Session 自動刷新已停止');
};

/**
 * 手動觸發 Session 刷新（供外部呼叫）
 */
export const forceRefreshSession = async (): Promise<boolean> => {
  return performSessionRefresh(true);
};

/**
 * 檢查 Supabase 是否已正確配置
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);