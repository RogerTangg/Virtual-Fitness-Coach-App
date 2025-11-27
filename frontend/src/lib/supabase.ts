
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
 * 初始化 Session 監控與自動刷新
 * 每 4 分鐘主動檢查並刷新 Session，避免 Token 過期導致自動登出
 */
let sessionRefreshInterval: ReturnType<typeof setInterval> | null = null;

export const startSessionRefresh = () => {
  if (sessionRefreshInterval) return;
  
  sessionRefreshInterval = setInterval(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // 主動刷新 Session
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.warn('Session 刷新失敗:', error.message);
        } else {
          console.log('✅ Session 已主動刷新');
        }
      }
    } catch (e) {
      console.warn('Session 檢查失敗:', e);
    }
  }, 4 * 60 * 1000); // 每 4 分鐘
};

export const stopSessionRefresh = () => {
  if (sessionRefreshInterval) {
    clearInterval(sessionRefreshInterval);
    sessionRefreshInterval = null;
  }
};

/**
 * 檢查 Supabase 是否已正確配置
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);