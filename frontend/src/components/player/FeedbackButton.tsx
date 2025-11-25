import React from 'react';
import type { DifficultyRating } from '@/types/feedback';

interface FeedbackButtonProps {
    /** 按鈕顯示文字 (Button Label) */
    label: string;

    /** 圖示組件 (Icon Component) */
    icon: React.ReactNode;

    /** 難度評分值 (Difficulty Rating Value) */
    difficulty: DifficultyRating;

    /** 點擊事件處理 (Click Handler) */
    onClick: () => void;

    /** 是否已選中 (Is Selected) */
    selected?: boolean;
}

export const FeedbackButton: React.FC<FeedbackButtonProps> = ({
    label,
    icon,
    onClick,
    selected = false
}) => {
    return (
        <button
            onClick={onClick}
            className={`
                flex flex-col items-center justify-center gap-3 px-4 py-6 rounded-xl
                border transition-all duration-300 w-28 h-32
                ${selected
                    ? 'border-brand-light bg-brand-light text-brand-dark shadow-[0_0_20px_rgba(212,235,133,0.4)] scale-105'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:border-white/30 hover:text-white hover:scale-105'
                }
            `}
        >
            <div className={`
                p-3 rounded-full transition-colors
                ${selected ? 'bg-black/10' : 'bg-white/5'}
            `}>
                {icon}
            </div>
            <span className="text-sm font-bold tracking-wide">{label}</span>
        </button>
    );
};
