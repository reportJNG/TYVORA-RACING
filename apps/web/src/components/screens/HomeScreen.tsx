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

  // Dynamic tachometer bars (active count based on liveKmh)
  const activeBars = Math.min(6, Math.max(1, Math.round((liveKmh - 180) / 10)));

  return (
    <div className="relative w-full flex-1 flex flex-col justify-end items-center px-4 pt-4 pb-10 sm:pb-14 md:pb-16 min-h-[calc(100vh-56px)] select-none font-sans overflow-hidden">
      {/* 1. CINEMATIC GAMEPLAY BACKGROUND VIDEO */}
      <GameplayBackground />

      {/* 2. LOWER-THIRD COCKPIT HUD (EXACTLY 2 COMPONENTS: TELEMETRY BAR & START BUTTON) */}
      <div className="relative z-20 max-w-2xl w-full mx-auto flex flex-col items-center text-center pointer-events-auto space-y-5 sm:space-y-6">
        
        {/* COMPONENT 1: SPEED & TOP RACER TELEMETRY CLUSTER */}
        <div className="relative group w-full sm:w-auto inline-flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-8 px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl bg-[#090D17]/85 hover:bg-[#090D17]/95 border border-white/12 hover:border-white/20 backdrop-blur-3xl shadow-[0_16px_45px_rgba(0,0,0,0.7),0_0_1px_1px_rgba(255,255,255,0.06)] transition-all duration-300">
          {/* Top specular reflection line */}
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

          {/* Speed & Velocity Meter */}
          <div className="flex items-center gap-3.5 text-left">
            <div className="p-2.5 rounded-xl bg-accent/15 border border-accent/30 text-accent shadow-[0_0_16px_rgba(255,75,38,0.25)] flex items-center justify-center shrink-0">
              <Gauge className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 leading-none">
                <span className="text-2xl font-mono font-black text-white tabular-nums tracking-tight drop-shadow-sm">
                  {liveKmh}
                </span>
                <span className="text-xs font-sans font-extrabold text-accent tracking-wider">
                  KM/H
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                {/* Dynamic RPM / Velocity Segment Meter */}
                <div className="flex items-center gap-0.5">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-1.5 rounded-xs transition-colors duration-150 ${
                        i < activeBars
                          ? i >= 4
                            ? 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.9)]'
                            : 'bg-accent shadow-[0_0_5px_rgba(255,75,38,0.9)]'
                          : 'bg-white/15'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono tracking-widest text-white/50 font-semibold uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  <span>VELOCITY</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vertical Divider (Desktop) / Horizontal Divider (Mobile) */}
          <div className="hidden sm:block h-9 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          <div className="w-full h-px bg-white/10 sm:hidden" />

          {/* Top Racer Indicator */}
          <div className="flex items-center gap-3.5 text-left">
            <div className="p-2.5 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.25)] flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400/90 font-bold">
                #1 TOP RACER
              </div>
              <div className="text-sm sm:text-base font-bold text-white leading-tight flex items-center gap-2 mt-1">
                <span className="max-w-[120px] sm:max-w-[160px] truncate">{topRacer.username}</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/30 font-mono text-xs font-bold text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.2)]">
                  {topRacer.bestWpm} WPM
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* COMPONENT 2: START RACE BUTTON & LAUNCH HINT */}
        <div className="flex flex-col items-center justify-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              audioEngine.playUiClick();
              onStartRace();
            }}
            className="relative group w-full sm:w-auto min-w-[280px] sm:min-w-[340px] px-10 py-4.5 sm:px-14 sm:py-5 rounded-2xl bg-gradient-to-r from-accent via-[#ff5a27] to-amber-500 text-white font-extrabold text-xl sm:text-2xl tracking-wider shadow-[0_0_45px_rgba(255,75,38,0.5),0_12px_28px_rgba(0,0,0,0.55)] hover:shadow-[0_0_70px_rgba(255,75,38,0.8),0_16px_36px_rgba(255,75,38,0.4)] hover:scale-[1.03] active:scale-[0.98] active:translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-3.5 overflow-hidden border-t border-white/35 border-x border-white/20 border-b border-black/35 cursor-pointer"
          >
            {/* Top glass gloss reflection */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none rounded-t-2xl" />

            {/* Animated shimmer sweep on hover */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

            {/* Glowing circular icon container */}
            <div className="w-8 h-8 rounded-full bg-black/25 border border-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Play className="w-4 h-4 fill-white ml-0.5" />
            </div>

            <span className="drop-shadow-md font-display tracking-wider uppercase font-black">
              START RACE
            </span>

            {/* Space hotkey pill */}
            <span className="ml-1 px-2.5 py-0.5 rounded-md bg-black/35 border border-white/20 text-xs font-mono font-bold text-white/95 shadow-inner hidden sm:inline-flex items-center">
              SPACE
            </span>
          </button>

          {/* Keystroke Launch Hint */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-white/50 tracking-wider uppercase">
            <span>PRESS</span>
            <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/20 text-white font-mono font-bold shadow-sm">ENTER</kbd>
            <span className="text-white/30">OR</span>
            <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/20 text-white font-mono font-bold shadow-sm">SPACE</kbd>
            <span>TO LAUNCH</span>
          </div>
        </div>

      </div>
    </div>
  );
};
