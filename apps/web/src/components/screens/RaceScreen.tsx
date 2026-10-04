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

  const playerD = useRaceStore((state) => state.playerSim.d);
  const opponents = useRaceStore((state) => state.opponents);
  let rank = 1;
  for (const opp of opponents) {
    if (opp.racer.d > playerD) rank++;
  }
  const posLabel = rank === 1 ? '1ST' : rank === 2 ? '2ND' : '3RD';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg select-none">
      {/* TOP EDGE HAIRLINE PROGRESS RAIL */}
      <div className="absolute top-0 inset-x-0 z-30 pointer-events-none">
        <RaceProgressBar />
      </div>

      {/* 3D WEBGL RACING CANVAS (Hero Viewport) */}
      <RaceCanvas />

      {/* MINIMAL TOP BAR: CLEAN ESC & POSITION / ROUND STATUS */}
      <div className="absolute top-3 inset-x-0 z-20 flex items-center justify-between px-5 pointer-events-none">
        <button
          onClick={pauseRace}
          className="pointer-events-auto text-[10px] font-mono uppercase tracking-widest text-white/50 hover:text-white px-2 py-1 rounded bg-black/40 backdrop-blur-md border border-white/10 transition-colors"
        >
          ESC // PAUSE
        </button>

        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="text-[11px] font-display font-bold uppercase tracking-wider text-accent px-2.5 py-0.5 rounded bg-black/40 backdrop-blur-md border border-accent/30 shadow-[0_0_12px_rgba(255,85,28,0.2)]">
            {posLabel}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/60 px-2 py-0.5 rounded bg-black/40 backdrop-blur-md border border-white/10">
            R{currentRound}/{totalRounds}
          </span>
        </div>
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
