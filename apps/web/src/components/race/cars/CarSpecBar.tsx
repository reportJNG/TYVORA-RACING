// apps/web/src/components/race/cars/CarSpecBar.tsx
import React from 'react';

export interface CarSpecBarProps {
  label: string;
  value: number; // 0 to 100 or rating
  maxValue?: number;
  displayValue?: string;
  color?: string;
  delta?: number; // difference vs compared car
}

export const CarSpecBar: React.FC<CarSpecBarProps> = ({
  label,
  value,
  maxValue = 100,
  displayValue,
  color = 'bg-accent',
  delta,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));

  return (
    <div className="space-y-1 font-mono text-xs">
      <div className="flex items-center justify-between text-white/70">
        <span className="uppercase text-[11px] font-bold">{label}</span>
        <div className="flex items-center gap-1.5">
          {delta !== undefined && delta !== 0 && (
            <span
              className={`text-[10px] font-bold ${
                delta > 0 ? 'text-emerald-400' : 'text-danger'
              }`}
            >
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
          <span className="text-white font-bold tabular-nums">
            {displayValue || value}
          </span>
        </div>
      </div>

      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden relative">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
