import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { Profile } from '../types/db';

/**
 * 身份驗證 Context 型別定義
 */
interface AuthContextType {
    /** 當前登入的使用者 */
    user: User | null;
    /** 使用者個人資料 */
    profile: Profile | null;
    /** Session 資訊 */
    session: Session | null;
    /** 載入狀態 */
    loading: boolean;
    /** 註冊函數 */
    signUp: (email: string, password: string, displayName?: string) => Promise<void>;
    /** 登入函數 */
    signIn: (email: string, password: string) => Promise<void>;
    /** 登出函數 */
    signOut: () => Promise<void>;
    /** 更新個人資料 */
    updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

/**
 * 建立 Auth Context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider 組件 (Authentication Provider Component)
 * 
 * 提供全域的身份驗證狀態管理
 * 
 * 功能 (Features):
 * - 自動監聽 Supabase Auth 狀態變化
 * - 提供註冊、登入、登出功能
 * - 同步載入使用者 Profile
 * 
 * @param {Object} props - 組件 Props
 * @param {React.ReactNode} props.children - 子組件
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    /**
     * 載入使用者個人資料 (Load User Profile)
     * 
     * @param {string} userId - 使用者 ID
     */
    const loadProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            setProfile(data);
        } catch (error) {
            console.error('載入個人資料失敗:', error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * 初始化：檢查當前 Session 並訂閱 Auth 狀態變化
     */
    useEffect(() => {
        // 檢查當前 session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                loadProfile(session.user.id);
            } else {
                setLoading(false);
            }
        }).catch(err => {
            console.error('Session check failed:', err);
            setLoading(false);
        });

        // 安全機制：若 5 秒後仍在載入中，強制結束載入狀態
        const safetyTimeout = setTimeout(() => {
            setLoading(prev => {
                if (prev) {
                    console.warn('Auth loading timed out, forcing false');
                    return false;
                }
                return prev;
            });
        }, 5000);

        // 訂閱認證狀態變更（包含 Email 驗證後的自動登入）
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth event:', event); // Debug log

            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                await loadProfile(session.user.id);

                // Email 驗證完成後自動導向（App.tsx 會根據 user 狀態自動處理）
                if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                    console.log('User signed in or updated');
                }
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
            clearTimeout(safetyTimeout);
        };
    }, []);

    /**
     * 註冊新帳號 (Sign Up New Account)
     * 
     * @param {string} email - Email 地址
     * @param {string} password - 密碼
     * @param {string} [displayName] - 顯示名稱 (選填)
     */
    const signUp = async (email: string, password: string, displayName?: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: displayName,
                    },
                },
            });

            if (error) throw error;
        } catch (error: any) {
            console.error('註冊失敗:', error);
            throw new Error(error.message || '註冊失敗，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 登入 (Sign In)
     * 
     * @param {string} email - Email 地址
     * @param {string} password - 密碼
     */
    const signIn = async (email: string, password: string) => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
        } catch (error: any) {
            console.error('登入失敗:', error);
            throw new Error(error.message || '登入失敗，請檢查帳號密碼');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 登出 (Sign Out)
     */
    const signOut = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error: any) {
            console.error('登出失敗:', error);
            throw new Error(error.message || '登出失敗');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 更新個人資料 (Update Profile)
     * 
     * @param {Partial<Profile>} updates - 要更新的欄位
     */
    const updateProfile = async (updates: Partial<Profile>) => {
        if (!user) throw new Error('使用者未登入');

        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            // 重新載入 Profile
            await loadProfile(user.id);
        } catch (error: any) {
            console.error('更新個人資料失敗:', error);
            throw new Error(error.message || '更新失敗');
        } finally {
            setLoading(false);
        }
    };

    const value: AuthContextType = {
        user,
        profile,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth Hook
 * 
 * 使用方式 (Usage):
 * ```tsx
 * const { user, signIn, signOut } = useAuth();
 * ```
 * 
 * @returns {AuthContextType} Auth Context 值
 * @throws {Error} 若在 AuthProvider 外部使用
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
