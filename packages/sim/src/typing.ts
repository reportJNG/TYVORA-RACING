// packages/sim/src/typing.ts
import { BURST_WINDOW_MS } from './constants.js';

export type PositionState = 0 | 1 | 2 | 3; // 0: pending, 1: correct, 2: wrong, 3: current

export type KeystrokeEntry =
  | [t: number, ch: string]
  | [t: number, 'BS']
  | [t: number, 'WBS'];

export interface TypingEvent {
  type: 'correct' | 'mistake' | 'backspace' | 'ignored_full' | 'ignored_empty';
  index?: number;
  t: number;
}

export interface TypingState {
  target: string;
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
  accuracy: number;
  isFullWithErrors: boolean;
  isComplete: boolean;
  completedAt: number | null;
}

export function createTypingState(target: string): TypingState {
  return {
    target,
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
  };
}

export function onChar(state: TypingState, ch: string, t: number): TypingEvent {
  if (state.K >= state.L) {
    return { type: 'ignored_full', t };
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

  if (state.K === state.L && state.W === 0 && state.completedAt === null) {
    state.completedAt = t;
  }

  return { type: ok ? 'correct' : 'mistake', index: state.K - 1, t };
}

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

  // If backspacing while completed (rare), reset completion
  if (state.K < state.L || state.W > 0) {
    state.completedAt = null;
  }

  return { type: 'backspace', index: state.K, t };
}

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
  // Count correct keystrokes in [windowStart, tNow]
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

export function finalWpm(state: TypingState): number {
  if (!state.completedAt || state.completedAt <= 0) return 0;
  const minutes = state.completedAt / 60000;
  return Number(((state.L / 5) / minutes).toFixed(1));
}

export function accuracyPercentage(state: TypingState): number {
  if (state.totalKeystrokes === 0) return 100;
  // Floored so that any mistake prevents 100%
  return Math.min(100, Math.floor((state.correctKeystrokes / state.totalKeystrokes) * 100));
}

export function getTypingSnapshot(state: TypingState, tNow: number): TypingSnapshot {
  const states = new Uint8Array(state.L);
  for (let i = 0; i < state.L; i++) {
    if (i < state.K) {
      states[i] = state.buffer[i] === state.target[i] ? 1 : 2;
    } else if (i === state.K) {
      states[i] = 3; // current
    } else {
      states[i] = 0; // pending
    }
  }

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
    accuracy: accuracyPercentage(state),
    isFullWithErrors: state.K === state.L && state.W > 0,
    isComplete: state.K === state.L && state.W === 0,
    completedAt: state.completedAt,
  };
}
