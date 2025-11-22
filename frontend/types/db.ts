/**
 * 資料庫結構定義 (Database Schema Definitions)
 * 對應 Supabase 中的 Table 結構
 */

/**
 * 運動項目 (Exercise)
 * 對應 PRD F-1.1: 運動資料表結構
 */
export interface Exercise {
  id: string;
  created_at?: string;
  
  /** 動作名稱 */
  name: string;
  
  /** 動作說明/注意事項 */
  description: string;
  
  /** 示範影片連結 (MP4 或 GIF) */
  video_url: string;
  
  /** 建議持續時間 (秒) */
  duration_seconds: number;
  
  /** 
   * 標籤陣列，用於篩選
   * 格式範例: ["goal:增肌", "difficulty:初階", "equipment:啞鈴", "type:肌力"]
   */
  tags: string[];
}
