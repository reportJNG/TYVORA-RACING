// apps/web/src/components/race/RaceProgressBar.tsx
import React from 'react';
import { Flag } from 'lucide-react';
import { useRaceStore } from '../../stores/useRaceStore.js';

export const RaceProgressBar: React.FC = () => {
  const { raceDistance, playerSim, opponents } = useRaceStore();

  const playerProg = Math.min(100, Math.max(0, (playerSim.d / raceDistance) * 100));
  const opp1 = opponents[0];
  const opp1Prog = opp1 ? Math.min(100, Math.max(0, (opp1.racer.d / raceDistance) * 100)) : 0;
  const opp2 = opponents[1];
  const opp2Prog = opp2 ? Math.min(100, Math.max(0, (opp2.racer.d / raceDistance) * 100)) : 0;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 select-none">
      <div className="relative w-full h-2 bg-surface-2/80 rounded-full border border-border-strong flex items-center">
        {/* Track Rail */}
        <div className="absolute inset-x-2 h-0.5 bg-border" />

        {/* AI Pacer Marker (Lane C) */}
        {opp2 && (
          <div
            className="absolute -translate-x-1/2 transition-all duration-75 flex flex-col items-center"
            style={{ left: `${opp2Prog}%` }}
          >
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white/60 bg-surface shadow" />
          </div>
        )}

        {/* AI Rival Marker (Lane A) */}
        {opp1 && (
          <div
            className="absolute -translate-x-1/2 transition-all duration-75 flex flex-col items-center"
            style={{ left: `${opp1Prog}%` }}
          >
            <div className="w-4 h-4 rounded-full border-2 border-white bg-surface shadow-md" />
          </div>
        )}

        {/* Player Marker (Lane B) */}
        <div
          className="absolute -translate-x-1/2 transition-all duration-75 z-10 flex flex-col items-center"
          style={{ left: `${playerProg}%` }}
        >
          <div className="w-5 h-5 rounded-full bg-accent border-2 border-accent-contrast shadow-[0_0_10px_rgba(255,90,31,0.8)]" />
        </div>

        {/* Finish Flag */}
        <div className="absolute right-0 -mr-2 text-accent">
          <Flag className="w-5 h-5 fill-accent" />
        </div>
      </div>

      {/* Progress Labels */}
      <div className="flex items-center justify-between text-[11px] font-display uppercase tracking-widest text-text-muted mt-1.5 px-1">
        <span>Start</span>
        <div className="flex items-center gap-4">
          <span className="text-accent font-bold">You: {Math.round(playerProg)}%</span>
          {opp1 && (
            <span>
              {opp1.racer.name}: {Math.round(opp1Prog)}%
            </span>
          )}
        </div>
        <span>Finish</span>
      </div>
    </div>
  );
};
