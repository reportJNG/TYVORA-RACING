// apps/web/src/components/screens/RaceScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Lock,
  Unlock,
  Radio,
  ArrowLeft,
} from 'lucide-react';
import { useRaceStore } from '../../stores/useRaceStore.js';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { CARS_DATA, CARS_LIST } from '../../data/cars.js';
import { ShowroomCanvas } from '../scene/ShowroomCanvas.js';
import { Stars } from '../common/Stars.js';
import { audioEngine } from '../../audio/AudioEngine.js';

// Racing HUD & Overlays
import { RaceCanvas } from '../scene/RaceCanvas.js';
import { TypingHUD } from '../race/TypingHUD.js';
import { RaceProgressBar } from '../race/RaceProgressBar.js';
import { CountdownOverlay } from '../race/CountdownOverlay.js';
import { RoundCompleteOverlay } from '../race/RoundCompleteOverlay.js';
import { PauseOverlay } from '../race/PauseOverlay.js';
import { RaceResultModal } from '../race/RaceResultModal.js';

export interface RaceScreenProps {
  onHome: () => void;
  onLeaderboard?: () => void;
  onOpenOnlineModal?: () => void;
}

export const RaceScreen: React.FC<RaceScreenProps> = ({
  onHome,
  onLeaderboard,
  onOpenOnlineModal,
}) => {
  const {
    status,
    selectedCarId,
    selectCar,
    prepareRace,
    startCountdown,
    pauseRace,
    resetToCarSelect,
    currentRound,
    totalRounds,
  } = useRaceStore();

  const { currentUser, unlockedCars } = useAuthStore();

  const currentCar = CARS_DATA[selectedCarId] || CARS_LIST[0];
  const carIndex = CARS_LIST.findIndex((c) => c.id === currentCar.id);

  const isCurrentCarUnlocked = unlockedCars.includes(currentCar.id);
  const userPoints = currentUser?.points || 0;
  const unlockPointsReq = currentCar.unlockPoints || 0;
  const pointsRemaining = Math.max(0, unlockPointsReq - userPoints);
  const unlockPercent =
    unlockPointsReq > 0
      ? Math.min(100, Math.round((userPoints / unlockPointsReq) * 100))
      : 100;

  // Race Viewport state
  const [overtakeNotice, setOvertakeNotice] = useState<string | null>(null);
  const prevRankRef = useRef<number>(3);
  const lastFrameTime = useRef<number>(performance.now());
  const animFrameId = useRef<number | null>(null);

  // Decoupled game simulation loop when actively racing
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

  const handlePrevCar = () => {
    audioEngine.playUiClick();
    const nextIdx = (carIndex - 1 + CARS_LIST.length) % CARS_LIST.length;
    selectCar(CARS_LIST[nextIdx].id);
  };

  const handleNextCar = () => {
    audioEngine.playUiClick();
    const nextIdx = (carIndex + 1) % CARS_LIST.length;
    selectCar(CARS_LIST[nextIdx].id);
  };

  const handleStartRace = () => {
    if (!isCurrentCarUnlocked) {
      audioEngine.playMistakeSound();
      return;
    }
    audioEngine.playUiClick();
    prepareRace(1);
    startCountdown();
  };

  const handleRaceAgain = () => {
    prepareRace(1);
    startCountdown();
  };

  const handleChangeCar = () => {
    resetToCarSelect();
  };

  // Keyboard controls during Lobby state
  useEffect(() => {
    if (status !== 'idle') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowLeft') {
        handlePrevCar();
      } else if (e.key === 'ArrowRight') {
        handleNextCar();
      } else if (e.key === 'Enter') {
        if (isCurrentCarUnlocked) {
          handleStartRace();
        }
      } else if (e.key === 'Escape') {
        onHome();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, carIndex, isCurrentCarUnlocked, onHome]);

  const playerD = useRaceStore((state) => state.playerSim.d);
  const opponents = useRaceStore((state) => state.opponents);
  let rank = 1;
  for (const opp of opponents) {
    if (opp.racer.d > playerD) rank++;
  }
  const posLabel = rank === 1 ? '1ST' : rank === 2 ? '2ND' : '3RD';

  // Overtake feedback notification during active race
  useEffect(() => {
    if (status === 'racing' && playerD > 5) {
      if (rank < prevRankRef.current) {
        setOvertakeNotice(rank === 1 ? 'LEAD TAKEN // 1ST' : 'GHOST OVERTAKEN // +1 POS');
        const timer = setTimeout(() => setOvertakeNotice(null), 1600);
        return () => clearTimeout(timer);
      }
    }
    prevRankRef.current = rank;
  }, [rank, status, playerD]);

  // =========================================================================
  // VIEW A: PRE-RACE CAR SELECTION & ONLINE LOBBY (MINIMAL & CLEAN)
  // =========================================================================
  if (status === 'idle') {
    return (
      <div className="relative w-full h-[calc(100vh-56px)] flex flex-col justify-between p-4 md:p-6 select-none overflow-hidden bg-bg font-sans">
        {/* TOP BAR: Back button & Car Header */}
        <div className="z-10 max-w-5xl w-full mx-auto flex items-center justify-between">
          <button
            onClick={onHome}
            className="text-xs text-text-muted hover:text-text transition-colors flex items-center gap-1.5 py-1 px-3 rounded-full bg-surface-2/60 border border-border"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </button>

          {/* Points indicator */}
          <div className="text-xs font-mono text-text-muted bg-surface-2/60 border border-border px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="text-accent font-semibold">{userPoints} PTS</span>
            <span className="text-text-faint">available</span>
          </div>
        </div>

        {/* CENTER STAGE: CAR 3D CANVAS & PREV/NEXT ARROWS */}
        <div className="relative flex-1 w-full max-w-4xl mx-auto flex items-center justify-center my-auto min-h-[280px]">
          {/* Previous Car Button */}
          <button
            onClick={handlePrevCar}
            className="absolute left-2 md:left-6 z-20 w-11 h-11 rounded-full bg-surface/90 hover:bg-surface-2 border border-border text-text hover:text-accent shadow-xl backdrop-blur-md flex items-center justify-center transition-all active:scale-95"
            aria-label="Previous Vehicle"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* 3D Vehicle Showcase Canvas */}
          <div className="w-full h-full max-w-3xl flex items-center justify-center">
            <ShowroomCanvas selectedCarId={currentCar.id} />
          </div>

          {/* Next Car Button */}
          <button
            onClick={handleNextCar}
            className="absolute right-2 md:right-6 z-20 w-11 h-11 rounded-full bg-surface/90 hover:bg-surface-2 border border-border text-text hover:text-accent shadow-xl backdrop-blur-md flex items-center justify-center transition-all active:scale-95"
            aria-label="Next Vehicle"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* MID-DOWN SECTION: CAR DETAILS, PICK/LOCK STATUS, PLAY ONLINE & START RACE */}
        <div className="z-10 max-w-3xl w-full mx-auto flex flex-col items-center space-y-4">
          {/* Car Details: Name, Category, Speed & Accel */}
          <div className="w-full p-4 rounded-2xl glass-panel border border-border/80 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left: Car Title & Unlock Status */}
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="text-2xl font-bold tracking-tight text-text">
                  {currentCar.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-subtle border border-accent/30 text-accent">
                  {currentCar.category}
                </span>
              </div>

              {isCurrentCarUnlocked ? (
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-success font-medium">
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Ready to drive</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-danger font-medium">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Requires {unlockPointsReq} PTS · Need {pointsRemaining} more</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-48 bg-surface-2 h-1.5 rounded-full overflow-hidden border border-border mx-auto sm:mx-0">
                    <div
                      className="bg-accent h-full transition-all duration-300"
                      style={{ width: `${unlockPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right: Key Specs (Top Speed & Acceleration) */}
            <div className="flex items-center gap-6 text-xs text-text-muted">
              <div className="text-center sm:text-right">
                <span className="text-[10px] text-text-faint uppercase tracking-wider block">Top Speed</span>
                <span className="text-base font-bold text-text font-mono">
                  {currentCar.displaySpecs.topSpeedKph} <span className="text-xs font-normal text-text-muted">KM/H</span>
                </span>
              </div>
              <div className="text-center sm:text-right border-l border-border pl-6">
                <span className="text-[10px] text-text-faint uppercase tracking-wider block">Acceleration</span>
                <div className="mt-0.5">
                  <Stars count={currentCar.stars.acceleration} />
                </div>
              </div>
            </div>
          </div>

          {/* Action Row: Play Online button & Start Race / Pick Car button */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3">
            {/* MID DOWN PAGE: PLAY ONLINE BUTTON */}
            <button
              onClick={() => {
                audioEngine.playUiClick();
                if (onOpenOnlineModal) {
                  onOpenOnlineModal();
                }
              }}
              className="w-full sm:w-1/2 py-3 px-6 rounded-xl bg-surface-2/90 hover:bg-surface-2 border border-accent/40 text-text font-semibold text-sm hover:border-accent hover:shadow-lg hover:shadow-accent/15 transition-all flex items-center justify-center gap-2 group"
            >
              <Radio className="w-4 h-4 text-accent animate-pulse" />
              <span>Play Online</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-accent/15 text-accent font-semibold ml-1">
                LOBBY
              </span>
            </button>

            {/* START RACE / PICK CAR BUTTON */}
            <button
              onClick={handleStartRace}
              disabled={!isCurrentCarUnlocked}
              className={`w-full sm:w-1/2 py-3 px-6 rounded-xl text-white font-semibold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
                isCurrentCarUnlocked
                  ? 'bg-accent hover:bg-accent-hover shadow-accent/25 hover:shadow-accent/40 active:scale-[0.98]'
                  : 'bg-surface-2 border border-border text-text-faint cursor-not-allowed opacity-60 shadow-none'
              }`}
            >
              {isCurrentCarUnlocked ? (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Race</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Locked ({pointsRemaining} PTS needed)</span>
                </>
              )}
            </button>
          </div>

          {/* BOTTOM CAR SELECTOR ROW: Clean, compact car thumbnails */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1 px-2">
            {CARS_LIST.map((c) => {
              const isSelected = c.id === currentCar.id;
              const isUnlocked = unlockedCars.includes(c.id);

              return (
                <button
                  key={c.id}
                  onClick={() => {
                    audioEngine.playUiClick();
                    selectCar(c.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? 'bg-accent/15 border-accent text-text font-semibold shadow-sm shadow-accent/20'
                      : 'bg-surface-2/60 border-border text-text-muted hover:text-text hover:bg-surface-2'
                  } ${!isUnlocked ? 'opacity-60' : ''}`}
                >
                  {c.spriteUrl && (
                    <img
                      src={c.spriteUrl}
                      alt={c.name}
                      className="h-6 w-8 object-contain"
                    />
                  )}
                  <span className="text-xs whitespace-nowrap">{c.name}</span>
                  {!isUnlocked && <Lock className="w-3 h-3 text-text-faint" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW B: ACTIVE RACING VIEWPORT (GAMEPLAY RUNNING)
  // =========================================================================
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg select-none font-sans">
      {/* TOP EDGE HAIRLINE PROGRESS RAIL */}
      <div className="absolute top-0 inset-x-0 z-30 pointer-events-none">
        <RaceProgressBar />
      </div>

      {/* 3D WEBGL RACING CANVAS */}
      <RaceCanvas />

      {/* OVERTAKE FLASH NOTIFICATION */}
      {overtakeNotice && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3.5 py-1 rounded-full bg-black/60 border border-accent/60 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest text-accent shadow-[0_0_16px_rgba(255,75,38,0.35)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
            <span>{overtakeNotice}</span>
          </div>
        </div>
      )}

      {/* MINIMAL TOP BAR: CLEAN ESC & POSITION / ROUND STATUS */}
      <div className="absolute top-3 inset-x-0 z-20 flex items-center justify-between px-5 pointer-events-none">
        <button
          onClick={pauseRace}
          className="pointer-events-auto text-[10px] font-mono uppercase tracking-widest text-white/60 hover:text-white px-2 py-1 rounded bg-black/40 backdrop-blur-md border border-white/10 transition-colors"
        >
          ESC // PAUSE
        </button>

        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-accent px-2.5 py-0.5 rounded bg-black/40 backdrop-blur-md border border-accent/30 shadow-[0_0_12px_rgba(255,75,38,0.2)]">
            {posLabel}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/60 px-2 py-0.5 rounded bg-black/40 backdrop-blur-md border border-white/10">
            R{currentRound}/{totalRounds}
          </span>
        </div>
      </div>

      {/* COUNTDOWN 3-2-1-GO */}
      <CountdownOverlay />

      {/* ROUND COMPLETE INTERSTITIAL */}
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
        onChangeCar={handleChangeCar}
        onHome={onHome}
        onLeaderboard={onLeaderboard}
      />
    </div>
  );
};
