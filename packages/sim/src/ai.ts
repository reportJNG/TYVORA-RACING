// packages/sim/src/ai.ts
import { KeystrokeEntry, createTypingState, onChar, onBackspace } from './typing.js';
import { mulberry32, randInt, randChance } from './rng.js';

import { Difficulty } from './constants.js';
export type { Difficulty };

export interface AiProfile {
  name: string;
  targetWpm: number;
  variance: number;
  errorRatePermille: number; // e.g. 30 = 3.0%
}

export const AI_DIFFICULTY_PROFILES: Record<
  Difficulty,
  { rival: AiProfile; pacer: AiProfile }
> = {
  easy: {
    rival: { name: 'Racer Swift', targetWpm: 32, variance: 3, errorRatePermille: 45 },
    pacer: { name: 'Cruiser Sam', targetWpm: 26, variance: 3, errorRatePermille: 50 },
  },
  normal: {
    rival: { name: 'Nitro Nova', targetWpm: 48, variance: 4, errorRatePermille: 35 },
    pacer: { name: 'GearHead', targetWpm: 40, variance: 4, errorRatePermille: 40 },
  },
  hard: {
    rival: { name: 'SpeedDemon', targetWpm: 68, variance: 5, errorRatePermille: 25 },
    pacer: { name: 'Apex Ace', targetWpm: 58, variance: 5, errorRatePermille: 30 },
  },
  extreme: {
    rival: { name: 'Ghost Zero', targetWpm: 92, variance: 6, errorRatePermille: 15 },
    pacer: { name: 'Mach Mira', targetWpm: 80, variance: 6, errorRatePermille: 20 },
  },
};

// 64-entry log-normal approximation lookup table (values in permille, mean ≈ 1000)
const JITTER_TABLE = [
  560, 620, 670, 710, 740, 770, 800, 820, 840, 860, 880, 900, 910, 930, 940, 960,
  970, 980, 990, 1000, 1010, 1020, 1030, 1040, 1050, 1060, 1080, 1090, 1100, 1120, 1140, 1150,
  1170, 1190, 1210, 1230, 1250, 1270, 1300, 1330, 1360, 1390, 1420, 1460, 1500, 1540, 1580, 1630,
  1680, 1730, 1790, 1850, 1900, 750, 850, 950, 1050, 1150, 1250, 900, 1000, 1100, 1200, 1000,
];

// QWERTY neighbor keys for realistic mistypes
const KEYBOARD_NEIGHBORS: Record<string, string[]> = {
  a: ['q', 'w', 's', 'z'],
  b: ['v', 'g', 'h', 'n'],
  c: ['x', 'd', 'f', 'v'],
  d: ['s', 'e', 'r', 'f', 'c', 'x'],
  e: ['w', 'r', 'd', 's'],
  f: ['d', 'r', 't', 'g', 'v', 'c'],
  g: ['f', 't', 'y', 'h', 'b', 'v'],
  h: ['g', 'y', 'u', 'j', 'n', 'b'],
  i: ['u', 'o', 'k', 'j'],
  j: ['h', 'u', 'i', 'k', 'm', 'n'],
  k: ['j', 'i', 'o', 'l', 'm'],
  l: ['k', 'o', 'p'],
  m: ['n', 'j', 'k'],
  n: ['b', 'h', 'j', 'm'],
  o: ['i', 'p', 'l', 'k'],
  p: ['o', 'l'],
  q: ['w', 'a'],
  r: ['e', 't', 'f', 'd'],
  s: ['a', 'w', 'e', 'd', 'x', 'z'],
  t: ['r', 'y', 'g', 'f'],
  u: ['y', 'i', 'j', 'h'],
  v: ['c', 'f', 'g', 'b'],
  w: ['q', 'e', 's', 'a'],
  x: ['z', 's', 'd', 'c'],
  y: ['t', 'u', 'h', 'g'],
  z: ['a', 's', 'x'],
};

function getCharModifier(ch: string, prevCh: string): number {
  if (ch === ' ') return 900;
  if (prevCh === ' ') return 1250; // start of word
  if (ch >= 'A' && ch <= 'Z') return 1300; // capital
  if (ch >= '0' && ch <= '9') return 1400; // digit
  if (ch === '.' || ch === ',' || ch === ';' || ch === ':' || ch === '!' || ch === '?') return 1600;
  if (ch === prevCh) return 850; // repeated char
  return 1000;
}

function getWrongChar(expected: string, rng: () => number): string {
  const lower = expected.toLowerCase();
  const neighbors = KEYBOARD_NEIGHBORS[lower];
  if (neighbors && neighbors.length > 0) {
    const pick = neighbors[rng() % neighbors.length];
    return expected >= 'A' && expected <= 'Z' ? pick.toUpperCase() : pick;
  }
  return 'e';
}

/**
 * Generates a realistic, humanized keystroke log for an AI racer.
 * Runs an internal simulation loop to calibrate effective WPM to match targetWpm.
 */
export function generateAiLog(
  seed: number,
  passage: string,
  targetWpm: number,
  errorRatePermille: number
): { log: KeystrokeEntry[]; effectiveWpm: number; totalMistakes: number } {
  let scale = 1000;

  for (let iter = 0; iter < 4; iter++) {
    const rng = mulberry32(seed);
    const log: KeystrokeEntry[] = [];
    const L = passage.length;

    // Start reaction time: 180 - 380 ms after GO
    let t = randInt(rng, 180, 380);
    const baseInterval = Math.round(12000 / targetWpm);

    let charIdx = 0;
    let wordTempo = 1000;

    while (charIdx < L) {
      const ch = passage[charIdx];
      const prevCh = charIdx > 0 ? passage[charIdx - 1] : ' ';

      // Word-level cadence shift
      if (prevCh === ' ') {
        const tempos = [900, 950, 1000, 1050, 1150];
        wordTempo = tempos[rng() % tempos.length];
        // 2% chance of slight pre-word hesitation
        if (randChance(rng, 20)) {
          t += randInt(rng, 250, 600);
        }
      }

      // Check for simulated mistake
      const isMistake = randChance(rng, errorRatePermille);

      if (isMistake && charIdx < L - 1) {
        // Emit wrong char
        const wrong = getWrongChar(ch, rng);
        log.push([Math.round(t), wrong]);

        // Mistake reaction delay: 180 - 420 ms
        t += Math.round(randInt(rng, 180, 420) * (scale / 1000));
        log.push([Math.round(t), 'BS']);

        // Correct character interval
        t += Math.round(randInt(rng, 80, 160) * (scale / 1000));
        log.push([Math.round(t), ch]);
      } else {
        // Normal keystroke
        log.push([Math.round(t), ch]);
      }

      // Calculate next interval
      const charMod = getCharModifier(ch, prevCh);
      const jitter = JITTER_TABLE[rng() % JITTER_TABLE.length];
      let interval = Math.round(
        baseInterval *
          (charMod / 1000) *
          (wordTempo / 1000) *
          (jitter / 1000) *
          (scale / 1000)
      );

      interval = Math.max(35, Math.min(1500, interval));
      t += interval;
      charIdx++;
    }

    // Verify through the typing engine to measure effective WPM
    const testState = createTypingState(passage);
    for (const entry of log) {
      if (entry[1] === 'BS') {
        onBackspace(testState, entry[0]);
      } else if (entry[1] === 'WBS') {
        // not used in basic AI log
      } else {
        onChar(testState, entry[1], entry[0]);
      }
    }

    const completedAt = testState.completedAt ?? t;
    const effectiveWpm = Number(((L / 5) / (completedAt / 60000)).toFixed(1));

    if (Math.abs(effectiveWpm - targetWpm) <= 1.5 || iter === 3) {
      return {
        log,
        effectiveWpm,
        totalMistakes: testState.mistakes,
      };
    }

    // Adjust scale for next iteration: if effectiveWpm > targetWpm, intervals need to be larger
    scale = Math.max(200, Math.min(3000, Math.round((scale * effectiveWpm) / targetWpm)));
  }

  // Fallback (unreachable with loop)
  return { log: [], effectiveWpm: targetWpm, totalMistakes: 0 };
}
