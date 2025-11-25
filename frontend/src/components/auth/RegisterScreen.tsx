/**
 * RegisterScreen - 註冊畫面組件 (Register Screen Component)
 * 
 * 提供 Email/密碼註冊表單
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { signUp } from '@/services/authService';
import { useAuth } from '@/features/auth/AuthContext';
import { UserPlus } from 'lucide-react';

interface RegisterScreenProps {
    /** 註冊成功後的回調 (Callback after successful registration) */
    onSuccess: () => void;

    /** 切換至登入畫面 (Switch to login screen) */
    onSwitchToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
    onSuccess,
    onSwitchToLogin,
}) => {
    const { setUser } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // 驗證密碼是否一致
        if (password !== confirmPassword) {
            setError('密碼與確認密碼不一致');
            return;
        }

        // 驗證密碼長度
        if (password.length < 6) {
            setError('密碼至少需要 6 個字元');
            return;
        }

        setIsLoading(true);

        try {
            const user = await signUp({
                email,
                password,
                confirmPassword,
                display_name: displayName || undefined,
            });
            setUser(user);
            onSuccess();
        } catch (err: any) {
            setError(err.message || '註冊失敗，請稍後再試');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="inline-block p-3 bg-brand-light rounded-full mb-4">
                        <UserPlus className="w-8 h-8 text-brand-dark" />
                    </div>
                    <h2 className="text-3xl font-bold text-brand-dark">建立帳號</h2>
                    <p className="mt-2 text-brand-gray">開始記錄您的健身旅程</p>
                </div>

                {/* Register Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Display Name Input (Optional) */}
                    <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-brand-dark mb-2">
                            顯示名稱 <span className="text-brand-gray">(選填)</span>
                        </label>
                        <input
                            id="displayName"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border-2 border-brand-light/50 focus:border-brand-dark focus:outline-none transition-colors"
                            placeholder="您的暱稱"
                        />
                    </div>

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
                            密碼 <span className="text-sm text-brand-gray">(至少 6 個字元)</span>
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

                    {/* Confirm Password Input */}
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-brand-dark mb-2">
                            確認密碼
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                        {isLoading ? '註冊中...' : '註冊'}
                    </Button>
                </form>

                {/* Switch to Login */}
                <div className="text-center">
                    <p className="text-brand-gray">
                        已有帳號？{' '}
                        <button
                            onClick={onSwitchToLogin}
                            className="text-brand-dark font-semibold hover:underline"
                        >
                            前往登入
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
