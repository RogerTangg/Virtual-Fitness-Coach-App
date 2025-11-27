import { Exercise } from './db';

/**
 * 使用者偏好設定 (User Preferences)
 * 對應 PRD Epic 2: 偏好設定
 */
export interface UserPreferences {
  /** 運動目標 (例如: 增肌, 減脂, 塑形) */
  goal: string;

  /** 可用器材 (例如: 徒手, 啞鈴) */
  equipment: string[];

  /** 總訓練時長 (分鐘) */
  durationMinutes: number;

  /** 難度偏好 (初階, 中階, 高階) */
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * 應用程式畫面狀態 (App Screen State)
 * 用於簡單的狀態路由 (MVP 不需複雜的 React Router)
 * 
 * Phase 2 新增: login, register, profile (身份驗證相關畫面)
 * Phase 2 Module 3 新增: history (訓練歷史紀錄)
 * Phase 2 Module 4 新增: dashboard (儀表板)
 */
export type AppScreen =
  | 'home'
  | 'dashboard'
  | 'login'
  | 'register'
  | 'profile'
  | 'history'
  | 'setup'
  | 'generating'
  | 'overview'
  | 'workout'
  | 'completed';

/**
 * 訓練計畫項目類型
 */
export type PlanItemType = 'exercise' | 'rest';

/**
 * 訓練計畫項目 (Workout Plan Item)
 * 課表中的單一項目，可能是運動或休息
 */
export interface PlanItem {
  type: PlanItemType;
  /** 持續時間 (秒) */
  duration: number;
  /** 如果是運動，則包含運動詳情 */
  exercise?: Exercise;
  /** 用於顯示的標題 (例如: "休息", "伏地挺身") */
  title: string;
}