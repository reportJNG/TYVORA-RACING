// apps/web/src/components/race/TypingHUD.tsx
import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Gauge, Zap, CheckCircle2 } from 'lucide-react';
import { useTypingStore } from '../../stores/useTypingStore.js';
import { useRaceStore } from '../../stores/useRaceStore.js';
import { TypingStream } from './TypingStream.js';

export interface TypingHUDProps {
  isRacing: boolean;
}

export const TypingHUD: React.FC<TypingHUDProps> = React.memo(({ isRacing }) => {
  const typeChar = useTypingStore((state) => state.typeChar);
  const typeBackspace = useTypingStore((state) => state.typeBackspace);
  const typeWordBackspace = useTypingStore((state) => state.typeWordBackspace);
  const tickSnapshot = useTypingStore((state) => state.tickSnapshot);

  const mistakes = useTypingStore((state) => state.snapshot.mistakes);
  const liveWpm = useTypingStore((state) => state.snapshot.smoothedWpm || state.snapshot.liveWpm);
  const accuracy = useTypingStore((state) => state.snapshot.accuracy);

  const playerSpeedKmh = useRaceStore((state) => Math.round(state.playerSim.v * 3.6));

  const raceTimeRef = useRef<number>(0);

  // Keep raceTimeRef synced with store without re-running effects
  useEffect(() => {
    return useRaceStore.subscribe((state) => {
      raceTimeRef.current = state.raceTimeMs;
    });
  }, []);

  // Tick snapshot metrics every 150ms for live WPM smoothing
  useEffect(() => {
    if (!isRacing) return;
    const interval = setInterval(() => {
      tickSnapshot(raceTimeRef.current);
    }, 150);
    return () => clearInterval(interval);
  }, [isRacing, tickSnapshot]);

  // Global racing keydown capture
  useEffect(() => {
    if (!isRacing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore IME, composition, dead keys, and browser navigation shortcuts
      if (e.isComposing || e.key === 'Process' || e.key === 'Dead') return;
      if (e.metaKey) return;
      if (e.ctrlKey && !e.altKey && e.key !== 'Backspace') return;
      if (e.key === 'Escape' || e.key === 'Tab') return;

      const tMs = raceTimeRef.current;

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (e.ctrlKey || e.altKey) {
          typeWordBackspace(tMs);
        } else {
          typeBackspace(tMs);
        }
        return;
      }

      // Printable character
      if (e.key.length === 1) {
        e.preventDefault();
        typeChar(e.key, tMs);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRacing, typeChar, typeBackspace, typeWordBackspace]);

  const hasMistakes = mistakes > 0;

  return (
    <div
      className={`relative w-full max-w-xl mx-auto rounded-3xl p-4 select-none transition-all duration-200 backdrop-blur-2xl shadow-[0_16px_50px_rgba(0,0,0,0.7)] ${
        hasMistakes
          ? 'bg-[#0D0911]/92 border-2 border-danger/60 shadow-[0_0_30px_rgba(239,68,68,0.35)]'
          : 'bg-[#080C16]/88 border border-white/12 hover:border-white/20'
      }`}
    >
      {/* Top specular reflection line */}
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

      {/* 5-WORD KINETIC STREAM */}
      <TypingStream />

      {/* TELEMETRY LOWER DECK */}
      <div className="mt-2.5 pt-2.5 border-t border-white/8 flex items-center justify-between text-xs font-mono px-1">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Speedometer */}
          <div className="flex items-baseline gap-1 text-white">
            <Gauge className="w-3.5 h-3.5 text-accent self-center" />
            <span className="font-mono font-black text-lg sm:text-xl tabular-nums leading-none">
              {playerSpeedKmh}
            </span>
            <span className="text-[10px] text-accent font-extrabold uppercase tracking-wider">
              KM/H
            </span>
          </div>

          <div className="h-4 w-px bg-white/15" />

          {/* Live WPM */}
          <div className="flex items-baseline gap-1 text-white/90">
            <Zap className="w-3 h-3 text-amber-400 self-center" />
            <span className="font-mono font-bold text-base sm:text-lg tabular-nums leading-none">
              {liveWpm}
            </span>
            <span className="text-[10px] text-white/40 uppercase">WPM</span>
          </div>

          <div className="h-4 w-px bg-white/15 hidden sm:block" />

          {/* Accuracy */}
          <div className="items-baseline gap-1 text-white/90 hidden sm:flex">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 self-center" />
            <span className="font-mono font-bold text-base tabular-nums leading-none">
              {accuracy}%
            </span>
            <span className="text-[10px] text-white/40 uppercase">ACC</span>
          </div>
        </div>

        {/* Clean Typo Indicator or Streak */}
        {hasMistakes ? (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-danger/20 border border-danger/50 text-danger text-[11px] font-mono font-bold animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            <span>BACKSPACE</span>
          </span>
        ) : (
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest hidden sm:inline">
            CLEAN RUN
          </span>
        )}
      </div>
    </div>
  );
});
