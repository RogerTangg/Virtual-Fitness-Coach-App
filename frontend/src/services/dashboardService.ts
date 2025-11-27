/**
 * 儀表板數據服務 (Dashboard Data Service)
 * Phase 2: 儀表板與數據分析模組
 * 
 * 提供儀表板所需的統計數據、日曆資料與分析圖表數據
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { WorkoutLog, WorkoutStats } from '../types/workoutLog';

/**
 * 日曆視圖的訓練日期資料
 */
export interface CalendarWorkoutDay {
  /** 日期 (YYYY-MM-DD 格式) */
  date: string;
  /** 當日訓練次數 */
  workoutCount: number;
  /** 當日總訓練時長 (分鐘) */
  totalMinutes: number;
}

/**
 * 部位/標籤分佈數據 (用於圓餅圖)
 */
export interface TagDistribution {
  /** 標籤名稱 */
  tag: string;
  /** 出現次數 */
  count: number;
  /** 百分比 */
  percentage: number;
  /** 顏色 (用於圖表) */
  color: string;
}

/**
 * 儀表板完整數據
 */
export interface DashboardData {
  /** 基本統計 */
  stats: WorkoutStats & {
    /** 預估消耗熱量 (kcal) */
    estimatedCalories: number;
    /** 本週訓練次數 */
    weeklyWorkouts: number;
    /** 本月訓練次數 */
    monthlyWorkouts: number;
  };
  /** 日曆資料 (近 3 個月) */
  calendarData: CalendarWorkoutDay[];
  /** 標籤分佈 */
  tagDistribution: TagDistribution[];
  /** 最近訓練 */
  recentWorkouts: {
    id: string;
    date: string;
    duration: number;
    goal: string;
    rating: number | null;
  }[];
}

/**
 * 本地儲存鍵名 (訪客模式)
 */
const LOCAL_STORAGE_KEY = 'virtual_coach_workout_logs';

/**
 * 訓練目標翻譯映射表 (英文 → 繁體中文)
 */
const GOAL_TRANSLATIONS: Record<string, string> = {
  'muscle': '增肌',
  'muscle_gain': '增肌',
  'fat-loss': '減脂',
  'fat_loss': '減脂',
  'tone': '塑形',
  'flexibility': '柔軟度',
  'cardio': '有氧',
  'strength': '肌力',
  'endurance': '耐力',
  'balance': '平衡',
  'full_body': '全身',
  'upper_body': '上肢',
  'lower_body': '下肢',
  'core': '核心',
};

/**
 * 將訓練目標轉換為繁體中文
 */
function translateGoal(goal: string): string {
  return GOAL_TRANSLATIONS[goal] || goal;
}

/**
 * 標籤顏色對應表
 */
const TAG_COLORS: Record<string, string> = {
  '全身': '#4F7942',     // brand-dark
  '上肢': '#7CB342',     // 綠色
  '下肢': '#8BC34A',     // 淺綠
  '核心': '#AED581',     // 更淺綠
  '有氧': '#FF7043',     // 橘色
  '肌力': '#42A5F5',     // 藍色
  '伸展': '#AB47BC',     // 紫色
  '平衡': '#26A69A',     // 青綠
  '爆發力': '#EF5350',   // 紅色
  '減脂': '#FFA726',     // 橙黃
  '增肌': '#5C6BC0',     // 靛藍
  '塑形': '#EC407A',     // 粉紅
  '耐力': '#78909C',     // 灰藍
  '其他': '#9E9E9E',     // 灰色
};

/**
 * 從本地儲存讀取訓練紀錄 (訪客模式)
 */
function getLocalWorkoutLogs(): WorkoutLog[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * 預估消耗熱量 (簡化計算)
 * 基於 MET 值：中等強度運動約 5 MET
 * 公式: 卡路里 = MET × 體重(kg) × 時間(小時)
 * 假設平均體重 65kg
 */
function estimateCalories(totalMinutes: number): number {
  const MET = 5; // 中等強度
  const weight = 65; // 假設體重
  const hours = totalMinutes / 60;
  return Math.round(MET * weight * hours);
}

/**
 * 計算連續訓練天數 (Streak)
 */
function calculateStreak(logs: { started_at: string }[]): number {
  if (logs.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 取得所有訓練日期 (去重)
  const workoutDates = new Set<string>();
  logs.forEach(log => {
    const date = new Date(log.started_at);
    date.setHours(0, 0, 0, 0);
    workoutDates.add(date.toISOString().split('T')[0]);
  });

  let streak = 0;
  const checkDate = new Date(today);
  
  // 如果今天沒有訓練，從昨天開始算
  const todayStr = today.toISOString().split('T')[0];
  if (!workoutDates.has(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
    if (!workoutDates.has(checkDate.toISOString().split('T')[0])) {
      return 0;
    }
  }

  while (workoutDates.has(checkDate.toISOString().split('T')[0])) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

/**
 * 生成日曆資料 (近 3 個月)
 */
function generateCalendarData(logs: WorkoutLog[]): CalendarWorkoutDay[] {
  const calendarMap = new Map<string, CalendarWorkoutDay>();
  
  logs.forEach(log => {
    const date = log.started_at.split('T')[0];
    const existing = calendarMap.get(date);
    
    if (existing) {
      existing.workoutCount++;
      existing.totalMinutes += log.duration_minutes;
    } else {
      calendarMap.set(date, {
        date,
        workoutCount: 1,
        totalMinutes: log.duration_minutes,
      });
    }
  });

  return Array.from(calendarMap.values()).sort((a, b) => 
    b.date.localeCompare(a.date)
  );
}

/**
 * 計算標籤分佈
 */
function calculateTagDistribution(logs: WorkoutLog[]): TagDistribution[] {
  const tagCount = new Map<string, number>();
  
  // 計算每個 goal 出現次數 (翻譯為繁體中文)
  logs.forEach(log => {
    const rawGoal = log.settings?.goal || '其他';
    const goal = translateGoal(rawGoal);
    tagCount.set(goal, (tagCount.get(goal) || 0) + 1);
  });

  const total = logs.length || 1;
  
  return Array.from(tagCount.entries())
    .map(([tag, count]) => ({
      tag,
      count,
      percentage: Math.round((count / total) * 100),
      color: TAG_COLORS[tag] || TAG_COLORS['其他'],
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 取得儀表板完整數據
 * 
 * @param userId - 使用者 ID (null 為訪客模式)
 * @returns 儀表板數據
 */
export async function getDashboardData(
  userId: string | null
): Promise<DashboardData> {
  const defaultData: DashboardData = {
    stats: {
      totalWorkouts: 0,
      totalMinutes: 0,
      avgRating: null,
      lastWorkoutAt: null,
      currentStreak: 0,
      estimatedCalories: 0,
      weeklyWorkouts: 0,
      monthlyWorkouts: 0,
    },
    calendarData: [],
    tagDistribution: [],
    recentWorkouts: [],
  };

  let logs: WorkoutLog[] = [];

  // 訪客模式：從本地讀取
  if (!userId) {
    logs = getLocalWorkoutLogs();
  } else if (isSupabaseConfigured) {
    // 會員模式：從 Supabase 讀取
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      if (!error && data) {
        logs = data as WorkoutLog[];
      }
    } catch (error) {
      console.error('取得儀表板數據失敗:', error);
    }
  }

  if (logs.length === 0) return defaultData;

  // 計算基本統計
  const totalMinutes = logs.reduce((sum, log) => sum + log.duration_minutes, 0);
  const ratings = logs.filter(log => log.rating !== null).map(log => log.rating!);
  const avgRating = ratings.length > 0 
    ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10
    : null;

  // 計算本週/本月訓練次數
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const weeklyWorkouts = logs.filter(log => 
    new Date(log.started_at) >= weekStart
  ).length;
  
  const monthlyWorkouts = logs.filter(log => 
    new Date(log.started_at) >= monthStart
  ).length;

  // 最近 5 筆訓練 (翻譯目標名稱)
  const recentWorkouts = logs.slice(0, 5).map(log => ({
    id: log.id,
    date: log.started_at,
    duration: log.duration_minutes,
    goal: translateGoal(log.settings?.goal || '其他'),
    rating: log.rating,
  }));

  return {
    stats: {
      totalWorkouts: logs.length,
      totalMinutes,
      avgRating,
      lastWorkoutAt: logs[0]?.started_at || null,
      currentStreak: calculateStreak(logs),
      estimatedCalories: estimateCalories(totalMinutes),
      weeklyWorkouts,
      monthlyWorkouts,
    },
    calendarData: generateCalendarData(logs),
    tagDistribution: calculateTagDistribution(logs),
    recentWorkouts,
  };
}

/**
 * 取得指定月份的日曆資料
 * 
 * @param userId - 使用者 ID
 * @param year - 年份
 * @param month - 月份 (1-12)
 */
export async function getMonthCalendarData(
  userId: string | null,
  year: number,
  month: number
): Promise<CalendarWorkoutDay[]> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  let logs: WorkoutLog[] = [];

  if (!userId) {
    logs = getLocalWorkoutLogs().filter(log => {
      const date = new Date(log.started_at);
      return date >= startDate && date <= endDate;
    });
  } else if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('started_at, duration_minutes')
        .eq('user_id', userId)
        .gte('started_at', startDate.toISOString())
        .lte('started_at', endDate.toISOString());

      if (!error && data) {
        logs = data as WorkoutLog[];
      }
    } catch (error) {
      console.error('取得月曆數據失敗:', error);
    }
  }

  return generateCalendarData(logs);
}
