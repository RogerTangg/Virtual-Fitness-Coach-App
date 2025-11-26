/**
 * ProfileScreen - 個人頁面組件 (Profile Screen Component)
 * 
 * 顯示並編輯使用者個人資料，提供登出功能
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { updateProfile, signOut } from '@/services/authService';
import { useAuth } from '@/features/auth/AuthContext';
import { User, LogOut, Save } from 'lucide-react';

interface ProfileScreenProps {
    /** 返回首頁 (Back to home) */
    onBack: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
    const { user, setUser } = useAuth();
    const [displayName, setDisplayName] = useState(user?.display_name || '');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <p className="text-brand-gray">請先登入</p>
                <Button onClick={onBack} className="mt-4">返回首頁</Button>
            </div>
        );
    }

    const handleSave = async () => {
        setError('');
        setSuccess('');
        setIsSaving(true);

        try {
            const updatedUser = await updateProfile({ display_name: displayName });
            setUser(updatedUser);
            setSuccess('個人資料已更新');
            setIsEditing(false);
        } catch (err: any) {
            setError(err.message || '更新失敗，請稍後再試');
        } finally {
            setIsSaving(false);
        }
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
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="inline-block p-3 bg-brand-light rounded-full mb-4">
                        <User className="w-8 h-8 text-brand-dark" />
                    </div>
                    <h2 className="text-3xl font-bold text-brand-dark">個人資料</h2>
                </div>

                {/* Profile Info */}
                <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-brand-light/30">
                    {/* Email (Read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-brand-dark mb-2">
                            Email
                        </label>
                        <div className="px-4 py-3 bg-gray-50 rounded-lg text-brand-gray">
                            {user.email}
                        </div>
                    </div>

                    {/* Display Name */}
                    <div>
                        <label className="block text-sm font-medium text-brand-dark mb-2">
                            顯示名稱
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border-2 border-brand-light/50 focus:border-brand-dark focus:outline-none transition-colors"
                                placeholder="您的暱稱"
                            />
                        ) : (
                            <div className="px-4 py-3 bg-gray-50 rounded-lg text-brand-dark">
                                {user.display_name || '(未設定)'}
                            </div>
                        )}
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-600">{success}</p>
                        </div>
                    )}

                    {/* Edit/Save Buttons */}
                    <div className="flex gap-3">
                        {isEditing ? (
                            <>
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-1"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {isSaving ? '儲存中...' : '儲存'}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setDisplayName(user.display_name || '');
                                        setError('');
                                        setSuccess('');
                                    }}
                                    variant="secondary"
                                    className="flex-1"
                                >
                                    取消
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={() => setIsEditing(true)}
                                variant="secondary"
                                className="w-full"
                            >
                                編輯個人資料
                            </Button>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <Button
                        onClick={() => setShowLogoutDialog(true)}
                        variant="secondary"
                        className="w-full"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        登出
                    </Button>

                    <Button
                        onClick={onBack}
                        variant="secondary"
                        className="w-full"
                    >
                        返回首頁
                    </Button>
                </div>

                {/* Logout Confirmation Dialog */}
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
        </div>
    );
};
