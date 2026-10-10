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
    <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none select-none bg-black/35 backdrop-blur-[2px]">
      <div className="flex flex-col items-center animate-in zoom-in-75 duration-200">
        {/* Round Badge */}
        <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-[#0B0F19]/90 border border-accent/40 shadow-[0_0_20px_rgba(255,75,38,0.35)] mb-4">
          <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
          <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-white">
            ROUND {currentRound} OF {totalRounds}
          </span>
        </div>

        {/* Start Gantry Lights */}
        <div className="flex items-center gap-3 mb-6 p-2.5 rounded-2xl bg-black/75 border border-white/15 backdrop-blur-md shadow-2xl">
          {[1, 2, 3].map((num) => {
            const isLit = countdownValue <= 3 - num;
            return (
              <div
                key={num}
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 transition-all duration-150 ${
                  isLit
                    ? countdownValue === 0
                      ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.9)]'
                      : 'bg-accent border-accent-hover shadow-[0_0_20px_rgba(255,75,38,0.9)]'
                    : 'bg-black/60 border-white/10 opacity-35'
                }`}
              />
            );
          })}
        </div>

        {/* Giant Countdown Digit / GO */}
        {countdownValue > 0 ? (
          <div className="text-center">
            <div className="font-mono text-xs sm:text-sm font-extrabold uppercase tracking-widest text-white/50 mb-1">
              GET READY
            </div>
            <div className="font-display font-black text-8xl sm:text-9xl text-white leading-none drop-shadow-[0_15px_40px_rgba(0,0,0,0.9)] scale-110 transition-transform">
              {countdownValue}
            </div>
          </div>
        ) : (
          <div className="text-center animate-in zoom-in-90 duration-150">
            <div className="font-display font-black text-8xl sm:text-9xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 leading-none filter drop-shadow-[0_0_50px_rgba(52,211,153,0.9)]">
              GO!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
