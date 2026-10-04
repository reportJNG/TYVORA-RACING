// apps/web/src/components/race/RoundCompleteOverlay.tsx
import React, { useEffect, useState } from 'react';
import { Flag, ArrowRight } from 'lucide-react';
import { useRaceStore } from '../../stores/useRaceStore.js';
import { Button } from '../common/Button.js';

export const RoundCompleteOverlay: React.FC = () => {
  const { status, currentRound, totalRounds, roundResults, advanceToNextRound } = useRaceStore();
  const [secondsLeft, setSecondsLeft] = useState(2);

  useEffect(() => {
    if (status !== 'round_complete') return;
    setSecondsLeft(2);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 900);
    return () => clearInterval(interval);
  }, [status]);

  if (status !== 'round_complete') return null;

  const currentResult = roundResults[roundResults.length - 1];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn select-none">
      <div className="w-full max-w-md bg-surface border border-accent/40 rounded-[8px] p-6 shadow-2xl animate-scaleUp text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/20 border border-accent/40 text-accent mb-3">
          <Flag className="w-6 h-6 fill-accent" />
        </div>

        <span className="text-xs font-display uppercase tracking-widest text-accent font-bold block mb-1">
          ROUND {currentRound} OF {totalRounds} COMPLETE
        </span>

        <h2 className="text-3xl font-display font-bold uppercase tracking-wider text-text mb-4">
          {currentResult?.isWin ? '1ST PLACE FINISH!' : `POSITION #${currentResult?.position ?? 2}`}
        </h2>

        {/* ROUND STATS */}
        {currentResult && (
          <div className="grid grid-cols-3 gap-2 p-3 rounded-[6px] bg-surface-2 border border-border mb-4 text-xs font-display uppercase tracking-wider">
            <div>
              <span className="text-[10px] text-text-muted block">Speed</span>
              <span className="text-xl font-bold text-text tabular-nums">{currentResult.wpm}</span>
              <span className="text-[9px] text-text-faint block">WPM</span>
            </div>
            <div className="border-x border-border">
              <span className="text-[10px] text-text-muted block">Accuracy</span>
              <span className="text-xl font-bold text-text tabular-nums">{currentResult.accuracy}%</span>
              <span className="text-[9px] text-text-faint block">RATING</span>
            </div>
            <div>
              <span className="text-[10px] text-text-muted block">Time</span>
              <span className="text-xl font-bold text-text tabular-nums">{currentResult.timeSeconds}s</span>
              <span className="text-[9px] text-text-faint block">SEC</span>
            </div>
          </div>
        )}

        <div className="text-xs font-display text-text-muted mb-4 uppercase tracking-widest">
          Next: Round {currentRound + 1} / {totalRounds} in {secondsLeft}s...
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={advanceToNextRound}
          className="w-full flex items-center justify-center gap-2"
        >
          <span>Continue Now</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
