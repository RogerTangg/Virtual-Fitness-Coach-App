/**
 * ProfileScreen - 個人頁面組件 (Profile Screen Component)
 * Phase 2: 完整個人資料管理 - 桌面端優化版本
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { updateProfile, signOut } from '@/services/authService';
import { getWorkoutStats } from '@/services/workoutLogService';
import { WorkoutStats } from '@/types/workoutLog';
import { useAuth } from '@/features/auth/AuthContext';
import { 
  User, 
  LogOut, 
  History, 
  ArrowLeft,
  Mail,
  Edit3,
  X,
  Check,
  Dumbbell,
  Clock,
  Flame,
  Star,
  ChevronRight,
  Award,
  TrendingUp,
  Settings
} from 'lucide-react';

interface ProfileScreenProps {
    onBack: () => void;
    onHistoryClick?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack, onHistoryClick }) => {
    const { user, setUser } = useAuth();
    const [displayName, setDisplayName] = useState(user?.display_name || '');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [stats, setStats] = useState<WorkoutStats | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    useEffect(() => {
        if (user) {
            loadStats();
        }
    }, [user]);

    const loadStats = async () => {
        setIsLoadingStats(true);
        try {
            const statsData = await getWorkoutStats(user?.id || null);
            setStats(statsData);
        } catch (error) {
            console.error('載入統計失敗:', error);
        } finally {
            setIsLoadingStats(false);
        }
    };

    const getInitials = () => {
        if (user?.display_name) return user.display_name.charAt(0).toUpperCase();
        if (user?.email) return user.email.charAt(0).toUpperCase();
        return 'U';
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <User size={32} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">請先登入</h3>
                <p className="text-gray-500 mb-6">登入後可查看個人資料與訓練紀錄</p>
                <Button onClick={onBack}>返回首頁</Button>
            </div>
        );
    }

    const handleSave = async () => {
        if (!displayName.trim()) {
            setError('請輸入顯示名稱');
            return;
        }
        setError('');
        setSuccess('');
        setIsSaving(true);

        try {
            const updatedUser = await updateProfile({ display_name: displayName.trim() });
            setUser(updatedUser);
            setSuccess('個人資料已更新');
            setIsEditing(false);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || '更新失敗，請稍後再試');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setDisplayName(user.display_name || '');
        setError('');
    };

    const handleSignOutConfirm = async () => {
        setShowLogoutDialog(false);
        try {
            await signOut();
            setUser(null);
            onBack();
        } catch (err: any) {
            setError(err.message || '登出失敗');
        }
    };

    return (
        <div className="min-h-[80vh] animate-fade-in">
            {/* 頁面標題 */}
            <div className="mb-8">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-500 hover:text-brand-dark mb-6 transition-colors group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span>返回首頁</span>
                </button>
                
                <h1 className="text-3xl font-bold text-brand-dark">個人檔案</h1>
            </div>

            {/* 兩欄佈局 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 左側：個人資料卡片 */}
                <div className="lg:col-span-2 space-y-6">
                    {/* 個人資訊卡片 */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center gap-5">
                                {/* 頭像 */}
                                <div className="w-20 h-20 bg-brand-light rounded-2xl flex items-center justify-center text-3xl font-bold text-brand-dark">
                                    {getInitials()}
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {user.display_name || '健身達人'}
                                    </h2>
                                    <p className="text-gray-500">{user.email}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-light text-brand-dark">
                                            {user.role === 'member' ? '會員' : '訪客'}
                                        </span>
                                        {stats && stats.currentStreak >= 3 && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                                🔥 連續 {stats.currentStreak} 天
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 編輯個人資料 */}
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-800">個人資料</h3>
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-1.5 text-sm text-brand-dark hover:underline"
                                    >
                                        <Edit3 size={14} />
                                        編輯
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {/* Email */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm text-gray-500 mb-1.5">
                                        <Mail size={14} />
                                        Email
                                    </label>
                                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-700 border border-gray-100">
                                        {user.email}
                                    </div>
                                </div>

                                {/* 顯示名稱 */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm text-gray-500 mb-1.5">
                                        <User size={14} />
                                        顯示名稱
                                    </label>
                                    {isEditing ? (
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-brand-light focus:border-brand-dark focus:outline-none transition-colors"
                                                placeholder="您的暱稱"
                                                autoFocus
                                            />
                                            <div className="flex gap-2">
                                                <Button onClick={handleSave} disabled={isSaving} size="sm" className="gap-1.5">
                                                    <Check size={16} />
                                                    {isSaving ? '儲存中...' : '儲存'}
                                                </Button>
                                                <Button onClick={handleCancelEdit} variant="secondary" size="sm" className="gap-1.5">
                                                    <X size={16} />
                                                    取消
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-700 border border-gray-100">
                                            {user.display_name || '(未設定)'}
                                        </div>
                                    )}
                                </div>

                                {/* 訊息 */}
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                                        <X size={16} className="text-red-500" />
                                        <p className="text-sm text-red-600">{error}</p>
                                    </div>
                                )}
                                {success && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                                        <Check size={16} className="text-green-500" />
                                        <p className="text-sm text-green-600">{success}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 快速操作 */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800">快速操作</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {onHistoryClick && (
                                <ActionRow
                                    icon={<History size={20} />}
                                    iconColor="text-blue-600"
                                    iconBg="bg-blue-100"
                                    title="訓練歷史紀錄"
                                    subtitle="查看所有訓練紀錄與統計"
                                    onClick={onHistoryClick}
                                />
                            )}
                            <ActionRow
                                icon={<Award size={20} />}
                                iconColor="text-yellow-600"
                                iconBg="bg-yellow-100"
                                title="訓練成就"
                                subtitle="查看已解鎖的成就徽章"
                                disabled
                                badge="即將推出"
                            />
                            <ActionRow
                                icon={<TrendingUp size={20} />}
                                iconColor="text-green-600"
                                iconBg="bg-green-100"
                                title="進度追蹤"
                                subtitle="查看訓練數據與趨勢分析"
                                disabled
                                badge="即將推出"
                            />
                            <ActionRow
                                icon={<Settings size={20} />}
                                iconColor="text-gray-600"
                                iconBg="bg-gray-100"
                                title="應用程式設定"
                                subtitle="語音、通知與顯示偏好"
                                disabled
                                badge="即將推出"
                            />
                        </div>
                    </div>
                </div>

                {/* 右側：統計與登出 */}
                <div className="space-y-6">
                    {/* 訓練統計 */}
                    {!isLoadingStats && stats && stats.totalWorkouts > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                            <h3 className="font-semibold text-gray-800 mb-4">訓練統計</h3>
                            <div className="space-y-4">
                                <StatRow icon={<Dumbbell size={18} />} label="總訓練次數" value={`${stats.totalWorkouts} 次`} />
                                <StatRow icon={<Clock size={18} />} label="總訓練時間" value={`${stats.totalMinutes} 分鐘`} />
                                <StatRow 
                                    icon={<Flame size={18} />} 
                                    label="連續天數" 
                                    value={`${stats.currentStreak} 天`} 
                                    highlight={stats.currentStreak >= 3}
                                />
                                <StatRow icon={<Star size={18} />} label="平均評分" value={stats.avgRating ? `${stats.avgRating.toFixed(1)} 星` : '-'} />
                            </div>
                        </div>
                    )}

                    {/* 帳號操作 */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <h3 className="font-semibold text-gray-800 mb-4">帳號</h3>
                        <button
                            onClick={() => setShowLogoutDialog(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors font-medium"
                        >
                            <LogOut size={18} />
                            登出帳號
                        </button>
                    </div>

                    {/* 版本資訊 */}
                    <div className="text-center text-xs text-gray-400">
                        Virtual Fitness Coach v2.0
                    </div>
                </div>
            </div>

            {/* 登出確認對話框 */}
            <ConfirmDialog
                isOpen={showLogoutDialog}
                type="warning"
                title="確定要登出嗎？"
                message="登出後您的訓練記錄將無法同步，但仍可以訪客身份使用。"
                confirmText="登出"
                cancelText="取消"
                confirmVariant="danger"
                onConfirm={handleSignOutConfirm}
                onCancel={() => setShowLogoutDialog(false)}
            />
        </div>
    );
};

// 操作行
const ActionRow = ({
    icon,
    iconColor,
    iconBg,
    title,
    subtitle,
    onClick,
    disabled = false,
    badge,
}: {
    icon: React.ReactNode;
    iconColor: string;
    iconBg: string;
    title: string;
    subtitle: string;
    onClick?: () => void;
    disabled?: boolean;
    badge?: string;
}) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-colors ${
            disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'
        }`}
    >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} ${iconColor}`}>
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800">{title}</span>
                {badge && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
                        {badge}
                    </span>
                )}
            </div>
            <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
    </button>
);

// 統計行
const StatRow = ({
    icon,
    label,
    value,
    highlight = false,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    highlight?: boolean;
}) => (
    <div className={`flex items-center justify-between p-3 rounded-xl ${highlight ? 'bg-orange-50' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-3">
            <span className={highlight ? 'text-orange-500' : 'text-gray-500'}>{icon}</span>
            <span className="text-gray-600">{label}</span>
        </div>
        <span className={`font-semibold ${highlight ? 'text-orange-600' : 'text-gray-900'}`}>
            {value}
            {highlight && ' 🔥'}
        </span>
    </div>
);
