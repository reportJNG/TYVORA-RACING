import React from 'react';
import { Palette, Check } from 'lucide-react';
import { PAINT_PALETTE } from '../../../data/cars.js';
import { audioEngine } from '../../../audio/AudioEngine.js';

export interface PaintStudioProps {
  currentPaintHex: string;
  defaultCarHex: string;
  onSelectColor: (hex: string | null) => void;
}

export const PaintStudio: React.FC<PaintStudioProps> = ({
  currentPaintHex,
  defaultCarHex,
  onSelectColor,
}) => {
  const activeColorHex = (currentPaintHex || defaultCarHex).toLowerCase();

  return (
    <div className="w-full rounded-2xl bg-surface/80 border border-white/10 p-4 space-y-3 font-mono text-white select-none">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <Palette className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            CUSTOM LIVERY STUDIO
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            audioEngine.playUiClick();
            onSelectColor(null);
          }}
          className="text-[10px] font-mono text-white/50 hover:text-white uppercase transition-colors"
        >
          RESET FACTORY
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {PAINT_PALETTE.map((color) => {
          const isSelected = activeColorHex === color.hex.toLowerCase();

          return (
            <button
              key={color.id}
              type="button"
              onClick={() => {
                audioEngine.playUiClick();
                onSelectColor(color.hex);
              }}
              title={`${color.name} (${color.hex})`}
              className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                isSelected
                  ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)] ring-2 ring-accent'
                  : 'border-white/20 hover:scale-105 hover:border-white/60'
              }`}
              style={{ backgroundColor: color.hex }}
            >
              {isSelected && (
                <Check
                  className={`w-3.5 h-3.5 stroke-[3] ${
                    ['pure-white', 'liquid-silver', 'solar-yellow'].includes(color.id)
                      ? 'text-black'
                      : 'text-white'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
