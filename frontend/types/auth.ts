/**
 * 認證相關型別定義 (Authentication Type Definitions)
 * 
 * 此檔案定義所有與使用者認證、個人資料相關的 TypeScript 型別
 */

/**
 * 使用者個人資料 (User Profile)
 * 
 * 對應資料庫 user_profiles 資料表
 */
export interface UserProfile {
    id: string;
    display_name: string;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * 使用者資料 (User)
 * 
 * 整合 Supabase Auth User 與 Profile 資料
 */
export interface User {
    id: string;
    email: string;
    profile: UserProfile;
}

/**
 * 認證 Context 型別 (Authentication Context Type)
 */
export interface AuthContextType {
    user: User | null;
    isGuest: boolean;
    isLoading: boolean;
    signUp: (email: string, password: string, displayName: string) => Promise<boolean>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    updateProfile: (displayName: string, avatarUrl?: string) => Promise<void>;
}

/**
 * 認證錯誤類型 (Authentication Error Types)
 */
export type AuthError =
    | 'invalid_email'           // Email 格式錯誤
    | 'weak_password'           // 密碼太弱
    | 'email_exists'            // Email 已被使用
    | 'invalid_credentials'     // 帳號或密碼錯誤
    | 'network_error'           // 網路錯誤
    | 'unknown_error';          // 未知錯誤

/**
 * 認證錯誤訊息對應 (Auth Error Messages)
 */
export const AUTH_ERROR_MESSAGES: Record<AuthError, string> = {
    invalid_email: '請輸入有效的 Email 地址',
    weak_password: '密碼至少需要 6 個字元',
    email_exists: '此 Email 已被使用，請使用其他 Email 或直接登入',
    invalid_credentials: 'Email 或密碼錯誤',
    network_error: '網路連線錯誤，請稍後再試',
    unknown_error: '發生錯誤，請稍後再試'
};
