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

/**
 * 註冊新使用者 (Sign Up)
 * 
 * @param data - 註冊資料 (Registration data)
 * @returns Promise<UserProfile> - 成功返回使用者資料
 * @throws Error - 註冊失敗時拋出錯誤
 */
export const signUp = async (data: RegisterData): Promise<UserProfile> => {
    try {
        const { email, password, display_name } = data;

        // 呼叫 Supabase Auth 註冊 API
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: display_name || email.split('@')[0],
                },
            },
        });

        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error('註冊失敗：無法建立使用者');

        // 等待 user_profiles 自動建立 (由 trigger 處理)
        // 取得完整的 profile 資料
        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError) {
            console.warn('無法取得 user_profiles，可能尚未建立', profileError);
        }

        return {
            id: authData.user.id,
            email: authData.user.email,
            display_name: profileData?.display_name || display_name || email.split('@')[0],
            avatar_url: profileData?.avatar_url,
            role: 'member',
        };
    } catch (error: any) {
        console.error('註冊錯誤:', error);
        throw new Error(error.message || '註冊失敗，請稍後再試');
    }
};

/**
 * 登入使用者 (Sign In)
 * 
 * @param credentials - 登入憑證 (Login credentials)
 * @returns Promise<UserProfile> - 成功返回使用者資料
 * @throws Error - 登入失敗時拋出錯誤
 */
export const signIn = async (credentials: LoginCredentials): Promise<UserProfile> => {
    try {
        const { email, password } = credentials;

        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) throw signInError;
        if (!authData.user) throw new Error('登入失敗：無法取得使用者資料');

        // 取得 user profile
        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError) {
            console.warn('無法取得 user_profiles', profileError);
        }

        return {
            id: authData.user.id,
            email: authData.user.email,
            display_name: profileData?.display_name || authData.user.email?.split('@')[0],
            avatar_url: profileData?.avatar_url,
            role: 'member',
        };
    } catch (error: any) {
        console.error('登入錯誤:', error);
        throw new Error(error.message || '登入失敗，請檢查 Email 與密碼');
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
        throw new Error(error.message || '登出失敗，請稍後再試');
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

        // 取得 user profile
        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.warn('無法取得 user_profiles', profileError);
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
        throw new Error(error.message || '更新個人資料失敗，請稍後再試');
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
