/**
 * 個人資料頁面組件 (Profile Screen Component)
 * 
 * 顯示與編輯使用者個人資料
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { User as UserIcon, Mail, Calendar, Edit2, Check, X, LogOut } from 'lucide-react';

interface ProfileScreenProps {
    onBack: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
    const { user, signOut, updateProfile } = useAuth();
    const [isEditingName, setIsEditingName] = useState(false);
    const [newDisplayName, setNewDisplayName] = useState(user?.profile.display_name || '');
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState('');

    if (!user) {
        return null;
    }

    /**
     * 處理顯示名稱更新
     */
    const handleUpdateName = async () => {
        setError('');

        if (newDisplayName.trim().length < 2) {
            setError('顯示名稱至少需要 2 個字元');
            return;
        }

        if (newDisplayName === user.profile.display_name) {
            setIsEditingName(false);
            return;
        }

        setIsUpdating(true);

        try {
            await updateProfile(newDisplayName.trim());
            setIsEditingName(false);
        } catch (err) {
            setError('更新失敗，請稍後再試');
        } finally {
            setIsUpdating(false);
        }
    };

    /**
     * 取消編輯
     */
    const handleCancelEdit = () => {
        setNewDisplayName(user.profile.display_name);
        setIsEditingName(false);
        setError('');
    };

    /**
     * 處理登出
     */
    const handleSignOut = async () => {
        if (confirm('確定要登出嗎？')) {
            try {
                await signOut();
            } catch (err) {
                alert('登出失敗，請稍後再試');
            }
        }
    };

    /**
     * 格式化日期
     */
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-[80vh] px-4 py-8 animate-fade-in">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* 頁面標題 */}
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-extrabold text-brand-dark">個人資料</h2>
                    <button
                        onClick={onBack}
                        className="text-brand-gray hover:text-brand-dark transition-colors"
                    >
                        ← 返回
                    </button>
                </div>

                {/* 個人資料卡片 */}
                <div className="bg-white border-2 border-gray-100 rounded-2xl shadow-lg overflow-hidden">
                    {/* 頂部裝飾 */}
                    <div className="h-24 bg-gradient-to-r from-brand-dark to-brand-mid"></div>

                    {/* 頭像與會員標記 */}
                    <div className="px-6 -mt-12 pb-6">
                        <div className="flex items-end gap-4">
                            <div className="w-24 h-24 bg-brand-light rounded-2xl flex items-center justify-center shadow-xl border-4 border-white">
                                <UserIcon size={48} className="text-brand-dark" strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 pb-2">
                                <span className="inline-block px-3 py-1 bg-brand-light/20 text-brand-dark text-xs font-bold rounded-full border border-brand-light">
                                    ✨ 會員
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 資料欄位 */}
                    <div className="px-6 pb-6 space-y-6">
                        {/* 顯示名稱 */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-brand-gray">顯示名稱</label>

                            {isEditingName ? (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newDisplayName}
                                            onChange={(e) => setNewDisplayName(e.target.value)}
                                            className="flex-1 px-4 py-2 border-2 border-brand-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-dark text-brand-dark"
                                            maxLength={50}
                                            disabled={isUpdating}
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleUpdateName}
                                            disabled={isUpdating}
                                            className="px-4 py-2 bg-brand-dark text-brand-light rounded-xl hover:bg-opacity-90 transition-colors disabled:opacity-50"
                                        >
                                            {isUpdating ? (
                                                <div className="w-5 h-5 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Check size={20} />
                                            )}
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            disabled={isUpdating}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                    {error && (
                                        <p className="text-sm text-red-600">{error}</p>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl">
                                    <span className="text-brand-dark font-medium">{user.profile.display_name}</span>
                                    <button
                                        onClick={() => setIsEditingName(true)}
                                        className="text-brand-dark hover:bg-white p-2 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-brand-gray">Email 地址</label>
                            <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl">
                                <Mail size={20} className="text-brand-gray" />
                                <span className="text-brand-dark font-medium">{user.email}</span>
                            </div>
                            <p className="text-xs text-brand-gray pl-1">Email 無法修改</p>
                        </div>

                        {/* 註冊日期 */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-brand-gray">加入日期</label>
                            <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl">
                                <Calendar size={20} className="text-brand-gray" />
                                <span className="text-brand-dark font-medium">{formatDate(user.profile.created_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 登出按鈕 */}
                <div className="pt-4">
                    <Button
                        onClick={handleSignOut}
                        variant="outline"
                        size="lg"
                        fullWidth
                        className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                    >
                        <span className="flex items-center gap-2">
                            <LogOut size={20} />
                            登出
                        </span>
                    </Button>
                </div>

                {/* 說明文字 */}
                <p className="text-center text-sm text-brand-gray">
                    所有訓練紀錄已自動同步至雲端 ☁️
                </p>
            </div>
        </div>
    );
};
