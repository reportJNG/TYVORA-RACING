import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { CarVisualConfig } from '../../../data/cars.js';
import { CarSpecBar } from './CarSpecBar.js';

export interface CarSpecComparisonProps {
  selectedCar: CarVisualConfig;
  equippedCar: CarVisualConfig;
}

export const CarSpecComparison: React.FC<CarSpecComparisonProps> = ({
  selectedCar,
  equippedCar,
}) => {
  const isSameCar = selectedCar.id === equippedCar.id;

  const topSpeedDiff = isSameCar
    ? 0
    : selectedCar.displaySpecs.topSpeedKph - equippedCar.displaySpecs.topSpeedKph;

  const accelDiff = isSameCar
    ? 0
    : Number((equippedCar.displaySpecs.zeroToHundredSec - selectedCar.displaySpecs.zeroToHundredSec).toFixed(1)); // lower 0-100 is better

  const controlDiff = isSameCar
    ? 0
    : selectedCar.stars.control - equippedCar.stars.control;

  return (
    <div className="w-full rounded-2xl bg-surface/80 border border-white/10 p-4 space-y-4 font-mono text-white select-none">
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div>
          <span className="text-[10px] text-white/50 uppercase tracking-widest block font-bold">
            VEHICLE TELEMETRY & DIFF
          </span>
          <h4 className="text-base font-black uppercase text-white tracking-wide">
            {selectedCar.name}
          </h4>
        </div>

        {!isSameCar && (
          <div className="text-right">
            <span className="text-[10px] text-white/40 block">COMPARED TO</span>
            <span className="text-xs text-accent font-bold uppercase truncate max-w-[120px] block">
              {equippedCar.name}
            </span>
          </div>
        )}
      </div>

      {/* Main Spec Bars */}
      <div className="space-y-3">
        {/* Top Speed */}
        <CarSpecBar
          label="Top Speed"
          value={selectedCar.displaySpecs.topSpeedKph}
          maxValue={380}
          displayValue={`${selectedCar.displaySpecs.topSpeedKph} KM/H`}
          delta={topSpeedDiff}
          color="bg-gradient-to-r from-accent to-amber-500"
        />

        {/* 0-100 Acceleration */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between text-white/70">
            <span className="uppercase text-[11px] font-bold">0-100 KM/H</span>
            <div className="flex items-center gap-1.5">
              {!isSameCar && accelDiff !== 0 && (
                <span
                  className={`text-[10px] font-bold flex items-center gap-0.5 ${
                    accelDiff > 0 ? 'text-emerald-400' : 'text-danger'
                  }`}
                >
                  {accelDiff > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {accelDiff > 0 ? `-${Math.abs(accelDiff)}s` : `+${Math.abs(accelDiff)}s`}
                </span>
              )}
              <span className="text-white font-bold tabular-nums">
                {selectedCar.displaySpecs.zeroToHundredSec}s
              </span>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(10, ((6 - selectedCar.displaySpecs.zeroToHundredSec) / 4) * 100)
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Handling / Control */}
        <CarSpecBar
          label="Handling Rating"
          value={selectedCar.stars.control}
          maxValue={5}
          displayValue={`${selectedCar.stars.control} / 5 ★`}
          delta={controlDiff}
          color="bg-gradient-to-r from-emerald-400 to-teal-500"
        />
      </div>

      {/* Spec Summary Pill Badges */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/8 text-center text-[10px]">
        <div className="p-2 rounded-xl bg-black/25 border border-white/8">
          <span className="text-white/40 block">BODY STYLE</span>
          <span className="font-bold text-white text-xs truncate block">{selectedCar.bodyStyle}</span>
        </div>
        <div className="p-2 rounded-xl bg-black/25 border border-white/8">
          <span className="text-white/40 block">AERODYNAMICS</span>
          <span className="font-bold text-white text-xs uppercase">{selectedCar.wingStyle}</span>
        </div>
        <div className="p-2 rounded-xl bg-black/25 border border-white/8">
          <span className="text-white/40 block">CATEGORY</span>
          <span className="font-bold text-accent text-xs uppercase">{selectedCar.category}</span>
        </div>
      </div>
    </div>
  );
};
