// apps/web/src/components/race/maps/CircuitSelector.tsx
import React from 'react';
import { TRACKS_LIST } from '../../../data/tracks.js';
import { CircuitCard } from './CircuitCard.js';

export interface CircuitSelectorProps {
  selectedTrackId: string;
  onSelectTrack: (trackId: string) => void;
  compact?: boolean;
}

export const CircuitSelector: React.FC<CircuitSelectorProps> = ({
  selectedTrackId,
  onSelectTrack,
  compact = false,
}) => {
  return (
    <div className={compact ? 'grid grid-cols-2 sm:grid-cols-3 gap-2.5' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5'}>
      {TRACKS_LIST.map((track) => (
        <CircuitCard
          key={track.id}
          track={track}
          isSelected={selectedTrackId === track.id}
          onSelect={onSelectTrack}
          compact={compact}
        />
      ))}
    </div>
  );
};
