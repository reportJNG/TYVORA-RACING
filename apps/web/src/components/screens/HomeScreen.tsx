// apps/web/src/components/screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { Play, Gauge, Trophy } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { SEED_LEADERBOARD } from '../../data/mockLeaderboard.js';
import { audioEngine } from '../../audio/AudioEngine.js';
import { GameplayBackground } from '../scene/GameplayBackground.js';

export interface HomeScreenProps {
  onStartRace: () => void;
  onNavigateLeaderboard?: () => void;
  onNavigateProfile?: () => void;
  onOpenAuthModal?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartRace }) => {
  const { leaderboard } = useAuthStore();
  const [liveKmh, setLiveKmh] = useState(224);

  const topRacer =
    leaderboard && leaderboard.length > 0 ? leaderboard[0] : SEED_LEADERBOARD[0];

  // Animated live speedometer oscillation
  useEffect(() => {
    let frameId: number;
    let t = 0;
    const updateSpeed = () => {
      t += 0.04;
      const base = 216 + Math.sin(t) * 24 + Math.cos(t * 1.8) * 10;
      setLiveKmh(Math.round(base));
      frameId = requestAnimationFrame(updateSpeed);
    };
    frameId = requestAnimationFrame(updateSpeed);
    return () => cancelAnimationFrame(frameId);
  }, []);

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

  return (
    <div className="relative w-full flex-1 flex flex-col justify-center items-center p-4 md:p-8 min-h-[calc(100vh-56px)] select-none font-sans overflow-hidden">
      {/* 1. CINEMATIC GAMEPLAY BACKGROUND VIDEO (ONLY VIDEO) */}
      <GameplayBackground />

      {/* 2. CENTER CONTENT: TITLE, SUBTITLE, SPEED & TOP PLAYER, START BUTTON */}
      <div className="relative z-20 max-w-4xl w-full mx-auto flex flex-col items-center text-center my-auto py-6 pointer-events-auto space-y-8">
        {/* Title & Subtitle */}
        <div className="space-y-3">
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-none drop-shadow-2xl">
            <span className="block text-white font-extrabold tracking-tight">PURE VELOCITY.</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent via-amber-400 to-accent-hover filter drop-shadow-[0_4px_24px_rgba(255,75,38,0.45)]">
              ZERO DELAY.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-white/70 max-w-lg mx-auto font-medium tracking-wide">
            Every clean keystroke accelerates raw horsepower. Type fast. Outrun the competition.
          </p>
        </div>

        {/* Component with Speed & Name of Top Player */}
        <div className="inline-flex items-center gap-6 sm:gap-8 px-6 py-3.5 rounded-2xl bg-surface/60 border border-white/15 backdrop-blur-2xl shadow-2xl">
          {/* Speed Indicator */}
          <div className="flex items-center gap-3 text-left">
            <Gauge className="w-5 h-5 text-accent shrink-0" />
            <div>
              <div className="text-lg sm:text-xl font-mono font-black text-white tabular-nums tracking-tight leading-none">
                {liveKmh} <span className="text-xs font-sans font-bold text-accent">KM/H</span>
              </div>
              <div className="text-[10px] font-mono text-white/50 tracking-wider mt-0.5">
                LIVE VELOCITY
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-white/15" />

          {/* Top Player Name */}
          <div className="flex items-center gap-3 text-left">
            <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] font-mono text-white/50 uppercase tracking-wider font-semibold">
                #1 TOP RACER
              </div>
              <div className="text-sm sm:text-base font-bold text-white leading-tight flex items-center gap-1.5 mt-0.5">
                <span>{topRacer.username}</span>
                <span className="text-amber-400 font-mono text-xs font-semibold">
                  ({topRacer.bestWpm} WPM)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Button of Start Race */}
        <div className="flex flex-col items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              audioEngine.playUiClick();
              onStartRace();
            }}
            className="relative group px-10 py-4 sm:px-14 sm:py-5 rounded-2xl bg-gradient-to-r from-accent via-accent-hover to-amber-500 text-white font-extrabold text-lg sm:text-xl tracking-wider shadow-[0_0_40px_rgba(255,75,38,0.55)] hover:shadow-[0_0_60px_rgba(255,75,38,0.8)] hover:scale-[1.04] active:scale-[0.98] transition-all flex items-center justify-center gap-3 overflow-hidden border border-white/25 cursor-pointer"
          >
            {/* Animated shimmer sweep */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white transition-transform group-hover:scale-110" />
            <span>START RACE</span>
            <span className="ml-1 px-2.5 py-0.5 rounded-md bg-black/30 border border-white/20 text-[11px] font-mono font-bold text-white/90 hidden sm:inline">
              SPACE
            </span>
          </button>

          {/* Keystroke Hint */}
          <div className="text-[11px] font-mono text-white/50 tracking-wider">
            PRESS <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white border border-white/20 font-bold">ENTER</kbd> OR <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white border border-white/20 font-bold">SPACE</kbd> TO LAUNCH
          </div>
        </div>
      </div>
    </div>
  );
};
