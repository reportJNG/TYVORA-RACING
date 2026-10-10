// apps/web/src/components/race/RaceResultModal.tsx
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Car, Home, Award, Zap, Sparkles } from 'lucide-react';
import { useRaceStore } from '../../stores/useRaceStore.js';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { useSettingsStore } from '../../stores/useSettingsStore.js';

export interface RaceResultModalProps {
  onRaceAgain: () => void;
  onChangeCar: () => void;
  onHome: () => void;
  onLeaderboard?: () => void;
}

export const RaceResultModal: React.FC<RaceResultModalProps> = ({
  onRaceAgain,
  onChangeCar,
  onHome,
}) => {
  const { status, lastResult, newBests, pointsEarned } = useRaceStore();
  const { newlyUnlockedCar, clearUnlockNotification, currentUser } = useAuthStore();
  const { reducedMotion, raceEffects } = useSettingsStore();

  useEffect(() => {
    if (status === 'results' && (lastResult?.isWin || newlyUnlockedCar)) {
      if (!reducedMotion && raceEffects) {
        confetti({
          particleCount: 140,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#FF551C', '#00F2FE', '#FFFFFF', '#FFD700'],
        });
      }
    }
  }, [status, lastResult, newlyUnlockedCar, reducedMotion, raceEffects]);

  // Keyboard shortcut listeners (Enter: Race Again, C: Change Car, H: Home)
  useEffect(() => {
    if (status !== 'results') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        onRaceAgain();
      } else if (e.key === 'c' || e.key === 'C') {
        onChangeCar();
      } else if (e.key === 'h' || e.key === 'H') {
        onHome();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, onRaceAgain, onChangeCar, onHome]);

  if (status !== 'results' || !lastResult) return null;

  const {
    isWin,
    timeSeconds,
    wpm,
    bestWpm,
    accuracy,
    mistakes,
    bestRound,
    counted,
    rounds,
    opponents,
  } = lastResult;

  const earnedPoints = lastResult.pointsEarned || pointsEarned || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 select-none font-sans">
      <div className="w-full max-w-xl rounded-3xl bg-[#0C101C]/95 border border-white/15 p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.85)] animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
        {/* NEW VEHICLE UNLOCKED BANNER IF APPLICABLE */}
        {newlyUnlockedCar && (
          <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-accent/25 via-accent/15 to-transparent border border-accent/60 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent flex items-center justify-center text-accent">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-accent uppercase font-bold tracking-widest">
                  NEW VEHICLE UNLOCKED!
                </div>
                <div className="text-base font-bold text-white uppercase">
                  {newlyUnlockedCar.name}
                </div>
              </div>
            </div>
            <button
              onClick={clearUnlockNotification}
              className="text-[10px] text-white/60 hover:text-white uppercase font-mono px-2.5 py-1 rounded-lg bg-surface border border-white/15 cursor-pointer"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* HEADER BANNER */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            {isWin ? (
              <Trophy className="w-8 h-8 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] animate-bounce" />
            ) : (
              <Award className="w-8 h-8 text-white/50" />
            )}
            <h1
              className={`text-2xl sm:text-4xl font-black uppercase tracking-tight ${
                isWin ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-accent to-amber-400 drop-shadow-md' : 'text-white'
              }`}
            >
              {isWin ? 'VICTORY LAP // 1ST PLACE' : 'MATCH FINISHED'}
            </h1>
          </div>

          <div className="font-mono text-sm sm:text-base text-white/60 tracking-wider tabular-nums">
            TOTAL TIME: {timeSeconds.toFixed(2)} SEC
          </div>

          {/* POINTS EARNED PILL */}
          {earnedPoints > 0 && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-accent/15 border border-accent/40 text-accent text-xs font-mono font-bold tracking-wider shadow-[0_0_15px_rgba(255,75,38,0.2)]">
              <Zap className="w-3.5 h-3.5 fill-accent" />
              <span>+{earnedPoints} PTS EARNED</span>
              <span className="text-white/30">|</span>
              <span className="text-white/80">TOTAL: {currentUser?.points || 0} PTS</span>
            </div>
          )}

          {!counted && (
            <span className="block mt-1 text-[10px] uppercase font-mono tracking-widest text-white/40">
              Casual Practice · Not Counted for Rank
            </span>
          )}
        </div>

        {/* AGGREGATED METRICS GRID */}
        <div className="grid grid-cols-4 gap-2 mb-6 p-4 rounded-2xl bg-surface/80 border border-white/10 font-mono">
          <div className="text-center">
            <span className="text-[10px] uppercase tracking-widest text-white/50 block">
              AVG SPEED
            </span>
            <span className="text-xl sm:text-2xl font-black text-white tabular-nums mt-0.5 block">
              {wpm}
            </span>
            <span className="text-[10px] text-white/40 block uppercase">WPM</span>
            {newBests.includes('wpm') && (
              <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider block mt-0.5">
                NEW BEST
              </span>
            )}
          </div>

          <div className="text-center border-l border-white/10">
            <span className="text-[10px] uppercase tracking-widest text-white/50 block">
              PEAK SPEED
            </span>
            <span className="text-xl sm:text-2xl font-black text-accent tabular-nums mt-0.5 block">
              {bestWpm}
            </span>
            <span className="text-[10px] text-accent/60 block uppercase">WPM</span>
          </div>

          <div className="text-center border-l border-white/10">
            <span className="text-[10px] uppercase tracking-widest text-white/50 block">
              ACCURACY
            </span>
            <span className="text-xl sm:text-2xl font-black text-white tabular-nums mt-0.5 block">
              {accuracy}%
            </span>
            <span className="text-[10px] text-white/40 block uppercase">RATING</span>
          </div>

          <div className="text-center border-l border-white/10">
            <span className="text-[10px] uppercase tracking-widest text-white/50 block">
              MISTAKES
            </span>
            <span
              className={`text-xl sm:text-2xl font-black tabular-nums mt-0.5 block ${
                mistakes > 0 ? 'text-danger' : 'text-emerald-400'
              }`}
            >
              {mistakes}
            </span>
            <span className="text-[10px] text-white/40 block uppercase">ERRORS</span>
          </div>
        </div>

        {/* 3-ROUND BREAKDOWN CARDS */}
        {rounds && rounds.length > 0 && (
          <div className="mb-6 space-y-2">
            <div className="text-xs uppercase font-mono tracking-widest text-white/50 px-1 flex items-center justify-between">
              <span>3-Round Match Progression</span>
              <span>Best: Round #{bestRound}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {rounds.map((r, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs font-mono uppercase tracking-wider ${
                    r.isWin
                      ? 'bg-accent/15 border-accent/40 text-white'
                      : 'bg-surface/60 border-white/10 text-white/70'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="text-accent">Round {r.roundNumber}</span>
                    <span>{r.isWin ? '1st' : `#${r.position}`}</span>
                  </div>
                  <div className="text-sm font-bold text-white tabular-nums">{r.wpm} WPM</div>
                  <div className="text-[10px] text-white/50 flex items-center justify-between mt-1">
                    <span>{r.accuracy}% Acc</span>
                    <span>{r.timeSeconds}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STANDINGS TABLE */}
        <div className="mb-6 space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between uppercase tracking-wider text-white/50 px-3 pb-1 border-b border-white/10">
            <span>Racer</span>
            <span>Speed Pace</span>
          </div>

          <div
            className={`flex items-center justify-between px-3 py-2 rounded-xl ${
              isWin ? 'bg-accent/20 border border-accent/40 font-bold text-white shadow-sm' : 'bg-surface/80 text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-accent">#1</span>
              <span>You</span>
            </span>
            <span className="tabular-nums font-bold">{wpm} WPM</span>
          </div>

          {opponents.map((opp, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg text-white/60 hover:bg-white/5"
            >
              <span className="flex items-center gap-2">
                <span className="text-white/40">#{idx + 2}</span>
                <span>{opp.name} (AI)</span>
              </span>
              <span className="tabular-nums">{opp.wpm} WPM</span>
            </div>
          ))}
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={onRaceAgain}
            className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-accent via-[#ff5b28] to-amber-500 text-white font-extrabold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,75,38,0.4)] hover:shadow-[0_0_40px_rgba(255,75,38,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Race Again</span>
          </button>

          <button
            onClick={onChangeCar}
            className="py-3 px-5 rounded-2xl bg-surface/75 hover:bg-surface border border-white/15 hover:border-white/25 text-white/90 hover:text-white font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Car className="w-4 h-4" />
            <span>Change Car</span>
          </button>

          <button
            onClick={onHome}
            className="py-3 px-5 rounded-2xl bg-surface/75 hover:bg-surface border border-white/15 hover:border-white/25 text-white/90 hover:text-white font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
