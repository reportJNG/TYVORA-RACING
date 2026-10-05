// apps/web/src/components/screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { Play, Trophy, ChevronRight, Gauge, Flame } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { useRaceStore } from '../../stores/useRaceStore.js';
import { CARS_DATA, CARS_LIST } from '../../data/cars.js';
import { SEED_LEADERBOARD } from '../../data/mockLeaderboard.js';
import { Avatar } from '../common/Avatar.js';
import { audioEngine } from '../../audio/AudioEngine.js';
import { GameplayBackground } from '../scene/GameplayBackground.js';

export interface HomeScreenProps {
  onStartRace: () => void;
  onNavigateLeaderboard?: () => void;
  onNavigateProfile?: () => void;
  onOpenAuthModal?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartRace,
  onNavigateLeaderboard,
  onNavigateProfile,
  onOpenAuthModal,
}) => {
  const { currentUser, leaderboard } = useAuthStore();
  const { selectedCarId, selectCar } = useRaceStore();

  const [isRevving, setIsRevving] = useState(false);
  const [liveKmh, setLiveKmh] = useState(218);

  const currentCar = CARS_DATA[selectedCarId] || CARS_DATA['apex-gtr'] || CARS_LIST[0];
  const top3Racers = (leaderboard && leaderboard.length > 0 ? leaderboard : SEED_LEADERBOARD).slice(0, 3);

  // Showcase cars for fleet dock selector
  const fleetCarIds = ['apex-gtr', 'cyclone-rs', 'strada-r', 'meridian-gt', 'scrapper-rust'];
  const fleetCars = fleetCarIds
    .map((id) => CARS_DATA[id])
    .filter(Boolean);

  // Animated live speedometer oscillation
  useEffect(() => {
    let frameId: number;
    let t = 0;
    const updateSpeed = () => {
      t += 0.04;
      if (isRevving) {
        setLiveKmh((prev) => Math.min(312, prev + 5.5));
      } else {
        const base = 210 + Math.sin(t) * 28 + Math.cos(t * 1.8) * 12;
        setLiveKmh(Math.round(base));
      }
      frameId = requestAnimationFrame(updateSpeed);
    };
    frameId = requestAnimationFrame(updateSpeed);
    return () => cancelAnimationFrame(frameId);
  }, [isRevving]);

  // Spacebar and Enter to instantly start race from anywhere on home
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        audioEngine.playUiClick();
        onStartRace();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartRace]);

  const handleRevStart = () => {
    audioEngine.init();
    audioEngine.playEngineRev();
    setIsRevving(true);
  };

  const handleRevEnd = () => {
    setIsRevving(false);
  };

  const handleSelectVehicle = (carId: string) => {
    audioEngine.playUiClick();
    selectCar(carId);
  };

  return (
    <div className="relative w-full flex-1 flex flex-col justify-between items-center p-4 md:p-8 min-h-[calc(100vh-56px)] select-none font-sans overflow-hidden">
      {/* 1. CINEMATIC GAMEPLAY BACKGROUND VIDEO */}
      <GameplayBackground />

      {/* 2. TOP STATUS TICKER (Podium Snippet & Driver status) */}
      <div className="relative z-20 w-full max-w-6xl mx-auto flex items-center justify-between gap-4 pt-1 pointer-events-auto">
        {/* Championship Top 3 Snippet */}
        <div
          onClick={() => {
            audioEngine.playUiClick();
            if (onNavigateLeaderboard) onNavigateLeaderboard();
          }}
          className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface/70 hover:bg-surface-2/90 border border-white/10 hover:border-accent/40 backdrop-blur-xl shadow-lg cursor-pointer transition-all"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider hidden sm:inline">
            Rankings:
          </span>
          <div className="flex items-center gap-2 text-xs">
            {top3Racers.map((racer, idx) => (
              <span
                key={racer.userId}
                className={`items-center gap-1 font-mono text-[11px] ${
                  idx > 0 ? 'hidden md:flex' : 'flex'
                }`}
              >
                <span className={idx === 0 ? 'text-amber-400 font-bold' : 'text-text-muted'}>
                  #{idx + 1}
                </span>
                <span className="text-white/80 font-medium max-w-[80px] truncate">
                  {racer.username}
                </span>
                <span className="text-accent text-[10px]">({racer.bestWpm} WPM)</span>
                {idx < 2 && <span className="text-white/20 hidden md:inline">·</span>}
              </span>
            ))}
          </div>
          <ChevronRight className="w-3 h-3 text-white/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Driver Profile Status */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div
              onClick={() => {
                audioEngine.playUiClick();
                if (onNavigateProfile) onNavigateProfile();
              }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface/70 hover:bg-surface-2/90 border border-white/10 text-xs text-text-muted hover:text-white cursor-pointer backdrop-blur-xl shadow-lg transition-all"
            >
              <Avatar seed={currentUser.username} size="sm" />
              <span className="text-white font-medium">{currentUser.username}</span>
              <span className="text-accent font-mono font-semibold">({currentUser.points} PTS)</span>
            </div>
          ) : onOpenAuthModal ? (
            <button
              onClick={() => {
                audioEngine.playUiClick();
                onOpenAuthModal();
              }}
              className="px-3.5 py-1.5 rounded-full bg-surface/70 hover:bg-surface-2 border border-white/10 hover:border-accent/40 text-xs text-text-muted hover:text-white backdrop-blur-xl transition-all"
            >
              <span>Sign In</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* 3. HERO CENTERSTAGE: PURE VISUAL IMPACT (Minimal text, maximum punch) */}
      <div className="relative z-20 max-w-4xl w-full mx-auto flex flex-col items-center text-center my-auto py-4 pointer-events-auto space-y-6">
        {/* Neon Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-subtle/80 border border-accent/40 text-accent text-xs font-bold tracking-widest uppercase backdrop-blur-xl shadow-lg shadow-accent/20 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span>REAL-TIME HYPER MOTORSPORT</span>
          <span className="text-accent/40">/</span>
          <span className="text-white font-mono">SEASON 01</span>
        </div>

        {/* Main Headline */}
        <div className="space-y-2">
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-none drop-shadow-2xl">
            <span className="block text-white font-extrabold tracking-tight">PURE VELOCITY.</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent via-amber-400 to-accent-hover filter drop-shadow-[0_4px_24px_rgba(255,75,38,0.45)]">
              ZERO DELAY.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-white/70 max-w-lg mx-auto font-medium tracking-wide">
            Every clean keystroke accelerates raw horsepower. Type fast. Draft rivals. Claim the leaderboard.
          </p>
        </div>

        {/* LIVE RACING COCKPIT TELEMETRY & REV GAUGE (Interactive eye-candy) */}
        <div className="inline-flex items-center gap-4 sm:gap-6 px-5 py-2.5 rounded-2xl bg-surface/60 border border-white/15 backdrop-blur-2xl shadow-2xl">
          {/* Animated Speedometer */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <Gauge className={`w-5 h-5 ${isRevving ? 'text-amber-400 animate-spin' : 'text-accent'}`} />
            </div>
            <div className="text-left">
              <div className="text-base sm:text-lg font-mono font-black text-white tabular-nums tracking-tight leading-none">
                {liveKmh} <span className="text-[11px] font-sans font-bold text-accent">KM/H</span>
              </div>
              <div className="text-[10px] font-mono text-white/50 tracking-wider">
                TELEMETRY ACTIVE
              </div>
            </div>
          </div>

          <div className="h-7 w-px bg-white/15" />

          {/* Featured Car Spec */}
          <div className="flex items-center gap-2 text-left">
            <div>
              <div className="text-xs sm:text-sm font-bold text-white leading-none">
                {currentCar.name}
              </div>
              <div className="text-[10px] font-mono text-amber-400 font-semibold mt-0.5">
                TOP SPEED {currentCar.displaySpecs.topSpeedKph} KM/H
              </div>
            </div>
          </div>

          <div className="h-7 w-px bg-white/15" />

          {/* Interactive Rev Throttle Button */}
          <button
            onMouseDown={handleRevStart}
            onMouseUp={handleRevEnd}
            onTouchStart={handleRevStart}
            onTouchEnd={handleRevEnd}
            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase transition-all shadow-md flex items-center gap-1.5 ${
              isRevving
                ? 'bg-amber-500 text-black scale-95 shadow-amber-500/50'
                : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/15 hover:border-amber-400/50'
            }`}
            title="Hold to Rev Engine"
          >
            <Flame className={`w-3.5 h-3.5 ${isRevving ? 'text-black fill-current animate-bounce' : 'text-amber-400'}`} />
            <span>{isRevving ? 'REVVING!' : 'REV ENGINE'}</span>
          </button>
        </div>

        {/* PRIMARY CALL TO ACTION BUTTON (THE WOW BUTTON) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 w-full sm:w-auto">
          <button
            onClick={() => {
              audioEngine.playUiClick();
              onStartRace();
            }}
            className="relative group w-full sm:w-64 px-8 py-4 rounded-2xl bg-gradient-to-r from-accent via-accent-hover to-amber-500 text-white font-extrabold text-lg tracking-wide shadow-[0_0_35px_rgba(255,75,38,0.5)] hover:shadow-[0_0_50px_rgba(255,75,38,0.7)] hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center justify-center gap-3 overflow-hidden border border-white/25"
          >
            {/* Animated shimmer sweep */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

            <Play className="w-5 h-5 fill-white transition-transform group-hover:scale-110" />
            <span>START RACE</span>
            <span className="ml-1 px-2 py-0.5 rounded-md bg-black/30 border border-white/20 text-[10px] font-mono font-bold text-white/90 hidden sm:inline">
              SPACE
            </span>
          </button>

          {onNavigateLeaderboard && (
            <button
              onClick={() => {
                audioEngine.playUiClick();
                onNavigateLeaderboard();
              }}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-surface/70 hover:bg-surface-2 border border-white/15 hover:border-accent/40 text-white font-semibold text-sm backdrop-blur-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Championship Leaderboard</span>
            </button>
          )}
        </div>

        {/* Keystroke Hint */}
        <div className="text-[11px] font-mono text-white/50 tracking-wider">
          PRESS <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white border border-white/20 font-bold">ENTER</kbd> OR <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white border border-white/20 font-bold">SPACE</kbd> TO LAUNCH
        </div>
      </div>

      {/* 4. BOTTOM FLEET GARAGE DOCK: QUICK VEHICLE SWITCHER */}
      <div className="relative z-20 w-full max-w-4xl mx-auto pb-2 pointer-events-auto">
        <div className="px-4 py-2.5 rounded-2xl bg-surface/65 border border-white/10 backdrop-blur-2xl shadow-2xl flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-white/60 pl-2 shrink-0 hidden md:block">
            <span>GARAGE:</span>
          </div>

          <div className="flex items-center gap-2.5 w-full justify-around md:justify-end">
            {fleetCars.map((car) => {
              const isSelected = car.id === currentCar.id;
              return (
                <button
                  key={car.id}
                  onClick={() => handleSelectVehicle(car.id)}
                  className={`group relative flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all shrink-0 ${
                    isSelected
                      ? 'bg-accent/20 border-accent text-white shadow-[0_0_18px_rgba(255,75,38,0.35)] scale-105'
                      : 'bg-surface-2/60 hover:bg-surface-2 border-white/10 text-text-muted hover:text-white'
                  }`}
                >
                  {/* Car Thumbnail Sprite */}
                  <img
                    src={car.spriteUrl}
                    alt={car.name}
                    className="h-6 w-10 object-contain filter drop-shadow group-hover:scale-110 transition-transform"
                  />

                  {/* Car Mini Label */}
                  <div className="text-left hidden sm:block">
                    <div className={`text-xs font-bold leading-none ${isSelected ? 'text-white' : 'text-text-muted group-hover:text-white'}`}>
                      {car.name}
                    </div>
                    <div className="text-[10px] font-mono text-accent font-semibold mt-0.5">
                      {car.displaySpecs.topSpeedKph} KM/H
                    </div>
                  </div>

                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
