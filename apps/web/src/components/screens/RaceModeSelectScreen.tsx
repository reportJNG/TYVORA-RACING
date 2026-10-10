// apps/web/src/components/screens/RaceModeSelectScreen.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Radio,
  Wrench,
  Zap,
  Gauge,
  SlidersHorizontal,
  X,
  ArrowRight,
} from 'lucide-react';
import { useRaceStore } from '../../stores/useRaceStore.js';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { CARS_DATA, CARS_LIST } from '../../data/cars.js';
import { TRACKS_DATA, TRACKS_LIST } from '../../data/tracks.js';
import { audioEngine } from '../../audio/AudioEngine.js';
import { BotConfigSelector } from '../race/players/BotConfigSelector.js';
import { CircuitSelector } from '../race/maps/CircuitSelector.js';
import { CarCardSelector } from '../race/cars/CarCardSelector.js';

export const RaceModeSelectScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedCarId,
    selectedTrackId,
    difficulty,
    botCount,
    selectCar,
    selectTrack,
    selectDifficulty,
    selectBotCount,
    prepareRace,
  } = useRaceStore();

  const { currentUser, unlockedCars } = useAuthStore();

  const currentCar = CARS_DATA[selectedCarId] || CARS_LIST[0];
  const currentTrack = TRACKS_DATA[selectedTrackId] || TRACKS_LIST[0];
  const isCarUnlocked = unlockedCars.includes(currentCar.id);
  const userPoints = currentUser?.points || 0;

  // Offline Customizer Modal state
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);

  // Online Matchmaking searching state
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineSearchTimer, setOnlineSearchTimer] = useState(0);

  // Launch Offline Race
  const handleLaunchOffline = () => {
    if (!isCarUnlocked) {
      audioEngine.playMistakeSound();
      navigate('/race/garage');
      return;
    }

    audioEngine.playUiClick();
    prepareRace(1);
    navigate('/race/playing');
  };

  // Start Online Search and redirect to generated room session
  const handleStartOnline = () => {
    audioEngine.playUiClick();
    setIsSearchingOnline(true);
    setOnlineSearchTimer(0);
  };

  useEffect(() => {
    let timer: any;
    if (isSearchingOnline) {
      timer = setInterval(() => {
        setOnlineSearchTimer((prev) => {
          if (prev >= 2) {
            // Found match! Generate room ID and redirect
            clearInterval(timer);
            const roomId = 'room-' + Math.random().toString(36).substring(2, 8);
            audioEngine.playStreakMilestone(10);
            setIsSearchingOnline(false);
            navigate(`/race/playing/${roomId}`);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSearchingOnline, navigate]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleLaunchOffline();
      } else if (e.key === 'g' || e.key === 'G') {
        audioEngine.playUiClick();
        navigate('/race/garage');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, isCarUnlocked]);

  return (
    <div className="relative w-full min-h-[calc(100vh-56px)] flex flex-col justify-between p-4 sm:p-6 md:p-8 select-none font-sans bg-[#070A12] overflow-x-hidden">
      {/* Background ambient neon lighting */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_75%_55%_at_50%_25%,rgba(255,75,38,0.08)_0%,transparent_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* TOP HEADER: DRIVER STATUS & GARAGE QUICK LINK */}
      <header className="relative z-20 max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent/20 border border-accent/40 text-accent">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-white font-display">
              RACE CONTROL
            </h1>
            <p className="text-[11px] font-mono text-white/50 uppercase">
              SELECT RACE MODE OR ENTER GARAGE
            </p>
          </div>
        </div>

        {/* Right: Driver Points & Garage Shortcut */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              audioEngine.playUiClick();
              navigate('/race/garage');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface/80 hover:bg-surface border border-white/12 hover:border-accent text-white text-xs font-mono font-bold transition-all shadow-md group cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5 text-accent group-hover:rotate-45 transition-transform" />
            <span>GARAGE</span>
          </button>

          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent/15 border border-accent/35 text-white text-xs font-mono font-bold shadow-[0_0_15px_rgba(255,75,38,0.25)]">
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span className="tabular-nums">{userPoints}</span>
            <span className="text-[10px] text-accent font-sans font-bold">PTS</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT: MODE CARDS (OFFLINE SOLO VS ONLINE MATCH) */}
      <main className="relative z-20 max-w-6xl w-full mx-auto my-auto py-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        {/* ================================================================= */}
        {/* CARD 1: SOLO OFFLINE RACE (CUSTOMIZABLE BOTS & CIRCUIT)           */}
        {/* ================================================================= */}
        <div className="relative group rounded-3xl bg-[#0B0F1D]/85 hover:bg-[#0E1426]/95 border border-white/12 hover:border-accent/50 p-6 sm:p-7 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all duration-300">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-accent/15 text-accent border border-accent/30">
                OFFLINE MOTORSPORT
              </span>

              <button
                type="button"
                onClick={() => {
                  audioEngine.playUiClick();
                  setIsCustomizeModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white text-[11px] font-mono transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3 h-3 text-accent" />
                <span>SETTINGS</span>
              </button>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-display">
                SOLO PADDOCK
              </h2>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">
                Compete against intelligent adaptive AI racers across multi-round velocity heats.
              </p>
            </div>

            {/* Current Active Config Summary Pill */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/8 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-white/50">CIRCUIT</span>
                <span className="text-white font-bold">{currentTrack.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50">DIFFICULTY</span>
                <span className="text-accent font-bold uppercase">{difficulty}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50">AI RIVALS</span>
                <span className="text-white font-bold">{botCount} BOTS</span>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-6">
            <button
              onClick={handleLaunchOffline}
              className="w-full py-4.5 rounded-2xl bg-gradient-to-r from-accent via-[#ff5b28] to-amber-500 text-white font-black text-base uppercase tracking-wider shadow-[0_0_35px_rgba(255,75,38,0.45)] hover:shadow-[0_0_55px_rgba(255,75,38,0.7)] hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer border-t border-white/30"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>PLAY OFFLINE</span>
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* CARD 2: PLAY ONLINE MULTIPLAYER MATCHMAKING                       */}
        {/* ================================================================= */}
        <div className="relative group rounded-3xl bg-[#091224]/85 hover:bg-[#0B172E]/95 border border-cyan-400/25 hover:border-cyan-400/60 p-6 sm:p-7 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all duration-300">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                MULTIPLAYER LOBBY
              </span>

              <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>SERVERS ONLINE</span>
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-display">
                PLAY ONLINE
              </h2>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">
                Connect to live competitive matchmaking against drivers worldwide with synchronized 60 Hz telemetry.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/8 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-white/50">MATCH FORMAT</span>
                <span className="text-cyan-300 font-bold">HEAD-TO-HEAD / 4P</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50">RANKED RATING</span>
                <span className="text-white font-bold">WPM ELO SYSTEM</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50">REWARDS</span>
                <span className="text-amber-300 font-bold">+180 PTS / WIN</span>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-6">
            <button
              onClick={handleStartOnline}
              disabled={isSearchingOnline}
              className="w-full py-4.5 rounded-2xl bg-[#0F1E36] hover:bg-[#132745] border border-cyan-400/40 hover:border-cyan-400 text-white font-black text-base uppercase tracking-wider shadow-[0_0_30px_rgba(6,182,212,0.25)] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Radio className={`w-5 h-5 text-cyan-400 ${isSearchingOnline ? 'animate-spin' : 'animate-pulse'}`} />
              <span>
                {isSearchingOnline
                  ? `SEARCHING FOR MATCH (${onlineSearchTimer}s)...`
                  : 'FIND ONLINE MATCH'}
              </span>
            </button>
          </div>
        </div>

      </main>

      {/* BOTTOM SECTION: EQUIPPED CAR SUMMARY & GARAGE CTA */}
      <footer className="relative z-20 max-w-6xl w-full mx-auto pt-4 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Quick Car Switcher */}
        <div className="w-full sm:w-auto flex items-center gap-3">
          <div className="text-xs font-mono text-white/50 hidden lg:block uppercase">
            ACTIVE CAR:
          </div>
          <CarCardSelector
            selectedCarId={currentCar.id}
            unlockedCars={unlockedCars}
            onSelectCar={(id) => selectCar(id)}
            orientation="horizontal"
          />
        </div>

        {/* Right: Enter Garage Button */}
        <button
          onClick={() => {
            audioEngine.playUiClick();
            navigate('/race/garage');
          }}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-surface/90 hover:bg-surface-2 border border-white/15 hover:border-accent text-white font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg group shrink-0"
        >
          <Wrench className="w-4 h-4 text-accent group-hover:rotate-45 transition-transform" />
          <span>GARAGE & SHOP</span>
          <ArrowRight className="w-3.5 h-3.5 text-white/50 group-hover:translate-x-1 transition-transform" />
        </button>
      </footer>

      {/* =================================================================== */}
      {/* OFFLINE RACE SETUP DRAWER / MODAL                                   */}
      {/* =================================================================== */}
      {isCustomizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#0C101C] border border-white/15 p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.8)] space-y-6 text-white max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent/20 border border-accent/40 text-accent">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight uppercase">RACE SETUP</h2>
                  <p className="text-[11px] font-mono text-white/50 uppercase">
                    CONFIGURE OFFLINE OPPONENTS & TRACK
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCustomizeModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Bot & Difficulty Config */}
            <BotConfigSelector
              difficulty={difficulty}
              botCount={botCount}
              onSelectDifficulty={(d) => selectDifficulty(d)}
              onSelectBotCount={(c) => selectBotCount(c)}
            />

            {/* 2. Circuit Selector */}
            <div className="space-y-2.5">
              <label className="text-xs font-mono font-bold text-white/70 uppercase tracking-wider flex items-center justify-between">
                <span>CIRCUIT MAP</span>
                <span className="text-accent font-mono">{currentTrack.name}</span>
              </label>
              <CircuitSelector
                selectedTrackId={selectedTrackId}
                onSelectTrack={(t) => selectTrack(t)}
                compact
              />
            </div>

            {/* Launch button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCustomizeModalOpen(false);
                  handleLaunchOffline();
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-accent via-[#ff5b28] to-amber-500 text-white font-extrabold text-base tracking-wider uppercase shadow-[0_0_35px_rgba(255,75,38,0.5)] hover:shadow-[0_0_50px_rgba(255,75,38,0.75)] hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>CONFIRM & START RACE</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
