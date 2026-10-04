// apps/web/src/components/race/PauseOverlay.tsx
import React, { useEffect } from 'react';
import { useRaceStore } from '../../stores/useRaceStore.js';
import { Button } from '../common/Button.js';

export interface PauseOverlayProps {
  onQuit: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({ onQuit }) => {
  const { status, resumeRace, prepareRace, startCountdown } = useRaceStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status === 'paused') {
        if (e.key === 'Escape' || e.key === 'Enter') {
          resumeRace();
        } else if (e.key === 'r' || e.key === 'R') {
          prepareRace();
          startCountdown();
        } else if (e.key === 'q' || e.key === 'Q') {
          onQuit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, resumeRace, prepareRace, startCountdown, onQuit]);

  if (status !== 'paused') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-sm bg-surface border border-border-strong rounded-m p-8 text-center shadow-2xl">
        <h2 className="text-3xl font-display font-bold uppercase tracking-widest text-text mb-6">
          PAUSED
        </h2>

        <div className="flex flex-col gap-3 font-display">
          <Button variant="primary" size="lg" onClick={resumeRace} fullWidth>
            Resume (Esc)
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              prepareRace();
              startCountdown();
            }}
            fullWidth
          >
            Restart Race (R)
          </Button>
          <Button variant="ghost" size="md" onClick={onQuit} fullWidth>
            Quit to Menu (Q)
          </Button>
        </div>
      </div>
    </div>
  );
};
