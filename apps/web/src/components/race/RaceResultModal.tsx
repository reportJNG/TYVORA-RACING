// apps/web/src/components/race/RaceResultModal.tsx
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Car, Home, Award } from 'lucide-react';
import { useRaceStore } from '../../stores/useRaceStore.js';
import { useSettingsStore } from '../../stores/useSettingsStore.js';
import { Button } from '../common/Button.js';

export interface RaceResultModalProps {
  onRaceAgain: () => void;
  onChangeCar: () => void;
  onHome: () => void;
}

export const RaceResultModal: React.FC<RaceResultModalProps> = ({
  onRaceAgain,
  onChangeCar,
  onHome,
}) => {
  const { status, lastResult, newBests } = useRaceStore();
  const { reducedMotion, raceEffects } = useSettingsStore();

  useEffect(() => {
    if (status === 'results' && lastResult?.isWin) {
      if (!reducedMotion && raceEffects) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#FF551C', '#00F2FE', '#FFFFFF', '#FFD700'],
        });
      }
    }
  }, [status, lastResult, reducedMotion, raceEffects]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-xl bg-surface border border-border-strong rounded-[8px] p-6 md:p-8 shadow-2xl animate-scaleUp overflow-y-auto max-h-[90vh]">
        {/* HEADER BANNER */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            {isWin ? (
              <Trophy className="w-8 h-8 text-accent animate-bounce" />
            ) : (
              <Award className="w-8 h-8 text-text-muted" />
            )}
            <h1
              className={`text-3xl md:text-5xl font-display font-bold uppercase tracking-wider ${
                isWin ? 'text-accent' : 'text-text'
              }`}
            >
              {isWin ? 'CHAMPIONSHIP WIN' : 'MATCH FINISHED'}
            </h1>
          </div>
          <div className="font-display font-semibold text-lg md:text-xl text-text-muted tracking-widest tabular-nums">
            TOTAL TIME: {timeSeconds.toFixed(2)} SEC
          </div>
          {!counted && (
            <span className="inline-block mt-1 text-[10px] font-display uppercase tracking-widest bg-surface-2 border border-border-strong px-2.5 py-0.5 rounded text-text-faint">
              Practice · Not Ranked
            </span>
          )}
        </div>

        {/* AGGREGATED METRICS GRID */}
        <div className="grid grid-cols-4 gap-2.5 mb-6 p-4 rounded-[6px] bg-surface-2/70 border border-border">
          <div className="text-center">
            <span className="text-[10px] font-display uppercase tracking-widest text-text-muted block">
              AVG SPEED
            </span>
            <span className="text-2xl md:text-3xl font-display font-bold text-text tabular-nums">
              {wpm}
            </span>
            <span className="text-[10px] text-text-faint block uppercase">WPM</span>
            {newBests.includes('wpm') && (
              <span className="text-[8px] text-success font-bold uppercase tracking-wider block mt-0.5">
                NEW BEST
              </span>
            )}
          </div>

          <div className="text-center border-l border-border">
            <span className="text-[10px] font-display uppercase tracking-widest text-text-muted block">
              PEAK SPEED
            </span>
            <span className="text-2xl md:text-3xl font-display font-bold text-accent tabular-nums">
              {bestWpm}
            </span>
            <span className="text-[10px] text-text-faint block uppercase">WPM</span>
          </div>

          <div className="text-center border-l border-border">
            <span className="text-[10px] font-display uppercase tracking-widest text-text-muted block">
              ACCURACY
            </span>
            <span className="text-2xl md:text-3xl font-display font-bold text-text tabular-nums">
              {accuracy}%
            </span>
            <span className="text-[10px] text-text-faint block uppercase">RATING</span>
          </div>

          <div className="text-center border-l border-border">
            <span className="text-[10px] font-display uppercase tracking-widest text-text-muted block">
              MISTAKES
            </span>
            <span
              className={`text-2xl md:text-3xl font-display font-bold tabular-nums ${
                mistakes > 0 ? 'text-danger' : 'text-text'
              }`}
            >
              {mistakes}
            </span>
            <span className="text-[10px] text-text-faint block uppercase">ERRORS</span>
          </div>
        </div>

        {/* 3-ROUND BREAKDOWN CARDS */}
        {rounds && rounds.length > 0 && (
          <div className="mb-6 space-y-2">
            <div className="text-xs font-display uppercase tracking-widest text-text-muted px-1 flex items-center justify-between">
              <span>3-Round Breakdown</span>
              <span>Best Round: #{bestRound}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {rounds.map((r, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-[6px] border text-xs font-display uppercase tracking-wider ${
                    r.isWin
                      ? 'bg-accent/10 border-accent/40 text-text'
                      : 'bg-surface-2/60 border-border text-text-muted'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="text-accent">Round {r.roundNumber}</span>
                    <span>{r.isWin ? '1st' : `#${r.position}`}</span>
                  </div>
                  <div className="text-sm font-bold text-text tabular-nums">{r.wpm} WPM</div>
                  <div className="text-[10px] text-text-faint flex items-center justify-between mt-1">
                    <span>{r.accuracy}% Acc</span>
                    <span>{r.timeSeconds}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STANDINGS TABLE */}
        <div className="mb-6 space-y-1.5 font-display text-xs">
          <div className="flex items-center justify-between uppercase tracking-wider text-text-muted px-3 pb-1 border-b border-border">
            <span>Racer</span>
            <span>Speed Pace</span>
          </div>

          <div
            className={`flex items-center justify-between px-3 py-2 rounded ${
              isWin ? 'bg-accent/15 border border-accent/40 font-bold' : 'bg-surface-2'
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
              className="flex items-center justify-between px-3 py-1.5 rounded text-text-muted hover:bg-surface-2/40"
            >
              <span className="flex items-center gap-2">
                <span className="text-text-faint">#{idx + 2}</span>
                <span>{opp.name} (AI)</span>
              </span>
              <span className="tabular-nums">{opp.wpm} WPM</span>
            </div>
          ))}
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Button
            variant="primary"
            size="md"
            onClick={onRaceAgain}
            className="flex-1 flex items-center justify-center gap-2 text-sm tracking-widest font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Race Again</span>
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={onChangeCar}
            className="flex items-center justify-center gap-2 text-sm"
          >
            <Car className="w-4 h-4" />
            <span>Change Car</span>
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={onHome}
            className="flex items-center justify-center gap-2 text-sm"
          >
            <Home className="w-4 h-4" />
            <span>Hub</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
