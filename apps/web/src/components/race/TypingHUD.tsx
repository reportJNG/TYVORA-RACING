// apps/web/src/components/race/TypingHUD.tsx
import React, { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
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
      className={`w-full max-w-lg mx-auto rounded-[14px] p-3 select-none transition-all duration-200 backdrop-blur-xl ${
        hasMistakes
          ? 'bg-[#0B0E14]/90 border border-danger/50 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
          : 'bg-[#0B0E14]/85 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)]'
      }`}
    >
      {/* CLEAN 5-WORD KINETIC STREAM */}
      <TypingStream />

      {/* ULTRA-CLEAN MINIMAL TELEMETRY */}
      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono text-white/60 px-1">
        <div className="flex items-center gap-3.5">
          <span className="font-bold text-white text-base tabular-nums">
            {playerSpeedKmh}{' '}
            <span className="text-[10px] text-white/40 font-normal">KM/H</span>
          </span>
          <span className="text-white/15">/</span>
          <span className="text-white/80 tabular-nums">
            {liveWpm} <span className="text-[10px] text-white/40">WPM</span>
          </span>
          <span className="text-white/15">/</span>
          <span className="text-white/80 tabular-nums">
            {accuracy}% <span className="text-[10px] text-white/40">ACC</span>
          </span>
        </div>

        {/* Clean Typo Indicator */}
        {hasMistakes && (
          <span className="flex items-center gap-1 text-danger text-[11px] font-sans font-medium animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            <span>BACKSPACE</span>
          </span>
        )}
      </div>
    </div>
  );
});
