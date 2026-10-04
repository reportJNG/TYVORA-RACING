// apps/web/src/components/screens/LeaderboardScreen.tsx
import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { LeaderboardRacer } from '../../data/mockLeaderboard.js';
import { Avatar } from '../common/Avatar.js';
import { Modal } from '../common/Modal.js';
import { CARS_DATA } from '../../data/cars.js';

export const LeaderboardScreen: React.FC = () => {
  const { leaderboard, currentUser } = useAuthStore();
  const [inspectingRacer, setInspectingRacer] = useState<LeaderboardRacer | null>(null);

  const myEntry = currentUser
    ? leaderboard.find((r) => r.userId === currentUser.id)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 select-none">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-accent text-[11px] font-display uppercase tracking-widest font-bold mb-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>GLOBAL STANDINGS</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider text-text">
            LEADERBOARD
          </h1>
        </div>
        <div className="text-[11px] font-display uppercase tracking-widest text-text-muted bg-surface-2 px-3 py-1 rounded-[4px] border border-border">
          RANKED BY TOTAL VICTORIES
        </div>
      </div>

      {/* STANDINGS TABLE */}
      <div className="w-full glass-panel border border-border rounded-[6px] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-display">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-widest text-text-muted bg-surface-2/60">
                <th className="py-2.5 px-4"># Rank</th>
                <th className="py-2.5 px-4">Player</th>
                <th className="py-2.5 px-4 text-right">Wins</th>
                <th className="py-2.5 px-4 text-right">Win Rate</th>
                <th className="py-2.5 px-4 text-right">Best WPM</th>
                <th className="py-2.5 px-4 text-right">Fastest Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {leaderboard.map((racer) => {
                const isMe = currentUser && racer.userId === currentUser.id;
                const isTop3 = racer.rank <= 3;

                return (
                  <tr
                    key={racer.userId}
                    onClick={() => setInspectingRacer(racer)}
                    className={`hover:bg-surface-2/80 transition-colors cursor-pointer ${
                      isMe ? 'bg-accent/10 font-bold' : ''
                    }`}
                  >
                    <td className="py-3 px-4 tabular-nums">
                      <span
                        className={`inline-block w-8 text-center text-xs font-bold ${
                          isTop3 ? 'text-accent' : 'text-text-muted'
                        }`}
                      >
                        #{racer.rank.toString().padStart(2, '0')}
                      </span>
                    </td>
                    <td className="py-3 px-4 flex items-center gap-3">
                      <Avatar seed={racer.avatarSeed} size="sm" />
                      <span className="font-semibold text-text uppercase tracking-wider">
                        {racer.username} {isMe && <span className="text-accent">(You)</span>}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-accent">
                      {racer.wins}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-text-muted">
                      {racer.winRate}%
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-text">
                      {racer.bestWpm} WPM
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-text-muted">
                      {racer.bestTimeSeconds > 0 ? `${racer.bestTimeSeconds.toFixed(2)}s` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PINNED USER ROW IF NOT IN TOP LIST */}
        {myEntry && myEntry.rank > 8 && (
          <div className="border-t-2 border-accent/40 bg-accent/15 px-4 py-2.5 flex items-center justify-between text-xs font-display uppercase tracking-wider font-bold">
            <div className="flex items-center gap-3">
              <span className="text-accent">#{myEntry.rank}</span>
              <Avatar seed={myEntry.avatarSeed} size="sm" />
              <span>You ({myEntry.username})</span>
            </div>
            <div className="flex items-center gap-5">
              <span>{myEntry.wins} WINS</span>
              <span>{myEntry.winRate}% WIN RATE</span>
              <span>{myEntry.bestWpm} WPM</span>
            </div>
          </div>
        )}
      </div>

      {/* INSPECT RACER PUBLIC PROFILE MODAL */}
      {inspectingRacer && (
        <Modal
          isOpen={!!inspectingRacer}
          onClose={() => setInspectingRacer(null)}
          title="Racer Profile"
          maxWidth="sm"
        >
          <div className="text-center py-2 font-display select-none">
            <Avatar seed={inspectingRacer.avatarSeed} size="lg" className="mx-auto mb-3" />
            <h3 className="text-2xl font-bold uppercase tracking-wider text-text mb-1">
              {inspectingRacer.username}
            </h3>
            <span className="text-[11px] text-text-muted uppercase tracking-widest block mb-5">
              Member since {inspectingRacer.memberSince} · Rank #{inspectingRacer.rank}
            </span>

            {/* STATS TILES */}
            <div className="grid grid-cols-3 gap-2 bg-surface-2 p-3 rounded-[4px] border border-border mb-4">
              <div>
                <span className="text-[10px] text-text-muted uppercase block">WINS</span>
                <span className="text-xl font-bold text-accent tabular-nums">
                  {inspectingRacer.wins}
                </span>
              </div>
              <div className="border-x border-border">
                <span className="text-[10px] text-text-muted uppercase block">WIN RATE</span>
                <span className="text-xl font-bold text-text tabular-nums">
                  {inspectingRacer.winRate}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted uppercase block">BEST WPM</span>
                <span className="text-xl font-bold text-text tabular-nums">
                  {inspectingRacer.bestWpm}
                </span>
              </div>
            </div>

            <div className="text-left text-xs uppercase tracking-wider text-text-muted space-y-1.5 p-3 rounded-[4px] bg-surface-2/40 border border-border">
              <div className="flex justify-between">
                <span>Fastest Race:</span>
                <span className="text-text font-bold">
                  {inspectingRacer.bestTimeSeconds > 0
                    ? `${inspectingRacer.bestTimeSeconds.toFixed(2)}s`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Favorite Machine:</span>
                <span className="text-text font-bold">
                  {CARS_DATA[inspectingRacer.favoriteCarId]?.name || 'Meridian GT'}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
