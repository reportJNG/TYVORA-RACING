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
            ? 'opacity-100 z-10'
            : isCompleted
            ? 'opacity-25 pointer-events-none'
            : 'opacity-55 hover:opacity-80'
        }`}
      >
        {/* Word Text Row */}
        <span
          className={`relative inline-flex items-center font-mono tracking-wider transition-colors ${
            largeText ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'
          } ${
            isCurrent && hasMistake
              ? 'text-danger'
              : ''
          }`}
        >
          {characters.map((chDef) => {
            const { char, index, state, isCursor } = chDef;

            // state: 0: pending, 1: correct, 2: wrong
            let colorClass = 'text-white/60';
            if (state === 1) {
              colorClass = isCurrent
                ? 'text-accent font-semibold drop-shadow-[0_0_6px_rgba(255,85,28,0.5)]'
                : 'text-white/30 font-normal';
            } else if (state === 2) {
              colorClass =
                'text-danger bg-danger/25 font-bold underline decoration-danger decoration-2 rounded-xs px-0.5';
            } else if (isCurrent) {
              colorClass = 'text-white font-medium';
            }

            return (
              <span key={index} className="relative inline-block">
                {/* Glowing Sleek Caret */}
                {isCursor && (
                  <span
                    className={`absolute -left-[1.5px] top-0.5 bottom-0.5 w-[2px] bg-accent rounded-full shadow-[0_0_8px_#FF551C] z-20 ${
                      reducedMotion ? '' : 'animate-caret'
                    }`}
                  />
                )}
                <span className={colorClass}>{char}</span>
              </span>
            );
          })}

          {/* Trailing Space Cursor if active */}
          {hasTrailingSpace && (
            <span className="relative inline-block w-1.5 text-center ml-0.5">
              {isTrailingSpaceCursor && (
                <span
                  className={`absolute left-0 top-0.5 bottom-0.5 w-[2px] bg-accent rounded-full shadow-[0_0_8px_#FF551C] z-20 ${
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
        <span className="inline-block w-2 sm:w-2.5" />
      </div>
    );
  }
);
