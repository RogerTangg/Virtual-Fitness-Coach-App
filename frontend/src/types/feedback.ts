/**
 * 互動式回饋型別定義 (Interactive Feedback Type Definitions)
 * 
 * 定義訓練過程中的回饋資料結構,包含組間回饋與訓練後回饋
 */

/**
 * 組間回饋難度評分 (Inter-set Difficulty Rating)
 * 
 * - too_easy: 太簡單
 * - just_right: 剛剛好
 * - too_hard: 太難
 */
export type DifficultyRating = 'too_easy' | 'just_right' | 'too_hard';

/**
 * 單一動作回饋 (Exercise Feedback)
 * 
 * 記錄使用者對單一動作的難度評分與執行時間
 */
export interface ExerciseFeedback {
    /** 動作 ID (Exercise ID) */
    exerciseId: string;

    /** 動作名稱 (Exercise Name) */
    exerciseName: string;

    /** 難度評分 (Difficulty Rating) - null 表示未評分 */
    difficulty: DifficultyRating | null;

    /** 實際執行時間 (秒) (Actual Duration in seconds) */
    actualDuration: number;
}

/**
 * 訓練後整體評分 (Post-workout Overall Rating)
 * 
 * 使用者對整次訓練的整體感受評分
 */
export interface WorkoutRating {
    /** 星級評分 (1-5) (Star Rating) */
    stars: number;

    /** 文字備註 (Text Comment) */
    comment: string;
}

/**
 * 完整訓練回饋資料 (Complete Workout Feedback)
 * 
 * 整合單一訓練的所有回饋資料,用於儲存與分析
 */
export interface WorkoutFeedback {
    /** 訓練 ID (時間戳記) (Workout ID - timestamp) */
    workoutId: string;

    /** 訓練時間 (Workout Timestamp) */
    timestamp: string;

    /** 訓練總時長 (分鐘) (Total Duration in minutes) */
    durationMinutes: number;

    /** 各動作回饋 (Exercise Feedback List) */
    exercises: ExerciseFeedback[];

    /** 整體評分 (Overall Rating) */
    rating: WorkoutRating;
}
