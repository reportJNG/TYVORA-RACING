// packages/sim/src/passage.ts
import { Difficulty } from './constants.js';

export interface PassageWord {
  word: string;
  startIndex: number; // inclusive index in text
  endIndex: number;   // exclusive index in text
  wordIndex: number;  // 0-indexed word position
}

export interface CharacterMetadata {
  char: string;
  index: number;
  wordIndex: number;
  isSpace: boolean;
}

export interface PassageMetadata {
  charCount: number;
  wordCount: number;
  avgWordLength: number;
  punctuationDensity: number;
  category: 'racing' | 'mechanics' | 'focus' | 'technical' | 'street' | 'endurance';
}

export interface Passage {
  id: string;
  text: string;
  words: PassageWord[];
  characters: CharacterMetadata[];
  difficulty: Difficulty;
  round?: number;
  estimatedDurationSeconds: number;
  metadata: PassageMetadata;
}

export interface RoundProgressionConfig {
  minLength: number;
  maxLength: number;
  difficultyPool: Difficulty[];
}

export const DEFAULT_ROUND_PROGRESSION: Record<number, RoundProgressionConfig> = {
  1: {
    minLength: 120,
    maxLength: 170,
    difficultyPool: ['easy', 'normal'],
  },
  2: {
    minLength: 165,
    maxLength: 220,
    difficultyPool: ['normal'],
  },
  3: {
    minLength: 210,
    maxLength: 280,
    difficultyPool: ['hard', 'extreme'],
  },
};

/**
 * Normalizes passage text to avoid common typist friction:
 * - Replaces smart/curly quotes with standard ASCII quotes (' and ")
 * - Replaces em-dashes and en-dashes with standard hyphens
 * - Collapses multiple whitespace into single spaces
 * - Trims leading and trailing whitespace
 */
export function normalizePassageText(text: string): string {
  return text
    .replace(/[\u2018\u2019\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u00A0\u200B]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Precomputes word boundaries and character metadata once,
 * enabling O(1) runtime character-to-word lookups and smooth windowing.
 */
export function precomputePassageStructure(text: string): {
  words: PassageWord[];
  characters: CharacterMetadata[];
} {
  const words: PassageWord[] = [];
  const characters: CharacterMetadata[] = new Array(text.length);

  // Split into words while accurately recording exact character offsets
  let wordStart = -1;
  let wordIdx = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const isSpace = ch === ' ';

    if (!isSpace) {
      if (wordStart === -1) {
        wordStart = i;
      }
    } else {
      if (wordStart !== -1) {
        words.push({
          word: text.slice(wordStart, i),
          startIndex: wordStart,
          endIndex: i,
          wordIndex: wordIdx,
        });
        wordIdx++;
        wordStart = -1;
      }
    }
  }

  // Final word if text doesn't end with space
  if (wordStart !== -1) {
    words.push({
      word: text.slice(wordStart),
      startIndex: wordStart,
      endIndex: text.length,
      wordIndex: wordIdx,
    });
  }

  // Precompute character metadata
  let currentWord = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const isSpace = ch === ' ';

    if (isSpace) {
      characters[i] = {
        char: ch,
        index: i,
        wordIndex: currentWord > 0 ? currentWord - 1 : 0,
        isSpace: true,
      };
      if (currentWord < words.length && i >= words[currentWord].startIndex) {
        currentWord++;
      }
    } else {
      if (currentWord < words.length && i >= words[currentWord].endIndex) {
        currentWord++;
      }
      characters[i] = {
        char: ch,
        index: i,
        wordIndex: currentWord < words.length ? currentWord : words.length - 1,
        isSpace: false,
      };
    }
  }

  return { words, characters };
}

/**
 * Analyzes passage metrics for balance and metadata
 */
export function analyzePassage(
  text: string,
  category: PassageMetadata['category'] = 'racing'
): PassageMetadata {
  const charCount = text.length;
  const wordTokens = text.trim().split(/\s+/);
  const wordCount = wordTokens.length;
  const totalLetters = wordTokens.reduce((sum, w) => sum + w.length, 0);
  const avgWordLength = wordCount > 0 ? Number((totalLetters / wordCount).toFixed(1)) : 0;

  const punctuationChars = (text.match(/[,.;:!?'"()\-#\[\]]/g) || []).length;
  const punctuationDensity = Number(((punctuationChars / Math.max(1, charCount)) * 100).toFixed(1));

  return {
    charCount,
    wordCount,
    avgWordLength,
    punctuationDensity,
    category,
  };
}

export function createPassage(input: {
  id: string;
  text: string;
  difficulty: Difficulty;
  category?: PassageMetadata['category'];
  round?: number;
  targetWpm?: number;
}): Passage {
  const cleanText = normalizePassageText(input.text);
  const { words, characters } = precomputePassageStructure(cleanText);
  const metadata = analyzePassage(cleanText, input.category || 'racing');

  // Estimate duration at expected pace for difficulty
  const baseWpm =
    input.targetWpm ||
    (input.difficulty === 'easy'
      ? 45
      : input.difficulty === 'normal'
      ? 65
      : input.difficulty === 'hard'
      ? 85
      : 105);

  const estimatedMinutes = (cleanText.length / 5) / baseWpm;
  const estimatedDurationSeconds = Math.max(5, Math.round(estimatedMinutes * 60));

  return {
    id: input.id,
    text: cleanText,
    words,
    characters,
    difficulty: input.difficulty,
    round: input.round,
    estimatedDurationSeconds,
    metadata,
  };
}

// Raw Curated Passage Data
interface RawPassageDef {
  id: string;
  difficulty: Difficulty;
  text: string;
  category: PassageMetadata['category'];
}

export const RAW_PASSAGES: RawPassageDef[] = [
  // EASY: 130 - 165 characters, natural rhythm, accessible vocabulary
  {
    id: 'easy_01',
    difficulty: 'easy',
    text: 'keep your eyes on the road ahead and type every word with steady rhythm to reach top speed while your engine hums down the wide open coastal boulevard.',
    category: 'racing',
  },
  {
    id: 'easy_02',
    difficulty: 'easy',
    text: 'smooth fingers make the engine roar as you chase the finish line with clean and fast typing, overtaking the competition one clean word at a time.',
    category: 'racing',
  },
  {
    id: 'easy_03',
    difficulty: 'easy',
    text: 'the highway is clear tonight and your car will fly as long as you do not hit any wrong keys, gliding smoothly past every turn toward victory.',
    category: 'racing',
  },
  {
    id: 'easy_04',
    difficulty: 'easy',
    text: 'speed comes from practice and staying calm when the road opens up before your headlights, letting natural instinct steer you into first place.',
    category: 'focus',
  },
  {
    id: 'easy_05',
    difficulty: 'easy',
    text: 'drive fast and stay accurate on every corner to build your streak and take home the victory as the crowd cheers for your championship win.',
    category: 'racing',
  },
  {
    id: 'easy_06',
    difficulty: 'easy',
    text: 'listen to the hum of the tires on asphalt while your hands flow across the keyboard effortlessly, feeling the car accelerate with every phrase.',
    category: 'focus',
  },
  {
    id: 'easy_07',
    difficulty: 'easy',
    text: 'every clean word gives you a burst of speed so stay relaxed and let your reflexes take over as you surge toward the chequered flag on the horizon.',
    category: 'racing',
  },
  {
    id: 'easy_08',
    difficulty: 'easy',
    text: 'grip the wheel with confidence and accelerate down the long open runway toward the sunset, keeping your rhythm steady until the race is won.',
    category: 'street',
  },

  // NORMAL: 170 - 215 characters, punctuation, standard capitalization, momentum
  {
    id: 'norm_01',
    difficulty: 'normal',
    text: 'Every race is a battle between your fingers and the clock. Maintain focus, correct mistakes quickly, and accelerate down the straightaway to build an insurmountable lead over the pack.',
    category: 'racing',
  },
  {
    id: 'norm_02',
    difficulty: 'normal',
    text: "When you make a mistake, don't panic. Tap Backspace, fix the error, and watch your engine rebuild momentum immediately as you slingshot through the slipstream of the rival car ahead.",
    category: 'mechanics',
  },
  {
    id: 'norm_03',
    difficulty: 'normal',
    text: 'A great typist drives like a professional racer: smooth through the corners and relentlessly fast down every open straight, finding rhythm where others hesitate under pressure.',
    category: 'racing',
  },
  {
    id: 'norm_04',
    difficulty: 'normal',
    text: 'The road belongs to the fastest driver who maintains a steady cadence, avoiding early mistakes through every sharp turn while keeping their eyes locked on upcoming words ahead.',
    category: 'racing',
  },
  {
    id: 'norm_05',
    difficulty: 'normal',
    text: 'Rhythm is your true engine. Type cleanly and the speedometer will climb as your car overtakes the competition with ease, carrying high momentum into the final sector of the circuit.',
    category: 'focus',
  },
  {
    id: 'norm_06',
    difficulty: 'normal',
    text: 'Hold your lane as the tachometer climbs. When your fingers sync with the keystrokes, the entire circuit feels effortless and every clean word injects pure boost into your velocity.',
    category: 'mechanics',
  },
  {
    id: 'norm_07',
    difficulty: 'normal',
    text: 'Confidence breeds velocity on this straightaway. Scan the next two words before your fingertips finish the current one, anticipating every character with calm precision.',
    category: 'focus',
  },
  {
    id: 'norm_08',
    difficulty: 'normal',
    text: 'Apex after apex, the race rewards consistency. Never rush ahead blindly; trust your cadence to carry you past the pack and claim the podium with flawless execution.',
    category: 'street',
  },

  // HARD: 210 - 255 characters, advanced sentence structures, semicolons, quotes, numbers
  {
    id: 'hard_01',
    difficulty: 'hard',
    text: 'True velocity requires ruthless consistency; one careless typo drops your RPM, forcing you to fight for every lost second. Recover fast, keep your composure, and push your machine past 280 km/h down Sector 3.',
    category: 'racing',
  },
  {
    id: 'hard_02',
    difficulty: 'hard',
    text: 'The tunnel lights flash by at high speed: "Rhythm is your throttle, accuracy is your steering." Never hesitate on the keys when drafting behind rivals; slipstream aerodynamic advantage demands perfection.',
    category: 'racing',
  },
  {
    id: 'hard_03',
    difficulty: 'hard',
    text: 'Precision under intense pressure separates champions from contenders; remember: raw velocity is nothing without control. Balance your tempo across every sentence and watch your rival fade in the rearview mirror.',
    category: 'focus',
  },
  {
    id: 'hard_04',
    difficulty: 'hard',
    text: 'Accelerate through the sweeping curves and keep your fingers moving; every clean keystroke injects fuel into your engine while maintaining 90+ WPM through technical hairpin corners and sudden chicanes.',
    category: 'racing',
  },
  {
    id: 'hard_05',
    difficulty: 'hard',
    text: 'Night falls across the coastal ridge; the speedometer reads 295 km/h as you execute each phrase with surgical calm, pulling ahead into the final straightaway under the brilliant stadium floodlights.',
    category: 'street',
  },
  {
    id: 'hard_06',
    difficulty: 'hard',
    text: 'Tires screech against warm tarmac! Maintain a steady cadence through the hairpin turn to secure your podium finish; let your muscle memory drive the vehicle smoothly past the finish line arch.',
    category: 'racing',
  },
  {
    id: 'hard_07',
    difficulty: 'hard',
    text: 'Telemetry confirms optimal tire temperature: "Keep clean cadence down Sector 2; back off zero percent until the flag drops." Shift your attention forward and lock in your winning split time.',
    category: 'endurance',
  },

  // EXTREME: 235 - 285 characters, high technicality, symbols, brackets, exact commands
  {
    id: 'extr_01',
    difficulty: 'extreme',
    text: 'Telemetric check: 100% throttle, gear #6 engaged (RPM: 7,800). Can you maintain 110+ WPM without dropping accuracy below 98%? Execute every character cleanly to unleash the full horsepower of your hypercar!',
    category: 'technical',
  },
  {
    id: 'extr_02',
    difficulty: 'extreme',
    text: 'SYSTEM NOTICE [v1.0]: Turbo-boost requires 25 consecutive hits! Break through Sector 03 at 310+ km/h and seal the championship; zero typos allowed when navigating high-speed sweepers under the lights.',
    category: 'technical',
  },
  {
    id: 'extr_03',
    difficulty: 'extreme',
    text: 'Code: SPEED-DEMON; Sector delta = -0.65s! Push into overdrive (WPM >= 120, mistakes = 0) and shatter the existing lap record; hold your line through the final bend and dominate the leaderboard.',
    category: 'technical',
  },
  {
    id: 'extr_04',
    difficulty: 'extreme',
    text: 'STATUS: NITROUS ARMED [PSI: 980]; Shift into 7th gear at 8,500 RPM. Execute flawless strings (accuracy = 100%) for maximum boost down the main straightaway before the final checkered flag descends!',
    category: 'technical',
  },
  {
    id: 'extr_05',
    difficulty: 'extreme',
    text: 'Challenger alert: telemetry differential indicates 0.85s gap! Deploy Sector-4 overdrive; zero typos permitted across the grid as you push your engine to the redline and capture the ultimate victory.',
    category: 'racing',
  },
];

// Pre-instantiated Passage Library
export const PASSAGE_LIBRARY: Passage[] = RAW_PASSAGES.map((raw) =>
  createPassage({
    id: raw.id,
    text: raw.text,
    difficulty: raw.difficulty,
    category: raw.category,
  })
);

/**
 * Dedicated Passage Engine managing round selection, difficulty progression,
 * and text preparation completely independent from the typing logic.
 */
export class PassageEngine {
  private library: Passage[];
  private progression: Record<number, RoundProgressionConfig>;

  constructor(
    customPassages: Passage[] = PASSAGE_LIBRARY,
    progression: Record<number, RoundProgressionConfig> = DEFAULT_ROUND_PROGRESSION
  ) {
    this.library = customPassages;
    this.progression = progression;
  }

  public getById(id: string): Passage | undefined {
    return this.library.find((p) => p.id === id);
  }

  public getByDifficulty(difficulty: Difficulty): Passage[] {
    return this.library.filter((p) => p.difficulty === difficulty);
  }

  /**
   * Deterministic or random passage selector based on difficulty and seed.
   */
  public getRandomPassage(difficulty: Difficulty, seed?: number): Passage {
    const pool = this.getByDifficulty(difficulty);
    if (pool.length === 0) return this.library[0];
    const idx =
      seed !== undefined ? Math.abs(seed) % pool.length : Math.floor(Math.random() * pool.length);
    return pool[idx];
  }

  /**
   * Selects an optimal passage for match round progression:
   * Round 1: Warmup (accessible length & flow)
   * Round 2: Pace & Rhythm (standard length)
   * Round 3: High-speed climax (longer, higher challenge)
   *
   * Avoids repeating recently typed passages.
   */
  public getPassageForRound(
    difficulty: Difficulty,
    roundNumber: number,
    seed?: number,
    excludeIds: string[] = []
  ): Passage {
    const config = this.progression[roundNumber] || this.progression[2];

    // Determine target difficulties for this round based on player difficulty setting
    let targetDifficulties: Difficulty[];
    if (roundNumber === 1) {
      targetDifficulties = ['easy', 'normal'];
    } else if (roundNumber === 2) {
      targetDifficulties = [difficulty === 'easy' ? 'easy' : 'normal'];
    } else {
      targetDifficulties = [
        difficulty === 'easy' ? 'normal' : difficulty === 'normal' ? 'hard' : 'extreme',
      ];
    }

    // Filter candidate pool
    let candidates = this.library.filter(
      (p) =>
        targetDifficulties.includes(p.difficulty) &&
        p.text.length >= config.minLength - 15 &&
        p.text.length <= config.maxLength + 25 &&
        !excludeIds.includes(p.id)
    );

    // Fallback if exclude list eliminated candidates
    if (candidates.length === 0) {
      candidates = this.library.filter((p) => targetDifficulties.includes(p.difficulty));
    }
    if (candidates.length === 0) {
      candidates = this.library;
    }

    const idx =
      seed !== undefined
        ? Math.abs(seed + roundNumber * 31) % candidates.length
        : Math.floor(Math.random() * candidates.length);

    const basePassage = candidates[idx];
    return {
      ...basePassage,
      round: roundNumber,
    };
  }

  /**
   * Creates a custom passage from player-provided or server-provided string
   */
  public preparePassage(text: string, difficulty: Difficulty = 'normal', id?: string): Passage {
    return createPassage({
      id: id || `custom_${Date.now()}`,
      text,
      difficulty,
    });
  }
}

// Global default instance for convenience
export const passageEngine = new PassageEngine();
