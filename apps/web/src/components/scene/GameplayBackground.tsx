// apps/web/src/components/scene/GameplayBackground.tsx
import React, { useEffect, useRef, useState } from 'react';

export interface GameplayBackgroundProps {
  onVideoLoaded?: () => void;
  className?: string;
}

export const GameplayBackground: React.FC<GameplayBackgroundProps> = ({
  onVideoLoaded,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Autoplay management
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
  }, []);

  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none ${className}`}>
      {/* 1. CINEMATIC VIDEO BACKGROUND LAYER */}
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

      {/* 2. BALANCED CINEMATIC OVERLAYS (ENHANCED FOR VIBRANT POP) */}
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
    </div>
  );
};
