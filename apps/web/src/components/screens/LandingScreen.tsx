// apps/web/src/components/screens/LandingScreen.tsx
import React from 'react';
import { Play } from 'lucide-react';
import { Button } from '../common/Button.js';

export interface LandingScreenProps {
  onPlay: () => void;
  onLogin: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onPlay, onLogin }) => {
  return (
    <div className="relative min-h-[calc(100vh-56px)] flex flex-col justify-center items-center px-4 py-12 text-center select-none overflow-hidden bg-bg racing-grid">
      <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
        {/* Subtitle pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-surface-2 border border-border text-accent text-xs font-display uppercase tracking-widest mb-6">
          <span>HIGH-VELOCITY TYPING SIMULATION</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-display font-bold uppercase tracking-widest text-text leading-none mb-3">
          TYPE<span className="text-accent">//</span>RACE
        </h1>

        <p className="text-base md:text-lg font-display uppercase tracking-widest text-text-muted mb-8 max-w-md">
          Clean keystrokes accelerate directly. Zero steering. Pure velocity.
        </p>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Button
            variant="primary"
            size="lg"
            onClick={onPlay}
            className="w-full sm:w-60 text-lg flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-accent-contrast" />
            <span>Enter World</span>
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={onLogin}
            className="w-full sm:w-40 text-sm"
          >
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
};
