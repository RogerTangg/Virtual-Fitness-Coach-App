import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { UserPlus, Mail, Lock, User, ArrowLeft, CheckCircle, Inbox } from 'lucide-react';

interface RegisterScreenProps {
    onLogin: () => void;
    onBack: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onLogin, onBack }) => {
    const { signUp } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showVerificationMessage, setShowVerificationMessage] = useState(false);

    /**
     * 表單驗證
     */
    const validateForm = (): boolean => {
        if (displayName.trim().length < 2) {
            setError('顯示名稱至少需要 2 個字元');
            return false;
        }

        if (!email.includes('@')) {
            setError('請輸入有效的 Email 地址');
            return false;
        }

        if (password.length < 6) {
            setError('密碼至少需要 6 個字元');
            return false;
        }

        return true;
    };

    /**
     * 處理註冊
     */
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const needsVerification = await signUp(email.trim(), password, displayName.trim());

            if (needsVerification) {
                // 需要 Email 驗證
                setShowVerificationMessage(true);
            }
            // 如果不需要驗證，AuthContext 會自動更新狀態並導向首頁
        } catch (err) {
            setError('發生錯誤，請稍後再試');
        } finally {
            setIsLoading(false);
        }
    };

    // 如果顯示驗證訊息
    if (showVerificationMessage) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in">
                <div className="w-full max-w-md space-y-8 text-center">
                    {/* 成功圖示 */}
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                        <Inbox size={40} className="text-green-600" strokeWidth={2} />
                    </div>

                    {/* 標題 */}
                    <div className="space-y-3">
                        <h2 className="text-3xl font-extrabold text-brand-dark">請檢查您的 Email</h2>
                        <p className="text-lg text-brand-gray">
                            我們已發送驗證郵件至
                        </p>
                        <p className="text-lg font-bold text-brand-dark">
                            {email}
                        </p>
                    </div>

                    {/* 說明 */}
                    <div className="bg-brand-light/20 border-2 border-brand-light rounded-2xl p-6 space-y-4">
                        <div className="flex items-start gap-3 text-left">
                            <CheckCircle size={24} className="text-brand-dark flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-brand-dark mb-1">點擊驗證連結</p>
                                <p className="text-sm text-brand-gray">請開啟郵件並點擊驗證連結以啟用您的帳號</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 text-left">
                            <CheckCircle size={24} className="text-brand-dark flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-brand-dark mb-1">自動登入</p>
                                <p className="text-sm text-brand-gray">驗證完成後，系統會自動為您登入</p>
                            </div>
                        </div>
                    </div>

                    {/* 提示 */}
                    <p className="text-sm text-brand-gray">
                        沒收到郵件？請檢查垃圾郵件資料夾，或
                        <button
                            onClick={() => setShowVerificationMessage(false)}
                            className="ml-1 font-bold text-brand-dark hover:underline"
                        >
                            重新註冊
                        </button>
                    </p>

                    {/* 返回按鈕 */}
                    <Button
                        onClick={onBack}
                        variant="outline"
                        size="lg"
                        fullWidth
                        className="gap-2"
                    >
                        <ArrowLeft size={20} />
                        返回首頁
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in">
            <div className="w-full max-w-md space-y-8">
                {/* 標題 */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-light rounded-2xl mb-4">
                        <UserPlus size={32} className="text-brand-dark" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-3xl font-extrabold text-brand-dark">建立帳號</h2>
                    <p className="text-brand-gray">開始您的專屬健身旅程</p>
                </div>

                {/* 註冊表單 */}
                <form onSubmit={handleRegister} className="space-y-6">
                    {/* 顯示名稱 */}
                    <div className="space-y-2">
                        <label htmlFor="displayName" className="block text-sm font-bold text-brand-dark">
                            顯示名稱
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User size={20} className="text-brand-gray" />
                            </div>
                            <input
                                id="displayName"
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-dark text-brand-dark ${error && displayName.trim().length < 2 ? 'border-red-400' : 'border-gray-200'
                                    }`}
                                placeholder="輸入您的名稱"
                                maxLength={50}
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-bold text-brand-dark">
                            Email 地址
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail size={20} className="text-brand-gray" />
                            </div>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-dark text-brand-dark ${error && !email.includes('@') ? 'border-red-400' : 'border-gray-200'
                                    }`}
                                placeholder="your@email.com"
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>

                    {/* 密碼 */}
                    <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-bold text-brand-dark">
                            密碼
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock size={20} className="text-brand-gray" />
                            </div>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-dark text-brand-dark ${error && password.length < 6 ? 'border-red-400' : 'border-gray-200'
                                    }`}
                                placeholder="••••••••"
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <p className="text-xs text-brand-gray pl-1">密碼需至少 6 個字元</p>
                    </div>

                    {/* 錯誤訊息 */}
                    {error && (
                        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {/* 註冊按鈕 */}
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        fullWidth
                        disabled={isLoading}
                        className="gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
                                處理中...
                            </>
                        ) : (
                            <>
                                <UserPlus size={20} />
                                建立帳號
                            </>
                        )}
                    </Button>
                </form>

                {/* 登入連結 */}
                <div className="text-center space-y-4">
                    <p className="text-sm text-brand-gray">
                        已經有帳號了？
                        <button
                            onClick={onLogin}
                            className="ml-1 font-bold text-brand-dark hover:underline transition-colors"
                            disabled={isLoading}
                        >
                            立即登入
                        </button>
                    </p>

                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-sm text-brand-gray hover:text-brand-dark transition-colors mx-auto"
                        disabled={isLoading}
                    >
                        <ArrowLeft size={16} />
                        返回首頁
                    </button>
                </div>

                {/* 服務條款 */}
                <p className="text-xs text-center text-brand-gray/60">
                    註冊即表示您同意我們的服務條款與隱私政策
                </p>
            </div>
        </div>
    );
};
