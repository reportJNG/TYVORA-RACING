// apps/web/src/components/layout/Footer.tsx
import React from 'react';

export interface FooterProps {
  currentScreen: string;
  onOpenLegal: (tab: 'terms' | 'privacy' | 'about') => void;
}

export const Footer: React.FC<FooterProps> = ({ currentScreen, onOpenLegal }) => {
  if (currentScreen === 'race') return null;

  return (
    <footer className="w-full py-3 border-t border-border mt-auto text-[11px] font-display uppercase tracking-widest text-text-faint transition-colors select-none">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-text-muted font-bold">TYPERACE</span>
          <span>//</span>
          <span>KEYBOARD PHYSICS ENGINE</span>
        </div>
        <div className="flex items-center gap-5 text-text-muted">
          <button
            onClick={() => onOpenLegal('about')}
            className="hover:text-accent transition-colors"
          >
            About
          </button>
          <button
            onClick={() => onOpenLegal('terms')}
            className="hover:text-accent transition-colors"
          >
            Terms
          </button>
          <button
            onClick={() => onOpenLegal('privacy')}
            className="hover:text-accent transition-colors"
          >
            Privacy
          </button>
        </div>
      </div>
    </footer>
  );
};
