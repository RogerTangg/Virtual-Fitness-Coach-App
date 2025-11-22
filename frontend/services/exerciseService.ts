
import { supabase } from '../lib/supabase';
import { Exercise } from '../types/db';
import { MOCK_EXERCISES } from '../data/mockExercises';

/**
 * 獲取所有運動資料
 * 策略：優先從 Supabase 獲取，若失敗或無資料，則使用 Mock Data。
 */
export const getAllExercises = async (): Promise<Exercise[]> => {
  try {
    // 檢查 Supabase 客戶端是否已配置 URL (避免無效請求)
    // @ts-ignore - 存取內部屬性以進行快速檢查
    if (!supabase.supabaseUrl || supabase.supabaseUrl === '') {
      console.warn('Supabase URL 未設定，使用模擬資料。');
      return MOCK_EXERCISES;
    }

    const { data, error } = await supabase
      .from('exercises')
      .select('*');

    if (error) {
      console.error('Supabase 請求錯誤:', error.message);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn('資料庫為空，使用模擬資料。');
      return MOCK_EXERCISES;
    }

    // 資料清洗 (Sanitization)
    // 確保每一筆資料都符合 TypeScript 定義，特別是 tags 必須是陣列
    const sanitizedData = data.map((item: any) => ({
      ...item,
      // 如果 tags 是 null 或 undefined，強制轉為空陣列
      tags: Array.isArray(item.tags) ? item.tags : [] 
    }));

    return sanitizedData as Exercise[];

  } catch (error) {
    console.error('獲取運動資料失敗，切換至模擬資料模式:', error);
    // Fallback strategy: 確保 App 永遠可用
    return MOCK_EXERCISES;
  }
};
