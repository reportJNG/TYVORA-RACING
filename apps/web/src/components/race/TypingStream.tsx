// apps/web/src/components/race/TypingStream.tsx
import React from 'react';
import { useTypingStore } from '../../stores/useTypingStore.js';
import { useSettingsStore } from '../../stores/useSettingsStore.js';
import { WordBlock } from './WordBlock.js';

export const TypingStream: React.FC = React.memo(() => {
  const wordWindow = useTypingStore((state) => state.wordWindow);
  const largeText = useSettingsStore((state) => state.largeText);
  const reducedMotion = useSettingsStore((state) => state.reducedMotion);

  const { blocks, isComplete } = wordWindow;

  return (
    <div className="relative w-full overflow-hidden select-none py-0.5">
      {/* Side Fade Gradient Masks for Sleek Cockpit Visual Depth */}
      <div className="pointer-events-none absolute left-0 inset-y-0 w-4 md:w-6 bg-gradient-to-r from-surface to-transparent z-20" />
      <div className="pointer-events-none absolute right-0 inset-y-0 w-8 md:w-12 bg-gradient-to-l from-surface to-transparent z-20" />

      {/* 5-Word Kinetic Stream Track */}
      <div
        className={`flex items-center min-h-[44px] md:min-h-[48px] px-1 md:px-2 transition-transform ${
          reducedMotion ? 'duration-0' : 'duration-150 ease-out'
        } overflow-x-hidden`}
      >
        {blocks.map((block) => (
          <WordBlock
            key={`word_${block.wordIndex}_${block.startIndex}`}
            block={block}
            largeText={largeText}
            reducedMotion={reducedMotion}
          />
        ))}

        {isComplete && (
          <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-success/20 border border-success/50 text-success text-[11px] font-display uppercase tracking-widest font-bold animate-pulse">
            GOAL REACHED
          </span>
        )}
      </div>
    </div>
  );
});
