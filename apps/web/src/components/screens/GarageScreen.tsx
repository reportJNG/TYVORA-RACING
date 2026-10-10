// apps/web/src/components/screens/GarageScreen.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useRaceStore } from '../../stores/useRaceStore.js';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { CARS_DATA, CARS_LIST } from '../../data/cars.js';
import { ShowroomCanvas } from '../scene/ShowroomCanvas.js';
import { audioEngine } from '../../audio/AudioEngine.js';
import { CarSpecComparison } from '../race/cars/CarSpecComparison.js';
import { PaintStudio } from '../race/cars/PaintStudio.js';
import { CarCardSelector } from '../race/cars/CarCardSelector.js';
import { BuyCarButton } from '../race/cars/BuyCarButton.js';

export const GarageScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedCarId,
    customPaintColor,
    selectCar,
    setCustomPaintColor,
  } = useRaceStore();

  const { currentUser, unlockedCars } = useAuthStore();

  // Highlighted car in the showroom
  const [highlightedCarId, setHighlightedCarId] = useState<string>(selectedCarId);

  const highlightedCar = CARS_DATA[highlightedCarId] || CARS_LIST[0];
  const equippedCar = CARS_DATA[selectedCarId] || CARS_LIST[0];
  const carIndex = CARS_LIST.findIndex((c) => c.id === highlightedCar.id);
  const isUnlocked = unlockedCars.includes(highlightedCar.id);
  const isEquipped = selectedCarId === highlightedCar.id;
  const userPoints = currentUser?.points || 0;

  const handlePrevCar = () => {
    audioEngine.playUiClick();
    const nextIdx = (carIndex - 1 + CARS_LIST.length) % CARS_LIST.length;
    setHighlightedCarId(CARS_LIST[nextIdx].id);
  };

  const handleNextCar = () => {
    audioEngine.playUiClick();
    const nextIdx = (carIndex + 1) % CARS_LIST.length;
    setHighlightedCarId(CARS_LIST[nextIdx].id);
  };

  const handleEquipCar = (carId: string) => {
    selectCar(carId);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowLeft') {
        handlePrevCar();
      } else if (e.key === 'ArrowRight') {
        handleNextCar();
      } else if (e.key === 'Escape') {
        navigate('/race');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carIndex, navigate]);

  return (
    <div className="relative w-full min-h-[calc(100vh-56px)] flex flex-col justify-between p-4 sm:p-6 select-none font-sans bg-[#070A12] overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_75%_55%_at_50%_35%,rgba(255,75,38,0.08)_0%,transparent_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* 1. TOP HEADER: RETURN, VEHICLE TITLE & BALANCE */}
      <header className="relative z-20 max-w-7xl w-full mx-auto flex items-center justify-between">
        <button
          onClick={() => {
            audioEngine.playUiClick();
            navigate('/race');
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface/80 hover:bg-surface border border-white/10 hover:border-white/20 text-white/80 hover:text-white transition-all text-xs font-mono backdrop-blur-md cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO PADDOCK</span>
        </button>

        {/* Center: Vehicle Name & Category Pill */}
        <div className="flex items-center gap-3">
          <h1 className="font-display font-black text-xl sm:text-2xl tracking-tight text-white uppercase drop-shadow-sm">
            {highlightedCar.name}
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/10 border border-white/15 text-accent">
            {highlightedCar.category}
          </span>
        </div>

        {/* Right: Driver Points / Balance */}
        <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent/15 border border-accent/35 text-white text-xs font-mono font-bold shadow-[0_0_15px_rgba(255,75,38,0.25)]">
          <Zap className="w-3.5 h-3.5 text-accent" />
          <span className="tabular-nums">{userPoints}</span>
          <span className="text-[10px] text-accent font-sans font-bold">PTS</span>
        </div>
      </header>

      {/* 2. CENTER STAGE: 3D TURNTABLE + SIDEBAR SPEC COMPARISON ("CHOOSE DIFF & BUY") */}
      <div className="relative z-10 flex-1 max-w-7xl w-full mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-center min-h-[420px] py-4">
        
        {/* LEFT / CENTER: 3D TURNTABLE (Cols 1-7) */}
        <div className="lg:col-span-7 relative w-full h-[320px] sm:h-[400px] lg:h-[480px] flex items-center justify-center">
          {/* Previous Car Button */}
          <button
            onClick={handlePrevCar}
            className="absolute left-2 sm:left-4 z-20 w-11 h-11 rounded-full bg-surface/85 hover:bg-surface-2 border border-white/15 hover:border-accent text-white shadow-xl backdrop-blur-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            aria-label="Previous Car"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* 3D WebGL Showroom Canvas */}
          <div className="w-full h-full flex items-center justify-center">
            <ShowroomCanvas
              selectedCarId={highlightedCar.id}
              colorOverride={isEquipped ? customPaintColor || undefined : undefined}
            />
          </div>

          {/* Next Car Button */}
          <button
            onClick={handleNextCar}
            className="absolute right-2 sm:right-4 z-20 w-11 h-11 rounded-full bg-surface/85 hover:bg-surface-2 border border-white/15 hover:border-accent text-white shadow-xl backdrop-blur-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            aria-label="Next Car"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Bottom Floating Tagline */}
          <div className="absolute bottom-2 inset-x-0 flex items-center justify-center pointer-events-none">
            <div className="px-4 py-1.5 rounded-full bg-[#090D17]/85 border border-white/10 backdrop-blur-md text-[11px] font-mono text-white/70 max-w-md text-center truncate">
              {highlightedCar.tagline}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: VEHICLE SPECS & DIFF & LIVERY STUDIO (Cols 8-12) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Spec Comparison Component ("choose diff and buy") */}
          <CarSpecComparison
            selectedCar={highlightedCar}
            equippedCar={equippedCar}
          />

          {/* Custom Livery Studio (only when equipped or unlocked) */}
          {isUnlocked && (
            <PaintStudio
              currentPaintHex={customPaintColor || highlightedCar.primaryColor}
              defaultCarHex={highlightedCar.primaryColor}
              onSelectColor={(hex) => setCustomPaintColor(hex)}
            />
          )}

          {/* Buy or Equip Action Button */}
          <BuyCarButton
            car={highlightedCar}
            isUnlocked={isUnlocked}
            isEquipped={isEquipped}
            userPoints={userPoints}
            onEquip={handleEquipCar}
          />
        </div>

      </div>

      {/* 3. BOTTOM CAR SELECTOR STRIP */}
      <footer className="relative z-20 max-w-7xl w-full mx-auto pt-2">
        <CarCardSelector
          selectedCarId={highlightedCar.id}
          unlockedCars={unlockedCars}
          onSelectCar={(id) => setHighlightedCarId(id)}
          orientation="horizontal"
        />
      </footer>
    </div>
  );
};
