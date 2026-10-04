// apps/web/src/components/race/TypingHUD.tsx
import React, { useEffect, useRef } from 'react';
import { Zap, AlertTriangle, FastForward } from 'lucide-react';
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

  const streak = useTypingStore((state) => state.snapshot.streak);
  const mistakes = useTypingStore((state) => state.snapshot.mistakes);
  const isFullWithErrors = useTypingStore((state) => state.snapshot.isFullWithErrors);
  const liveWpm = useTypingStore((state) => state.snapshot.smoothedWpm || state.snapshot.liveWpm);
  const accuracy = useTypingStore((state) => state.snapshot.accuracy);

  const playerSpeedKmh = useRaceStore((state) => Math.round(state.playerSim.v * 3.6));
  const currentRound = useRaceStore((state) => state.currentRound);
  const totalRounds = useRaceStore((state) => state.totalRounds);

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
  const isHighStreak = streak >= 10;
  const boostPercent = Math.min(30, Math.round((streak / 50) * 30));

  // Compute simulated transmission gear scaled for 3X hyper-speed (up to 999 km/h)
  let gear = 1;
  if (playerSpeedKmh >= 840) gear = 6;
  else if (playerSpeedKmh >= 680) gear = 5;
  else if (playerSpeedKmh >= 480) gear = 4;
  else if (playerSpeedKmh >= 300) gear = 3;
  else if (playerSpeedKmh >= 150) gear = 2;

  return (
    <div
      className={`w-full max-w-2xl mx-auto rounded-[10px] p-3 md:p-3.5 select-none transition-all duration-150 backdrop-blur-xl ${
        hasMistakes
          ? 'bg-surface/90 border border-danger/60 shadow-[0_0_24px_rgba(239,68,68,0.25)]'
          : isHighStreak
          ? 'bg-surface/90 border border-accent/60 shadow-[0_0_28px_rgba(255,85,28,0.3)]'
          : 'bg-surface/90 border border-border/80 shadow-[0_12px_32px_rgba(0,0,0,0.7)]'
      }`}
    >
      {/* TOP COMPACT STATUS BAR */}
      <div className="flex items-center justify-between text-[10px] font-display uppercase tracking-widest text-text-muted pb-1.5 mb-1.5 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <span className="text-accent font-bold">
            STAGE {currentRound}/{totalRounds}
          </span>

          {streak >= 5 && (
            <span className="flex items-center gap-1 text-accent font-bold bg-accent/15 px-1.5 py-0.5 rounded border border-accent/30 animate-pulse">
              <Zap className="w-2.5 h-2.5 fill-accent" />
              <span>STREAK ×{streak}</span>
              {boostPercent > 0 && <span className="opacity-90">(+{boostPercent}%)</span>}
            </span>
          )}

          <span className="hidden sm:flex items-center gap-1 text-text-muted/70 text-[9px] bg-surface-2/60 px-1.5 py-0.5 rounded border border-border/40">
            <FastForward className="w-2.5 h-2.5 text-accent" />
            <span>AUTO-SPACE</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {mistakes > 0 && (
            <span className="text-danger flex items-center gap-1 font-semibold">
              <AlertTriangle className="w-3 h-3" />
              <span>
                {mistakes} {mistakes === 1 ? 'ERR' : 'ERRS'}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* 5-WORD KINETIC STREAM */}
      <TypingStream />

      {/* ERROR CORRECTION PROMPT */}
      {isFullWithErrors && (
        <div className="mt-2 pt-1.5 border-t border-danger/30 flex items-center justify-between text-danger text-[11px] font-display uppercase tracking-widest font-bold">
          <span className="flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-danger" />
            <span>FIX ERRORS TO CROSS FINISH</span>
          </span>
          <span className="bg-danger/20 px-1.5 py-0.5 rounded border border-danger/40 text-[10px] font-mono tracking-normal">
            BACKSPACE
          </span>
        </div>
      )}

      {/* COMPACT BOTTOM TELEMETRY STRIP */}
      <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-xs font-display uppercase tracking-wider">
        {/* Speedometer & Gear */}
        <div className="flex items-baseline gap-1.5">
          <span
            className={`font-bold text-xl md:text-2xl tabular-nums leading-none tracking-tight ${
              playerSpeedKmh >= 600
                ? 'text-accent drop-shadow-[0_0_10px_rgba(255,85,28,0.7)]'
                : 'text-text'
            }`}
          >
            {playerSpeedKmh}
          </span>
          <span className="text-[10px] text-text-muted font-bold">KM/H</span>
          <span className="text-[9px] text-text-faint ml-1">G{gear}</span>
        </div>

        {/* Telemetry WPM & Accuracy */}
        <div className="flex items-center gap-3 text-xs font-display uppercase tracking-widest">
          <div className="flex items-baseline gap-1">
            <span className="text-[9px] text-text-muted">PACE:</span>
            <span className="text-sm md:text-base font-bold text-text tabular-nums">{liveWpm}</span>
            <span className="text-[9px] text-text-faint">WPM</span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-[9px] text-text-muted">ACC:</span>
            <span className="text-sm md:text-base font-bold text-text tabular-nums">
              {accuracy}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
