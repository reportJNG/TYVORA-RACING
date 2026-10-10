// apps/web/src/components/race/maps/CircuitCard.tsx
import React from 'react';
import { MapPin, Sun, CloudRain, Check } from 'lucide-react';
import { TrackDefinition } from '../../../data/tracks.js';
import { audioEngine } from '../../../audio/AudioEngine.js';

export interface CircuitCardProps {
  track: TrackDefinition;
  isSelected: boolean;
  onSelect: (trackId: string) => void;
  compact?: boolean;
}

export const CircuitCard: React.FC<CircuitCardProps> = ({
  track,
  isSelected,
  onSelect,
  compact = false,
}) => {
  const handleClick = () => {
    audioEngine.playUiClick();
    onSelect(track.id);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`relative p-3 rounded-2xl border text-left transition-all cursor-pointer overflow-hidden ${
          isSelected
            ? 'bg-accent/20 border-accent shadow-[0_0_18px_rgba(255,75,38,0.3)]'
            : 'bg-surface/60 hover:bg-surface border-white/10 hover:border-white/20'
        }`}
      >
        {isSelected && (
          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-accent text-white flex items-center justify-center">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
        )}
        <div className="text-xs font-bold text-white truncate pr-4">{track.name}</div>
        <div className="text-[10px] font-mono text-white/50 truncate mt-0.5">{track.location}</div>
        <div className="mt-2 inline-block text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white/10 text-white/70">
          {track.timeOfDay}
        </div>
      </button>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`group relative p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
        isSelected
          ? 'bg-[#0E1524]/90 border-accent shadow-[0_0_25px_rgba(255,75,38,0.25)] ring-1 ring-accent/40'
          : 'bg-[#0A0E18]/70 hover:bg-[#0E1422]/80 border-white/10 hover:border-white/20'
      }`}
    >
      {/* Top right selection checkmark */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center shadow-[0_0_10px_rgba(255,75,38,0.6)]">
          <Check className="w-3 h-3 stroke-[3]" />
        </div>
      )}

      {/* Header Info */}
      <div className="flex items-center gap-2 mb-1.5">
        <MapPin className="w-3.5 h-3.5 text-accent" />
        <span className="text-[11px] font-mono text-white/50 uppercase tracking-wider">{track.location}</span>
      </div>

      <h3 className="font-display font-black text-base text-white tracking-wide uppercase truncate group-hover:text-accent transition-colors">
        {track.name}
      </h3>

      <p className="text-[11px] text-white/60 line-clamp-2 mt-1 leading-snug">
        {track.tagline}
      </p>

      {/* Badges footer */}
      <div className="mt-3 pt-2.5 border-t border-white/8 flex items-center gap-2 flex-wrap text-[10px] font-mono">
        <span className="px-2 py-0.5 rounded bg-white/10 text-white/80 font-bold">
          {track.difficulty}
        </span>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-white/60">
          <Sun className="w-2.5 h-2.5 text-amber-400" />
          {track.timeOfDay}
        </span>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-white/60">
          <CloudRain className="w-2.5 h-2.5 text-cyan-400" />
          {track.weather}
        </span>
      </div>
    </div>
  );
};
