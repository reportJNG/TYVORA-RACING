// apps/web/src/components/race/CountdownOverlay.tsx
import React from 'react';
import { useRaceStore } from '../../stores/useRaceStore.js';

export const CountdownOverlay: React.FC = () => {
  const status = useRaceStore((state) => state.status);
  const countdownValue = useRaceStore((state) => state.countdownValue);
  const currentRound = useRaceStore((state) => state.currentRound);
  const totalRounds = useRaceStore((state) => state.totalRounds);

  if (status !== 'countdown') return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none select-none">
      <div className="flex flex-col items-center animate-scaleUp">
        <span className="font-display font-bold text-sm md:text-base uppercase tracking-widest text-accent bg-accent/15 border border-accent/30 px-3 py-1 rounded-full mb-3 shadow-[0_0_15px_rgba(255,85,28,0.3)]">
          ROUND {currentRound} / {totalRounds}
        </span>

        {countdownValue > 0 ? (
          <>
            <span className="font-display font-bold text-2xl uppercase tracking-widest text-text-muted mb-2">
              READY
            </span>
            <span className="font-display font-bold text-8xl md:text-9xl text-text leading-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.85)]">
              {countdownValue}
            </span>
          </>
        ) : (
          <span className="font-display font-bold text-8xl md:text-9xl text-accent leading-none drop-shadow-[0_0_40px_rgba(255,85,28,0.85)] animate-pulse">
            GO!
          </span>
        )}
      </div>
    </div>
  );
};
