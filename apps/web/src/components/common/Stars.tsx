// apps/web/src/components/common/Stars.tsx
import React from 'react';

export interface StarsProps {
  count: number;
  max?: number;
  label?: string;
  size?: number;
}

export const Stars: React.FC<StarsProps> = ({ count, max = 5, label }) => {
  return (
    <div
      className="flex items-center gap-1"
      title={label ? `${label}: ${count}/${max}` : `${count}/${max}`}
      aria-label={label ? `${label}: ${count}/${max}` : undefined}
    >
      {Array.from({ length: max }).map((_, i) => {
        const isFilled = i < count;
        return (
          <div
            key={i}
            className={`h-2.5 w-3.5 rounded-[2px] skew-x-[-14deg] transition-all ${
              isFilled
                ? 'bg-accent shadow-[0_0_6px_rgba(255,85,28,0.45)]'
                : 'bg-surface-2 border border-border-strong/80 opacity-60'
            }`}
          />
        );
      })}
    </div>
  );
};
