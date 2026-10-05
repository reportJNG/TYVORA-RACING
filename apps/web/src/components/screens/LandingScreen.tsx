// apps/web/src/components/screens/LandingScreen.tsx
import React, { useEffect } from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../common/Button.js';
import { ShowroomCanvas } from '../scene/ShowroomCanvas.js';
import { useRaceStore } from '../../stores/useRaceStore.js';
import { CARS_DATA, CARS_LIST } from '../../data/cars.js';
import { Stars } from '../common/Stars.js';
import { audioEngine } from '../../audio/AudioEngine.js';

export interface LandingScreenProps {
  onPlay: () => void;
  onLogin: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onPlay, onLogin }) => {
  const { selectedCarId, selectCar } = useRaceStore();

  const currentCar = CARS_DATA[selectedCarId] || CARS_DATA['scrapper-rust'];
  const carIndex = CARS_LIST.findIndex((c) => c.id === currentCar.id);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowLeft') {
        handlePrevCar();
      } else if (e.key === 'ArrowRight') {
        handleNextCar();
      } else if (e.key === 'Enter') {
        audioEngine.playUiClick();
        onPlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carIndex, onPlay]);

  return (
    <div className="relative min-h-[calc(100vh-56px)] w-full flex flex-col justify-between items-center p-4 md:p-8 text-center select-none overflow-hidden bg-bg font-sans">
      {/* 3D Interactive WebGL Showroom Canvas */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-auto">
        <ShowroomCanvas selectedCarId={currentCar.id} />
      </div>

      {/* Ambient Radial Accent Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-accent/15 blur-[120px] pointer-events-none rounded-full" />

      {/* TOP HEADER: MINIMAL TITLE */}
      <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-subtle border border-accent/40 text-accent text-xs font-semibold tracking-wide mb-3 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span>MINIMAL TYPING MOTORSPORT</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-text leading-tight drop-shadow-lg">
          TYVORA<span className="text-accent">·</span>RACING
        </h1>

        <p className="mt-2 text-sm md:text-base text-text-muted">
          Clean keystrokes accelerate directly. Zero steering. Pure velocity.
        </p>
      </div>

      {/* CENTER INTERACTIVE CAR PREVIEW & SWITCHER */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between pointer-events-none my-auto">
        <button
          onClick={handlePrevCar}
          className="pointer-events-auto w-11 h-11 rounded-full bg-surface/85 hover:bg-surface-2 border border-border text-text hover:text-accent shadow-xl backdrop-blur-md flex items-center justify-center transition-all active:scale-95"
          aria-label="Previous Car"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Vehicle spec badge */}
        <div className="pointer-events-auto flex flex-col items-center gap-2">
          <div className="px-5 py-2.5 rounded-2xl glass-panel border border-border/80 shadow-2xl flex items-center gap-3 backdrop-blur-md">
            <span className="text-base font-bold text-text">
              {currentCar.name}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-subtle border border-accent/30 text-accent">
              {currentCar.category}
            </span>
            <span className="text-text-faint text-xs">·</span>
            <span className="text-xs font-mono text-text-muted">
              {currentCar.displaySpecs.topSpeedKph} KM/H
            </span>
            <span className="text-text-faint text-xs">·</span>
            <Stars count={currentCar.stars.topSpeed} />
          </div>
        </div>

        <button
          onClick={handleNextCar}
          className="pointer-events-auto w-11 h-11 rounded-full bg-surface/85 hover:bg-surface-2 border border-border text-text hover:text-accent shadow-xl backdrop-blur-md flex items-center justify-center transition-all active:scale-95"
          aria-label="Next Car"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* BOTTOM ACTIONS */}
      <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center gap-4 pb-4">
        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Button
            variant="primary"
            size="lg"
            onClick={onPlay}
            className="w-full sm:w-56"
          >
            <Play className="w-4 h-4 fill-white mr-2" />
            <span>Enter Race</span>
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={onLogin}
            className="w-full sm:w-36"
          >
            Sign In
          </Button>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2/70 border border-border backdrop-blur-md text-xs text-text-faint">
          <span>Instant Keystroke Throttle</span>
          <span>·</span>
          <span>8 Tuned Vehicles</span>
        </div>
      </div>
    </div>
  );
};
