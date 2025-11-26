/**
 * EmailVerificationScreen - Email 驗證提示畫面組件
 * 
 * 註冊後顯示，提示使用者前往信箱驗證
 * 自動監聽驗證狀態，驗證成功後自動跳轉
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { resendVerificationEmail } from '@/services/authService';
import { useAuth } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react';

interface EmailVerificationScreenProps {
    /** 使用者註冊的 Email */
    email: string;
    /** 返回登入頁面 */
    onBackToLogin: () => void;
    /** 驗證成功後的回調 */
    onVerificationSuccess?: () => void;
}

export const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({
    email,
    onBackToLogin,
    onVerificationSuccess,
}) => {
    const { setUser } = useAuth();
    const [isResending, setIsResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [resendError, setResendError] = useState('');
    const [countdown, setCountdown] = useState(0);

    // 檢查驗證狀態
    const checkVerificationStatus = useCallback(async () => {
        try {
            // 監聯 auth 狀態變化
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user?.email_confirmed_at) {
                // 取得使用者資料並跳轉
                const { data: profileData } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();

                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    display_name: profileData?.display_name || session.user.email?.split('@')[0],
                    avatar_url: profileData?.avatar_url,
                    role: 'member',
                });

                if (onVerificationSuccess) {
                    onVerificationSuccess();
                }
                return true;
            }
        } catch {
            // 驗證狀態檢查失敗，静默處理
        }
        return false;
    }, [setUser, onVerificationSuccess]);

    // 監聽 Supabase auth 狀態變化
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
                await checkVerificationStatus();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [checkVerificationStatus]);

    // 定期輪詢檢查驗證狀態（每 3 秒）
    useEffect(() => {
        const pollInterval = setInterval(async () => {
            const verified = await checkVerificationStatus();
            if (verified) {
                clearInterval(pollInterval);
            }
        }, 3000);

        return () => {
            clearInterval(pollInterval);
        };
    }, [checkVerificationStatus]);

    // 倒數計時處理
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [countdown]);

    const handleResendEmail = async () => {
        if (countdown > 0) return;

        setIsResending(true);
        setResendError('');
        setResendSuccess(false);

        try {
            await resendVerificationEmail(email);
            setResendSuccess(true);
            setCountdown(60); // 60 秒後可再次發送
        } catch (err: any) {
            setResendError(err.message || '發送失敗，請稍後再試');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <div className="w-full max-w-md space-y-8 text-center">
                {/* Icon Animation */}
                <div className="relative inline-block">
                    <div className="w-24 h-24 bg-brand-light/30 rounded-full flex items-center justify-center mx-auto animate-pulse">
                        <Mail className="w-12 h-12 text-brand-dark" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 bg-brand-dark rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">✉️</span>
                    </div>
                </div>

                {/* Title & Message */}
                <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-brand-dark">
                        請驗證您的 Email
                    </h2>
                    <p className="text-brand-gray leading-relaxed">
                        我們已發送驗證信至
                    </p>
                    <p className="text-lg font-semibold text-brand-dark bg-brand-light/20 py-2 px-4 rounded-lg inline-block">
                        {email}
                    </p>
                    <p className="text-brand-gray leading-relaxed">
                        請點擊信中的驗證連結以完成註冊<br />
                        驗證成功後將自動登入
                    </p>
                </div>

                {/* Instructions */}
                <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3">
                    <h3 className="font-semibold text-brand-dark flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-brand-mid" />
                        操作步驟
                    </h3>
                    <ol className="text-sm text-brand-gray space-y-2 ml-7 list-decimal">
                        <li>前往您的 Email 信箱</li>
                        <li>找到來自 Virtual Coach 的驗證信</li>
                        <li>點擊「確認 Email」按鈕</li>
                        <li>驗證成功後自動跳轉至首頁</li>
                    </ol>
                </div>

                {/* Status Messages */}
                {resendSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-600 flex items-center justify-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            驗證信已重新發送！請查看您的信箱
                        </p>
                    </div>
                )}

                {resendError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{resendError}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-4 pt-4">
                    <p className="text-sm text-brand-gray">
                        沒有收到驗證信？
                    </p>
                    <Button
                        onClick={handleResendEmail}
                        disabled={isResending || countdown > 0}
                        variant="secondary"
                        className="w-full"
                    >
                        {isResending ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                發送中...
                            </>
                        ) : countdown > 0 ? (
                            `${countdown} 秒後可重新發送`
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                重新發送驗證信
                            </>
                        )}
                    </Button>

                    <button
                        onClick={onBackToLogin}
                        className="flex items-center justify-center gap-2 text-brand-gray hover:text-brand-dark transition-colors w-full py-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        返回登入頁面
                    </button>
                </div>

                {/* Tips */}
                <div className="text-xs text-brand-gray/70 pt-4">
                    <p>提示：如果找不到驗證信，請檢查垃圾郵件資料夾</p>
                </div>
            </div>
        </div>
    );
};
