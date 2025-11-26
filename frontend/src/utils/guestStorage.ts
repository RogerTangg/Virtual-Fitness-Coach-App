/**
 * 訪客模式儲存服務 (Guest Storage Service)
 * 
 * 提供訪客模式下的本地資料儲存功能 (使用 localStorage)
 * 
 * 訪客資料結構 (Guest Data Structure):
 * - 訓練紀錄僅儲存於瀏覽器本地
 * - 當使用者註冊為會員後，可選擇性遷移資料至雲端
 */

/**
 * 訪客訓練紀錄 (Guest Workout Record)
 */
export interface GuestWorkoutRecord {
    /** 紀錄 ID (Record ID) */
    id: string;

    /** 訓練日期時間 (Workout timestamp) */
    timestamp: string;

    /** 訓練時長（分鐘） (Duration in minutes) */
    durationMinutes: number;

    /** 訓練目標 (Training goal) */
    goal: string;

    /** 難度 (Difficulty) */
    difficulty: string;
}

const GUEST_WORKOUTS_KEY = 'vca__guest_workouts';

/**
 * 儲存訪客訓練紀錄 (Save Guest Workout)
 * 
 * @param workout - 訓練紀錄 (Workout record)
 */
export const saveGuestWorkout = (workout: Omit<GuestWorkoutRecord, 'id' | 'timestamp'>): void => {
    try {
        const existingWorkouts = getGuestWorkouts();
        const newWorkout: GuestWorkoutRecord = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            ...workout,
        };

        const updatedWorkouts = [...existingWorkouts, newWorkout];
        localStorage.setItem(GUEST_WORKOUTS_KEY, JSON.stringify(updatedWorkouts));
    } catch (error) {
        console.error('儲存訪客訓練紀錄失敗:', error);
    }
};

/**
 * 取得所有訪客訓練紀錄 (Get Guest Workouts)
 * 
 * @returns GuestWorkoutRecord[] - 訓練紀錄陣列
 */
export const getGuestWorkouts = (): GuestWorkoutRecord[] => {
    try {
        const data = localStorage.getItem(GUEST_WORKOUTS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('取得訪客訓練紀錄失敗:', error);
        return [];
    }
};

/**
 * 清除所有訪客資料 (Clear Guest Data)
 * 
 * 當使用者登出或註冊為會員後可呼叫此函數清除訪客資料
 */
export const clearGuestData = (): void => {
    try {
        localStorage.removeItem(GUEST_WORKOUTS_KEY);
    } catch (error) {
        console.error('清除訪客資料失敗:', error);
    }
};

/**
 * 取得訪客訓練紀錄數量 (Get Guest Workout Count)
 * 
 * @returns number - 訓練紀錄數量
 */
export const getGuestWorkoutCount = (): number => {
    return getGuestWorkouts().length;
};
