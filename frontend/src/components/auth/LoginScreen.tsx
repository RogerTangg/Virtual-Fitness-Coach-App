/**
 * LoginScreen - 登入畫面組件 (Login Screen Component)
 * 
 * 提供 Email/密碼登入表單與導航至註冊頁面的連結
 * 支援未驗證用戶跳轉至驗證提示頁面
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { signIn } from '@/services/authService';
import { useAuth } from '@/features/auth/AuthContext';
import { EmailVerificationScreen } from './EmailVerificationScreen';
import { LogIn, User } from 'lucide-react';

interface LoginScreenProps {
    /** 登入成功後的回調 (Callback after successful login) */
    onSuccess: () => void;

    /** 切換至註冊畫面 (Switch to register screen) */
    onSwitchToRegister: () => void;

    /** 以訪客身份繼續 (Continue as guest) */
    onContinueAsGuest: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
    onSuccess,
    onSwitchToRegister,
    onContinueAsGuest,
}) => {
    const { setUser } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Email 驗證狀態
    const [showVerification, setShowVerification] = useState(false);
    const [pendingEmail, setPendingEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await signIn({ email, password });
            
            if (result.needsEmailVerification) {
                // 需要 Email 驗證，顯示驗證提示畫面
                setPendingEmail(result.email || email);
                setShowVerification(true);
                setIsLoading(false);
                return;
            }
            
            if (result.success && result.user) {
                // 登入成功
                setUser(result.user);
                onSuccess();
            } else {
                // 其他未知狀態
                setError('登入失敗，請稍後再試');
            }
        } catch (err: any) {
            setError(err.message || '登入失敗，請檢查 Email 與密碼');
        } finally {
            setIsLoading(false);
        }
    };

    // 顯示 Email 驗證提示畫面
    if (showVerification) {
        return (
            <EmailVerificationScreen
                email={pendingEmail}
                onBackToLogin={() => setShowVerification(false)}
                onVerificationSuccess={onSuccess}
            />
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="inline-block p-3 bg-brand-light rounded-full mb-4">
                        <LogIn className="w-8 h-8 text-brand-dark" />
                    </div>
                    <h2 className="text-3xl font-bold text-brand-dark">會員登入</h2>
                    <p className="mt-2 text-brand-gray">登入以同步您的訓練紀錄</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email Input */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-brand-dark mb-2">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border-2 border-brand-light/50 focus:border-brand-dark focus:outline-none transition-colors"
                            placeholder="your.email@example.com"
                        />
                    </div>

                    {/* Password Input */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-brand-dark mb-2">
                            密碼
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border-2 border-brand-light/50 focus:border-brand-dark focus:outline-none transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full"
                        size="lg"
                    >
                        {isLoading ? '登入中...' : '登入'}
                    </Button>
                </form>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-brand-light/50"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-background text-brand-gray">或</span>
                    </div>
                </div>

                {/* Guest Mode Button */}
                <Button
                    onClick={onContinueAsGuest}
                    variant="secondary"
                    className="w-full"
                    size="lg"
                >
                    <User className="w-5 h-5 mr-2" />
                    以訪客身份繼續
                </Button>

                {/* Switch to Register */}
                <div className="text-center">
                    <p className="text-brand-gray">
                        還沒有帳號？{' '}
                        <button
                            onClick={onSwitchToRegister}
                            className="text-brand-dark font-semibold hover:underline"
                        >
                            立即註冊
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
