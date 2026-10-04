// apps/web/src/components/screens/ProfileScreen.tsx
import React from 'react';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { CARS_DATA } from '../../data/cars.js';
import { Avatar } from '../common/Avatar.js';

export const ProfileScreen: React.FC = () => {
  const { currentUser, stats } = useAuthStore();

  if (!currentUser) return null;

  const favoriteCar = CARS_DATA[stats.favoriteCarId] || CARS_DATA['meridian-gt'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 font-display select-none">
      {/* DRIVER DOSSIER HEADER */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6 p-5 rounded-[6px] glass-panel border border-border">
        <Avatar seed={currentUser.username} size="xl" />
        <div className="text-center sm:text-left flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-text">
                {currentUser.username}
              </h1>
              <span className="text-[11px] uppercase tracking-widest text-text-muted">
                DRIVER LICENSE // SINCE {currentUser.memberSince}
              </span>
            </div>
            <div className="text-[11px] uppercase tracking-widest text-text-faint bg-surface-2 px-2.5 py-1 rounded-[4px] border border-border self-center sm:self-auto">
              TOTAL RACES: {stats.totalRaces}
            </div>
          </div>

          {/* FOUR CORE METRICS */}
          <div className="grid grid-cols-4 gap-2 p-2.5 rounded-[4px] bg-surface-2/80 border border-border text-center">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-text-muted block">WINS</span>
              <span className="text-xl md:text-2xl font-bold text-accent tabular-nums">
                {stats.wins}
              </span>
            </div>
            <div className="border-l border-border">
              <span className="text-[10px] uppercase tracking-wider text-text-muted block">WIN RATE</span>
              <span className="text-xl md:text-2xl font-bold text-text tabular-nums">
                {stats.winRate}%
              </span>
            </div>
            <div className="border-l border-border">
              <span className="text-[10px] uppercase tracking-wider text-text-muted block">BEST SPEED</span>
              <span className="text-xl md:text-2xl font-bold text-text tabular-nums">
                {stats.bestWpm > 0 ? `${stats.bestWpm} WPM` : '—'}
              </span>
            </div>
            <div className="border-l border-border">
              <span className="text-[10px] uppercase tracking-wider text-text-muted block">ACCURACY</span>
              <span className="text-xl md:text-2xl font-bold text-text tabular-nums">
                {stats.bestAccuracy > 0 ? `${stats.bestAccuracy}%` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECONDARY ROW: FAVORITE MACHINE & BEST STREAK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div className="p-3.5 rounded-[6px] glass-panel border border-border flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-text-muted block">
              PRIMARY MACHINE
            </span>
            <span className="text-lg font-bold text-text uppercase">
              {favoriteCar.name}
            </span>
            <span className="text-[10px] text-accent block uppercase">
              {favoriteCar.category} // {favoriteCar.displaySpecs.topSpeedKph} KM/H TOP
            </span>
          </div>
          <div
            className="w-8 h-8 rounded-full border border-border/80 shadow"
            style={{ backgroundColor: favoriteCar.primaryColor }}
          />
        </div>

        <div className="p-3.5 rounded-[6px] glass-panel border border-border flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-text-muted block">
              WIN STREAK RECORD
            </span>
            <span className="text-lg font-bold text-accent tabular-nums">
              {stats.longestStreak} WINS IN A ROW
            </span>
            <span className="text-[10px] text-text-faint block uppercase">
              CURRENT STREAK: {stats.currentStreak}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-widest text-text-muted block">
              FASTEST WIN
            </span>
            <span className="text-lg font-bold text-text tabular-nums">
              {stats.bestTimeSeconds > 0 ? `${stats.bestTimeSeconds.toFixed(2)}s` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* RECENT RACES TABLE */}
      <div className="glass-panel border border-border rounded-[6px] overflow-hidden shadow-lg">
        <div className="px-4 py-2.5 border-b border-border text-xs font-bold uppercase tracking-wider text-text flex items-center justify-between">
          <span>Recent Activity</span>
          <span className="text-[10px] text-text-muted font-normal">Last 10 Runs</span>
        </div>

        {stats.history.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-xs uppercase tracking-wider">
            No race records logged yet. Enter your first race to record telemetry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-wider text-text-muted bg-surface-2/40">
                  <th className="py-2 px-4">Result</th>
                  <th className="py-2 px-4">Speed</th>
                  <th className="py-2 px-4">Accuracy</th>
                  <th className="py-2 px-4">Time</th>
                  <th className="py-2 px-4">Machine</th>
                  <th className="py-2 px-4">Difficulty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.history.map((h) => {
                  const car = CARS_DATA[h.carId] || CARS_DATA['meridian-gt'];
                  return (
                    <tr key={h.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="py-2.5 px-4 font-bold">
                        <span className={h.isWin ? 'text-accent' : 'text-danger'}>
                          {h.isWin ? 'WIN' : 'LOSS'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 tabular-nums">{h.wpm} WPM</td>
                      <td className="py-2.5 px-4 tabular-nums">{h.accuracy}%</td>
                      <td className="py-2.5 px-4 tabular-nums">{h.timeSeconds.toFixed(2)}s</td>
                      <td className="py-2.5 px-4 uppercase">{car.name}</td>
                      <td className="py-2.5 px-4 uppercase text-[10px] text-text-muted">
                        {h.difficulty} {!h.counted && '(Practice)'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
