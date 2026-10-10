// apps/web/src/components/race/rounds/RoundIndicator.tsx
import React from 'react';

export interface RoundIndicatorProps {
  currentRound: number;
  totalRounds: number;
}

export const RoundIndicator: React.FC<RoundIndicatorProps> = ({
  currentRound,
  totalRounds,
}) => {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/12 backdrop-blur-md font-mono text-xs text-white/90">
      <span className="text-[10px] text-white/50 uppercase tracking-wider">ROUND</span>
      <span className="font-bold text-accent">
        {currentRound}
      </span>
      <span className="text-white/30">/</span>
      <span className="text-white/60">{totalRounds}</span>
    </div>
  );
};
