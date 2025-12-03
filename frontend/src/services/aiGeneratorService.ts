/**
 * AI 訓練生成器服務 (AI Workout Generator Service)
 * 
 * 使用 Google Gemini Flash 2.5 模型生成個人化訓練課表
 * 
 * 安全實作 (Security Implementation):
 * - 方案 A (推薦): 透過 Supabase Edge Function 代理，API Key 存於伺服器
 * - 方案 B (備用): 直接呼叫 Gemini API（開發環境或 Edge Function 未部署時）
 * 
 * @author Virtual Fitness Coach Team
 * @version 3.0
 */

import { Exercise } from '../types/db';
import { UserPreferences, PlanItem } from '../types/app';
import { getAllExercises } from './exerciseService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * 檢查是否使用 Edge Function（安全模式）
 */
const shouldUseEdgeFunction = (): boolean => {
  // @ts-ignore - Vite 環境變數存取
  const useEdgeFunction = import.meta.env?.VITE_USE_EDGE_FUNCTION;
  
  // 若明確設為 'false' 則不使用（開發用）
  if (useEdgeFunction === 'false') {
    console.warn('⚠️ 安全警告：正在使用不安全的直接 API 呼叫模式');
    return false;
  }
  
  // 預設使用 Edge Function（安全模式）
  return true;
};

/**
 * 取得 Gemini API Key（僅用於開發/備用模式）
 */
const getGeminiApiKey = (): string => {
  // @ts-ignore - Vite 環境變數存取
  const key = import.meta.env?.VITE_GEMINI_API_KEY;
  return key || '';
};

// Gemini API 設定（備用模式使用）
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * 訓練目標翻譯映射
 */
const GOAL_LABELS: Record<string, string> = {
  'muscle': '增肌訓練',
  'fat-loss': '減脂燃脂',
  'tone': '塑形雕塑',
  'flexibility': '柔軟度提升',
};

/**
 * 難度翻譯映射
 */
const DIFFICULTY_LABELS: Record<string, string> = {
  'beginner': '初階',
  'intermediate': '中階',
  'advanced': '高階',
};

/**
 * 器材翻譯映射
 */
const EQUIPMENT_LABELS: Record<string, string> = {
  'bodyweight': '徒手',
  'dumbbell': '啞鈴',
  'band': '彈力帶',
  'kettlebell': '壺鈴',
};

/**
 * 透過 Supabase Edge Function 呼叫 AI（安全模式）
 * API Key 存於伺服器端，不會暴露給前端
 */
async function callEdgeFunction(
  exercises: Array<{ id: string; name: string; duration: number; description: string; tags: string[] }>,
  preferences: UserPreferences
): Promise<string[]> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase 未配置');
  }

  try {
    const { data, error } = await supabase.functions.invoke('generate-workout', {
      body: { exercises, preferences },
    });

    if (error) {
      console.error('Edge Function 錯誤:', error);
      throw error;
    }

    if (!data?.success || !Array.isArray(data.selectedExerciseIds)) {
      console.error('Edge Function 回應格式錯誤:', data);
      throw new Error('Invalid response format');
    }

    console.log('🔒 透過 Edge Function 安全呼叫 AI 成功');
    return data.selectedExerciseIds;
    
  } catch (error) {
    console.error('Edge Function 呼叫失敗:', error);
    throw error;
  }
}

/**
 * 直接呼叫 Gemini API（備用模式，開發環境使用）
 * ⚠️ 警告：此模式會將 API Key 暴露在瀏覽器 Network 請求中
 */
async function callGeminiDirectly(prompt: string): Promise<string> {
  const apiKey = getGeminiApiKey();
  
  if (!apiKey) {
    throw new Error('Gemini API Key 未設定');
  }

  console.warn('⚠️ 警告：正在使用不安全的直接 API 呼叫（僅限開發環境）');

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API 錯誤:', errorText);
      throw new Error(`Gemini API 請求失敗: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('Gemini API 回應格式錯誤');
    }

    return text;
  } catch (error) {
    console.error('直接呼叫 Gemini API 失敗:', error);
    throw error;
  }
}

/**
 * 解析 AI 回應中的運動 ID 列表
 */
function parseExerciseIds(response: string): string[] {
  // 嘗試匹配 JSON 陣列格式
  const jsonMatch = response.match(/\[[\s\S]*?\]/);
  if (jsonMatch) {
    try {
      const ids = JSON.parse(jsonMatch[0]);
      if (Array.isArray(ids)) {
        return ids.filter(id => typeof id === 'string');
      }
    } catch {
      // 解析失敗，繼續嘗試其他格式
    }
  }

  // 嘗試匹配 UUID 格式
  const idPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi;
  const matches = response.match(idPattern);
  return matches ? [...new Set(matches)] : [];
}

/**
 * 建構 AI 提示詞
 */
function buildPrompt(
  exercises: Array<{ id: string; name: string; duration: number; description: string; tags: string[] }>,
  prefs: UserPreferences
): string {
  return `你是一位專業的健身教練。請根據以下條件，從提供的運動列表中選擇最適合的運動組合來設計一個訓練課表。

## 使用者需求
- **訓練目標**: ${GOAL_LABELS[prefs.goal] || prefs.goal}
- **訓練時長**: ${prefs.durationMinutes} 分鐘
- **難度等級**: ${DIFFICULTY_LABELS[prefs.difficulty] || prefs.difficulty}
- **可用器材**: ${prefs.equipment.map(e => EQUIPMENT_LABELS[e] || e).join('、')}

## 可選運動列表
${JSON.stringify(exercises, null, 2)}

## 設計要求
1. 總訓練時間（包含休息）應接近 ${prefs.durationMinutes} 分鐘
2. 每個運動之間會有 30 秒休息時間
3. 選擇多樣化的運動，避免連續相同肌群
4. 根據訓練目標選擇最合適的運動
5. 確保運動順序合理（先暖身、後主訓練）

## 回應格式
請只回傳選中運動的 ID 陣列（JSON 格式），按照建議的執行順序排列。
例如: ["id1", "id2", "id3", ...]

請直接回傳 JSON 陣列，不要包含其他說明文字。`;
}

/**
 * 使用 AI 生成訓練課表 (AI-Powered Workout Plan Generation)
 * 
 * 核心流程:
 * 1. 從資料庫獲取所有可用運動
 * 2. 根據使用者偏好篩選運動
 * 3. 優先使用 Edge Function（安全模式）呼叫 AI
 * 4. 若 Edge Function 失敗，嘗試直接呼叫（僅開發環境）
 * 5. 若都失敗，使用 Fallback 生成器
 * 
 * @param prefs 使用者偏好設定
 * @returns 訓練計畫陣列
 */
export async function generateAIWorkoutPlan(prefs: UserPreferences): Promise<PlanItem[]> {
  console.log('🤖 開始 AI 訓練生成...', prefs);

  // 1. 獲取所有可用運動
  const allExercises = await getAllExercises();
  
  // 2. 根據器材和難度預先篩選
  const filteredExercises = allExercises.filter(ex => {
    const tags = Array.isArray(ex.tags) ? ex.tags : [];
    
    // 器材檢查
    const eqTag = tags.find(t => t.startsWith('equipment:'))?.split(':')[1];
    let eqId = 'bodyweight';
    if (eqTag === '啞鈴') eqId = 'dumbbell';
    else if (eqTag === '彈力帶') eqId = 'band';
    else if (eqTag === '壺鈴') eqId = 'kettlebell';
    else if (eqTag === '徒手') eqId = 'bodyweight';
    
    if (!prefs.equipment.includes(eqId)) return false;

    // 難度檢查
    const diffTag = tags.find(t => t.startsWith('difficulty:'))?.split(':')[1];
    if (prefs.difficulty === 'beginner' && diffTag !== '初階') return false;
    if (prefs.difficulty === 'intermediate' && diffTag === '高階') return false;
    
    return true;
  });

  if (filteredExercises.length === 0) {
    console.warn('沒有符合條件的運動，使用 fallback');
    return fallbackGenerate(allExercises, prefs);
  }

  // 3. 準備 AI 所需資料
  const exerciseListForAI = filteredExercises.map(ex => ({
    id: ex.id,
    name: ex.name,
    duration: ex.duration_seconds,
    description: ex.description,
    tags: ex.tags,
  }));

  let selectedIds: string[] = [];
  
  try {
    // 4. 優先使用 Edge Function（安全模式）
    if (shouldUseEdgeFunction()) {
      console.log('🔒 使用 Edge Function 安全模式呼叫 AI...');
      try {
        selectedIds = await callEdgeFunction(exerciseListForAI, prefs);
        console.log('✅ Edge Function 回傳運動 IDs:', selectedIds);
      } catch (edgeFnError) {
        console.warn('Edge Function 失敗，嘗試備用方案:', edgeFnError);
        
        // 5. Edge Function 失敗時，嘗試直接呼叫（僅開發環境）
        const apiKey = getGeminiApiKey();
        if (apiKey) {
          console.log('⚠️ 降級至直接 API 呼叫模式...');
          const prompt = buildPrompt(exerciseListForAI, prefs);
          const aiResponse = await callGeminiDirectly(prompt);
          selectedIds = parseExerciseIds(aiResponse);
        } else {
          throw new Error('無可用的 AI 呼叫方式');
        }
      }
    } else {
      // 直接呼叫模式（開發環境）
      console.log('⚠️ 使用直接 API 呼叫模式（開發環境）...');
      const prompt = buildPrompt(exerciseListForAI, prefs);
      const aiResponse = await callGeminiDirectly(prompt);
      console.log('🤖 AI 回應:', aiResponse);
      selectedIds = parseExerciseIds(aiResponse);
    }
    
    if (selectedIds.length === 0) {
      console.warn('AI 未回傳有效的運動 ID，使用 fallback');
      return fallbackGenerate(filteredExercises, prefs);
    }

    // 6. 根據 AI 選擇的 ID 組裝課表
    const plan: PlanItem[] = [];
    const REST_DURATION = 30;
    let currentDuration = 0;
    const targetDurationSeconds = prefs.durationMinutes * 60;

    for (const id of selectedIds) {
      const exercise = filteredExercises.find(ex => ex.id === id);
      if (!exercise) continue;

      // 檢查是否超過目標時間
      if (currentDuration + exercise.duration_seconds > targetDurationSeconds + 60) {
        break;
      }

      // 加入運動
      plan.push({
        type: 'exercise',
        duration: exercise.duration_seconds,
        exercise: exercise,
        title: exercise.name,
      });
      currentDuration += exercise.duration_seconds;

      // 加入休息（最後一個不需要）
      if (currentDuration + REST_DURATION < targetDurationSeconds) {
        plan.push({
          type: 'rest',
          duration: REST_DURATION,
          title: '休息',
          exercise: undefined,
        });
        currentDuration += REST_DURATION;
      }
    }

    // 若課表太短，補充運動
    if (plan.filter(p => p.type === 'exercise').length < 3) {
      console.warn('AI 生成的課表太短，使用 fallback 補充');
      return fallbackGenerate(filteredExercises, prefs);
    }

    console.log('✅ AI 訓練課表生成完成，共', plan.filter(p => p.type === 'exercise').length, '個運動');
    return plan;

  } catch (error) {
    console.error('AI 生成失敗，使用 fallback:', error);
    return fallbackGenerate(filteredExercises, prefs);
  }
}

/**
 * Fallback 生成器 (當 AI 失敗時使用)
 * 使用簡單的隨機洗牌演算法
 */
function fallbackGenerate(exercises: Exercise[], prefs: UserPreferences): PlanItem[] {
  console.log('📋 使用 Fallback 生成器...');
  
  // Fisher-Yates 洗牌
  const shuffled = [...exercises];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const plan: PlanItem[] = [];
  let currentDuration = 0;
  const targetDurationSeconds = prefs.durationMinutes * 60;
  const REST_DURATION = 30;

  let index = 0;
  while (currentDuration < targetDurationSeconds && index < shuffled.length * 2) {
    const exercise = shuffled[index % shuffled.length];

    plan.push({
      type: 'exercise',
      duration: exercise.duration_seconds,
      exercise: exercise,
      title: exercise.name,
    });
    currentDuration += exercise.duration_seconds;

    if (currentDuration >= targetDurationSeconds) break;

    if (currentDuration + REST_DURATION < targetDurationSeconds) {
      plan.push({
        type: 'rest',
        duration: REST_DURATION,
        title: '休息',
        exercise: undefined,
      });
      currentDuration += REST_DURATION;
    }

    index++;
  }

  return plan;
}
