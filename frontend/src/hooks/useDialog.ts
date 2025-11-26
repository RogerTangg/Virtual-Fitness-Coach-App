import { useState, useCallback } from 'react';
import { ToastType } from '../components/ui/Toast';
import { DialogType } from '../components/ui/ConfirmDialog';

// Toast Hook
interface ToastItem {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

export function useToast() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const addToast = useCallback((type: ToastType, message: string, duration?: number) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setToasts((prev) => [...prev, { id, type, message, duration }]);
        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const success = useCallback((message: string, duration?: number) => {
        return addToast('success', message, duration);
    }, [addToast]);

    const error = useCallback((message: string, duration?: number) => {
        return addToast('error', message, duration);
    }, [addToast]);

    const info = useCallback((message: string, duration?: number) => {
        return addToast('info', message, duration);
    }, [addToast]);

    const warning = useCallback((message: string, duration?: number) => {
        return addToast('warning', message, duration);
    }, [addToast]);

    return {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        info,
        warning,
    };
}

// Confirm Dialog Hook
interface DialogConfig {
    type?: DialogType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'primary' | 'danger';
    showCancel?: boolean;
}

interface DialogState extends DialogConfig {
    isOpen: boolean;
    resolve: ((value: boolean) => void) | null;
}

const initialDialogState: DialogState = {
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    confirmText: '確認',
    cancelText: '取消',
    confirmVariant: 'primary',
    showCancel: true,
    resolve: null,
};

export function useConfirmDialog() {
    const [dialogState, setDialogState] = useState<DialogState>(initialDialogState);

    const showDialog = useCallback((config: DialogConfig): Promise<boolean> => {
        return new Promise((resolve) => {
            setDialogState({
                ...initialDialogState,
                ...config,
                isOpen: true,
                resolve,
            });
        });
    }, []);

    const confirm = useCallback((title: string, message: string, options?: Partial<DialogConfig>): Promise<boolean> => {
        return showDialog({
            type: 'confirm',
            title,
            message,
            ...options,
        });
    }, [showDialog]);

    const alert = useCallback((title: string, message: string, options?: Partial<DialogConfig>): Promise<boolean> => {
        return showDialog({
            type: 'alert',
            title,
            message,
            showCancel: false,
            confirmText: '知道了',
            ...options,
        });
    }, [showDialog]);

    const warning = useCallback((title: string, message: string, options?: Partial<DialogConfig>): Promise<boolean> => {
        return showDialog({
            type: 'warning',
            title,
            message,
            confirmVariant: 'danger',
            ...options,
        });
    }, [showDialog]);

    const handleConfirm = useCallback(() => {
        if (dialogState.resolve) {
            dialogState.resolve(true);
        }
        setDialogState((prev) => ({ ...prev, isOpen: false, resolve: null }));
    }, [dialogState.resolve]);

    const handleCancel = useCallback(() => {
        if (dialogState.resolve) {
            dialogState.resolve(false);
        }
        setDialogState((prev) => ({ ...prev, isOpen: false, resolve: null }));
    }, [dialogState.resolve]);

    return {
        dialogState,
        showDialog,
        confirm,
        alert,
        warning,
        handleConfirm,
        handleCancel,
    };
}

export default useToast;
