/**
 * AuthContext - 全域身份驗證狀態管理 (Global Authentication State Management)
 * 
 * 提供身份驗證狀態與方法給整個應用程式使用
 * 支援 Email 驗證回調處理
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import type { AuthState, UserProfile } from '@/types/auth';
import { getCurrentUser, onAuthStateChange } from '@/services/authService';
import { supabase, startSessionRefresh, forceRefreshSession } from '@/lib/supabase';

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
    
    // 🔧 修復：使用 ref 追蹤驗證狀態，避免閉包問題
    const isVerifyingRef = useRef(false);
    // 追蹤是否已經初始化，避免重複初始化
    const isInitializedRef = useRef(false);

    /**
     * 重新載入使用者資訊 (Reload user information)
     * 加入 timeout 保護，避免卡住
     */
    const reloadUser = useCallback(async () => {
        setIsLoading(true);
        try {
            // 使用 Promise.race 加入 8 秒 timeout
            const currentUser = await Promise.race([
                getCurrentUser(),
                new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000))
            ]);
            setUser(currentUser);
            setIsGuest(currentUser === null);
        } catch (error) {
            console.error('載入使用者資訊失敗:', error);
            setUser(null);
            setIsGuest(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * 進入訪客模式 (Enter guest mode)
     */
    const enterGuestMode = useCallback(() => {
        setUser(null);
        setIsGuest(true);
        setIsLoading(false);
    }, []);

    /**
     * 清除驗證狀態
     */
    const clearVerificationStatus = useCallback(() => {
        setVerificationSuccess(false);
        setIsVerifying(false);
        isVerifyingRef.current = false;
    }, []);

    /**
     * 設定驗證中狀態（同時更新 state 和 ref）
     */
    const setVerifyingState = useCallback((value: boolean) => {
        setIsVerifying(value);
        isVerifyingRef.current = value;
    }, []);

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

        // 檢查是否有錯誤
        if (errorCode) {
            // 清除 URL 參數
            window.history.replaceState(null, '', window.location.pathname);
            setIsLoading(false);
            return;
        }

        // 檢查是否是驗證回調（signup 或 email_change）
        if (accessToken && (type === 'signup' || type === 'email_change' || type === 'recovery')) {
            setVerifyingState(true);

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
                    // 🔧 修復：驗證成功後開始 Session 刷新
                    startSessionRefresh();
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
                            startSessionRefresh();
                        }
                    }
                }

                // 清除 URL 中的 hash 和 query 參數
                window.history.replaceState(null, '', window.location.pathname);
            } catch {
                // 驗證回調處理失敗，靜默處理
            } finally {
                setVerifyingState(false);
                setIsLoading(false);
            }
        }
    };

    // 初始化：載入使用者資訊並處理驗證回調
    useEffect(() => {
        // 防止重複初始化
        if (isInitializedRef.current) return;
        isInitializedRef.current = true;
        
        // 🔧 修復：追蹤初始化是否完成，避免 onAuthStateChange 的競爭條件
        let isInitCompleted = false;
        
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
                // 嘗試從 localStorage 恢復 Session
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    
                    if (session?.user) {
                        console.log('📦 從 localStorage 恢復 Session:', session.user.email);
                        
                        // 檢查 Token 是否即將過期（5 分鐘內）
                        const expiresAt = session.expires_at;
                        const now = Math.floor(Date.now() / 1000);
                        const fiveMinutes = 5 * 60;
                        
                        if (expiresAt && (expiresAt - now) < fiveMinutes) {
                            console.log('⏰ Token 即將過期，立即刷新...');
                            await forceRefreshSession();
                        }
                        
                        // 開始 Session 刷新機制
                        startSessionRefresh();
                    }
                } catch (e) {
                    console.warn('恢復 Session 失敗:', e);
                }
                await reloadUser();
            }
            
            // 標記初始化完成
            isInitCompleted = true;
            
            // 確保 isLoading 一定會結束（防止極端情況）
            setIsLoading(false);
        };

        init().catch(() => {
            // 初始化失敗也要結束 loading 狀態
            isInitCompleted = true;
            setIsLoading(false);
        });

        // 監聽身份驗證狀態變化（包括從其他 tab 登入、Token 刷新）
        const unsubscribe = onAuthStateChange((newUser) => {
            // 🔧 修復：使用 ref 而非 state 來檢查驗證狀態，避免閉包問題
            if (!isVerifyingRef.current) {
                // 🔧 修復：如果初始化尚未完成且 newUser 為 null，忽略此事件
                // 這避免了 INITIAL_SESSION 事件在 getSession() 完成前將用戶設為 null
                if (!isInitCompleted && newUser === null) {
                    console.log('⏳ 初始化未完成，忽略空用戶事件');
                    return;
                }
                setUser(newUser);
                setIsGuest(newUser === null);
                setIsLoading(false);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [reloadUser]);

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
