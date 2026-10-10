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
      {/* 1. CINEMATIC GAMEPLAY BACKGROUND VIDEO */}
      <GameplayBackground />

      {/* 2. CENTER HERO AREA (ONLY 2 COMPONENTS: TELEMETRY BAR & START BUTTON) */}
      <div className="relative z-20 max-w-3xl w-full mx-auto flex flex-col items-center text-center my-auto py-8 pointer-events-auto space-y-8">
        
        {/* COMPONENT 1: SPEED & TOP RACER TELEMETRY BAR */}
        <div className="relative group inline-flex flex-col sm:flex-row items-center gap-5 sm:gap-8 px-6 py-4 sm:px-8 sm:py-4.5 rounded-3xl bg-[#0c101c]/80 hover:bg-[#0c101c]/90 border border-white/15 hover:border-white/25 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.65),0_0_1px_1px_rgba(255,255,255,0.08)] transition-all duration-300">
          {/* Subtle top specular reflection */}
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

          {/* Speed Indicator */}
          <div className="flex items-center gap-3.5 text-left">
            <div className="p-2.5 rounded-2xl bg-accent/15 border border-accent/30 text-accent shadow-[0_0_18px_rgba(255,75,38,0.25)] flex items-center justify-center shrink-0">
              <Gauge className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-mono font-black text-white tabular-nums tracking-tight leading-none drop-shadow-sm flex items-baseline">
                <span>{liveKmh}</span>
                <span className="text-xs font-sans font-extrabold text-accent ml-1.5 tracking-wider">KM/H</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono tracking-widest text-white/50 font-semibold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                <span>LIVE VELOCITY</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-10 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          <div className="w-full h-px bg-white/10 sm:hidden" />

          {/* Top Racer Indicator */}
          <div className="flex items-center gap-3.5 text-left">
            <div className="p-2.5 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.25)] flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400/90 font-bold">
                #1 TOP RACER
              </div>
              <div className="text-sm sm:text-base font-bold text-white leading-tight flex items-center gap-2 mt-0.5">
                <span className="max-w-[130px] sm:max-w-[170px] truncate">{topRacer.username}</span>
                <span className="px-2 py-0.5 rounded-lg bg-amber-400/15 border border-amber-400/30 font-mono text-xs font-bold text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.15)]">
                  {topRacer.bestWpm} WPM
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* COMPONENT 2: START RACE BUTTON & LAUNCH HINT */}
        <div className="flex flex-col items-center justify-center gap-3.5 pt-1">
          <button
            onClick={() => {
              audioEngine.playUiClick();
              onStartRace();
            }}
            className="relative group px-12 py-5 sm:px-16 sm:py-5.5 rounded-2xl bg-gradient-to-r from-accent via-[#ff5c29] to-amber-500 text-white font-extrabold text-xl sm:text-2xl tracking-wider shadow-[0_0_45px_rgba(255,75,38,0.55),0_12px_32px_rgba(0,0,0,0.5)] hover:shadow-[0_0_70px_rgba(255,75,38,0.85),0_16px_40px_rgba(255,75,38,0.4)] hover:scale-[1.04] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3.5 overflow-hidden border-t border-white/35 border-x border-white/20 border-b border-black/30 cursor-pointer"
          >
            {/* Animated shimmer sweep on hover */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

            <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-white transition-transform duration-300 group-hover:scale-110 group-hover:translate-x-0.5 drop-shadow-md" />
            <span className="drop-shadow-sm font-display tracking-wider uppercase">START RACE</span>
            <span className="ml-1.5 px-3 py-1 rounded-lg bg-black/35 border border-white/25 text-xs font-mono font-bold text-white shadow-inner hidden sm:inline-flex items-center">
              SPACE
            </span>
          </button>

          {/* Keystroke Launch Hint */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-white/55 tracking-wider uppercase">
            <span>PRESS</span>
            <kbd className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20 text-white font-mono font-bold shadow-sm">ENTER</kbd>
            <span className="text-white/30">OR</span>
            <kbd className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20 text-white font-mono font-bold shadow-sm">SPACE</kbd>
            <span>TO LAUNCH</span>
          </div>
        </div>

      </div>
    </div>
  );
};
