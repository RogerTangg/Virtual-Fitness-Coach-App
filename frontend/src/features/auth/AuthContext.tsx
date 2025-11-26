/**
 * AuthContext - 全域身份驗證狀態管理 (Global Authentication State Management)
 * 
 * 提供身份驗證狀態與方法給整個應用程式使用
 * 支援 Email 驗證回調處理
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AuthState, UserProfile } from '@/types/auth';
import { getCurrentUser, onAuthStateChange } from '@/services/authService';
import { supabase } from '@/lib/supabase';

// 定義 Context 型別
interface AuthContextType extends AuthState {
    /** 重新載入使用者資訊 (Reload user info) */
    reloadUser: () => Promise<void>;

    /** 設定使用者 (Set user) */
    setUser: (user: UserProfile | null) => void;

    /** 進入訪客模式 (Enter guest mode) */
    enterGuestMode: () => void;

    /** 是否正在處理 Email 驗證 */
    isVerifying: boolean;

    /** 驗證是否成功完成 */
    verificationSuccess: boolean;

    /** 清除驗證狀態 */
    clearVerificationStatus: () => void;
}

// 建立 Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider 組件 (AuthProvider Component)
 * 
 * 包裹整個應用程式，提供身份驗證狀態
 * 
 * @param children - 子組件 (Child components)
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationSuccess, setVerificationSuccess] = useState(false);

    /**
     * 重新載入使用者資訊 (Reload user information)
     */
    const reloadUser = async () => {
        setIsLoading(true);
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
            setIsGuest(currentUser === null);
        } catch (error) {
            console.error('載入使用者資訊失敗:', error);
            setUser(null);
            setIsGuest(true);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 進入訪客模式 (Enter guest mode)
     */
    const enterGuestMode = () => {
        setUser(null);
        setIsGuest(true);
        setIsLoading(false);
    };

    /**
     * 清除驗證狀態
     */
    const clearVerificationStatus = () => {
        setVerificationSuccess(false);
        setIsVerifying(false);
    };

    /**
     * 處理 Email 驗證回調
     * Supabase 可能在 URL hash 或 query params 中附帶 token
     */
    const handleEmailVerificationCallback = async () => {
        // 檢查 URL hash（Supabase 預設格式）
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        // 也檢查 query params（某些情況下可能使用）
        const queryParams = new URLSearchParams(window.location.search);
        
        const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        const type = hashParams.get('type') || queryParams.get('type');
        const errorCode = hashParams.get('error') || queryParams.get('error');
        const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');

        // 檢查是否有錯誤
        if (errorCode) {
            // 清除 URL 參數
            window.history.replaceState(null, '', window.location.pathname);
            setIsLoading(false);
            return;
        }

        // 檢查是否是驗證回調（signup 或 email_change）
        if (accessToken && (type === 'signup' || type === 'email_change' || type === 'recovery')) {
            setIsVerifying(true);

            try {
                // 嘗試從 URL 設定 session
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    throw error;
                }

                if (session?.user) {
                    const currentUser = await getCurrentUser();
                    setUser(currentUser);
                    setIsGuest(false);
                    setVerificationSuccess(true);
                } else {
                    // 如果 session 不存在，嘗試用 token 設定
                    const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
                    if (refreshToken) {
                        const { data, error: setSessionError } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });
                        
                        if (!setSessionError && data.user) {
                            const currentUser = await getCurrentUser();
                            setUser(currentUser);
                            setIsGuest(false);
                            setVerificationSuccess(true);
                        }
                    }
                }

                // 清除 URL 中的 hash 和 query 參數
                window.history.replaceState(null, '', window.location.pathname);
            } catch {
                // 驗證回調處理失敗，静默處理
            } finally {
                setIsVerifying(false);
                setIsLoading(false);
            }
        }
    };

    // 初始化：載入使用者資訊並處理驗證回調
    useEffect(() => {
        const init = async () => {
            // 先檢查是否有驗證回調（hash 或 query params）
            const hasVerificationParams = 
                window.location.hash.includes('access_token') || 
                window.location.search.includes('access_token') ||
                window.location.hash.includes('type=signup') ||
                window.location.search.includes('type=signup');
                
            if (hasVerificationParams) {
                await handleEmailVerificationCallback();
            } else {
                await reloadUser();
            }
        };

        init();

        // 監聯身份驗證狀態變化（包括從其他 tab 登入）
        const unsubscribe = onAuthStateChange((newUser) => {
            // 只在非驗證狀態時更新
            if (!isVerifying) {
                setUser(newUser);
                setIsGuest(newUser === null);
                setIsLoading(false);
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const value: AuthContextType = {
        user,
        isLoading,
        isGuest,
        reloadUser,
        setUser,
        enterGuestMode,
        isVerifying,
        verificationSuccess,
        clearVerificationStatus,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth Hook - 取得身份驗證狀態 (Get authentication state)
 * 
 * @returns AuthContextType - 身份驗證狀態與方法
 * @throws Error - 若在 AuthProvider 外部使用
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth 必須在 AuthProvider 內部使用');
    }
    return context;
};
