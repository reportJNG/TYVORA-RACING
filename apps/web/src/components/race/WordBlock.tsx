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

    // Calculate progress within current word for subtle laser progress line
    const correctInWord = characters.filter((c) => c.state === 1).length;
    const progressPercent = characters.length > 0 ? (correctInWord / characters.length) * 100 : 0;

    return (
      <div
        className={`inline-flex items-center relative whitespace-nowrap select-none transition-all ${
          reducedMotion ? 'duration-0' : 'duration-150 ease-out'
        } ${
          isCurrent
            ? 'scale-100 z-10'
            : isCompleted
            ? 'opacity-0 -translate-x-3 pointer-events-none scale-95 duration-200'
            : 'opacity-70 scale-[0.98] hover:opacity-90'
        }`}
      >
        {/* Word Container Pill */}
        <span
          className={`relative inline-flex flex-col items-start px-2 py-0.5 rounded-[5px] font-mono tracking-wider transition-all ${
            largeText ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'
          } ${
            isCurrent
              ? hasMistake
                ? 'bg-danger/20 border border-danger/60 shadow-[0_0_16px_rgba(255,59,48,0.3)]'
                : 'bg-surface-2/95 border border-accent/50 shadow-[0_0_16px_rgba(255,85,28,0.25)]'
              : isCompleted
              ? isFullyCorrect
                ? 'bg-transparent text-text-muted/40'
                : 'bg-transparent text-text-muted/30'
              : 'bg-surface/50 border border-border/40 text-text-muted/80'
          }`}
        >
          {/* Character Row */}
          <span className="inline-flex items-center">
            {characters.map((chDef) => {
              const { char, index, state, isCursor } = chDef;

              // state: 0: pending, 1: correct, 2: wrong, 3: current
              let colorClass = 'text-text-muted/60';
              if (state === 1) {
                colorClass = isCurrent
                  ? 'text-white font-semibold drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                  : 'text-text-muted font-medium';
              } else if (state === 2) {
                colorClass =
                  'text-danger bg-danger/30 font-bold underline decoration-danger decoration-2 rounded-xs px-0.5';
              } else if (isCurrent) {
                colorClass = 'text-text/85 font-medium';
              }

              return (
                <span key={index} className="relative inline-block">
                  {/* Glowing Laser Caret Pill */}
                  {isCursor && (
                    <span
                      className={`absolute -left-[1.5px] top-0.5 bottom-0.5 w-[2.5px] bg-accent rounded-full shadow-[0_0_10px_#FF551C] z-20 ${
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
                    className={`absolute left-0 top-0.5 bottom-0.5 w-[2.5px] bg-accent rounded-full shadow-[0_0_10px_#FF551C] z-20 ${
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

          {/* Active Word Laser Progress Line (Bottom Indicator) */}
          {isCurrent && (
            <span className="absolute bottom-0 left-1 right-1 h-[2px] bg-border/40 rounded-full overflow-hidden">
              <span
                className={`block h-full transition-all duration-100 ${
                  hasMistake ? 'bg-danger' : 'bg-accent'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </span>
          )}
        </span>

        {/* Word spacer */}
        <span className="inline-block w-1.5 sm:w-2" />
      </div>
    );
  }
);
