// apps/web/src/components/screens/RacePlayingScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Trophy, Radio, ArrowLeft } from 'lucide-react';
import { useRaceStore } from '../../stores/useRaceStore.js';
import { audioEngine } from '../../audio/AudioEngine.js';

// 3D Canvas & Race HUD
import { RaceCanvas } from '../scene/RaceCanvas.js';
import { RaceProgressBar } from '../race/RaceProgressBar.js';
import { TypingHUD } from '../race/TypingHUD.js';
import { CountdownOverlay } from '../race/CountdownOverlay.js';
import { RoundCompleteOverlay } from '../race/RoundCompleteOverlay.js';
import { PauseOverlay } from '../race/PauseOverlay.js';
import { RaceResultModal } from '../race/RaceResultModal.js';
import { OvertakeFlash } from '../race/animation/OvertakeFlash.js';
import { RoundIndicator } from '../race/rounds/RoundIndicator.js';

export const RacePlayingScreen: React.FC = () => {
  const { id: roomId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const {
    status,
    raceTimeMs,
    currentRound,
    totalRounds,
    pauseRace,
    prepareRace,
    startCountdown,
    resetToCarSelect,
  } = useRaceStore();

  const isOnline = Boolean(roomId);

  // Overtake notice state
  const [overtakeNotice, setOvertakeNotice] = useState<string | null>(null);
  const prevRankRef = useRef<number>(3);
  const lastFrameTime = useRef<number>(performance.now());
  const animFrameId = useRef<number | null>(null);

  // Auto-prepare and start countdown on mount if in 'idle' state
  useEffect(() => {
    const currentStatus = useRaceStore.getState().status;
    if (currentStatus === 'idle' || currentStatus === 'results') {
      prepareRace(1);
      startCountdown();
    }
  }, [prepareRace, startCountdown]);

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

  // Clean exit handlers
  const handleExitToRaceHub = () => {
    audioEngine.playUiClick();
    resetToCarSelect();
    navigate('/race');
  };

  const handleGotoGarage = () => {
    audioEngine.playUiClick();
    resetToCarSelect();
    navigate('/race/garage');
  };

  const handleRaceAgain = () => {
    audioEngine.playUiClick();
    prepareRace(1);
    startCountdown();
  };

  // Rank calculation for overtake notices
  const playerD = useRaceStore((state) => state.playerSim.d);
  const opponents = useRaceStore((state) => state.opponents);
  let rank = 1;
  for (const opp of opponents) {
    if (opp.racer.d > playerD) rank++;
  }

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

  // Live match clock formatter
  const formatRaceClock = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const remS = s % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    return `${m.toString().padStart(2, '0')}:${remS.toString().padStart(2, '0')}.${tenths}`;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#06080F] select-none font-sans">
      {/* 1. TOP PROGRESS TRACK RAIL */}
      <div className="absolute top-0 inset-x-0 z-30 pointer-events-none">
        <RaceProgressBar />
      </div>

      {/* 2. 3D WEBGL RACING CANVAS */}
      <RaceCanvas />

      {/* 3. OVERTAKE BANNER NOTIFICATION */}
      <OvertakeFlash message={overtakeNotice} />

      {/* 4. MINIMAL TOP BAR: ESC / LEAVE, CLOCK, MULTIPLAYER ROOM & RANK */}
      <div className="absolute top-3 inset-x-0 z-20 flex items-center justify-between px-4 sm:px-6 pointer-events-none">
        {/* Left: ESC // PAUSE or LEAVE */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={isOnline ? handleExitToRaceHub : pauseRace}
            className="text-[10px] font-mono uppercase tracking-widest text-white/70 hover:text-white px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/12 transition-all cursor-pointer flex items-center gap-1.5"
          >
            {isOnline ? (
              <>
                <ArrowLeft className="w-3 h-3" />
                <span>LEAVE MATCH</span>
              </>
            ) : (
              <>
                <span>ESC</span>
                <span className="text-white/30">//</span>
                <span>PAUSE</span>
              </>
            )}
          </button>

          {/* Online Match Tag */}
          {isOnline && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono text-[10px] font-bold">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>ROOM #{roomId}</span>
            </div>
          )}
        </div>

        {/* Center: Live Match Clock */}
        <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-black/60 border border-white/12 backdrop-blur-md font-mono text-xs text-white/90 tabular-nums pointer-events-auto">
          <Clock className="w-3.5 h-3.5 text-accent" />
          <span>{formatRaceClock(raceTimeMs)}</span>
        </div>

        {/* Right: Position & Round */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {rank === 1 ? (
            <span className="text-[11px] font-mono font-black uppercase tracking-wider text-amber-300 px-3 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.35)] flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-300" />
              <span>P1 // LEAD</span>
            </span>
          ) : rank === 2 ? (
            <span className="text-[11px] font-mono font-black uppercase tracking-wider text-cyan-300 px-3 py-0.5 rounded-full bg-cyan-400/20 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              P2
            </span>
          ) : rank === 3 ? (
            <span className="text-[11px] font-mono font-black uppercase tracking-wider text-amber-400 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
              P3
            </span>
          ) : (
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-white/80 px-2.5 py-0.5 rounded-full bg-black/60 border border-white/20">
              P{rank}
            </span>
          )}

          <RoundIndicator currentRound={currentRound} totalRounds={totalRounds} />
        </div>
      </div>

      {/* 5. COUNTDOWN 3-2-1-GO OVERLAY */}
      <CountdownOverlay />

      {/* 6. ROUND COMPLETE OVERLAY */}
      <RoundCompleteOverlay />

      {/* 7. BOTTOM COCKPIT HUD (LIVE 5-WORD STREAM & SPEED TELEMETRY) */}
      <div className="absolute bottom-6 inset-x-0 z-20 flex flex-col items-center px-4 pointer-events-auto">
        <TypingHUD isRacing={status === 'racing'} />
      </div>

      {/* 8. PAUSE MODAL OVERLAY */}
      <PauseOverlay onQuit={handleExitToRaceHub} />

      {/* 9. FINAL RESULTS MODAL */}
      <RaceResultModal
        onRaceAgain={handleRaceAgain}
        onChangeCar={handleGotoGarage}
        onHome={handleExitToRaceHub}
        onLeaderboard={() => navigate('/leaderboard')}
      />
    </div>
  );
};
