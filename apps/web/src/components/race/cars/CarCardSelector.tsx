// apps/web/src/components/race/cars/CarCardSelector.tsx
import React from 'react';
import { Lock } from 'lucide-react';
import { CARS_LIST } from '../../../data/cars.js';
import { audioEngine } from '../../../audio/AudioEngine.js';

export interface CarCardSelectorProps {
  selectedCarId: string;
  unlockedCars: string[];
  onSelectCar: (carId: string) => void;
  orientation?: 'horizontal' | 'grid';
}

export const CarCardSelector: React.FC<CarCardSelectorProps> = ({
  selectedCarId,
  unlockedCars,
  onSelectCar,
  orientation = 'horizontal',
}) => {
  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      className={
        isHorizontal
          ? 'flex items-center gap-2 overflow-x-auto max-w-full py-1 px-1 scrollbar-none'
          : 'grid grid-cols-2 sm:grid-cols-4 gap-2.5'
      }
    >
      {CARS_LIST.map((c) => {
        const isSelected = c.id === selectedCarId;
        const isUnlocked = unlockedCars.includes(c.id);

        return (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              audioEngine.playUiClick();
              onSelectCar(c.id);
            }}
            className={`relative rounded-2xl border transition-all flex items-center gap-2.5 cursor-pointer shrink-0 ${
              isHorizontal ? 'px-3 py-2' : 'p-3 flex-col text-left'
            } ${
              isSelected
                ? 'bg-accent/20 border-accent text-white font-bold shadow-[0_0_15px_rgba(255,75,38,0.35)] scale-[1.02]'
                : 'bg-surface/70 hover:bg-surface border-white/10 text-white/70 hover:text-white'
            } ${!isUnlocked ? 'opacity-60 hover:opacity-80' : ''}`}
          >
            {/* Thumbnail */}
            {c.spriteUrl ? (
              <img
                src={c.spriteUrl}
                alt={c.name}
                className={isHorizontal ? 'h-6 w-9 object-contain filter drop-shadow' : 'h-10 w-16 object-contain filter drop-shadow mx-auto'}
              />
            ) : (
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: c.primaryColor }}
              />
            )}

            {/* Info */}
            <div className={isHorizontal ? 'text-left' : 'w-full text-left'}>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold whitespace-nowrap truncate">{c.name}</span>
                {!isUnlocked && <Lock className="w-3 h-3 text-white/50 shrink-0" />}
              </div>
              <div className="text-[10px] font-mono text-white/40 uppercase">
                {isUnlocked ? c.category : `${c.unlockPoints} PTS`}
              </div>
            </div>

            {isSelected && isUnlocked && isHorizontal && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse ml-auto" />
            )}
          </button>
        );
      })}
    </div>
  );
};
