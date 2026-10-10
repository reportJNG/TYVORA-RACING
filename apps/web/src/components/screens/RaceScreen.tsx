// apps/web/src/components/screens/RaceScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Play,
  Radio,
  Lock,
  Unlock,
  Zap,
  Gauge,
  SlidersHorizontal,
  X,
  Check,
} from 'lucide-react';
import { useRaceStore } from '../../stores/useRaceStore.js';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { CARS_DATA, CARS_LIST } from '../../data/cars.js';
import { TRACKS_DATA, TRACKS_LIST } from '../../data/tracks.js';
import { ShowroomCanvas } from '../scene/ShowroomCanvas.js';
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
  onOpenOnlineModal?: (autoSearch?: boolean) => void;
}

export const RaceScreen: React.FC<RaceScreenProps> = ({
  onHome,
  onLeaderboard,
  onOpenOnlineModal,
}) => {
  const {
    status,
    selectedCarId,
    selectedTrackId,
    difficulty,
    botCount,
    selectCar,
    selectTrack,
    selectDifficulty,
    selectBotCount,
    prepareRace,
    startCountdown,
    pauseRace,
    resetToCarSelect,
    currentRound,
    totalRounds,
  } = useRaceStore();

  const { currentUser, unlockedCars } = useAuthStore();

  // Selected vehicle & unlock status
  const currentCar = CARS_DATA[selectedCarId] || CARS_LIST[0];
  const carIndex = CARS_LIST.findIndex((c) => c.id === currentCar.id);
  const isCurrentCarUnlocked = unlockedCars.includes(currentCar.id);
  const userPoints = currentUser?.points || 0;
  const unlockPointsReq = currentCar.unlockPoints || 0;
  const pointsRemaining = Math.max(0, unlockPointsReq - userPoints);

  // Offline Setup Drawer/Modal state
  const [isOfflineSetupOpen, setIsOfflineSetupOpen] = useState(false);

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

  const handleOpenOfflineSetup = () => {
    if (!isCurrentCarUnlocked) {
      audioEngine.playMistakeSound();
      return;
    }
    audioEngine.playUiClick();
    setIsOfflineSetupOpen(true);
  };

  const handleLaunchOfflineRace = () => {
    audioEngine.playUiClick();
    setIsOfflineSetupOpen(false);
    prepareRace(1);
    startCountdown();
  };

  const handleStartOnlineSearch = () => {
    audioEngine.playUiClick();
    if (onOpenOnlineModal) {
      onOpenOnlineModal(true);
    }
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
    if (status !== 'idle' || isOfflineSetupOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowLeft') {
        handlePrevCar();
      } else if (e.key === 'ArrowRight') {
        handleNextCar();
      } else if (e.key === 'Enter') {
        if (isCurrentCarUnlocked) {
          handleOpenOfflineSetup();
        }
      } else if (e.key === 'Escape') {
        onHome();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, carIndex, isCurrentCarUnlocked, isOfflineSetupOpen, onHome]);

  const playerD = useRaceStore((state) => state.playerSim.d);
  const opponents = useRaceStore((state) => state.opponents);
  let rank = 1;
  for (const opp of opponents) {
    if (opp.racer.d > playerD) rank++;
  }
  const posLabel =
    rank === 1 ? '1ST' : rank === 2 ? '2ND' : rank === 3 ? '3RD' : `${rank}TH`;

  // Overtake feedback notification during active race
  useEffect(() => {
    if (status === 'racing' && playerD > 5) {
      if (rank < prevRankRef.current) {
        setOvertakeNotice(rank === 1 ? 'P1 LEAD TAKEN' : `+1 OVERTAKE // P${rank}`);
        const timer = setTimeout(() => setOvertakeNotice(null), 1600);
        return () => clearTimeout(timer);
      }
    }
    prevRankRef.current = rank;
  }, [rank, status, playerD]);

  // Selected track details
  const activeTrack = TRACKS_DATA[selectedTrackId] || TRACKS_LIST[0];

  // =========================================================================
  // VIEW A: PRE-RACE HANGAR / CAR SHOWROOM (MINIMAL & ULTRA-POLISHED UI/UX)
  // =========================================================================
  if (status === 'idle') {
    return (
      <div className="relative w-full h-[calc(100vh-56px)] flex flex-col justify-between p-4 md:p-6 select-none overflow-hidden bg-[#070A12] font-sans">
        {/* Background ambient lighting */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_38%,rgba(255,75,38,0.07)_0%,transparent_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* 1. MINIMAL TOP BAR: BACK, CURRENT CAR TITLE & WALLET/POINTS */}
        <header className="relative z-20 max-w-5xl w-full mx-auto flex items-center justify-between">
          <button
            onClick={onHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface/75 hover:bg-surface border border-white/10 hover:border-white/20 text-text-muted hover:text-white transition-all text-xs font-mono backdrop-blur-md cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>HOME</span>
          </button>

          {/* Center: Vehicle Name & Category Pill */}
          <div className="flex items-center gap-2.5">
            <h1 className="font-display font-extrabold text-base sm:text-xl tracking-tight text-white uppercase drop-shadow-sm">
              {currentCar.name}
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-white/10 border border-white/15 text-accent">
              {currentCar.category}
            </span>
          </div>

          {/* Right: Driver Points / Balance */}
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-accent/15 border border-accent/35 text-white text-xs font-mono font-bold shadow-[0_0_15px_rgba(255,75,38,0.25)]">
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span className="tabular-nums">{userPoints}</span>
            <span className="text-[10px] text-accent font-sans font-bold">PTS</span>
          </div>
        </header>

        {/* 2. CENTER STAGE: 3D VEHICLE & MINIMAL ARROWS & STATS HUD */}
        <div className="relative z-10 flex-1 w-full max-w-4xl mx-auto flex items-center justify-center my-auto min-h-[260px]">
          {/* Previous Car */}
          <button
            onClick={handlePrevCar}
            className="absolute left-2 sm:left-4 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-surface/85 hover:bg-surface-2 border border-white/15 hover:border-accent/40 text-white/80 hover:text-white shadow-xl backdrop-blur-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            aria-label="Previous Car"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* 3D Showcase Canvas */}
          <div className="w-full h-full max-w-2xl flex items-center justify-center">
            <ShowroomCanvas selectedCarId={currentCar.id} />
          </div>

          {/* Next Car */}
          <button
            onClick={handleNextCar}
            className="absolute right-2 sm:right-4 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-surface/85 hover:bg-surface-2 border border-white/15 hover:border-accent/40 text-white/80 hover:text-white shadow-xl backdrop-blur-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            aria-label="Next Car"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Floating Minimal Vehicle Specs Overlay (Bottom of 3D Canvas) */}
          <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-6 text-xs font-mono pointer-events-none">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-white/80">
              <Gauge className="w-3.5 h-3.5 text-accent" />
              <span>{currentCar.displaySpecs.topSpeedKph} KM/H</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
              {isCurrentCarUnlocked ? (
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <Unlock className="w-3 h-3" /> READY
                </span>
              ) : (
                <span className="flex items-center gap-1 text-danger font-semibold">
                  <Lock className="w-3 h-3" /> {pointsRemaining} PTS NEEDED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. BOTTOM CONTROL CONSOLE: MODE SELECTION & QUICK CAR SWITCHER */}
        <footer className="relative z-20 max-w-2xl w-full mx-auto flex flex-col items-center space-y-4">
          {/* Main Action Deck: PLAY OFFLINE & PLAY ONLINE */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Play Offline Button */}
            <button
              onClick={handleOpenOfflineSetup}
              disabled={!isCurrentCarUnlocked}
              className={`relative group px-6 py-4 rounded-2xl font-extrabold text-base tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-xl overflow-hidden cursor-pointer ${
                isCurrentCarUnlocked
                  ? 'bg-gradient-to-r from-accent via-[#ff5b28] to-amber-500 text-white shadow-[0_0_35px_rgba(255,75,38,0.45)] hover:shadow-[0_0_55px_rgba(255,75,38,0.7)] hover:scale-[1.02] active:scale-[0.98] border-t border-white/35 border-x border-white/20 border-b border-black/35'
                  : 'bg-surface-2/60 border border-white/10 text-white/40 cursor-not-allowed opacity-65'
              }`}
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
              <Play className="w-4 h-4 fill-current" />
              <span>PLAY OFFLINE</span>
              <span className="ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/35 border border-white/20 font-bold uppercase">
                SOLO
              </span>
            </button>

            {/* Play Online Button -> Auto Searches */}
            <button
              onClick={handleStartOnlineSearch}
              className="relative group px-6 py-4 rounded-2xl bg-[#0F172A]/85 hover:bg-[#0F172A] border border-cyan-400/40 hover:border-cyan-400 text-white font-extrabold text-base tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-[0_0_30px_rgba(6,182,212,0.25)] hover:shadow-[0_0_45px_rgba(6,182,212,0.5)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>PLAY ONLINE</span>
              <span className="ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 font-bold uppercase">
                RADAR
              </span>
            </button>
          </div>

          {/* Quick Vehicle Switcher Strip */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1 px-1 scrollbar-none">
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
                  className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-accent/20 border-accent text-white font-bold shadow-[0_0_12px_rgba(255,75,38,0.35)] scale-105'
                      : 'bg-surface/70 hover:bg-surface border-white/10 text-white/60 hover:text-white'
                  } ${!isUnlocked ? 'opacity-50' : ''}`}
                >
                  {c.spriteUrl && (
                    <img
                      src={c.spriteUrl}
                      alt={c.name}
                      className="h-5 w-8 object-contain filter drop-shadow"
                    />
                  )}
                  <span className="text-xs whitespace-nowrap">{c.name}</span>
                  {!isUnlocked && <Lock className="w-3 h-3 text-white/40" />}
                </button>
              );
            })}
          </div>
        </footer>

        {/* ================================================================= */}
        {/* OFFLINE RACE SETUP MODAL: BOTS COUNT, DIFFICULTY & MAP SELECTION  */}
        {/* ================================================================= */}
        {isOfflineSetupOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200 font-sans">
            <div className="relative w-full max-w-xl rounded-3xl bg-[#0C101C] border border-white/15 p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.8)] space-y-6 text-white max-h-[92vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-accent/20 border border-accent/40 text-accent">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight uppercase">RACE SETUP</h2>
                    <p className="text-[11px] font-mono text-white/50 uppercase">CUSTOMIZE OFFLINE SESSION</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOfflineSetupOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1. DIFFICULTY MODE: EASY / MID / HARD */}
              <div className="space-y-2.5">
                <label className="text-xs font-mono font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                  <span>DIFFICULTY MODE</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'easy', label: 'EASY', wpm: '~30 WPM', color: 'hover:border-emerald-500' },
                    { id: 'normal', label: 'MID', wpm: '~48 WPM', color: 'hover:border-amber-500' },
                    { id: 'hard', label: 'HARD', wpm: '~68 WPM', color: 'hover:border-accent' },
                  ].map((m) => {
                    const isSelected = difficulty === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          audioEngine.playUiClick();
                          selectDifficulty(m.id as any);
                        }}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-accent/20 border-accent text-white shadow-[0_0_15px_rgba(255,75,38,0.3)]'
                            : `bg-surface/60 border-white/10 text-white/70 ${m.color}`
                        }`}
                      >
                        <div className="text-sm font-black uppercase tracking-wider">{m.label}</div>
                        <div className="text-[10px] font-mono text-white/50 mt-0.5">{m.wpm}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. BOT COUNT: 1 TO 4 BOTS */}
              <div className="space-y-2.5">
                <label className="text-xs font-mono font-bold text-white/70 uppercase tracking-wider flex items-center justify-between">
                  <span>AI COMPETITORS</span>
                  <span className="text-accent font-mono">{botCount} BOTS</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((num) => {
                    const isSelected = botCount === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          audioEngine.playUiClick();
                          selectBotCount(num);
                        }}
                        className={`py-2.5 rounded-xl border text-center font-mono font-bold text-sm transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-accent border-accent text-white shadow-[0_0_15px_rgba(255,75,38,0.35)]'
                            : 'bg-surface/60 border-white/10 text-white/70 hover:border-white/30'
                        }`}
                      >
                        {num} {num === 1 ? 'BOT' : 'BOTS'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. CHOOSE MAP / TRACK: 6 TRACKS */}
              <div className="space-y-2.5">
                <label className="text-xs font-mono font-bold text-white/70 uppercase tracking-wider flex items-center justify-between">
                  <span>CIRCUIT MAP</span>
                  <span className="text-accent font-mono">{activeTrack.name}</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {TRACKS_LIST.map((t) => {
                    const isSelected = selectedTrackId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          audioEngine.playUiClick();
                          selectTrack(t.id);
                        }}
                        className={`relative p-3 rounded-2xl border text-left transition-all cursor-pointer overflow-hidden ${
                          isSelected
                            ? 'bg-accent/20 border-accent shadow-[0_0_18px_rgba(255,75,38,0.3)]'
                            : 'bg-surface/60 hover:bg-surface border-white/10 hover:border-white/20'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-accent text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                        <div className="text-xs font-bold text-white truncate pr-4">{t.name}</div>
                        <div className="text-[10px] font-mono text-white/50 truncate mt-0.5">{t.location}</div>
                        <div className="mt-2 inline-block text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                          {t.timeOfDay}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons: START RACE */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleLaunchOfflineRace}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-accent via-[#ff5b28] to-amber-500 text-white font-extrabold text-base tracking-wider uppercase shadow-[0_0_35px_rgba(255,75,38,0.5)] hover:shadow-[0_0_50px_rgba(255,75,38,0.75)] hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>START RACE</span>
                </button>
              </div>
            </div>
          </div>
        )}
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
          className="pointer-events-auto text-[10px] font-mono uppercase tracking-widest text-white/60 hover:text-white px-2 py-1 rounded bg-black/40 backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
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
