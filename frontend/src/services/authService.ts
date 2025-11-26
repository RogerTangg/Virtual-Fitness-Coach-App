/**
 * 身份驗證服務 (Authentication Service)
 * 
 * 提供使用者註冊、登入、登出、個人資料管理等功能
 * 
 * 使用 Supabase Auth 作為身份驗證後端
 */

import { supabase } from '@/lib/supabase';
import type {
    UserProfile,
    LoginCredentials,
    RegisterData,
    ProfileUpdateData
} from '@/types/auth';
import { sanitizeAuthError } from '@/utils/errorHandling';

/**
 * Email 未驗證錯誤類別
 */
export class EmailNotVerifiedError extends Error {
    email: string;
    constructor(email: string) {
        super('Email 尚未驗證');
        this.name = 'EmailNotVerifiedError';
        this.email = email;
    }
}

/**
 * 登入結果類型
 */
export interface SignInResult {
    /** 登入是否成功 */
    success: boolean;
    /** 使用者資料 */
    user: UserProfile | null;
    /** 是否需要 Email 驗證 */
    needsEmailVerification: boolean;
    /** Email（用於顯示驗證畫面） */
    email?: string;
}

/**
 * 註冊結果類型
 */
export interface SignUpResult {
    /** 是否需要 Email 驗證 */
    needsEmailVerification: boolean;
    /** 使用者資料（若不需驗證或已驗證） */
    user: UserProfile | null;
    /** 註冊使用的 Email */
    email: string;
}

/**
 * 註冊新使用者 (Sign Up)
 * 
 * @param data - 註冊資料 (Registration data)
 * @returns Promise<SignUpResult> - 成功返回註冊結果
 * @throws Error - 註冊失敗時拋出錯誤
 */
export const signUp = async (data: RegisterData): Promise<SignUpResult> => {
    try {
        const { email, password, display_name } = data;

        // 取得當前網站 URL 作為驗證回調位址
        const redirectUrl = `${window.location.origin}/`;

        // 呼叫 Supabase Auth 註冊 API
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: display_name || email.split('@')[0],
                },
                emailRedirectTo: redirectUrl,
            },
        });

        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error('註冊失敗：無法建立使用者');

        // 檢查是否需要 Email 驗證
        // Supabase 會在 identities 為空陣列或 email_confirmed_at 為 null 時表示需要驗證
        const needsEmailVerification = !authData.user.email_confirmed_at;

        if (needsEmailVerification) {
            return {
                needsEmailVerification: true,
                user: null,
                email,
            };
        }

        // 不需要驗證的情況（例如 Supabase 設定關閉驗證）
        // 等待 user_profiles 自動建立 (由 trigger 處理)
        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError) {
            console.warn('無法取得 user_profiles，可能尚未建立', profileError);
        }

        return {
            needsEmailVerification: false,
            user: {
                id: authData.user.id,
                email: authData.user.email,
                display_name: profileData?.display_name || display_name || email.split('@')[0],
                avatar_url: profileData?.avatar_url,
                role: 'member',
            },
            email,
        };
    } catch (error: any) {
        console.error('註冊錯誤:', error);
        const userMessage = sanitizeAuthError(error);
        throw new Error(userMessage);
    }
};

/**
 * 重新發送驗證 Email (Resend Verification Email)
 * 
 * @param email - 需要重新發送驗證的 Email
 * @throws Error - 發送失敗時拋出錯誤
 */
export const resendVerificationEmail = async (email: string): Promise<void> => {
    try {
        const redirectUrl = `${window.location.origin}/`;

        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: {
                emailRedirectTo: redirectUrl,
            },
        });

        if (error) throw error;
    } catch (error: any) {
        console.error('重新發送驗證 Email 錯誤:', error);
        const userMessage = sanitizeAuthError(error);
        throw new Error(userMessage);
    }
};

/**
 * 登入使用者 (Sign In)
 * 
 * @param credentials - 登入憑證 (Login credentials)
 * @returns Promise<SignInResult> - 登入結果
 * @throws Error - 登入失敗時拋出錯誤
 */
export const signIn = async (credentials: LoginCredentials): Promise<SignInResult> => {
    try {
        const { email, password } = credentials;

        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            // 檢查是否為 Email 未驗證錯誤（支援多種可能的錯誤訊息）
            const errorMsg = signInError.message?.toLowerCase() || '';
            if (
                errorMsg.includes('email not confirmed') ||
                errorMsg.includes('email_not_confirmed') ||
                errorMsg.includes('not confirmed') ||
                signInError.code === 'email_not_confirmed'
            ) {
                return {
                    success: false,
                    user: null,
                    needsEmailVerification: true,
                    email,
                };
            }
            throw signInError;
        }
        
        if (!authData.user) throw new Error('登入失敗：無法取得使用者資料');

        // 再次檢查 Email 是否已驗證
        if (!authData.user.email_confirmed_at) {
            // 登出未驗證的用戶（不等待結果，避免卡住）
            supabase.auth.signOut().catch(() => { /* 忽略登出錯誤 */ });
            return {
                success: false,
                user: null,
                needsEmailVerification: true,
                email,
            };
        }

        // 取得 user profile（允許失敗，不阻塞登入）
        let profileData = null;
        try {
            const { data, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', authData.user.id)
                .maybeSingle();  // 使用 maybeSingle 而非 single，避免找不到時報錯

            if (!profileError) {
                profileData = data;
            }
        } catch {
            // Profile 查詢失敗不影響登入
        }

        return {
            success: true,
            user: {
                id: authData.user.id,
                email: authData.user.email,
                display_name: profileData?.display_name || authData.user.email?.split('@')[0],
                avatar_url: profileData?.avatar_url,
                role: 'member',
            },
            needsEmailVerification: false,
        };
    } catch (error: any) {
        console.error('登入錯誤:', error);
        const userMessage = sanitizeAuthError(error);
        throw new Error(userMessage);
    }
};

/**
 * 登出使用者 (Sign Out)
 * 
 * @returns Promise<void>
 * @throws Error - 登出失敗時拋出錯誤
 */
export const signOut = async (): Promise<void> => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    } catch (error: any) {
        console.error('登出錯誤:', error);
        const userMessage = sanitizeAuthError(error);
        throw new Error(userMessage);
    }
};

/**
 * 取得當前使用者 (Get Current User)
 * 
 * @returns Promise<UserProfile | null> - 回傳當前使用者資料或 null
 */
export const getCurrentUser = async (): Promise<UserProfile | null> => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) throw error;
        if (!user) return null;

        // 取得 user profile（允許失敗）
        let profileData = null;
        try {
            const { data, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (!profileError) {
                profileData = data;
            }
        } catch {
            // Profile 查詢失敗不影響取得用戶
        }

        return {
            id: user.id,
            email: user.email,
            display_name: profileData?.display_name || user.email?.split('@')[0],
            avatar_url: profileData?.avatar_url,
            role: 'member',
        };
    } catch (error: any) {
        console.error('取得使用者錯誤:', error);
        return null;
    }
};

/**
 * 更新使用者個人資料 (Update User Profile)
 * 
 * @param data - 個人資料更新資料 (Profile update data)
 * @returns Promise<UserProfile> - 成功返回更新後的使用者資料
 * @throws Error - 更新失敗時拋出錯誤
 */
export const updateProfile = async (data: ProfileUpdateData): Promise<UserProfile> => {
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) throw new Error('未登入或 Session 已過期');

        // 更新 user_profiles
        const { data: profileData, error: updateError } = await supabase
            .from('user_profiles')
            .update({
                display_name: data.display_name,
                avatar_url: data.avatar_url,
            })
            .eq('id', user.id)
            .select()
            .single();

        if (updateError) throw updateError;

        return {
            id: user.id,
            email: user.email,
            display_name: profileData.display_name,
            avatar_url: profileData.avatar_url,
            role: 'member',
        };
    } catch (error: any) {
        console.error('更新個人資料錯誤:', error);
        const userMessage = sanitizeAuthError(error);
        throw new Error(userMessage);
    }
};

/**
 * 監聽身份驗證狀態變化 (On Auth State Change)
 * 
 * @param callback - 狀態變化時的回調函數
 * @returns 取消訂閱函數 (Unsubscribe function)
 */
export const onAuthStateChange = (
    callback: (user: UserProfile | null) => void
) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
            const user = await getCurrentUser();
            callback(user);
        } else {
            callback(null);
        }
    });

    return () => {
        subscription.unsubscribe();
    };
};
