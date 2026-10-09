// apps/web/src/components/scene/GameplayBackground.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Eye, Sparkles, Radio } from 'lucide-react';
import { audioEngine } from '../../audio/AudioEngine.js';
import { ShowroomCanvas } from './ShowroomCanvas.js';
import { useRaceStore } from '../../stores/useRaceStore.js';

export interface GameplayBackgroundProps {
  onVideoLoaded?: () => void;
  className?: string;
}

export const GameplayBackground: React.FC<GameplayBackgroundProps> = ({
  onVideoLoaded,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [soundActive, setSoundActive] = useState(false);
  const [viewMode, setViewMode] = useState<'video' | 'live3d'>('video');
  const selectedCarId = useRaceStore((state) => state.selectedCarId);

  // Autoplay management
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [viewMode]);

  // Audio simulation sync when user toggles sound
  useEffect(() => {
    let animId: number;
    if (soundActive) {
      audioEngine.init();
      audioEngine.startEngine();

      let phase = 0;
      const tick = () => {
        phase += 0.035;
        // Oscillate RPM to mimic aggressive acceleration and gear shifts in video
        const simulatedSpeed = 220 + Math.sin(phase) * 55 + Math.cos(phase * 2.4) * 20;
        audioEngine.updateEngineRpm(simulatedSpeed, Math.cos(phase) > -0.2);
        animId = requestAnimationFrame(tick);
      };
      animId = requestAnimationFrame(tick);
    } else {
      audioEngine.stopEngine();
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      audioEngine.stopEngine();
    };
  }, [soundActive]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    audioEngine.playUiClick();

    if (video.paused) {
      video.play().then(() => setIsPlaying(true));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleSound = () => {
    audioEngine.playUiClick();
    setSoundActive((prev) => !prev);
  };

  const toggleViewMode = () => {
    audioEngine.playUiClick();
    setViewMode((prev) => (prev === 'video' ? 'live3d' : 'video'));
  };

  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none ${className}`}>
      {/* 1. CINEMATIC VIDEO BACKGROUND LAYER */}
      {viewMode === 'video' ? (
        <div className="absolute inset-0 w-full h-full">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/assets/videos/gameplay-poster.jpg"
            onLoadedData={() => {
              setIsLoaded(true);
              if (onVideoLoaded) onVideoLoaded();
            }}
            className={`w-full h-full object-cover transition-opacity duration-1000 ${
              isLoaded ? 'opacity-100' : 'opacity-85'
            }`}
          >
            <source src="/assets/videos/gameplay-bg.mp4" type="video/mp4" />
            <source src="/assets/videos/gameplay-bg.webm" type="video/webm" />
          </video>
        </div>
      ) : (
        /* 2. INTERACTIVE 3D VEHICLE & TURNTABLE MODE */
        <div className="absolute inset-0 w-full h-full pointer-events-auto bg-[#070B16]">
          <ShowroomCanvas selectedCarId={selectedCarId || 'apex-gtr'} />
        </div>
      )}

      {/* 3. BALANCED CINEMATIC OVERLAYS (ENHANCED FOR VIBRANT POP) */}
      {/* Soft Vignette - preserves vibrant center cars while framing content */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 100% 88% at 50% 50%, rgba(7, 10, 18, 0.0) 0%, rgba(7, 10, 18, 0.25) 55%, rgba(7, 10, 18, 0.82) 100%)',
        }}
      />

      {/* Subtle Top & Bottom Gradient Bleeds for Header & Navigation integration */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#0B0E14] via-[#0B0E14]/65 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/80 to-transparent pointer-events-none" />

      {/* High-tech Subtle Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Ambient Neon Accent Glow in Center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-accent/15 blur-[130px] pointer-events-none rounded-full" />

      {/* 4. DISCREET TELEMETRY BADGES (Top Left & Bottom Left) */}
      <div className="absolute top-20 left-6 z-20 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/50 border border-white/10 backdrop-blur-xl text-[11px] font-mono text-white/70">
        <Radio className="w-3 h-3 text-accent animate-pulse" />
        <span className="font-semibold text-white">LIVE BROADCAST</span>
        <span className="text-white/40">|</span>
        <span className="text-cyan-400">60 FPS</span>
      </div>

      <div className="absolute bottom-6 left-6 z-20 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/50 border border-white/10 backdrop-blur-xl text-[11px] font-mono text-white/60">
        <span className="text-accent font-bold">CIRCUIT:</span>
        <span>NEO TOKYO EXPRESSWAY</span>
      </div>

      {/* 5. FLOATING MEDIA CONTROLS (Bottom Right) */}
      <div className="absolute bottom-6 right-6 z-30 pointer-events-auto flex items-center gap-2">
        {/* View Mode Toggle (Video vs 3D) */}
        <button
          onClick={toggleViewMode}
          title={viewMode === 'video' ? 'Switch to Live 3D Scene' : 'Switch to Cinematic Broadcast'}
          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface/75 hover:bg-surface border border-white/10 hover:border-accent/40 text-text-muted hover:text-white backdrop-blur-xl shadow-xl transition-all text-xs font-mono"
        >
          {viewMode === 'video' ? (
            <>
              <Eye className="w-3.5 h-3.5 text-accent group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">3D View</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Broadcast</span>
            </>
          )}
        </button>

        {/* Engine Sound Toggle */}
        <button
          onClick={toggleSound}
          title={soundActive ? 'Mute Engine Roar' : 'Unmute Engine Roar'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-xl shadow-xl transition-all text-xs font-mono ${
            soundActive
              ? 'bg-accent/20 border-accent/60 text-accent font-semibold shadow-[0_0_15px_rgba(255,75,38,0.4)]'
              : 'bg-surface/75 hover:bg-surface border-white/10 text-text-muted hover:text-white'
          }`}
        >
          {soundActive ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span className="hidden sm:inline">Exhaust: ON</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-text-faint" />
              <span className="hidden sm:inline">Exhaust: OFF</span>
            </>
          )}
        </button>

        {/* Video Play / Pause (only if in video mode) */}
        {viewMode === 'video' && (
          <button
            onClick={togglePlay}
            title={isPlaying ? 'Pause Background Video' : 'Play Background Video'}
            className="w-8 h-8 rounded-full bg-surface/75 hover:bg-surface border border-white/10 hover:border-accent/40 text-text-muted hover:text-white backdrop-blur-xl shadow-xl flex items-center justify-center transition-all cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
