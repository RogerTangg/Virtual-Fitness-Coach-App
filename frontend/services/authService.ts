/**
 * 認證服務層 (Authentication Service Layer)
 * 
 * 封裝所有與 Supabase Auth 相關的操作
 * 提供統一的認證 API 介面
 */

import { supabase } from '../lib/supabase';
import type { User, UserProfile, AuthError } from '../types/auth';

/**
 * 註冊新使用者 (Sign Up)
 * 
 * 流程：
 * 1. 使用 Supabase Auth 建立帳號
 * 2. Trigger 自動建立 user_profiles 記錄
 * 3. 返回完整的使用者資料
 * 
 * @param {string} email - Email 地址
 * @param {string} password - 密碼（至少 6 字元）
 * @param {string} displayName - 顯示名稱
 * @returns {Promise<User>} 使用者資料
 * @throws {AuthError} 認證錯誤
 */
export const signUp = async (
    email: string,
    password: string,
    displayName: string
): Promise<{ user: User | null; needsEmailVerification: boolean }> => {
    try {
        // 1. 建立 Auth 帳號
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName
                },
                emailRedirectTo: `${window.location.origin}`
            }
        });

        if (authError) {
            throw mapSupabaseError(authError);
        }

        if (!authData.user) {
            throw 'unknown_error';
        }

        // 2. 檢查是否需要 Email 驗證
        // 如果 session 為 null，代表需要驗證 Email
        const needsVerification = !authData.session;

        if (needsVerification) {
            console.log('[Auth] Email verification required for:', email);
            return {
                user: null,
                needsEmailVerification: true
            };
        }

        // 3. 如果不需要驗證，等待 trigger 建立 profile
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 4. 獲取完整的 profile 資料
        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError) {
            console.error('[Auth] Profile fetch error after signup:', {
                error: profileError,
                userId: authData.user.id,
                possibleCauses: [
                    '1. user_profiles table does not exist',
                    '2. Trigger on_auth_user_created not executed',
                    '3. RLS policy blocking access',
                    '4. Database connection issue'
                ]
            });
            throw 'unknown_error';
        }

        return {
            user: {
                id: authData.user.id,
                email: authData.user.email!,
                profile: profileData as UserProfile
            },
            needsEmailVerification: false
        };

    } catch (error) {
        console.error('[Auth] Sign up error details:', {
            error,
            errorType: typeof error,
            errorMessage: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
};

/**
 * 登入 (Sign In)
 * 
 * @param {string} email - Email 地址
 * @param {string} password - 密碼
 * @returns {Promise<User>} 使用者資料
 * @throws {AuthError} 認證錯誤
 */
export const signIn = async (
    email: string,
    password: string
): Promise<User> => {
    try {
        // 1. Supabase Auth 登入
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            throw mapSupabaseError(authError);
        }

        if (!authData.user) {
            throw 'unknown_error';
        }

        // 2. 獲取 profile 資料
        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError) {
            console.error('Profile fetch error:', profileError);
            throw 'unknown_error';
        }

        return {
            id: authData.user.id,
            email: authData.user.email!,
            profile: profileData as UserProfile
        };

    } catch (error) {
        console.error('Sign in error:', error);
        throw error;
    }
};

/**
 * 登出 (Sign Out)
 * 
 * @returns {Promise<void>}
 */
export const signOut = async (): Promise<void> => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            throw mapSupabaseError(error);
        }
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
};

/**
 * 獲取當前使用者 (Get Current User)
 * 
 * 檢查是否有有效的 session，並返回完整的使用者資料
 * 
 * @returns {Promise<User | null>} 使用者資料或 null
 */
export const getCurrentUser = async (): Promise<User | null> => {
    try {
        // 1. 獲取當前 session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return null;
        }

        // 2. 獲取 profile 資料
        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profileError) {
            console.error('Profile fetch error:', profileError);
            return null;
        }

        return {
            id: session.user.id,
            email: session.user.email!,
            profile: profileData as UserProfile
        };

    } catch (error) {
        console.error('Get current user error:', error);
        return null;
    }
};

/**
 * 更新個人資料 (Update Profile)
 * 
 * @param {string} userId - 使用者 ID
 * @param {string} displayName - 新的顯示名稱
 * @param {string} [avatarUrl] - 新的頭像 URL（選用）
 * @returns {Promise<UserProfile>} 更新後的個人資料
 * @throws {AuthError} 認證錯誤
 */
export const updateProfile = async (
    userId: string,
    displayName: string,
    avatarUrl?: string
): Promise<UserProfile> => {
    try {
        const updateData: Partial<UserProfile> = {
            display_name: displayName
        };

        if (avatarUrl !== undefined) {
            updateData.avatar_url = avatarUrl;
        }

        const { data, error } = await supabase
            .from('user_profiles')
            .update(updateData)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            throw mapSupabaseError(error);
        }

        return data as UserProfile;

    } catch (error) {
        console.error('Update profile error:', error);
        throw error;
    }
};

/**
 * 監聽認證狀態變化 (Auth State Change Listener)
 * 
 * @param {Function} callback - 狀態變化回調函數
 * @returns {Function} 取消訂閱函數
 */
export const onAuthStateChange = (
    callback: (user: User | null) => void
) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
            if (session?.user) {
                // 有 session，獲取完整使用者資料
                const user = await getCurrentUser();
                callback(user);
            } else {
                // 無 session，使用者已登出
                callback(null);
            }
        }
    );

    // 返回取消訂閱函數
    return () => {
        subscription.unsubscribe();
    };
};

/**
 * 映射 Supabase 錯誤至 AuthError (Map Supabase Error to AuthError)
 * 
 * @param {any} error - Supabase 錯誤物件
 * @returns {AuthError} 標準化的認證錯誤類型
 */
const mapSupabaseError = (error: any): AuthError => {
    const message = error.message?.toLowerCase() || '';

    // Log the original error for debugging
    console.error('[Auth] Supabase error details:', {
        message: error.message,
        code: error.code,
        status: error.status,
        fullError: error
    });

    if (message.includes('invalid') && message.includes('email')) {
        return 'invalid_email';
    }
    if (message.includes('password') && (message.includes('short') || message.includes('weak'))) {
        return 'weak_password';
    }
    if (message.includes('already') || message.includes('registered')) {
        return 'email_exists';
    }
    if (message.includes('invalid') && (message.includes('credentials') || message.includes('password'))) {
        return 'invalid_credentials';
    }
    if (message.includes('network') || message.includes('fetch')) {
        return 'network_error';
    }

    return 'unknown_error';
};
