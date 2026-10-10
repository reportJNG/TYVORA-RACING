// apps/web/src/components/race/RoundCompleteOverlay.tsx
import React, { useEffect, useState } from 'react';
import { Flag, ArrowRight, Gauge, CheckCircle2, Clock } from 'lucide-react';
import { useRaceStore } from '../../stores/useRaceStore.js';

export const RoundCompleteOverlay: React.FC = () => {
  const { status, currentRound, totalRounds, roundResults, advanceToNextRound } = useRaceStore();
  const [secondsLeft, setSecondsLeft] = useState(6);

  useEffect(() => {
    if (status !== 'round_complete') return;
    setSecondsLeft(6);
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
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200 select-none font-sans">
      <div className="w-full max-w-md rounded-3xl bg-[#0C101C]/95 border border-white/15 p-7 sm:p-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.85)] space-y-6">
        {/* Round Badge */}
        <div className="flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/20 border border-accent/40 text-accent mb-3 shadow-[0_0_20px_rgba(255,75,38,0.3)]">
            <Flag className="w-6 h-6 fill-current" />
          </div>

          <div className="text-[10px] font-mono uppercase tracking-widest text-accent font-bold mb-1">
            ROUND {currentRound} OF {totalRounds} COMPLETE
          </div>

          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white drop-shadow-md">
            {currentResult?.isWin ? '1ST PLACE FINISH!' : `POSITION #${currentResult?.position ?? 2}`}
          </h2>
        </div>

        {/* Round Telemetry Summary Grid */}
        {currentResult && (
          <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-surface/70 border border-white/10 text-center font-mono">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-white/50 uppercase flex items-center gap-1">
                <Gauge className="w-3 h-3 text-accent" /> SPEED
              </span>
              <span className="text-xl sm:text-2xl font-black text-white tabular-nums mt-1">
                {currentResult.wpm}
              </span>
              <span className="text-[9px] text-accent font-bold">WPM</span>
            </div>

            <div className="flex flex-col items-center border-x border-white/10 px-2">
              <span className="text-[10px] text-white/50 uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ACCURACY
              </span>
              <span className="text-xl sm:text-2xl font-black text-white tabular-nums mt-1">
                {currentResult.accuracy}%
              </span>
              <span className="text-[9px] text-emerald-400 font-bold">ACC</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[10px] text-white/50 uppercase flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" /> TIME
              </span>
              <span className="text-xl sm:text-2xl font-black text-white tabular-nums mt-1">
                {currentResult.timeSeconds}s
              </span>
              <span className="text-[9px] text-cyan-400 font-bold">SEC</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div>
          <button
            onClick={advanceToNextRound}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-accent via-[#ff5b28] to-amber-500 text-white font-extrabold text-base tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,75,38,0.5)] hover:shadow-[0_0_50px_rgba(255,75,38,0.75)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>CONTINUE MATCH</span>
            <ArrowRight className="w-4 h-4" />
            <span className="ml-1 text-[10px] font-mono px-2 py-0.5 rounded bg-black/35 border border-white/20 text-white">
              ENTER
            </span>
          </button>

          <span className="text-[11px] font-mono text-white/40 mt-3 block uppercase tracking-wider">
            Auto-advancing in {secondsLeft}s...
          </span>
        </div>
      </div>
    </div>
  );
};
