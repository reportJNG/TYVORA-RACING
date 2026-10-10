// apps/web/src/components/race/maps/CircuitTelemetryBadge.tsx
import React from 'react';
import { Compass, MapPin } from 'lucide-react';
import { TRACKS_DATA, TRACKS_LIST } from '../../../data/tracks.js';

export interface CircuitTelemetryBadgeProps {
  trackId: string;
}

export const CircuitTelemetryBadge: React.FC<CircuitTelemetryBadgeProps> = ({ trackId }) => {
  const track = TRACKS_DATA[trackId] || TRACKS_LIST[0];

  return (
    <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-surface/80 border border-white/10 backdrop-blur-md text-xs font-mono text-white/90">
      <Compass className="w-3.5 h-3.5 text-accent" />
      <span className="font-bold text-white uppercase">{track.name}</span>
      <span className="text-white/30">//</span>
      <span className="flex items-center gap-1 text-[11px] text-white/60">
        <MapPin className="w-3 h-3 text-accent/70" />
        <span>{track.location}</span>
      </span>
      <span className="text-white/30 hidden sm:inline">//</span>
      <span className="text-[10px] text-accent hidden sm:inline font-bold uppercase">{track.timeOfDay}</span>
    </div>
  );
};
