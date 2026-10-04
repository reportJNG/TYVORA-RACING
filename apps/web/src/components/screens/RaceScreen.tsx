// apps/web/src/components/screens/RaceScreen.tsx
import React, { useEffect, useRef } from 'react';
import { useRaceStore } from '../../stores/useRaceStore.js';
import { RaceCanvas } from '../scene/RaceCanvas.js';
import { TypingHUD } from '../race/TypingHUD.js';
import { RaceProgressBar } from '../race/RaceProgressBar.js';
import { CountdownOverlay } from '../race/CountdownOverlay.js';
import { RoundCompleteOverlay } from '../race/RoundCompleteOverlay.js';
import { PauseOverlay } from '../race/PauseOverlay.js';
import { RaceResultModal } from '../race/RaceResultModal.js';

export interface RaceScreenProps {
  onBackToCarSelect: () => void;
  onHome: () => void;
}

export const RaceScreen: React.FC<RaceScreenProps> = ({ onBackToCarSelect, onHome }) => {
  const status = useRaceStore((state) => state.status);
  const currentRound = useRaceStore((state) => state.currentRound);
  const totalRounds = useRaceStore((state) => state.totalRounds);
  const selectedTrackId = useRaceStore((state) => state.selectedTrackId);
  const pauseRace = useRaceStore((state) => state.pauseRace);
  const prepareRace = useRaceStore((state) => state.prepareRace);
  const startCountdown = useRaceStore((state) => state.startCountdown);

  const lastFrameTime = useRef<number>(performance.now());
  const animFrameId = useRef<number | null>(null);

  // Initialize match and launch Round 1 countdown on mount
  useEffect(() => {
    prepareRace(1);
    startCountdown();
  }, [prepareRace, startCountdown]);

  // Decoupled 60/120 FPS game simulation loop (does not trigger React state re-renders)
  useEffect(() => {
    lastFrameTime.current = performance.now();

    const loop = (time: number) => {
      const deltaMs = Math.min(100, time - lastFrameTime.current);
      lastFrameTime.current = time;

      const store = useRaceStore.getState();
      if (store.status === 'racing') {
        store.tickRace(deltaMs);
      }

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, []);

  // Pause key listener (Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && useRaceStore.getState().status === 'racing') {
        pauseRace();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pauseRace]);

  const handleRaceAgain = () => {
    prepareRace(1);
    startCountdown();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg select-none">
      {/* 3D WEBGL RACING CANVAS (Hero Viewport) */}
      <RaceCanvas />

      {/* TOP INSTRUMENT BAR: CIRCUIT INFO, PROGRESS RAIL & ROUND INDICATOR */}
      <div className="absolute top-4 inset-x-0 z-20 flex items-center justify-between px-6 pointer-events-none gap-4">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="text-[11px] font-display uppercase tracking-widest text-text-muted glass-panel px-2.5 py-1 rounded-[4px] shadow-sm">
            ESC // PAUSE
          </span>
          <span className="hidden sm:inline-block text-[11px] font-display uppercase tracking-widest text-text glass-panel px-3 py-1 rounded-[4px] shadow-sm font-semibold capitalize">
            {selectedTrackId ? selectedTrackId.replace('-', ' ') : 'Pacific Coast'}
          </span>
        </div>

        <div className="flex-1 max-w-2xl pointer-events-auto">
          <RaceProgressBar />
        </div>

        <span className="text-[11px] font-display uppercase tracking-widest text-accent glass-panel px-3.5 py-1 rounded-[4px] font-bold shadow-[0_0_12px_rgba(255,85,28,0.25)] pointer-events-auto">
          ROUND {currentRound} / {totalRounds}
        </span>
      </div>

      {/* COUNTDOWN 3-2-1-GO */}
      <CountdownOverlay />

      {/* ROUND COMPLETE INTERSTITIAL (Between Round 1->2 and 2->3) */}
      <RoundCompleteOverlay />

      {/* BOTTOM COCKPIT HUD: INTEGRATED TYPING INSTRUMENT & TELEMETRY */}
      <div className="absolute bottom-6 inset-x-0 z-20 flex flex-col items-center px-4 pointer-events-auto">
        <TypingHUD isRacing={status === 'racing'} />
      </div>

      {/* PAUSE MODAL OVERLAY */}
      <PauseOverlay onQuit={onHome} />

      {/* 3-ROUND MATCH FINAL RESULTS MODAL */}
      <RaceResultModal
        onRaceAgain={handleRaceAgain}
        onChangeCar={onBackToCarSelect}
        onHome={onHome}
      />
    </div>
  );
};
