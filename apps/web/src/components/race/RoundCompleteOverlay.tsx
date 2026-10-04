// apps/web/src/components/race/RoundCompleteOverlay.tsx
import React, { useEffect, useState } from 'react';
import { Flag, ArrowRight } from 'lucide-react';
import { useRaceStore } from '../../stores/useRaceStore.js';
import { Button } from '../common/Button.js';

export const RoundCompleteOverlay: React.FC = () => {
  const { status, currentRound, totalRounds, roundResults, advanceToNextRound } = useRaceStore();
  const [secondsLeft, setSecondsLeft] = useState(8);

  useEffect(() => {
    if (status !== 'round_complete') return;
    setSecondsLeft(8);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          advanceToNextRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status, advanceToNextRound]);

  // Press Enter or Space to immediately continue
  useEffect(() => {
    if (status !== 'round_complete') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        advanceToNextRound();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, advanceToNextRound]);

  if (status !== 'round_complete') return null;

  const currentResult = roundResults[roundResults.length - 1];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-sm bg-surface border border-accent/40 rounded-[12px] p-6 shadow-2xl animate-scaleUp text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/15 border border-accent/40 text-accent mb-3">
          <Flag className="w-6 h-6 fill-accent" />
        </div>

        <span className="text-[11px] font-display uppercase tracking-widest text-accent font-bold block mb-1">
          ROUND {currentRound} OF {totalRounds} COMPLETE
        </span>

        <h2 className="text-2xl font-display font-bold uppercase tracking-wider text-text mb-4">
          {currentResult?.isWin ? '1ST PLACE FINISH!' : `POSITION #${currentResult?.position ?? 2}`}
        </h2>

        {/* COMPACT ROUND STATS */}
        {currentResult && (
          <div className="grid grid-cols-3 gap-2 p-3 rounded-[8px] bg-surface-2 border border-border mb-5 text-xs font-display uppercase tracking-wider">
            <div>
              <span className="text-[10px] text-text-muted block">Speed</span>
              <span className="text-lg font-bold text-text tabular-nums">{currentResult.wpm}</span>
              <span className="text-[9px] text-text-faint block">WPM</span>
            </div>
            <div className="border-x border-border">
              <span className="text-[10px] text-text-muted block">Accuracy</span>
              <span className="text-lg font-bold text-text tabular-nums">{currentResult.accuracy}%</span>
              <span className="text-[9px] text-text-faint block">ACC</span>
            </div>
            <div>
              <span className="text-[10px] text-text-muted block">Time</span>
              <span className="text-lg font-bold text-text tabular-nums">{currentResult.timeSeconds}s</span>
              <span className="text-[9px] text-text-faint block">SEC</span>
            </div>
          </div>
        )}

        <Button
          variant="primary"
          size="md"
          onClick={advanceToNextRound}
          className="w-full flex items-center justify-center gap-2"
        >
          <span>Continue (Enter)</span>
          <ArrowRight className="w-4 h-4" />
        </Button>

        <span className="text-[11px] font-display text-text-faint mt-3 block uppercase tracking-wider">
          Auto-advancing in {secondsLeft}s...
        </span>
      </div>
    </div>
  );
};
