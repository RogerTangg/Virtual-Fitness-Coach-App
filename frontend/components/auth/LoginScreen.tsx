/**
 * 登入畫面組件 (Login Screen Component)
 * 
 * 提供 Email/密碼登入功能
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { AUTH_ERROR_MESSAGES, type AuthError } from '../../types/auth';
import { LogIn, Mail, Lock, User as UserIcon } from 'lucide-react';

interface LoginScreenProps {
    onRegister: () => void;
    onGuestContinue: () => void;
    onBack?: () => void;
    onSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
    onRegister,
    onGuestContinue,
    onBack,
    onSuccess
}) => {
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    /**
     * 處理登入表單提交
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // 基本驗證
        if (!email || !password) {
            setError('請填寫所有欄位');
            return;
        }

        // Email 格式驗證
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError(AUTH_ERROR_MESSAGES.invalid_email);
            return;
        }

        setIsLoading(true);

        try {
            await signIn(email, password);
            // 登入成功，導向首頁
            if (onSuccess) {
                onSuccess();
            }
        } catch (err) {
            const authError = err as AuthError;
            setError(AUTH_ERROR_MESSAGES[authError] || AUTH_ERROR_MESSAGES.unknown_error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in">
            <div className="w-full max-w-md space-y-8">
                {/* 標題區 */}
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <UserIcon size={32} className="text-brand-dark" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-3xl font-extrabold text-brand-dark">會員登入</h2>
                    <p className="text-brand-gray">歡迎回來！繼續您的健身之旅</p>
                </div>

                {/* 登入表單 */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email 輸入框 */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-bold text-brand-dark">
                            Email 地址
                        </label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray">
                                <Mail size={20} />
                            </div>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-dark focus:outline-none transition-colors text-brand-dark placeholder-gray-400"
                                placeholder="your@email.com"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* 密碼輸入框 */}
                    <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-bold text-brand-dark">
                            密碼
                        </label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray">
                                <Lock size={20} />
                            </div>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-dark focus:outline-none transition-colors text-brand-dark placeholder-gray-400"
                                placeholder="••••••••"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* 錯誤訊息 */}
                    {error && (
                        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* 登入按鈕 */}
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        fullWidth
                        disabled={isLoading}
                        className="mt-6"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
                                登入中...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <LogIn size={20} />
                                登入
                            </span>
                        )}
                    </Button>
                </form>

                {/* 分隔線 */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-background text-brand-gray">或</span>
                    </div>
                </div>

                {/* 其他選項 */}
                <div className="space-y-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="md"
                        fullWidth
                        onClick={onGuestContinue}
                    >
                        以訪客身份繼續
                    </Button>

                    <div className="text-center text-sm text-brand-gray">
                        還沒有帳號？
                        <button
                            type="button"
                            onClick={onRegister}
                            className="ml-1 font-bold text-brand-dark hover:underline"
                        >
                            立即註冊
                        </button>
                    </div>

                    {onBack && (
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={onBack}
                                className="text-sm text-brand-gray hover:text-brand-dark transition-colors"
                            >
                                ← 返回首頁
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
