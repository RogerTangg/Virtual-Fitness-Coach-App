
import { Exercise } from '../../types/db';
import { UserPreferences, PlanItem } from '../../types/app';
import { getAllExercises } from '../../services/exerciseService';

/**
 * Fisher-Yates 洗牌演算法 (Fisher-Yates Shuffle Algorithm)
 * 
 * 用於隨機化陣列順序，確保每個元素出現在任何位置的機率相等
 * 
 * 演算法說明 (Algorithm Explanation):
 * 從陣列末端開始，逐一與隨機位置的元素交換
 * 時間複雜度 (Time Complexity): O(n)
 * 空間複雜度 (Space Complexity): O(n) (創建副本)
 * 
 * @template T - 陣列元素型別 (Array element type)
 * @param {T[]} array - 待洗牌的陣列 (Array to shuffle)
 * @returns {T[]} 洗牌後的新陣列 (Shuffled array)
 */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 解析標籤值 (Parse Tag Value)
 * 
 * 從標籤陣列中提取特定前綴的值
 * 例如從 "difficulty:初階" 解析出 "初階"
 * 
 * 增加防呆機制，避免 undefined 導致崩潰
 * 
 * @param {string[] | undefined | null} tags - 標籤陣列 (Tags array)
 * @param {string} prefix - 標籤前綴 (Tag prefix), 例如 "difficulty", "equipment"
 * @returns {string | null} 解析後的值，若無匹配則回傳 null (Parsed value or null)
 * 
 * @example
 * getTagValue(['difficulty:初階', 'goal:增肌'], 'difficulty') // returns '初階'
 * getTagValue(['equipment:啞鈴'], 'goal') // returns null
 */
const getTagValue = (tags: string[] | undefined | null, prefix: string): string | null => {
  if (!tags || !Array.isArray(tags)) return null;
  const tag = tags.find(t => t.startsWith(prefix + ':'));
  return tag ? tag.split(':')[1] : null;
};

/**
 * 根據使用者偏好生成客製化訓練課表 (Generate Customized Workout Plan Based on User Preferences)
 * 
 * 核心演算法 (Core Algorithm):
 * 1. 從 Supabase 獲取所有運動資料 (Fetch all exercises from Supabase)
 * 2. 根據使用者的器材、難度、目標進行篩選 (Filter by equipment, difficulty, goal)
 * 3. 隨機洗牌篩選後的運動 (Shuffle filtered exercises)
 * 4. 組裝訓練課表，插入休息時間 (Assemble workout plan with rest periods)
 * 
 * 篩選規則 (Filtering Rules):
 * - 器材 (Equipment): 使用者的器材清單必須包含該運動所需器材
 * - 難度 (Difficulty): 
 *   - 初階 (Beginner): 僅顯示初階運動
 *   - 中階 (Intermediate): 顯示初階與中階運動
 *   - 高階 (Advanced): 顯示所有難度的運動
 * - 目標 (Goal): 當前為軟性條件，不強制篩選
 * 
 * Fallback 機制 (Fallback Mechanism):
 * 若篩選後無符合的運動，使用所有徒手運動作為備案
 * 
 * @param {UserPreferences} prefs - 使用者偏好設定 (User preferences)
 * @returns {Promise<PlanItem[]>} 訓練計畫陣列 (Workout plan items)
 * 
 * @example
 * const plan = await generateWorkoutPlan({
 *   goal: 'muscle',
 *   equipment: ['bodyweight', 'dumbbell'],
 *   durationMinutes: 30,
 *   difficulty: 'intermediate'
 * });
 */
export const generateWorkoutPlan = async (prefs: UserPreferences): Promise<PlanItem[]> => {
  // 1. 獲取所有動作 (Service 層已做過清洗，確保 tags 為陣列)
  const allExercises = await getAllExercises();

  // 2. 過濾動作 (Filter)
  const filtered = allExercises.filter(ex => {
    // 雙重保險：確保 tags 存在
    const safeTags = Array.isArray(ex.tags) ? ex.tags : [];

    // A. 器材檢查 (Equipment)
    // 規則：使用者的器材清單必須包含該動作所需的器材
    const eqTag = getTagValue(safeTags, 'equipment'); // e.g., "啞鈴"

    // 將中文標籤轉換為內部 ID (簡單映射)
    let eqId = 'bodyweight'; // default
    if (eqTag === '啞鈴') eqId = 'dumbbell';
    else if (eqTag === '彈力帶') eqId = 'band';
    else if (eqTag === '壺鈴') eqId = 'kettlebell';
    else if (eqTag === '徒手') eqId = 'bodyweight';

    if (!prefs.equipment.includes(eqId)) return false;

    // B. 難度檢查 (Difficulty)
    const diffTag = getTagValue(safeTags, 'difficulty'); // e.g., "初階"

    if (prefs.difficulty === 'beginner') {
      if (diffTag !== '初階') return false;
    } else if (prefs.difficulty === 'intermediate') {
      if (diffTag === '高階') return false;
    }
    // Advanced 接受所有難度，不做過濾

    // C. 目標檢查 (Goal) - 目前僅用來過濾器材與難度，目標作為軟性篩選條件(暫不強制)
    // 未來可考慮加入目標篩選: safeTags.some(t => t === `goal:${goalMap[prefs.goal]}`)

    return true;
  });

  // 若過濾後無動作，回傳空陣列或預設動作 (避免 Crash)
  if (filtered.length === 0) {
    console.warn('沒有符合條件的動作，使用所有徒手動作作為備案');
    // 從原始資料中撈出徒手動作，同樣確保 tags 安全
    return allExercises
      .filter(ex => (Array.isArray(ex.tags) ? ex.tags : []).includes('equipment:徒手'))
      .slice(0, 5)
      .map(ex => ({
        type: 'exercise',
        duration: ex.duration_seconds,
        exercise: ex,
        title: ex.name
      }));
  }

  // 3. 洗牌 (Shuffle)
  const shuffled = shuffle(filtered);

  // 4. 組裝課表 (Assemble)
  const plan: PlanItem[] = [];
  let currentDuration = 0;
  const targetDurationSeconds = prefs.durationMinutes * 60;
  const REST_DURATION = 30; // 固定 30 秒休息

  let index = 0;
  while (currentDuration < targetDurationSeconds) {
    // 取出動作 (若用完則循環)
    const exercise = shuffled[index % shuffled.length];

    // 加入動作
    plan.push({
      type: 'exercise',
      duration: exercise.duration_seconds,
      exercise: exercise,
      title: exercise.name
    });
    currentDuration += exercise.duration_seconds;

    // 檢查是否超過時間，若超過則停止
    if (currentDuration >= targetDurationSeconds) break;

    // 加入休息 (最後一個動作後不需要休息)
    if (currentDuration + REST_DURATION < targetDurationSeconds) {
      plan.push({
        type: 'rest',
        duration: REST_DURATION,
        title: '休息',
        exercise: undefined
      });
      currentDuration += REST_DURATION;
    }

    index++;
  }

  return plan;
};
