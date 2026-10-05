// apps/web/src/components/screens/LeaderboardScreen.tsx
import React, { useState } from 'react';
import { Crown, Award, Medal } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { LeaderboardRacer } from '../../data/mockLeaderboard.js';
import { Avatar } from '../common/Avatar.js';
import { Modal } from '../common/Modal.js';
import { CARS_DATA } from '../../data/cars.js';
import { audioEngine } from '../../audio/AudioEngine.js';

export const LeaderboardScreen: React.FC = () => {
  const { leaderboard, currentUser } = useAuthStore();
  const [inspectingRacer, setInspectingRacer] = useState<LeaderboardRacer | null>(null);

  const myEntry = currentUser
    ? leaderboard.find((r) => r.userId === currentUser.id)
    : null;

  const top3 = leaderboard.slice(0, 3);
  const remainingRacers = leaderboard.slice(3);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 select-none font-sans">
      {/* 1. HEADER: LIVE & CLEAN */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-success/10 border border-success/30 text-success text-xs font-semibold tracking-wide mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span>LIVE RANKINGS</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text">
            Championship Standings
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Global speed ladder updated in real-time.
          </p>
        </div>

        {myEntry && (
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl glass-panel border border-border">
            <Avatar seed={myEntry.avatarSeed} size="sm" />
            <div className="text-left text-xs">
              <span className="text-text-muted block">Your Standing:</span>
              <span className="font-bold text-accent">
                Rank #{myEntry.rank} · {myEntry.totalPoints} PTS
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. TOP 3 PODIUM CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {/* 2nd Place */}
        {top3[1] && (
          <div
            onClick={() => {
              audioEngine.playUiClick();
              setInspectingRacer(top3[1]);
            }}
            className="p-4 rounded-2xl glass-panel border border-slate-400/30 hover:border-slate-400 transition-all cursor-pointer flex flex-col items-center text-center order-2 sm:order-1 relative group"
          >
            <div className="w-7 h-7 rounded-full bg-slate-500/20 border border-slate-400/40 text-slate-300 flex items-center justify-center mb-2 font-bold text-xs">
              <Medal className="w-4 h-4" />
            </div>
            <Avatar seed={top3[1].avatarSeed} size="md" className="mb-2" />
            <div className="font-semibold text-text text-sm truncate max-w-full">
              {top3[1].username}
            </div>
            <div className="text-xs font-mono text-accent font-semibold mt-0.5">
              {top3[1].totalPoints} PTS
            </div>
            <div className="text-[11px] text-text-faint font-mono mt-1">
              {top3[1].bestWpm} WPM · {top3[1].wins} Wins
            </div>
          </div>
        )}

        {/* 1st Place (Champion) */}
        {top3[0] && (
          <div
            onClick={() => {
              audioEngine.playUiClick();
              setInspectingRacer(top3[0]);
            }}
            className="p-5 rounded-2xl glass-panel border border-amber-400/50 shadow-lg shadow-amber-500/10 hover:border-amber-400 transition-all cursor-pointer flex flex-col items-center text-center order-1 sm:order-2 -mt-2 relative group"
          >
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-400 flex items-center justify-center mb-2 font-bold text-xs">
              <Crown className="w-4 h-4 fill-amber-400" />
            </div>
            <Avatar seed={top3[0].avatarSeed} size="lg" className="mb-2 ring-2 ring-amber-400/40" />
            <div className="font-bold text-text text-base truncate max-w-full">
              {top3[0].username}
            </div>
            <div className="text-sm font-mono text-accent font-bold mt-0.5">
              {top3[0].totalPoints} PTS
            </div>
            <div className="text-xs text-text-muted font-mono mt-1">
              {top3[0].bestWpm} WPM · {top3[0].wins} Wins
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {top3[2] && (
          <div
            onClick={() => {
              audioEngine.playUiClick();
              setInspectingRacer(top3[2]);
            }}
            className="p-4 rounded-2xl glass-panel border border-amber-700/30 hover:border-amber-600 transition-all cursor-pointer flex flex-col items-center text-center order-3 sm:order-3 relative group"
          >
            <div className="w-7 h-7 rounded-full bg-amber-700/20 border border-amber-600/40 text-amber-600 flex items-center justify-center mb-2 font-bold text-xs">
              <Award className="w-4 h-4" />
            </div>
            <Avatar seed={top3[2].avatarSeed} size="md" className="mb-2" />
            <div className="font-semibold text-text text-sm truncate max-w-full">
              {top3[2].username}
            </div>
            <div className="text-xs font-mono text-accent font-semibold mt-0.5">
              {top3[2].totalPoints} PTS
            </div>
            <div className="text-[11px] text-text-faint font-mono mt-1">
              {top3[2].bestWpm} WPM · {top3[2].wins} Wins
            </div>
          </div>
        )}
      </div>

      {/* 3. SIMPLE, CLEAN TABLE */}
      <div className="w-full glass-panel border border-border rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-text-muted bg-surface-2/40">
                <th className="py-3 px-4 font-medium w-16">Rank</th>
                <th className="py-3 px-4 font-medium">Driver</th>
                <th className="py-3 px-4 font-medium text-right">Points</th>
                <th className="py-3 px-4 font-medium text-right">Best WPM</th>
                <th className="py-3 px-4 font-medium text-right">Wins</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {remainingRacers.map((racer) => {
                const isMe = currentUser && racer.userId === currentUser.id;

                return (
                  <tr
                    key={racer.userId}
                    onClick={() => {
                      audioEngine.playUiClick();
                      setInspectingRacer(racer);
                    }}
                    className={`hover:bg-surface-2/70 transition-colors cursor-pointer ${
                      isMe ? 'bg-accent/10 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-xs text-text-muted">
                      #{racer.rank}
                    </td>
                    <td className="py-3 px-4 flex items-center gap-3">
                      <Avatar seed={racer.avatarSeed} size="sm" />
                      <span className="font-medium text-text">
                        {racer.username} {isMe && <span className="text-accent text-xs font-semibold">(You)</span>}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-accent">
                      {racer.totalPoints}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-text">
                      {racer.bestWpm > 0 ? `${racer.bestWpm} WPM` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-text-muted">
                      {racer.wins}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pinned user row if not in top list */}
        {myEntry && myEntry.rank > remainingRacers.length + 3 && (
          <div className="border-t-2 border-accent/40 bg-accent/10 px-4 py-3 flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-3">
              <span className="font-mono text-accent">#{myEntry.rank}</span>
              <Avatar seed={myEntry.avatarSeed} size="sm" />
              <span>You ({myEntry.username})</span>
            </div>
            <div className="flex items-center gap-4 font-mono">
              <span className="text-accent font-semibold">{myEntry.totalPoints} PTS</span>
              <span>{myEntry.bestWpm} WPM</span>
              <span>{myEntry.wins} WINS</span>
            </div>
          </div>
        )}
      </div>

      {/* INSPECT RACER MODAL */}
      {inspectingRacer && (
        <Modal
          isOpen={!!inspectingRacer}
          onClose={() => setInspectingRacer(null)}
          title="Driver Profile"
          maxWidth="sm"
        >
          <div className="text-center py-2 select-none">
            <Avatar seed={inspectingRacer.avatarSeed} size="lg" className="mx-auto mb-3" />
            <h3 className="text-xl font-bold text-text mb-0.5">
              {inspectingRacer.username}
            </h3>
            <span className="text-xs text-text-muted block mb-4">
              Rank #{inspectingRacer.rank} · Member since {inspectingRacer.memberSince}
            </span>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 bg-surface-2/80 p-3 rounded-xl border border-border mb-4">
              <div>
                <span className="text-[10px] text-text-muted uppercase block">Points</span>
                <span className="text-lg font-bold text-accent font-mono">
                  {inspectingRacer.totalPoints}
                </span>
              </div>
              <div className="border-x border-border">
                <span className="text-[10px] text-text-muted uppercase block">Wins</span>
                <span className="text-lg font-bold text-text font-mono">
                  {inspectingRacer.wins}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted uppercase block">Best WPM</span>
                <span className="text-lg font-bold text-text font-mono">
                  {inspectingRacer.bestWpm}
                </span>
              </div>
            </div>

            <div className="text-left text-xs text-text-muted space-y-2 p-3 rounded-xl bg-surface-2/40 border border-border">
              <div className="flex justify-between">
                <span>Win Rate:</span>
                <span className="text-text font-semibold">{inspectingRacer.winRate}%</span>
              </div>
              <div className="flex justify-between">
                <span>Primary Vehicle:</span>
                <span className="text-text font-semibold">
                  {CARS_DATA[inspectingRacer.favoriteCarId]?.name || 'Scrapper Rust'}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
