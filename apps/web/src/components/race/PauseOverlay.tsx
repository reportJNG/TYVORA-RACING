// apps/web/src/components/race/PauseOverlay.tsx
import React, { useEffect } from 'react';
import { Play, RotateCcw, Home } from 'lucide-react';
import { useRaceStore } from '../../stores/useRaceStore.js';

export interface PauseOverlayProps {
  onQuit: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({ onQuit }) => {
  const { status, resumeRace, prepareRace, startCountdown } = useRaceStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status === 'paused') {
        if (e.key === 'Escape' || e.key === 'Enter') {
          resumeRace();
        } else if (e.key === 'r' || e.key === 'R') {
          prepareRace();
          startCountdown();
        } else if (e.key === 'q' || e.key === 'Q') {
          onQuit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, resumeRace, prepareRace, startCountdown, onQuit]);

  if (status !== 'paused') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200 select-none font-sans">
      <div className="w-full max-w-sm rounded-3xl bg-[#0C101C]/95 border border-white/15 p-7 sm:p-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.85)] space-y-6">
        {/* Title */}
        <div>
          <div className="inline-block px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent font-mono text-[10px] font-bold uppercase tracking-widest mb-2">
            TELEMETRY PAUSED
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white drop-shadow-md">
            RACE PAUSED
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 font-sans">
          <button
            onClick={resumeRace}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-accent via-[#ff5b28] to-amber-500 text-white font-extrabold text-sm tracking-wide flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,75,38,0.4)] hover:shadow-[0_0_40px_rgba(255,75,38,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>RESUME RACE</span>
            <span className="ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30 border border-white/20 text-white/90">
              ESC
            </span>
          </button>

          <button
            onClick={() => {
              prepareRace();
              startCountdown();
            }}
            className="w-full py-3 px-6 rounded-2xl bg-surface/75 hover:bg-surface border border-white/10 hover:border-white/25 text-white/90 hover:text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART ROUND</span>
            <span className="ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/70">
              R
            </span>
          </button>

          <button
            onClick={onQuit}
            className="w-full py-2.5 px-6 rounded-2xl hover:bg-danger/15 text-white/50 hover:text-danger font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>QUIT TO HOME (Q)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
