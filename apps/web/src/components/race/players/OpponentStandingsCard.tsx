// apps/web/src/components/race/players/OpponentStandingsCard.tsx
import React from 'react';
import { Trophy, Medal, Bot } from 'lucide-react';

export interface StandingsEntry {
  name: string;
  position: number;
  timeSeconds: number;
  wpm: number;
  isPlayer?: boolean;
}

export interface OpponentStandingsCardProps {
  standings: StandingsEntry[];
}

export const OpponentStandingsCard: React.FC<OpponentStandingsCardProps> = ({ standings }) => {
  return (
    <div className="w-full rounded-2xl bg-surface/75 border border-white/10 p-3 sm:p-4 space-y-2 font-mono">
      <div className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2 flex items-center justify-between">
        <span>FINAL STANDINGS</span>
        <span>TIME / WPM</span>
      </div>

      <div className="space-y-1.5">
        {standings.map((entry) => {
          const isWinner = entry.position === 1;

          return (
            <div
              key={entry.name}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                entry.isPlayer
                  ? 'bg-accent/15 border-accent text-white font-bold shadow-[0_0_15px_rgba(255,75,38,0.2)]'
                  : 'bg-black/25 border-white/8 text-white/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isWinner
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50'
                      : entry.position === 2
                      ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/40'
                      : entry.position === 3
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-white/10 text-white/50 border border-white/10'
                  }`}
                >
                  {isWinner ? (
                    <Trophy className="w-3.5 h-3.5" />
                  ) : entry.position <= 3 ? (
                    <Medal className="w-3.5 h-3.5" />
                  ) : (
                    entry.position
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {!entry.isPlayer && <Bot className="w-3.5 h-3.5 text-white/40" />}
                  <span className="truncate max-w-[130px] sm:max-w-[200px]">
                    {entry.name}
                  </span>
                  {entry.isPlayer && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-accent text-white font-bold uppercase">
                      YOU
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-right">
                <span className="text-white/60 text-[11px] tabular-nums">
                  {entry.timeSeconds > 0 ? `${entry.timeSeconds}s` : 'DNF'}
                </span>
                <span className="font-bold text-accent tabular-nums">
                  {entry.wpm} WPM
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
