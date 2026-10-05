// apps/web/src/components/race/RaceProgressBar.tsx
import React from 'react';
import { useRaceStore } from '../../stores/useRaceStore.js';

export const RaceProgressBar: React.FC = React.memo(() => {
  const raceDistance = useRaceStore((state) => state.raceDistance);
  const playerD = useRaceStore((state) => state.playerSim.d);
  const playerProg = Math.min(100, Math.max(0, (playerD / Math.max(1, raceDistance)) * 100));

  return (
    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden select-none">
      <div
        className="h-full bg-accent shadow-[0_0_8px_#FF551C] transition-all duration-100 ease-out"
        style={{ width: `${playerProg}%` }}
      />
    </div>
  );
});

