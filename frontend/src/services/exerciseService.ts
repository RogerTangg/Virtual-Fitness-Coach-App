
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Exercise } from '../types/db';
import { MOCK_EXERCISES } from '../data/mockExercises';

/**
 * 帶超時的 Promise 包裝器
 * @param promise - 原始 Promise
 * @param timeoutMs - 超時時間（毫秒）
 */
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
};

/**
 * 將資料庫欄位轉換為 tags 格式
 * 資料庫: target_muscles, training_goals, difficulty, equipment
 * App 期望: tags: ["goal:增肌", "difficulty:初階", "equipment:徒手"]
 */
const convertDbToTags = (dbRow: any): string[] => {
  const tags: string[] = [];

  // 難度轉換
  const difficultyMap: Record<string, string> = {
    'beginner': '初階',
    'intermediate': '中階',
    'advanced': '高階'
  };
  if (dbRow.difficulty) {
    tags.push(`difficulty:${difficultyMap[dbRow.difficulty] || dbRow.difficulty}`);
  }

  // 訓練目標轉換
  const goalMap: Record<string, string> = {
    'strength': '增肌',
    'muscle_gain': '增肌',
    'fat_loss': '減脂',
    'endurance': '塑形'
  };
  if (Array.isArray(dbRow.training_goals)) {
    dbRow.training_goals.forEach((goal: string) => {
      const mapped = goalMap[goal] || goal;
      if (!tags.includes(`goal:${mapped}`)) {
        tags.push(`goal:${mapped}`);
      }
    });
  }

  // 器材轉換
  if (Array.isArray(dbRow.equipment) && dbRow.equipment.length > 0) {
    dbRow.equipment.forEach((eq: string) => {
      tags.push(`equipment:${eq}`);
    });
  } else {
    tags.push('equipment:徒手'); // 無器材 = 徒手
  }

  // 肌群轉換為類型
  if (Array.isArray(dbRow.target_muscles)) {
    if (dbRow.target_muscles.includes('core')) {
      tags.push('type:核心');
    } else if (dbRow.target_muscles.includes('full_body')) {
      tags.push('type:有氧');
    } else {
      tags.push('type:肌力');
    }
  }

  return tags;
};

/**
 * 獲取所有運動資料
 * 
 * 目前策略：直接使用模擬資料，確保 App 穩定運作
 * 
 * TODO: 待 Supabase RLS 政策修復後，重新啟用資料庫查詢
 * 問題：exercises 表的 RLS 政策導致 anon 用戶查詢卡住（無回應）
 * 解決方案：在 Supabase Dashboard 執行以下 SQL：
 * 
 * DROP POLICY IF EXISTS "Allow public read access to active exercises" ON public.exercises;
 * CREATE POLICY "Allow anyone to read exercises" ON public.exercises FOR SELECT TO anon, authenticated USING (true);
 */
export const getAllExercises = async (): Promise<Exercise[]> => {
  // 暫時直接返回模擬資料，避免 RLS 問題導致請求卡住
  // 當 Supabase RLS 修復後，將下面的 return 註解掉即可恢復資料庫查詢
  return MOCK_EXERCISES;

  /* 資料庫查詢邏輯（RLS 修復後取消註解）
  try {
    if (!isSupabaseConfigured) {
      return MOCK_EXERCISES;
    }

    const { data, error } = await withTimeout(
      supabase.from('exercises').select('*'),
      3000
    );

    if (error || !data || data.length === 0) {
      return MOCK_EXERCISES;
    }

    return data.map((item: any) => ({
      id: item.id,
      created_at: item.created_at,
      name: item.name,
      description: item.description || '',
      video_url: item.video_url,
      duration_seconds: item.duration_seconds,
      tags: convertDbToTags(item)
    }));

  } catch {
    return MOCK_EXERCISES;
  }
  */
};
