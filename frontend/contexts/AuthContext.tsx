/**
 * 認證 Context Provider (Authentication Context Provider)
 * 
 * 提供全域認證狀態管理
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, AuthContextType } from '../types/auth';
import * as authService from '../services/authService';

/**
 * 建立 Auth Context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Props
 */
interface AuthProviderProps {
    children: ReactNode;
}

/**
 * AuthProvider 組件 (Auth Provider Component)
 * 
 * 管理全域認證狀態，提供認證相關功能給所有子組件
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * 初始化：檢查是否有現存的 session
     */
    useEffect(() => {
        const initAuth = async () => {
            try {
                const currentUser = await authService.getCurrentUser();
                setUser(currentUser);
            } catch (error) {
                console.error('初始化認證失敗:', error);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();

        // 監聽認證狀態變化
        const unsubscribe = authService.onAuthStateChange((newUser) => {
            setUser(newUser);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    /**
     * 註冊 (Sign Up)
     * 
     * @returns boolean - true 如果需要 Email 驗證，false 如果立即登入
     */
    const handleSignUp = async (email: string, password: string, displayName: string): Promise<boolean> => {
        setError(null);
        try {
            const result = await authService.signUp(email, password, displayName);

            // 如果需要 Email 驗證，返回 true 讓 UI 顯示提示
            if (result.needsEmailVerification) {
                return true;
            }

            // 否則直接登入
            if (result.user) {
                setUser(result.user);
            }
            return false;
        } catch (err) {
            throw err;
        }
    };

    /**
     * 登入 (Sign In)
     */
    const handleSignIn = async (email: string, password: string) => {
        setError(null);
        try {
            const loggedInUser = await authService.signIn(email, password);
            setUser(loggedInUser);
        } catch (err) {
            throw err;
        }
    };

    /**
     * 登出 (Sign Out)
     */
    const signOut = async () => {
        await authService.signOut();
        setUser(null);
    };

    /**
     * 更新個人資料 (Update Profile)
     */
    const updateProfile = async (displayName: string, avatarUrl?: string) => {
        if (!user) {
            throw new Error('未登入');
        }

        const updatedProfile = await authService.updateProfile(user.id, displayName, avatarUrl);

        setUser({
            ...user,
            profile: updatedProfile
        });
    };

    const value: AuthContextType = {
        user,
        isGuest: user === null,
        isLoading,
        signUp: handleSignUp,
        signIn: handleSignIn,
        signOut,
        updateProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * useAuth Hook
 * 
 * 在任何組件中使用此 Hook 獲取認證狀態與功能
 * 
 * @returns {AuthContextType} 認證 Context
 * @throws {Error} 若在 AuthProvider 外使用
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth 必須在 AuthProvider 內使用');
    }

    return context;
};
