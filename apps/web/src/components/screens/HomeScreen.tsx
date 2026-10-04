// apps/web/src/components/screens/HomeScreen.tsx
import React, { useEffect } from 'react';
import { Play, ChevronLeft, ChevronRight, Compass, Wrench } from 'lucide-react';
import { Difficulty } from '@typerace/sim';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { useRaceStore } from '../../stores/useRaceStore.js';
import { CARS_DATA, CARS_LIST } from '../../data/cars.js';
import { TRACKS_DATA, TRACKS_LIST } from '../../data/tracks.js';
import { ShowroomCanvas } from '../scene/ShowroomCanvas.js';
import { Stars } from '../common/Stars.js';
import { Button } from '../common/Button.js';
import { audioEngine } from '../../audio/AudioEngine.js';

export interface HomeScreenProps {
  onTryGame?: () => void;
  onStartRace?: () => void;
  onOpenGarage?: () => void;
  onNavigateProfile?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onTryGame,
  onStartRace,
  onOpenGarage,
  onNavigateProfile,
}) => {
  const { stats, currentUser } = useAuthStore();
  const {
    selectedCarId,
    selectedTrackId,
    customPaintColor,
    difficulty,
    selectCar,
    selectTrack,
    setCustomPaintColor,
    selectDifficulty,
  } = useRaceStore();

  const currentCar = CARS_DATA[selectedCarId] || CARS_LIST[0];
  const carIndex = CARS_LIST.findIndex((c) => c.id === currentCar.id);

  const currentTrack = TRACKS_DATA[selectedTrackId] || TRACKS_LIST[0];
  const trackIndex = TRACKS_LIST.findIndex((t) => t.id === currentTrack.id);

  const handleStartRace = () => {
    if (onStartRace) {
      onStartRace();
    } else if (onTryGame) {
      onTryGame();
    }
  };

  const handleOpenGarage = () => {
    if (onOpenGarage) {
      onOpenGarage();
    } else if (onTryGame) {
      onTryGame();
    }
  };

  const handlePrevCar = () => {
    audioEngine.playUiClick();
    const nextIdx = (carIndex - 1 + CARS_LIST.length) % CARS_LIST.length;
    selectCar(CARS_LIST[nextIdx].id);
    setCustomPaintColor(null);
  };

  const handleNextCar = () => {
    audioEngine.playUiClick();
    const nextIdx = (carIndex + 1) % CARS_LIST.length;
    selectCar(CARS_LIST[nextIdx].id);
    setCustomPaintColor(null);
  };

  const handleCycleTrack = () => {
    audioEngine.playUiClick();
    const nextIdx = (trackIndex + 1) % TRACKS_LIST.length;
    selectTrack(TRACKS_LIST[nextIdx].id);
  };

  // Keyboard navigation on Home Hub
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowLeft') {
        handlePrevCar();
      } else if (e.key === 'ArrowRight') {
        handleNextCar();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleStartRace();
      } else if (e.key === 'g' || e.key === 'G') {
        handleOpenGarage();
      } else if (e.key === 't' || e.key === 'T') {
        handleCycleTrack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carIndex, trackIndex, onStartRace, onTryGame]);

  const difficulties: { id: Difficulty; label: string; target: string }[] = [
    { id: 'easy', label: 'Casual', target: '~45 WPM' },
    { id: 'normal', label: 'Standard', target: '~70 WPM' },
    { id: 'hard', label: 'Pro', target: '~95 WPM' },
    { id: 'extreme', label: 'Max', target: '~118 WPM' },
  ];

  return (
    <div className="relative w-full h-[calc(100vh-56px)] flex flex-col justify-between p-4 md:p-6 select-none overflow-hidden bg-bg racing-grid">
      {/* 3D INTERACTIVE SHOWROOM CANVAS CENTERPIECE */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <ShowroomCanvas
          selectedCarId={currentCar.id}
          colorOverride={customPaintColor || undefined}
        />
      </div>

      {/* TOP FLOATING HUD ROW */}
      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pointer-events-none">
        {/* Left: Machine Dossier */}
        <div className="pointer-events-auto p-3.5 md:p-4 rounded-[6px] glass-panel max-w-xs md:max-w-sm w-full transition-all shadow-xl">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-display uppercase tracking-widest text-accent font-bold">
                CLASS // {currentCar.category}
              </span>
              <span className="text-[10px] text-text-faint font-display uppercase">
                {carIndex + 1}/{CARS_LIST.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevCar}
                aria-label="Previous Vehicle"
                className="w-6 h-6 rounded bg-surface-2 hover:bg-accent hover:text-accent-contrast flex items-center justify-center text-text-muted transition-colors border border-border"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNextCar}
                aria-label="Next Vehicle"
                className="w-6 h-6 rounded bg-surface-2 hover:bg-accent hover:text-accent-contrast flex items-center justify-center text-text-muted transition-colors border border-border"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-wider text-text leading-tight mb-2">
            {currentCar.name}
          </h2>

          <div className="space-y-1.5 pt-2 border-t border-border/80">
            <div className="flex items-center justify-between text-[11px] font-display uppercase tracking-wider">
              <span className="text-text-muted">Speed</span>
              <Stars count={currentCar.stars.topSpeed} />
            </div>
            <div className="flex items-center justify-between text-[11px] font-display uppercase tracking-wider">
              <span className="text-text-muted">Acceleration</span>
              <Stars count={currentCar.stars.acceleration} />
            </div>
            <div className="flex items-center justify-between text-[11px] font-display uppercase tracking-wider">
              <span className="text-text-muted">Handling</span>
              <Stars count={currentCar.stars.control} />
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[10px] font-display uppercase tracking-wider text-text-faint">
            <span>{currentCar.displaySpecs.topSpeedKph} KM/H TOP</span>
            <span>0-100 {currentCar.displaySpecs.zeroToHundredSec}S</span>
          </div>
        </div>

        {/* Right: Circuit & Difficulty */}
        <div className="pointer-events-auto p-3.5 md:p-4 rounded-[6px] glass-panel max-w-xs md:max-w-sm w-full transition-all shadow-xl">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-display uppercase tracking-widest text-accent font-bold">
              <Compass className="w-3 h-3 text-accent" />
              <span>CIRCUIT</span>
            </div>
            <button
              onClick={handleCycleTrack}
              className="text-[10px] font-display uppercase tracking-wider text-text-muted hover:text-accent transition-colors underline"
            >
              Switch Circuit
            </button>
          </div>

          <h3 className="text-xl md:text-2xl font-display font-bold uppercase tracking-wider text-text leading-tight">
            {currentTrack.name}
          </h3>
          <div className="text-[11px] font-display uppercase tracking-wider text-text-muted mt-0.5 mb-3">
            {currentTrack.timeOfDay} · {currentTrack.weather}
          </div>

          {/* Difficulty selector tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 rounded bg-surface-2 border border-border text-center">
            {difficulties.map((d) => {
              const isSelected = difficulty === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => {
                    audioEngine.playUiClick();
                    selectDifficulty(d.id);
                  }}
                  className={`py-1 rounded text-[10px] font-display uppercase tracking-wider transition-all ${
                    isSelected
                      ? 'bg-accent text-accent-contrast font-bold shadow-sm'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  <span className="block leading-tight">{d.label}</span>
                  <span className="block text-[8px] opacity-75">{d.target}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM CONTROLS & LAUNCH ACTION */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center gap-3">
        {/* Primary Action Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="primary"
            size="lg"
            onClick={handleStartRace}
            className="w-full sm:w-72 h-14 text-xl tracking-widest flex items-center justify-center gap-3 shadow-2xl group"
          >
            <Play className="w-5 h-5 fill-accent-contrast transition-transform group-hover:scale-110" />
            <span>START RACE</span>
            <span className="hidden sm:inline-block text-[11px] opacity-80 font-mono tracking-normal ml-1">
              [ENTER]
            </span>
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={handleOpenGarage}
            className="hidden sm:flex items-center gap-2 text-xs tracking-wider"
            title="Open Garage & Custom Paint"
          >
            <Wrench className="w-4 h-4 text-accent" />
            <span>GARAGE</span>
          </Button>
        </div>

        {/* Minimal High-Signal Telemetry Footer */}
        <div className="w-full max-w-lg flex items-center justify-between text-[11px] font-display uppercase tracking-widest text-text-faint px-3 py-1.5 rounded-[4px] bg-surface/50 border border-border/40 backdrop-blur-sm">
          {stats.totalRaces > 0 ? (
            <button
              onClick={onNavigateProfile}
              className="hover:text-text text-left transition-colors flex items-center gap-2"
            >
              <span className="text-text-muted font-bold">
                {currentUser?.username || 'DRIVER'}
              </span>
              <span>//</span>
              <span className="text-accent font-bold">{stats.wins} WINS</span>
              <span>·</span>
              <span>BEST {stats.bestWpm} WPM</span>
            </button>
          ) : (
            <span>CLEAN TYPING DIRECTS ENGINE VELOCITY</span>
          )}

          <div className="flex items-center gap-2 text-[10px]">
            <span>[← / →] CAR</span>
            <span>·</span>
            <span>[T] CIRCUIT</span>
          </div>
        </div>
      </div>
    </div>
  );
};
