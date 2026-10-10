// apps/web/src/components/race/RaceProgressBar.tsx
import React from 'react';
import { useRaceStore } from '../../stores/useRaceStore.js';

export const RaceProgressBar: React.FC = React.memo(() => {
  const raceDistance = useRaceStore((state) => state.raceDistance);
  const playerD = useRaceStore((state) => state.playerSim.d);
  const opponents = useRaceStore((state) => state.opponents);
  const playerProg = Math.min(100, Math.max(0, (playerD / Math.max(1, raceDistance)) * 100));

  return (
    <div className="relative w-full h-1.5 bg-black/50 backdrop-blur-md select-none border-b border-white/10">
      {/* Dynamic Player Progress Beam */}
      <div
        className="h-full bg-gradient-to-r from-accent via-[#ff5b28] to-amber-400 shadow-[0_0_12px_rgba(255,75,38,0.85)] transition-all duration-75 ease-out rounded-r-full"
        style={{ width: `${playerProg}%` }}
      />

      {/* Opponent Ghost Progress Laser Pips */}
      {opponents.map((opp, idx) => {
        const oppProg = Math.min(100, Math.max(0, (opp.racer.d / Math.max(1, raceDistance)) * 100));
        return (
          <div
            key={idx}
            className="absolute -top-0.5 bottom-0 w-1.5 h-2.5 -translate-x-1/2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06B6D4] transition-all duration-100 ease-out pointer-events-none z-10"
            style={{ left: `${oppProg}%` }}
          />
        );
      })}
    </div>
  );
});
