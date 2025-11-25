/**
 * 回饋資料儲存服務 (Feedback Storage Service)
 * 
 * 提供訓練回饋資料的本地儲存功能 (使用 localStorage)
 * 未來將擴充支援會員模式的雲端同步
 */

import type { WorkoutFeedback } from '@/types/feedback';

const FEEDBACK_KEY = 'vca__workout_feedback';

/**
 * 儲存訓練回饋 (Save Workout Feedback)
 * 
 * 訪客模式使用 localStorage,會員模式未來將同步至雲端
 * 
 * @param feedback - 訓練回饋資料
 */
export const saveWorkoutFeedback = (feedback: WorkoutFeedback): void => {
    try {
        const existing = getWorkoutFeedbacks();
        const updated = [...existing, feedback];
        localStorage.setItem(FEEDBACK_KEY, JSON.stringify(updated));
        console.log('✅ 訓練回饋已儲存:', feedback.workoutId);
    } catch (error) {
        console.error('❌ 儲存回饋失敗:', error);
    }
};

/**
 * 取得所有訓練回饋紀錄 (Get All Workout Feedbacks)
 * 
 * @returns 訓練回饋陣列
 */
export const getWorkoutFeedbacks = (): WorkoutFeedback[] => {
    try {
        const data = localStorage.getItem(FEEDBACK_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('❌ 讀取回饋失敗:', error);
        return [];
    }
};

/**
 * 取得最近 N 筆訓練回饋 (Get Recent Workout Feedbacks)
 * 
 * @param count - 要取得的筆數 (預設 10)
 * @returns 最近的訓練回饋陣列
 */
export const getRecentFeedbacks = (count: number = 10): WorkoutFeedback[] => {
    const all = getWorkoutFeedbacks();
    return all.slice(-count).reverse(); // 最新的在前
};

/**
 * 清除所有回饋資料 (Clear All Feedback Data)
 * 
 * 當使用者登出或重置資料時使用
 */
export const clearWorkoutFeedbacks = (): void => {
    try {
        localStorage.removeItem(FEEDBACK_KEY);
        console.log('✅ 回饋資料已清除');
    } catch (error) {
        console.error('❌ 清除回饋失敗:', error);
    }
};

/**
 * 取得回饋統計資訊 (Get Feedback Statistics)
 * 
 * @returns 統計資訊物件
 */
export const getFeedbackStats = () => {
    const feedbacks = getWorkoutFeedbacks();

    if (feedbacks.length === 0) {
        return {
            totalWorkouts: 0,
            averageRating: 0,
            totalExercises: 0
        };
    }

    const totalRating = feedbacks.reduce((sum, f) => sum + f.rating.stars, 0);
    const totalExercises = feedbacks.reduce((sum, f) => sum + f.exercises.length, 0);

    return {
        totalWorkouts: feedbacks.length,
        averageRating: (totalRating / feedbacks.length).toFixed(1),
        totalExercises
    };
};
