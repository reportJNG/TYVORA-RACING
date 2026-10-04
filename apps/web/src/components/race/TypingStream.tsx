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
    <div className="relative w-full overflow-hidden select-none py-1">
      {/* Side Fade Gradient Masks for Smooth Flowing Momentum */}
      <div className="pointer-events-none absolute left-0 inset-y-0 w-6 md:w-10 bg-gradient-to-r from-surface to-transparent z-20" />
      <div className="pointer-events-none absolute right-0 inset-y-0 w-8 md:w-16 bg-gradient-to-l from-surface to-transparent z-20" />

      {/* Kinetic Word Window Track */}
      <div
        className={`flex items-center min-h-[52px] md:min-h-[64px] px-2 md:px-4 transition-transform ${
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
          <span className="ml-3 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-success/15 border border-success/40 text-success text-xs font-display uppercase tracking-widest font-bold animate-pulse">
            FINISH LINE CROSSED
          </span>
        )}
      </div>
    </div>
  );
});
