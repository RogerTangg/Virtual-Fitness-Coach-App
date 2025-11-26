import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Info, AlertCircle, HelpCircle, X } from 'lucide-react';

export type DialogType = 'confirm' | 'alert' | 'warning' | 'info';

export interface ConfirmDialogProps {
    isOpen: boolean;
    type?: DialogType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'primary' | 'danger';
    onConfirm: () => void;
    onCancel: () => void;
    showCancel?: boolean;
}

const dialogIcons: Record<DialogType, { icon: React.ReactNode; color: string }> = {
    confirm: {
        icon: <HelpCircle size={24} />,
        color: 'text-brand-dark bg-brand-light/30',
    },
    alert: {
        icon: <AlertCircle size={24} />,
        color: 'text-red-600 bg-red-100',
    },
    warning: {
        icon: <AlertTriangle size={24} />,
        color: 'text-amber-600 bg-amber-100',
    },
    info: {
        icon: <Info size={24} />,
        color: 'text-blue-600 bg-blue-100',
    },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    type = 'confirm',
    title,
    message,
    confirmText = '確認',
    cancelText = '取消',
    confirmVariant = 'primary',
    onConfirm,
    onCancel,
    showCancel = true,
}) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const confirmButtonRef = useRef<HTMLButtonElement>(null);
    const { icon, color } = dialogIcons[type];

    // Focus trap and escape key handling
    useEffect(() => {
        if (!isOpen) return;

        // Focus confirm button when dialog opens
        confirmButtonRef.current?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        // Prevent body scroll when dialog is open
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            aria-describedby="dialog-message"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div
                ref={dialogRef}
                className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-dialog-enter overflow-hidden"
            >
                {/* Close button */}
                <button
                    onClick={onCancel}
                    className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 transition-colors z-10"
                    aria-label="關閉"
                >
                    <X size={20} className="text-gray-400" />
                </button>

                {/* Content */}
                <div className="p-6 pt-8 text-center">
                    {/* Icon */}
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full ${color} mb-4`}>
                        {icon}
                    </div>

                    {/* Title */}
                    <h2
                        id="dialog-title"
                        className="text-xl font-bold text-gray-900 mb-2"
                    >
                        {title}
                    </h2>

                    {/* Message */}
                    <p
                        id="dialog-message"
                        className="text-gray-600 leading-relaxed"
                    >
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-4 pt-2 border-t border-gray-100">
                    {showCancel && (
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        ref={confirmButtonRef}
                        onClick={onConfirm}
                        className={`
                            flex-1 px-4 py-3 rounded-xl font-semibold transition-colors
                            ${confirmVariant === 'danger'
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-brand-dark text-white hover:bg-brand-mid'
                            }
                        `}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
