import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating?: number; // 0 to 5
  ratingsCount?: number;
  userRating?: number | null;
  onRate?: (score: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md';
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating = 0,
  ratingsCount = 0,
  userRating,
  onRate,
  interactive = true,
  size = 'sm',
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  };

  const currentScore = hoverRating !== null ? hoverRating : (userRating || Math.round(rating));

  return (
    <div className="inline-flex items-center gap-1.5 select-none">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= currentScore;
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive || !onRate}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              onClick={() => onRate?.(star)}
              className={cn(
                'p-0.5 transition-colors focus:outline-none',
                interactive && onRate ? 'cursor-pointer hover:scale-110' : 'cursor-default'
              )}
            >
              <Star
                className={cn(
                  starSizes[size],
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-transparent text-slate-600'
                )}
              />
            </button>
          );
        })}
      </div>

      <span className="text-[11px] font-semibold text-slate-300">
        {rating > 0 ? rating.toFixed(1) : 'New'}
      </span>

      {ratingsCount > 0 && (
        <span className="text-[10px] text-slate-500">
          ({ratingsCount})
        </span>
      )}
    </div>
  );
};
