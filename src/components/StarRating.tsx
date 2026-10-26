import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 0 to 5
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onChange,
  readOnly = false,
  size = 'md',
  showNumber = false,
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : rating;

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const handleMouseMove = (starIndex: number, event: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !onChange) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const isLeftHalf = event.clientX - rect.left < rect.width / 2;
    const newRating = isLeftHalf ? starIndex - 0.5 : starIndex;
    setHoverRating(newRating);
  };

  const handleClick = (starIndex: number, event: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !onChange) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const isLeftHalf = event.clientX - rect.left < rect.width / 2;
    const newRating = isLeftHalf ? starIndex - 0.5 : starIndex;
    onChange(newRating);
  };

  return (
    <div className="inline-flex items-center gap-1.5 select-none" onMouseLeave={() => setHoverRating(null)}>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFull = displayRating >= starIndex;
          const isHalf = displayRating === starIndex - 0.5;

          return (
            <div
              key={starIndex}
              className={`relative ${readOnly ? 'cursor-default' : 'cursor-pointer transition-transform hover:scale-115'}`}
              onMouseMove={(e) => handleMouseMove(starIndex, e)}
              onClick={(e) => handleClick(starIndex, e)}
              title={`${displayRating} stars`}
            >
              {/* Background empty star */}
              <Star
                className={`${starSizes[size]} text-slate-700/80 stroke-slate-600 transition-colors`}
              />

              {/* Half or Full Star Overlay */}
              {(isFull || isHalf) && (
                <div
                  className="absolute inset-0 overflow-hidden text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                  style={{ width: isHalf ? '50%' : '100%' }}
                >
                  <Star
                    className={`${starSizes[size]} fill-amber-400 text-amber-400`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showNumber && (
        <span className="ml-1 text-xs font-semibold tracking-wide text-amber-400/90 font-mono">
          {displayRating > 0 ? displayRating.toFixed(1) : 'Unrated'}
        </span>
      )}
    </div>
  );
};
