
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
 * @param {string} key - 環境變數名稱 (Environment variable name)
 * @returns {string} 環境變數值 (Environment variable value)
 * @throws {Error} 若環境變數未設定 (If environment variable is not set)
 */
const getRequiredEnv = (key: string): string => {
  try {
    // @ts-ignore - Vite 環境變數存取 (Vite environment variable access)
    const value = import.meta.env?.[key];

    if (!value) {
      throw new Error(
        `環境變數 ${key} 未設定。請在 .env 檔案中設定此變數。\n` +
        `Environment variable ${key} is not set. Please configure it in your .env file.`
      );
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
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);