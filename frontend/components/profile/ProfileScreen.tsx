import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { User, Camera, LogOut } from 'lucide-react';

/**
 * ProfileScreen 組件 (Profile Screen Component)
 * 
 * 使用者個人資料管理頁面
 * 
 * @param {Object} props - 組件 Props
 * @param {Function} props.onBack - 返回上一頁的回調
 */
export const ProfileScreen: React.FC<{
    onBack: () => void;
}> = ({ onBack }) => {
    const { user, profile, updateProfile, signOut } = useAuth();
    const [editing, setEditing] = useState(false);
    const [displayName, setDisplayName] = useState(profile?.display_name || '');
    const [height, setHeight] = useState(profile?.height?.toString() || '');
    const [weight, setWeight] = useState(profile?.weight?.toString() || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // 當 profile 更新時，同步更新本地狀態
    React.useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || '');
            setHeight(profile.height?.toString() || '');
            setWeight(profile.weight?.toString() || '');
        }
    }, [profile]);

    const handleSave = async () => {
        setLoading(true);
        setMessage(null);

        try {
            await updateProfile({
                display_name: displayName || undefined,
                height: height ? parseFloat(height) : undefined,
                weight: weight ? parseFloat(weight) : undefined,
            });

            setMessage({ type: 'success', text: '個人資料更新成功' });
            setEditing(false);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || '更新失敗' });
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        if (confirm('確定要登出嗎？')) {
            await signOut();
            onBack();
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-brand-dark">個人資料</h2>
                <button
                    onClick={onBack}
                    className="text-brand-gray hover:text-brand-dark transition"
                >
                    返回
                </button>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                        <div className="w-24 h-24 bg-brand-light rounded-full flex items-center justify-center">
                            {profile?.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt="Avatar"
                                    className="w-24 h-24 rounded-full object-cover"
                                />
                            ) : (
                                <User size={48} className="text-brand-dark" />
                            )}
                        </div>
                        {editing && (
                            <button className="absolute bottom-0 right-0 w-8 h-8 bg-brand-dark text-white rounded-full flex items-center justify-center shadow-lg hover:bg-brand-mid transition">
                                <Camera size={16} />
                            </button>
                        )}
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-brand-gray">{user?.email}</p>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div
                        className={`px-4 py-3 rounded-lg text-sm ${message.type === 'success'
                            ? 'bg-green-50 border border-green-200 text-green-700'
                            : 'bg-red-50 border border-red-200 text-red-700'
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                {/* Profile Form */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-brand-dark mb-1">
                            顯示名稱
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            disabled={!editing}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-light focus:border-brand-light outline-none transition disabled:bg-gray-50 disabled:text-gray-500"
                            placeholder="您的暱稱"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-brand-dark mb-1">
                                身高 (cm)
                            </label>
                            <input
                                type="number"
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                                disabled={!editing}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-light focus:border-brand-light outline-none transition disabled:bg-gray-50 disabled:text-gray-500"
                                placeholder="170"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-brand-dark mb-1">
                                體重 (kg)
                            </label>
                            <input
                                type="number"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                disabled={!editing}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-light focus:border-brand-light outline-none transition disabled:bg-gray-50 disabled:text-gray-500"
                                placeholder="70"
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    {editing ? (
                        <>
                            <Button
                                onClick={handleSave}
                                className="flex-1"
                                disabled={loading}
                            >
                                {loading ? '儲存中...' : '儲存變更'}
                            </Button>
                            <button
                                onClick={() => {
                                    setEditing(false);
                                    setDisplayName(profile?.display_name || '');
                                    setHeight(profile?.height?.toString() || '');
                                    setWeight(profile?.weight?.toString() || '');
                                }}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-brand-dark"
                            >
                                取消
                            </button>
                        </>
                    ) : (
                        <Button
                            onClick={() => setEditing(true)}
                            className="flex-1"
                        >
                            編輯資料
                        </Button>
                    )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200"></div>

                {/* Sign Out */}
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium"
                >
                    <LogOut size={18} />
                    登出
                </button>
            </div>
        </div>
    );
};
