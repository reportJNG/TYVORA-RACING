// apps/web/src/components/race/animation/OvertakeFlash.tsx
import React from 'react';

export interface OvertakeFlashProps {
  message: string | null;
}

export const OvertakeFlash: React.FC<OvertakeFlashProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="px-4 py-1.5 rounded-full bg-black/80 border border-accent/60 backdrop-blur-md text-[11px] font-bold uppercase tracking-widest text-accent shadow-[0_0_20px_rgba(255,75,38,0.45)] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
        <span>{message}</span>
      </div>
    </div>
  );
};
