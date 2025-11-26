import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * ConfirmDialog 組件 (Confirm Dialog Component)
 * 
 * 自訂確認對話框，替代原生的 window.confirm
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = '確定',
    cancelText = '取消',
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
            {/* 背景遮罩 */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            ></div>

            {/* 對話框 */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-4 animate-scale-in">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertCircle size={24} className="text-red-600" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-brand-dark mb-2">{title}</h3>
                        <p className="text-brand-gray">{message}</p>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button
                        variant="outline"
                        size="md"
                        fullWidth
                        onClick={onCancel}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant="primary"
                        size="md"
                        fullWidth
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};
