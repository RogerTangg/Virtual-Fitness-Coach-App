/**
 * 身份驗證相關型別定義 (Authentication Type Definitions)
 * 
 * 定義整個應用程式的身份驗證相關型別,包含使用者角色、個人資料、身份驗證狀態等
 */

/**
 * 使用者角色 (User Role)
 * 
 * - guest: 訪客 (未登入,資料僅存於本地)
 * - member: 會員 (已登入,資料同步至雲端)
 */
export type UserRole = 'guest' | 'member';

/**
 * 使用者個人資料 (User Profile)
 * 
 * 包含使用者的基本資訊與角色
 */
export interface UserProfile {
    /** 使用者 ID (User ID) - 對應 Supabase auth.users.id */
    id: string;

    /** Email 地址 (Email Address) - 僅會員有值 */
    email?: string;

    /** 顯示名稱 (Display Name) */
    display_name?: string;

    /** 頭像 URL (Avatar URL) */
    avatar_url?: string;

    /** 使用者角色 (User Role) */
    role: UserRole;
}

/**
 * 身份驗證狀態 (Authentication State)
 * 
 * 應用程式的全域身份驗證狀態
 */
export interface AuthState {
    /** 當前使用者 (Current User) - null 表示未載入或未登入 */
    user: UserProfile | null;

    /** 是否正在載入 (Is Loading) */
    isLoading: boolean;

    /** 是否為訪客模式 (Is Guest Mode) */
    isGuest: boolean;
}

/**
 * 登入憑證 (Login Credentials)
 */
export interface LoginCredentials {
    /** Email 地址 (Email Address) */
    email: string;

    /** 密碼 (Password) */
    password: string;
}

/**
 * 註冊資料 (Registration Data)
 */
export interface RegisterData extends LoginCredentials {
    /** 確認密碼 (Confirm Password) */
    confirmPassword: string;

    /** 顯示名稱 (Display Name) - 選填 */
    display_name?: string;
}

/**
 * 個人資料更新資料 (Profile Update Data)
 */
export interface ProfileUpdateData {
    /** 顯示名稱 (Display Name) */
    display_name?: string;

    /** 頭像 URL (Avatar URL) */
    avatar_url?: string;
}
