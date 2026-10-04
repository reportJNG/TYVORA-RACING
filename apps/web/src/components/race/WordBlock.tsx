// apps/web/src/components/race/WordBlock.tsx
import React from 'react';
import { WordWindowBlock } from '@typerace/sim';

export interface WordBlockProps {
  block: WordWindowBlock;
  largeText?: boolean;
  reducedMotion?: boolean;
}

export const WordBlock: React.FC<WordBlockProps> = React.memo(
  ({ block, largeText, reducedMotion }) => {
    const {
      status,
      characters,
      hasMistake,
      isFullyCorrect,
      hasTrailingSpace,
      trailingSpaceState,
      isTrailingSpaceCursor,
    } = block;

    const isCurrent = status === 'current';
    const isCompleted = status === 'completed';

    return (
      <div
        className={`inline-flex items-center relative whitespace-nowrap select-none transition-all ${
          reducedMotion ? 'duration-0' : 'duration-150 ease-out'
        } ${
          isCurrent
            ? 'scale-100 z-10'
            : isCompleted
            ? 'opacity-40 scale-[0.97]'
            : 'opacity-75 scale-[0.99]'
        }`}
      >
        {/* Word Container pill */}
        <span
          className={`inline-flex items-center px-2 py-1 rounded-[4px] font-mono tracking-wider transition-colors ${
            largeText ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
          } ${
            isCurrent
              ? hasMistake
                ? 'bg-danger/15 border border-danger/45 shadow-[0_0_12px_rgba(255,59,48,0.25)]'
                : 'bg-surface-2/85 border border-accent/40 shadow-[0_0_14px_rgba(255,85,28,0.2)]'
              : isCompleted
              ? isFullyCorrect
                ? 'text-text-muted/60'
                : 'text-text-muted/50'
              : 'text-text-muted/80'
          }`}
        >
          {characters.map((chDef) => {
            const { char, index, state, isCursor } = chDef;

            // state: 0: pending, 1: correct, 2: wrong, 3: current
            let colorClass = 'text-text-muted/50';
            if (state === 1) {
              colorClass = isCurrent ? 'text-text font-semibold' : 'text-text-muted font-medium';
            } else if (state === 2) {
              colorClass =
                'text-danger bg-danger/25 font-bold underline decoration-danger decoration-2 rounded-xs px-0.5';
            } else if (isCurrent) {
              colorClass = 'text-text/90 font-medium';
            }

            return (
              <span key={index} className="relative inline-block">
                {/* Active Caret with Accent Glow */}
                {isCursor && (
                  <span
                    className={`absolute -left-[1.5px] top-0.5 bottom-0.5 w-[2.5px] bg-accent rounded-full shadow-[0_0_8px_rgba(255,85,28,0.95)] z-20 ${
                      reducedMotion ? '' : 'animate-caret'
                    }`}
                  />
                )}
                <span className={colorClass}>{char}</span>
              </span>
            );
          })}

          {/* Trailing Space Cursor / Mistake Marker */}
          {hasTrailingSpace && (
            <span className="relative inline-block w-2 text-center ml-0.5">
              {isTrailingSpaceCursor && (
                <span
                  className={`absolute left-0 top-0.5 bottom-0.5 w-[2.5px] bg-accent rounded-full shadow-[0_0_8px_rgba(255,85,28,0.95)] z-20 ${
                    reducedMotion ? '' : 'animate-caret'
                  }`}
                />
              )}
              {trailingSpaceState === 2 ? (
                <span className="text-danger font-bold text-xs leading-none">·</span>
              ) : (
                <span className="opacity-0"> </span>
              )}
            </span>
          )}
        </span>

        {/* Word spacer */}
        <span className="inline-block w-2 sm:w-3" />
      </div>
    );
  }
);
