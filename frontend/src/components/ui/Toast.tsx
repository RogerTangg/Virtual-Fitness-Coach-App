import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
    onClose: (id: string) => void;
}

const toastStyles: Record<ToastType, { bg: string; icon: React.ReactNode; border: string }> = {
    success: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: <CheckCircle className="text-green-600" size={20} />,
    },
    error: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: <AlertCircle className="text-red-600" size={20} />,
    },
    info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: <Info className="text-blue-600" size={20} />,
    },
    warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: <AlertTriangle className="text-amber-600" size={20} />,
    },
};

export const Toast: React.FC<ToastProps> = ({ id, type, message, duration = 4000, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);
    const style = toastStyles[type];

    useEffect(() => {
        const exitTimer = setTimeout(() => {
            setIsExiting(true);
        }, duration - 300);

        const closeTimer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(closeTimer);
        };
    }, [id, duration, onClose]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onClose(id), 300);
    };

    return (
        <div
            className={`
                flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg 
                ${style.bg} ${style.border}
                ${isExiting ? 'animate-toast-exit' : 'animate-toast-enter'}
                transition-all duration-300
            `}
            role="alert"
        >
            {style.icon}
            <p className="flex-1 text-sm font-medium text-gray-800">{message}</p>
            <button
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-black/10 transition-colors"
                aria-label="關閉通知"
            >
                <X size={16} className="text-gray-500" />
            </button>
        </div>
    );
};

// Toast Container 組件
interface ToastContainerProps {
    toasts: Array<{ id: string; type: ToastType; message: string; duration?: number }>;
    onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} onClose={onClose} />
            ))}
        </div>
    );
};

export default Toast;
