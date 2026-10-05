// apps/web/src/components/layout/Footer.tsx
import React from 'react';

export interface FooterProps {
  currentScreen: string;
  onOpenLegal: (tab: 'terms' | 'privacy' | 'about') => void;
}

export const Footer: React.FC<FooterProps> = ({ currentScreen, onOpenLegal }) => {
  if (currentScreen === 'race') return null;

  const isHome = currentScreen === 'home';

  return (
    <footer
      className={`w-full py-4 border-t mt-auto text-xs transition-colors select-none ${
        isHome
          ? 'bg-[#0B0E14]/30 border-white/10 text-white/50 backdrop-blur-md'
          : 'border-border text-text-faint'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-text">TYVORA</span>
          <span className="text-text-faint">·</span>
          <span>Fast-Paced Typing Motorsport</span>
        </div>
        <div className="flex items-center gap-5 text-text-muted">
          <button
            onClick={() => onOpenLegal('about')}
            className="hover:text-text transition-colors"
          >
            About
          </button>
          <button
            onClick={() => onOpenLegal('terms')}
            className="hover:text-text transition-colors"
          >
            Terms
          </button>
          <button
            onClick={() => onOpenLegal('privacy')}
            className="hover:text-text transition-colors"
          >
            Privacy
          </button>
          <div className="flex items-center gap-1.5 pl-2 border-l border-border text-[11px] text-text-faint">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span>Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
