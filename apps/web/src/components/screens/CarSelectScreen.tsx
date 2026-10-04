// apps/web/src/components/screens/CarSelectScreen.tsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Palette, MapPin, Compass } from 'lucide-react';
import { Difficulty } from '@typerace/sim';
import { useRaceStore } from '../../stores/useRaceStore.js';
import { CARS_DATA, CARS_LIST, PAINT_PALETTE } from '../../data/cars.js';
import { TRACKS_DATA, TRACKS_LIST } from '../../data/tracks.js';
import { ShowroomCanvas } from '../scene/ShowroomCanvas.js';
import { Stars } from '../common/Stars.js';
import { Button } from '../common/Button.js';
import { audioEngine } from '../../audio/AudioEngine.js';

export interface CarSelectScreenProps {
  onStartRace: () => void;
  onBack: () => void;
}

export const CarSelectScreen: React.FC<CarSelectScreenProps> = ({ onStartRace, onBack }) => {
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

  const [activeTab, setActiveTab] = useState<'cars' | 'tracks'>('cars');

  const currentCar = CARS_DATA[selectedCarId] || CARS_LIST[0];
  const carIndex = CARS_LIST.findIndex((c) => c.id === currentCar.id);

  const currentTrack = TRACKS_DATA[selectedTrackId] || TRACKS_LIST[0];
  const trackIndex = TRACKS_LIST.findIndex((t) => t.id === currentTrack.id);

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

  const handlePrevTrack = () => {
    audioEngine.playUiClick();
    const nextIdx = (trackIndex - 1 + TRACKS_LIST.length) % TRACKS_LIST.length;
    selectTrack(TRACKS_LIST[nextIdx].id);
  };

  const handleNextTrack = () => {
    audioEngine.playUiClick();
    const nextIdx = (trackIndex + 1) % TRACKS_LIST.length;
    selectTrack(TRACKS_LIST[nextIdx].id);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowLeft') {
        if (activeTab === 'cars') handlePrevCar();
        else handlePrevTrack();
      } else if (e.key === 'ArrowRight') {
        if (activeTab === 'cars') handleNextCar();
        else handleNextTrack();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setActiveTab((prev) => (prev === 'cars' ? 'tracks' : 'cars'));
      } else if (e.key === 'Enter') {
        onStartRace();
      } else if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carIndex, trackIndex, activeTab, onStartRace, onBack]);

  const difficulties: { id: Difficulty; label: string; target: string }[] = [
    { id: 'easy', label: 'Casual', target: '~45 WPM' },
    { id: 'normal', label: 'Standard', target: '~70 WPM' },
    { id: 'hard', label: 'Pro', target: '~95 WPM' },
    { id: 'extreme', label: 'Max', target: '~118 WPM' },
  ];

  return (
    <div className="relative w-full h-[calc(100vh-56px)] flex flex-col justify-between p-4 md:p-6 select-none overflow-hidden bg-bg racing-grid">
      {/* TOP HEADER: NAVIGATION, TAB SWITCHER & SELECTED DETAILS */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 z-10 max-w-7xl w-full mx-auto">
        <div>
          <button
            onClick={onBack}
            className="text-[11px] font-display uppercase tracking-widest text-text-muted hover:text-text mb-2 transition-colors flex items-center gap-1.5"
          >
            <span>←</span>
            <span>Return to Race Hub</span>
          </button>

          {/* TAB TOGGLE: CARS VS TRACKS */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => {
                audioEngine.playUiClick();
                setActiveTab('cars');
              }}
              className={`px-3 py-1 rounded text-xs font-display uppercase tracking-widest font-bold transition-all border ${
                activeTab === 'cars'
                  ? 'bg-accent text-accent-contrast border-accent shadow-sm'
                  : 'bg-surface-2 text-text-muted border-border hover:text-text'
              }`}
            >
              Vehicles ({CARS_LIST.length})
            </button>
            <button
              onClick={() => {
                audioEngine.playUiClick();
                setActiveTab('tracks');
              }}
              className={`px-3 py-1 rounded text-xs font-display uppercase tracking-widest font-bold transition-all border ${
                activeTab === 'tracks'
                  ? 'bg-accent text-accent-contrast border-accent shadow-sm'
                  : 'bg-surface-2 text-text-muted border-border hover:text-text'
              }`}
            >
              Circuits ({TRACKS_LIST.length})
            </button>
          </div>

          {activeTab === 'cars' ? (
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider text-text">
                  {currentCar.name}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-display uppercase tracking-widest font-bold bg-accent/15 border border-accent/30 text-accent">
                  {currentCar.category}
                </span>
              </div>
              <p className="text-xs font-display text-text-muted uppercase tracking-wider mt-0.5">
                {currentCar.bodyStyle} // {currentCar.tagline}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-wider text-text">
                  {currentTrack.name}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-display uppercase tracking-widest font-bold bg-accent/15 border border-accent/30 text-accent">
                  {currentTrack.difficulty}
                </span>
              </div>
              <p className="text-xs font-display text-text-muted uppercase tracking-wider mt-0.5 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-accent" />
                <span>{currentTrack.location}</span> · <span>{currentTrack.timeOfDay}</span>
              </p>
            </div>
          )}
        </div>

        {/* RIGHT SIDE DETAILS / STATS CARD */}
        {activeTab === 'cars' ? (
          <div className="w-full md:w-80 p-3.5 rounded-[6px] glass-panel space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between text-xs font-display uppercase tracking-wider">
              <span className="text-text-muted">Acceleration</span>
              <Stars count={currentCar.stars.acceleration} />
            </div>
            <div className="flex items-center justify-between text-xs font-display uppercase tracking-wider">
              <span className="text-text-muted">Top Speed</span>
              <Stars count={currentCar.stars.topSpeed} />
            </div>
            <div className="flex items-center justify-between text-xs font-display uppercase tracking-wider">
              <span className="text-text-muted">Handling</span>
              <Stars count={currentCar.stars.control} />
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] font-display uppercase tracking-wider text-text-faint">
              <span>{currentCar.displaySpecs.topSpeedKph} KM/H TOP</span>
              <span>0-100 {currentCar.displaySpecs.zeroToHundredSec}S</span>
            </div>

            {/* PAINT COLOR CUSTOMIZER SWATCHES */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-1.5 text-[10px] font-display uppercase tracking-wider text-text-muted mb-1.5">
                <Palette className="w-3 h-3 text-accent" />
                <span>Custom Livery Finish</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {PAINT_PALETTE.map((color) => {
                  const isCurrent =
                    (customPaintColor || currentCar.primaryColor).toLowerCase() ===
                    color.hex.toLowerCase();
                  return (
                    <button
                      key={color.id}
                      onClick={() => {
                        audioEngine.playUiClick();
                        setCustomPaintColor(color.hex);
                      }}
                      title={color.name}
                      className={`w-5 h-5 rounded-full border transition-all ${
                        isCurrent
                          ? 'border-accent scale-110 shadow-md ring-2 ring-accent/50'
                          : 'border-border/60 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full md:w-80 p-3.5 rounded-[6px] glass-panel space-y-2 shadow-xl">
            <div className="text-[10px] font-display uppercase tracking-widest text-accent font-bold flex items-center gap-1.5">
              <Compass className="w-3 h-3 text-accent" />
              <span>CIRCUIT CONDITIONS</span>
            </div>
            <p className="text-xs text-text">{currentTrack.tagline}</p>
            <div className="pt-2 border-t border-border grid grid-cols-2 gap-2 text-xs font-display uppercase tracking-wider text-text-muted">
              <div>
                <span className="block text-[10px] text-text-faint">Weather</span>
                <span className="text-text font-bold">{currentTrack.weather}</span>
              </div>
              <div>
                <span className="block text-[10px] text-text-faint">Lighting</span>
                <span className="text-text font-bold">{currentTrack.timeOfDay}</span>
              </div>
              <div>
                <span className="block text-[10px] text-text-faint">Terrain</span>
                <span className="text-text font-bold capitalize">{currentTrack.scenery.terrainType}</span>
              </div>
              <div>
                <span className="block text-[10px] text-text-faint">Surface</span>
                <span className="text-text font-bold">{currentTrack.difficulty}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3D INTERACTIVE SHOWROOM / PREVIEW */}
      <div className="relative flex-1 w-full my-1 flex items-center justify-center min-h-[280px]">
        {/* Previous Button */}
        <button
          onClick={activeTab === 'cars' ? handlePrevCar : handlePrevTrack}
          className="absolute left-2 md:left-6 z-20 p-2.5 rounded-full bg-surface-2/80 hover:bg-surface border border-border text-text hover:text-accent shadow-lg transition-all"
          aria-label="Previous selection"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* 3D Canvas or Map Showcase */}
        {activeTab === 'cars' ? (
          <div className="w-full h-full max-w-5xl">
            <ShowroomCanvas
              selectedCarId={currentCar.id}
              colorOverride={customPaintColor || undefined}
            />
          </div>
        ) : (
          <div className="w-full h-full max-w-2xl flex items-center justify-center p-4">
            <div className="w-full rounded-[8px] border border-border glass-panel p-6 shadow-2xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center border border-accent/40 shadow-inner"
                  style={{ backgroundColor: currentTrack.road.asphaltColor }}
                >
                  <MapPin className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-2xl font-display font-bold uppercase tracking-wider text-text">
                  {currentTrack.name}
                </h3>
                <p className="text-xs text-text-muted max-w-md leading-relaxed">
                  {currentTrack.tagline}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-2.5 py-1 rounded bg-surface-2 border border-border text-[10px] font-display uppercase tracking-wider text-text font-bold">
                    {currentTrack.weather}
                  </span>
                  <span className="px-2.5 py-1 rounded bg-surface-2 border border-border text-[10px] font-display uppercase tracking-wider text-text font-bold">
                    {currentTrack.timeOfDay}
                  </span>
                  <span className="px-2.5 py-1 rounded bg-accent/15 border border-accent/30 text-[10px] font-display uppercase tracking-wider text-accent font-bold">
                    {currentTrack.scenery.terrainType}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Next Button */}
        <button
          onClick={activeTab === 'cars' ? handleNextCar : handleNextTrack}
          className="absolute right-2 md:right-6 z-20 p-2.5 rounded-full bg-surface-2/80 hover:bg-surface border border-border text-text hover:text-accent shadow-lg transition-all"
          aria-label="Next selection"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* BOTTOM CONTROLS: CARDS CAROUSEL, DIFFICULTY & LAUNCH */}
      <div className="z-10 max-w-7xl w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-4 pt-3 border-t border-border">
        {/* CARDS LIST CAROUSEL */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
          {activeTab === 'cars'
            ? CARS_LIST.map((c) => {
                const isSelected = c.id === currentCar.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      audioEngine.playUiClick();
                      selectCar(c.id);
                      setCustomPaintColor(null);
                    }}
                    className={`px-3 py-1.5 rounded-[4px] text-left transition-all font-display uppercase tracking-wider border whitespace-nowrap flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-accent/15 border-accent text-text font-bold shadow-[0_0_10px_rgba(255,85,28,0.25)]'
                        : 'bg-surface-2 border-border text-text-muted hover:text-text'
                    }`}
                  >
                    {c.spriteUrl ? (
                      <div className="w-5 h-8 flex items-center justify-center shrink-0">
                        <img
                          src={c.spriteUrl}
                          alt={c.name}
                          className="max-h-8 max-w-5 object-contain"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>
                    ) : (
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: c.primaryColor }}
                      />
                    )}
                    <div>
                      <div className="text-xs">{c.name}</div>
                      <div className="text-[9px] text-text-faint">{c.category}</div>
                    </div>
                  </button>
                );
              })
            : TRACKS_LIST.map((t) => {
                const isSelected = t.id === currentTrack.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      audioEngine.playUiClick();
                      selectTrack(t.id);
                    }}
                    className={`px-3 py-1.5 rounded-[4px] text-left transition-all font-display uppercase tracking-wider border whitespace-nowrap ${
                      isSelected
                        ? 'bg-accent/15 border-accent text-text font-bold shadow-[0_0_10px_rgba(255,85,28,0.25)]'
                        : 'bg-surface-2 border-border text-text-muted hover:text-text'
                    }`}
                  >
                    <div className="text-xs">{t.name}</div>
                    <div className="text-[9px] text-text-faint">{t.timeOfDay}</div>
                  </button>
                );
              })}
        </div>

        {/* Difficulty Selector */}
        <div className="flex items-center bg-surface-2 rounded-[4px] p-1 border border-border">
          {difficulties.map((d) => {
            const isSelected = difficulty === d.id;
            return (
              <button
                key={d.id}
                onClick={() => {
                  audioEngine.playUiClick();
                  selectDifficulty(d.id);
                }}
                className={`px-2.5 py-1 rounded-[3px] font-display uppercase tracking-wider text-xs transition-all ${
                  isSelected
                    ? 'bg-accent text-accent-contrast font-bold shadow-sm'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                <span>{d.label}</span>
                <span className="block text-[8px] opacity-75">{d.target}</span>
              </button>
            );
          })}
        </div>

        {/* Primary Launch Action */}
        <Button
          variant="primary"
          size="lg"
          onClick={onStartRace}
          className="w-full md:w-52 flex items-center justify-center gap-2 text-base tracking-widest shrink-0"
        >
          <Play className="w-4 h-4 fill-accent-contrast" />
          <span>Launch Race</span>
        </Button>
      </div>
    </div>
  );
};
