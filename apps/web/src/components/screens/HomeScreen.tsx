// apps/web/src/components/screens/HomeScreen.tsx
import React, { useState } from 'react';
import { Play, Trophy, Zap, ChevronRight, Gauge, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { CARS_DATA } from '../../data/cars.js';
import { Avatar } from '../common/Avatar.js';
import { audioEngine } from '../../audio/AudioEngine.js';

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
  const [activeCarPreview, setActiveCarPreview] = useState<number | null>(null);

  const top3Racers = leaderboard.slice(0, 3);

  // 3 showcase cars for the animation
  const showcaseCars = [
    {
      data: CARS_DATA['strada-r'] || CARS_DATA['scrapper-rust'],
      pos: '2ND',
      posColor: 'text-slate-300',
      posBg: 'bg-slate-500/20 border-slate-400/30',
      speedTag: '112 WPM',
      animClass: 'animate-car-2',
      scale: 'scale-95',
      glow: 'shadow-[0_10px_25px_rgba(201,22,36,0.3)]',
    },
    {
      data: CARS_DATA['apex-gtr'] || CARS_DATA['meridian-gt'],
      pos: '1ST',
      posColor: 'text-amber-400',
      posBg: 'bg-amber-500/20 border-amber-400/40',
      speedTag: '128 WPM',
      animClass: 'animate-car-1',
      scale: 'scale-110 z-10',
      glow: 'shadow-[0_15px_35px_rgba(255,75,38,0.4)]',
    },
    {
      data: CARS_DATA['cyclone-rs'] || CARS_DATA['volta-e'],
      pos: '3RD',
      posColor: 'text-amber-600',
      posBg: 'bg-amber-700/20 border-amber-600/30',
      speedTag: '104 WPM',
      animClass: 'animate-car-3',
      scale: 'scale-90',
      glow: 'shadow-[0_10px_25px_rgba(107,232,42,0.3)]',
    },
  ];

  return (
    <div className="relative w-full flex-1 flex flex-col items-center justify-between p-4 md:p-8 overflow-y-auto select-none font-sans">
      {/* Subtle radial ambient background glow */}
      <div className="absolute top-1/6 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-accent/10 blur-[130px] pointer-events-none rounded-full" />

      <div className="relative z-10 max-w-5xl w-full mx-auto flex flex-col items-center text-center my-auto py-6 space-y-10">
        {/* 1. HERO HEADER: Simple & Clean */}
        <div className="space-y-4 max-w-2xl mx-auto">
          {/* Subtle badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-subtle border border-accent/30 text-accent text-xs font-semibold tracking-wide backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span>FASTEST FINGERS WIN</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-text leading-tight">
            Pure Typing Velocity.
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent via-accent-hover to-amber-400">
              No Distractions.
            </span>
          </h1>

          <p className="text-base text-text-muted max-w-lg mx-auto leading-relaxed">
            Every keystroke drives raw acceleration. Pick your vehicle, test your typing speed against adaptive ghosts, and claim the leaderboard.
          </p>

          {/* Driver mini status */}
          <div className="pt-1">
            {currentUser ? (
              <div
                onClick={() => {
                  audioEngine.playUiClick();
                  if (onNavigateProfile) onNavigateProfile();
                }}
                className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface-2/70 hover:bg-surface-2 border border-border text-xs text-text-muted hover:text-text cursor-pointer transition-colors"
              >
                <Avatar seed={currentUser.username} size="sm" />
                <span>Driver: <strong className="text-text">{currentUser.username}</strong></span>
                <span className="text-accent font-mono font-semibold">({currentUser.points} PTS)</span>
              </div>
            ) : onOpenAuthModal ? (
              <button
                onClick={() => {
                  audioEngine.playUiClick();
                  onOpenAuthModal();
                }}
                className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors"
              >
                <span>Sign in to track points and unlock cars →</span>
              </button>
            ) : null}
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                audioEngine.playUiClick();
                onStartRace();
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-base shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 group"
            >
              <Play className="w-4 h-4 fill-white transition-transform group-hover:scale-110" />
              <span>Start Race</span>
            </button>

            {onNavigateLeaderboard && (
              <button
                onClick={() => {
                  audioEngine.playUiClick();
                  onNavigateLeaderboard();
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-surface-2/80 hover:bg-surface-2 border border-border text-text font-medium text-sm hover:border-accent/40 transition-all flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4 text-accent" />
                <span>Leaderboard</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. THREE CARS ANIMATION SHOWCASE */}
        <div className="w-full max-w-3xl mx-auto">
          <div className="relative rounded-2xl glass-panel border border-border/80 p-6 md:p-8 overflow-hidden shadow-2xl">
            {/* Animated Road Track in Background */}
            <div className="absolute inset-x-0 bottom-4 h-16 bg-surface-2/40 border-y border-border/60 overflow-hidden pointer-events-none flex items-center">
              {/* Moving road center dashed line */}
              <div className="w-[200%] h-[2px] bg-gradient-to-r from-transparent via-text-faint/30 to-transparent flex gap-6 animate-road">
                {Array.from({ length: 40 }).map((_, i) => (
                  <span key={i} className="inline-block w-8 h-[2px] bg-accent/40 shrink-0" />
                ))}
              </div>
            </div>

            {/* 3 Cars in Race Animation */}
            <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-6 items-end justify-center min-h-[160px] pb-6">
              {showcaseCars.map((item, idx) => (
                <div
                  key={item.data.id}
                  onMouseEnter={() => setActiveCarPreview(idx)}
                  onMouseLeave={() => setActiveCarPreview(null)}
                  className={`flex flex-col items-center cursor-pointer transition-all duration-300 ${item.animClass} ${item.scale}`}
                >
                  {/* Position Pill */}
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border mb-2 backdrop-blur-md ${item.posBg} ${item.posColor}`}
                  >
                    {item.pos}
                  </span>

                  {/* Car Sprite */}
                  <div className={`relative transition-transform duration-300 ${activeCarPreview === idx ? 'scale-110' : ''}`}>
                    <img
                      src={item.data.spriteUrl}
                      alt={item.data.name}
                      className={`h-16 sm:h-20 max-w-full object-contain filter drop-shadow-xl ${item.glow}`}
                    />
                  </div>

                  {/* Car Mini Label */}
                  <div className="mt-2 text-center">
                    <div className="text-xs font-semibold text-text truncate max-w-[120px]">
                      {item.data.name}
                    </div>
                    <div className="text-[10px] font-mono text-accent font-medium">
                      {item.speedTag}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtle Track Ribbon Bottom Notice */}
            <div className="pt-2 text-center text-xs text-text-faint">
              <span>Dynamic keystroke throttle · 3-round sprint racing</span>
            </div>
          </div>
        </div>

        {/* 3. BIT OF TOP PLAYERS (Minimal Podium Snippet) */}
        <div className="w-full max-w-3xl mx-auto space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
              <Trophy className="w-3.5 h-3.5 text-accent" />
              <span>Championship Top 3</span>
            </div>

            {onNavigateLeaderboard && (
              <button
                onClick={() => {
                  audioEngine.playUiClick();
                  onNavigateLeaderboard();
                }}
                className="text-xs text-accent hover:underline font-medium flex items-center gap-1 transition-colors"
              >
                <span>Full Leaderboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {top3Racers.map((racer, idx) => {
              const medalColors = [
                'border-amber-400/40 bg-amber-500/5 text-amber-400',
                'border-slate-300/40 bg-slate-500/5 text-slate-300',
                'border-amber-600/40 bg-amber-700/5 text-amber-600',
              ];
              const rankColor = medalColors[idx] || 'border-border text-text-muted';

              return (
                <div
                  key={racer.userId}
                  onClick={() => {
                    audioEngine.playUiClick();
                    if (onNavigateLeaderboard) onNavigateLeaderboard();
                  }}
                  className={`p-3.5 rounded-xl border glass-panel hover:border-accent/40 hover:bg-surface-2/60 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-sm ${
                    idx === 0 ? 'ring-1 ring-amber-400/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar seed={racer.avatarSeed} size="sm" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-text truncate">
                        {racer.username}
                      </div>
                      <div className="text-[10px] text-text-muted font-mono flex items-center gap-1.5">
                        <span className="text-accent font-semibold">{racer.totalPoints} PTS</span>
                        <span>·</span>
                        <span>{racer.bestWpm} WPM</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${rankColor}`}
                  >
                    #{idx + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. LIL STUFF: Clean, minimal feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-2/60 border border-border text-xs text-text-muted">
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span>Realtime Keystroke Throttle</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-2/60 border border-border text-xs text-text-muted">
            <Gauge className="w-3.5 h-3.5 text-accent" />
            <span>8 Unlockable Cars</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-2/60 border border-border text-xs text-text-muted">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Local SQLite Persistence</span>
          </div>
        </div>
      </div>
    </div>
  );
};
