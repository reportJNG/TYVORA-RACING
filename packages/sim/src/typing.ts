// packages/sim/src/typing.ts
import { BURST_WINDOW_MS } from './constants.js';
import { Passage, createPassage, PassageWord } from './passage.js';

export type PositionState = 0 | 1 | 2 | 3; // 0: pending, 1: correct, 2: wrong, 3: current

export type KeystrokeEntry =
  | [t: number, ch: string]
  | [t: number, 'BS']
  | [t: number, 'WBS'];

export interface TypingEvent {
  type: 'correct' | 'mistake' | 'backspace' | 'ignored_full' | 'ignored_empty' | 'ignored_space_redundant';
  index?: number;
  t: number;
  char?: string;
  autoJumpedSpace?: boolean;
}

export interface TypingState {
  target: string;
  passage?: Passage;
  words: PassageWord[];
  L: number; // target length
  buffer: string[];
  K: number; // cursor index (buffer length)
  C: number; // correct count currently in buffer
  W: number; // wrong count currently in buffer
  mistakes: number; // cumulative mistakes count
  totalKeystrokes: number;
  correctKeystrokes: number;
  backspaces: number;
  streak: number;
  longestStreak: number;
  completedAt: number | null; // race ms when completed
  correctKeyTimes: number[]; // timestamps of correct keystrokes for burst WPM
  log: KeystrokeEntry[];
  smoothedWpm: number;
  autoAdvanceSpace: boolean; // space auto-jump on word completion
}

export interface TypingSnapshot {
  target: string;
  K: number;
  states: Uint8Array;
  correctCount: number;
  wrongCount: number;
  mistakes: number;
  streak: number;
  longestStreak: number;
  liveWpm: number;
  smoothedWpm: number;
  accuracy: number;
  accuracyFloat: number;
  isFullWithErrors: boolean;
  isComplete: boolean;
  completedAt: number | null;
  progress: number;
  currentWordIndex: number;
  totalWords: number;
  autoAdvanceSpace: boolean;
}

export interface WordCharacterState {
  char: string;
  index: number;
  state: PositionState; // 0: pending, 1: correct, 2: wrong, 3: current
  isCursor: boolean;
}

export interface WordWindowBlock {
  wordIndex: number;
  word: string;
  startIndex: number;
  endIndex: number;
  status: 'completed' | 'current' | 'upcoming';
  characters: WordCharacterState[];
  hasMistake: boolean;
  isFullyCorrect: boolean;
  hasTrailingSpace: boolean;
  trailingSpaceState?: PositionState;
  isTrailingSpaceCursor?: boolean;
}

export interface WordWindowOptions {
  pastWords?: number;   // default 1 (for smooth sliding drop animation)
  futureWords?: number; // default 4 (total 5 active words ahead for high-speed eye lead)
}

export interface WordWindow {
  blocks: WordWindowBlock[];
  currentWordIndex: number;
  totalWords: number;
  cursorCharIndex: number;
  cursorInCurrentWordIndex: number;
  isComplete: boolean;
  isFullWithErrors: boolean;
}

export interface CreateTypingStateOptions {
  autoAdvanceSpace?: boolean;
}

export function createTypingState(
  targetOrPassage: string | Passage,
  options?: CreateTypingStateOptions
): TypingState {
  const isPassage = typeof targetOrPassage !== 'string' && 'words' in targetOrPassage;
  const target = isPassage ? targetOrPassage.text : (targetOrPassage as string);
  const passage = isPassage
    ? (targetOrPassage as Passage)
    : createPassage({ id: 'adhoc', text: target, difficulty: 'normal' });

  return {
    target,
    passage,
    words: passage.words,
    L: target.length,
    buffer: [],
    K: 0,
    C: 0,
    W: 0,
    mistakes: 0,
    totalKeystrokes: 0,
    correctKeystrokes: 0,
    backspaces: 0,
    streak: 0,
    longestStreak: 0,
    completedAt: null,
    correctKeyTimes: [],
    log: [],
    smoothedWpm: 0,
    autoAdvanceSpace: options?.autoAdvanceSpace ?? true,
  };
}

/**
 * Handles character input according to the Golden Rule:
 * Every character position evaluates independently.
 * Mistakes never cascade.
 *
 * Includes Space Auto-Jump:
 * When a word is cleanly completed, the following space is jumped automatically
 * so typists never have to think about clicking space. If a typist instinctively
 * taps space right after, it is smoothly absorbed without error.
 */
export function onChar(state: TypingState, ch: string, t: number): TypingEvent {
  if (state.K >= state.L) {
    return { type: 'ignored_full', t, char: ch };
  }

  // Redundant Space Absorption:
  // If typist naturally taps space right after a word was completed and space auto-jumped,
  // absorb it safely without recording a typo or resetting the streak.
  if (
    ch === ' ' &&
    state.K > 0 &&
    state.buffer[state.K - 1] === ' ' &&
    state.K < state.L &&
    state.target[state.K] !== ' '
  ) {
    return { type: 'ignored_space_redundant', index: state.K - 1, t, char: ' ' };
  }

  const expected = state.target[state.K];
  const ok = ch === expected;

  state.buffer.push(ch);
  state.K += 1;
  state.totalKeystrokes += 1;
  state.log.push([Math.round(t), ch]);

  if (ok) {
    state.correctKeystrokes += 1;
    state.C += 1;
    state.streak += 1;
    state.longestStreak = Math.max(state.longestStreak, state.streak);
    state.correctKeyTimes.push(t);
  } else {
    state.mistakes += 1;
    state.W += 1;
    state.streak = 0;
  }

  // SPACE AUTO-JUMP:
  // If word completed cleanly with zero mistakes, jump over the space directly!
  let autoJumped = false;
  if (
    ok &&
    state.autoAdvanceSpace !== false &&
    state.K < state.L &&
    state.target[state.K] === ' ' &&
    state.W === 0
  ) {
    state.buffer.push(' ');
    state.K += 1;
    state.totalKeystrokes += 1;
    state.correctKeystrokes += 1;
    state.C += 1;
    state.streak += 1;
    state.longestStreak = Math.max(state.longestStreak, state.streak);
    state.correctKeyTimes.push(t);
    state.log.push([Math.round(t), ' ']);
    autoJumped = true;
  }

  // Check completion criteria: must reach end of target with ZERO wrong characters
  if (state.K === state.L && state.W === 0 && state.completedAt === null) {
    state.completedAt = t;
  }

  return {
    type: ok ? 'correct' : 'mistake',
    index: autoJumped ? state.K - 2 : state.K - 1,
    t,
    char: ch,
    autoJumpedSpace: autoJumped,
  };
}

/**
 * Handles Backspace navigation and correction:
 * - Backspace is a first-class navigation/correction operation, NEVER an extra mistake
 * - Pops the last typed character from the buffer
 * - Updates correct/wrong count accordingly
 * - Resets completion status if backspacing after finishing
 */
export function onBackspace(state: TypingState, t: number): TypingEvent {
  if (state.K === 0) {
    return { type: 'ignored_empty', t };
  }

  state.K -= 1;
  const removed = state.buffer.pop()!;
  state.backspaces += 1;
  state.log.push([Math.round(t), 'BS']);

  if (removed === state.target[state.K]) {
    state.C -= 1;
  } else {
    state.W -= 1;
  }

  // Reset completedAt if backspacing from full
  if (state.K < state.L || state.W > 0) {
    state.completedAt = null;
  }

  return { type: 'backspace', index: state.K, t };
}

/**
 * Handles Word-level Backspace (Ctrl+Backspace / Alt+Backspace / Option+Backspace)
 * Cleans back to the previous word boundary without creating fake mistakes.
 */
export function onWordBackspace(state: TypingState, t: number): TypingEvent[] {
  if (state.K === 0) {
    return [{ type: 'ignored_empty', t }];
  }

  const events: TypingEvent[] = [];
  state.log.push([Math.round(t), 'WBS']);

  let deletedAnyNonSpace = false;
  while (state.K > 0) {
    const prevChar = state.buffer[state.K - 1];
    if (prevChar === ' ' && deletedAnyNonSpace) {
      break;
    }

    state.K -= 1;
    const removed = state.buffer.pop()!;
    state.backspaces += 1;

    if (removed !== ' ') {
      deletedAnyNonSpace = true;
    }

    if (removed === state.target[state.K]) {
      state.C -= 1;
    } else {
      state.W -= 1;
    }

    events.push({ type: 'backspace', index: state.K, t });
  }

  if (state.K < state.L || state.W > 0) {
    state.completedAt = null;
  }

  return events;
}

export function burstWpm(state: TypingState, tNow: number): number {
  if (state.correctKeyTimes.length === 0 || tNow <= 0) return 0;

  const windowStart = Math.max(0, tNow - BURST_WINDOW_MS);
  let count = 0;
  for (let i = state.correctKeyTimes.length - 1; i >= 0; i--) {
    const kt = state.correctKeyTimes[i];
    if (kt >= windowStart) {
      count++;
    } else {
      break;
    }
  }

  const effectiveWindow = Math.min(BURST_WINDOW_MS, Math.max(500, tNow));
  const minutes = effectiveWindow / 60000;
  return (count / 5) / minutes;
}

export function liveWpm(state: TypingState, tNow: number): number {
  if (tNow < 1000) return 0;
  const minutes = tNow / 60000;
  return Math.round((state.C / 5) / minutes);
}

export function computeSmoothedWpm(state: TypingState, tNow: number): number {
  if (tNow < 800) return 0;
  const rawLive = (state.C / 5) / (tNow / 60000);
  const burst = burstWpm(state, tNow);

  // Blend cumulative and burst for a rock-solid, jitter-free live reading
  const blended = tNow < 3000 ? 0.6 * burst + 0.4 * rawLive : 0.75 * rawLive + 0.25 * burst;
  state.smoothedWpm = Math.round(blended);
  return state.smoothedWpm;
}

export function finalWpm(state: TypingState): number {
  if (!state.completedAt || state.completedAt <= 0) return 0;
  const minutes = state.completedAt / 60000;
  return Number(((state.L / 5) / minutes).toFixed(1));
}

export function accuracyPercentage(state: TypingState): number {
  if (state.totalKeystrokes === 0) return 100;
  return Math.min(100, Math.floor((state.correctKeystrokes / state.totalKeystrokes) * 100));
}

export function accuracyFloatPercentage(state: TypingState): number {
  if (state.totalKeystrokes === 0) return 100;
  return Number(Math.min(100, (state.correctKeystrokes / state.totalKeystrokes) * 100).toFixed(1));
}

/**
 * Finds the index of the word currently being typed based on cursor index K
 */
export function getCurrentWordIndex(words: PassageWord[], K: number, L: number): number {
  if (words.length === 0) return 0;
  if (K >= L) return Math.max(0, words.length - 1);

  for (let i = 0; i < words.length; i++) {
    const nextStart = i < words.length - 1 ? words[i + 1].startIndex : L;
    if (K < nextStart) {
      return i;
    }
  }

  return words.length - 1;
}

/**
 * Generates an immutable snapshot of current typing metrics and character states
 */
export function getTypingSnapshot(state: TypingState, tNow: number): TypingSnapshot {
  const states = new Uint8Array(state.L);
  for (let i = 0; i < state.L; i++) {
    if (i < state.K) {
      states[i] = state.buffer[i] === state.target[i] ? 1 : 2;
    } else if (i === state.K) {
      states[i] = 3; // current cursor
    } else {
      states[i] = 0; // pending
    }
  }

  const currentWordIndex = getCurrentWordIndex(state.words, state.K, state.L);

  return {
    target: state.target,
    K: state.K,
    states,
    correctCount: state.C,
    wrongCount: state.W,
    mistakes: state.mistakes,
    streak: state.streak,
    longestStreak: state.longestStreak,
    liveWpm: liveWpm(state, tNow),
    smoothedWpm: computeSmoothedWpm(state, tNow),
    accuracy: accuracyPercentage(state),
    accuracyFloat: accuracyFloatPercentage(state),
    isFullWithErrors: state.K === state.L && state.W > 0,
    isComplete: state.K === state.L && state.W === 0,
    completedAt: state.completedAt,
    progress: state.L > 0 ? Number((state.K / state.L).toFixed(3)) : 0,
    currentWordIndex,
    totalWords: state.words.length,
    autoAdvanceSpace: state.autoAdvanceSpace,
  };
}

/**
 * Generates the focused 5-Word Window model.
 * Exposes 1 completed word on the left (dropping smoothly off) + 1 current active word + 3-4 upcoming words.
 * Gives the typist a clean, uncluttered 5-word view for maximum speed.
 */
export function getWordWindow(
  state: TypingState,
  options: WordWindowOptions = {}
): WordWindow {
  const pastWords = options.pastWords ?? 1; // 1 completed word gracefully dropping away
  const futureWords = options.futureWords ?? 4; // 4 upcoming words (total 5 active ahead)

  const words = state.words;
  const totalWords = words.length;
  const currentWordIndex = getCurrentWordIndex(words, state.K, state.L);

  const startWordIdx = Math.max(0, currentWordIndex - pastWords);
  const endWordIdx = Math.min(totalWords - 1, currentWordIndex + futureWords);

  const blocks: WordWindowBlock[] = [];

  for (let wIdx = startWordIdx; wIdx <= endWordIdx; wIdx++) {
    const wordDef = words[wIdx];
    const isCurrent = wIdx === currentWordIndex;
    const isPast = wIdx < currentWordIndex;

    const charStates: WordCharacterState[] = [];
    let wordHasMistake = false;
    let wordAllCorrect = true;

    for (let cIdx = wordDef.startIndex; cIdx < wordDef.endIndex; cIdx++) {
      const char = state.target[cIdx];
      let posState: PositionState = 0;
      const isCursor = cIdx === state.K;

      if (cIdx < state.K) {
        const isOk = state.buffer[cIdx] === char;
        posState = isOk ? 1 : 2;
        if (!isOk) wordHasMistake = true;
        if (!isOk) wordAllCorrect = false;
      } else if (cIdx === state.K) {
        posState = 3;
        wordAllCorrect = false;
      } else {
        posState = 0;
        wordAllCorrect = false;
      }

      charStates.push({
        char,
        index: cIdx,
        state: posState,
        isCursor,
      });
    }

    // Trailing space check
    const hasTrailingSpace = wordDef.endIndex < state.L && state.target[wordDef.endIndex] === ' ';
    let trailingSpaceState: PositionState | undefined;
    let isTrailingSpaceCursor: boolean | undefined;

    if (hasTrailingSpace) {
      const spaceIdx = wordDef.endIndex;
      isTrailingSpaceCursor = spaceIdx === state.K;

      if (spaceIdx < state.K) {
        const spaceOk = state.buffer[spaceIdx] === ' ';
        trailingSpaceState = spaceOk ? 1 : 2;
        if (!spaceOk) wordHasMistake = true;
      } else if (spaceIdx === state.K) {
        trailingSpaceState = 3;
      } else {
        trailingSpaceState = 0;
      }
    }

    blocks.push({
      wordIndex: wIdx,
      word: wordDef.word,
      startIndex: wordDef.startIndex,
      endIndex: wordDef.endIndex,
      status: isCurrent ? 'current' : isPast ? 'completed' : 'upcoming',
      characters: charStates,
      hasMistake: wordHasMistake,
      isFullyCorrect: isPast && wordAllCorrect && !wordHasMistake,
      hasTrailingSpace,
      trailingSpaceState,
      isTrailingSpaceCursor,
    });
  }

  const currentWord = words[currentWordIndex];
  const cursorInCurrentWordIndex = currentWord
    ? Math.max(0, state.K - currentWord.startIndex)
    : 0;

  return {
    blocks,
    currentWordIndex,
    totalWords,
    cursorCharIndex: state.K,
    cursorInCurrentWordIndex,
    isComplete: state.K === state.L && state.W === 0,
    isFullWithErrors: state.K === state.L && state.W > 0,
  };
}

/**
 * Clean Object-Oriented Session Contract for the Typing Engine
 */
export class TypingSession {
  public state: TypingState;
  public passage: Passage;

  constructor(targetOrPassage: string | Passage, options?: CreateTypingStateOptions) {
    if (typeof targetOrPassage === 'string') {
      this.passage = createPassage({
        id: `session_${Date.now()}`,
        text: targetOrPassage,
        difficulty: 'normal',
      });
    } else {
      this.passage = targetOrPassage;
    }
    this.state = createTypingState(this.passage, options);
  }

  public handleCharacter(char: string, tMs: number): TypingEvent {
    return onChar(this.state, char, tMs);
  }

  public handleBackspace(tMs: number): TypingEvent {
    return onBackspace(this.state, tMs);
  }

  public handleWordBackspace(tMs: number): TypingEvent[] {
    return onWordBackspace(this.state, tMs);
  }

  public getState(): Readonly<TypingState> {
    return this.state;
  }

  public getSnapshot(tNow: number): TypingSnapshot {
    return getTypingSnapshot(this.state, tNow);
  }

  public getWordWindow(options?: WordWindowOptions): WordWindow {
    return getWordWindow(this.state, options);
  }

  public getProgress(): number {
    return this.state.L > 0 ? Number((this.state.K / this.state.L).toFixed(3)) : 0;
  }

  public getLiveWpm(tNow: number): number {
    return liveWpm(this.state, tNow);
  }

  public getSmoothedWpm(tNow: number): number {
    return computeSmoothedWpm(this.state, tNow);
  }

  public getFinalWpm(): number {
    return finalWpm(this.state);
  }

  public getAccuracy(): number {
    return accuracyPercentage(this.state);
  }

  public isComplete(): boolean {
    return this.state.K === this.state.L && this.state.W === 0;
  }

  public reset(): void {
    this.state = createTypingState(this.passage, {
      autoAdvanceSpace: this.state.autoAdvanceSpace,
    });
  }
}

export function createTypingSession(
  targetOrPassage: string | Passage,
  options?: CreateTypingStateOptions
): TypingSession {
  return new TypingSession(targetOrPassage, options);
}

export function cloneTypingState(src: TypingState): TypingState {
  return {
    target: src.target,
    passage: src.passage,
    words: src.words,
    L: src.L,
    buffer: [...src.buffer],
    K: src.K,
    C: src.C,
    W: src.W,
    mistakes: src.mistakes,
    totalKeystrokes: src.totalKeystrokes,
    correctKeystrokes: src.correctKeystrokes,
    backspaces: src.backspaces,
    streak: src.streak,
    longestStreak: src.longestStreak,
    completedAt: src.completedAt,
    correctKeyTimes: [...src.correctKeyTimes],
    log: [...src.log],
    smoothedWpm: src.smoothedWpm,
    autoAdvanceSpace: src.autoAdvanceSpace,
  };
}
