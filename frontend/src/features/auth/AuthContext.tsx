/**
 * AuthContext - 全域身份驗證狀態管理 (Global Authentication State Management)
 * 
 * 提供身份驗證狀態與方法給整個應用程式使用
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AuthState, UserProfile } from '@/types/auth';
import { getCurrentUser, onAuthStateChange } from '@/services/authService';

// 定義 Context 型別
interface AuthContextType extends AuthState {
    /** 重新載入使用者資訊 (Reload user info) */
    reloadUser: () => Promise<void>;

    /** 設定使用者 (Set user) */
    setUser: (user: UserProfile | null) => void;

    /** 進入訪客模式 (Enter guest mode) */
    enterGuestMode: () => void;
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

    // 初始化：載入使用者資訊
    useEffect(() => {
        reloadUser();

        // 監聽身份驗證狀態變化
        const unsubscribe = onAuthStateChange((newUser) => {
            setUser(newUser);
            setIsGuest(newUser === null);
            setIsLoading(false);
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
