/**
 * StarRating - 星級評分組件 (Star Rating Component)
 * 
 * 可互動的 1-5 星評分組件,用於訓練後整體評分
 */

import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
    /** 當前評分值 (Current Rating Value) */
    value: number;

    /** 評分變更事件 (Rating Change Handler) */
    onChange: (value: number) => void;

    /** 最大星數 (Maximum Stars) */
    max?: number;

    /** 星星大小 (Star Size) */
    size?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({
    value,
    onChange,
    max = 5,
    size = 40
}) => {
    const [hoverValue, setHoverValue] = React.useState<number>(0);

    return (
        <div
            className="flex gap-2 justify-center"
            onMouseLeave={() => setHoverValue(0)}
        >
            {Array.from({ length: max }, (_, i) => i + 1).map((star) => {
                const isActive = star <= (hoverValue || value);

                return (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        onMouseEnter={() => setHoverValue(star)}
                        className="transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-dark focus:ring-offset-2 rounded"
                        aria-label={`評分 ${star} 星`}
                    >
                        <Star
                            size={size}
                            className={`transition-colors ${isActive
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300 hover:text-yellow-200'
                                }`}
                        />
                    </button>
                );
            })}
        </div>
    );
};
