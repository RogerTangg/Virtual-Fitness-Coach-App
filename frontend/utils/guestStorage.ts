/**
 * 訪客模式本地儲存工具 (Guest Mode Local Storage Utility)
 * 
 * 管理訪客使用者的訓練紀錄，儲存於 localStorage
 */

/**
 * 訓練紀錄介面 (Workout Log Interface)
 */
export interface GuestWorkoutLog {
    timestamp: string;
    duration: number;
    settings: {
        goal: string;
        difficulty: string;
        targetMuscles?: string[];
    };
    exercises: Array<{
        name: string;
        duration: number;
        completed: boolean;
    }>;
}

const STORAGE_KEY = 'guest_workout_logs';

/**
 * 儲存訓練紀錄 (Save Workout Log)
 * 
 * @param {GuestWorkoutLog} log - 訓練紀錄
 */
export const saveWorkoutLog = (log: GuestWorkoutLog): void => {
    try {
        const existingLogs = getWorkoutLogs();
        const updatedLogs = [...existingLogs, log];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
    } catch (error) {
        console.error('儲存訪客訓練紀錄失敗:', error);
    }
};

/**
 * 獲取所有訓練紀錄 (Get All Workout Logs)
 * 
 * @returns {GuestWorkoutLog[]} 訓練紀錄陣列
 */
export const getWorkoutLogs = (): GuestWorkoutLog[] => {
    try {
        const logsJson = localStorage.getItem(STORAGE_KEY);
        if (!logsJson) return [];
        return JSON.parse(logsJson) as GuestWorkoutLog[];
    } catch (error) {
        console.error('讀取訪客訓練紀錄失敗:', error);
        return [];
    }
};

/**
 * 清除所有訪客資料 (Clear All Guest Data)
 */
export const clearGuestData = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('清除訪客資料失敗:', error);
    }
};

/**
 * 獲取訪客訓練統計 (Get Guest Workout Stats)
 * 
 * @returns {Object} 統計資料
 */
export const getGuestStats = () => {
    const logs = getWorkoutLogs();

    return {
        totalWorkouts: logs.length,
        totalMinutes: logs.reduce((sum, log) => sum + log.duration, 0),
        lastWorkoutDate: logs.length > 0 ? logs[logs.length - 1].timestamp : null
    };
};
