// apps/web/src/stores/useTypingStore.ts
import { create } from 'zustand';
import {
  createTypingState,
  onChar,
  onBackspace,
  onWordBackspace,
  getTypingSnapshot,
  TypingState,
  TypingSnapshot,
} from '@typerace/sim';
import { audioEngine } from '../audio/AudioEngine.js';

export interface TypingStoreState {
  typingState: TypingState;
  snapshot: TypingSnapshot;
  version: number;

  initText: (target: string) => void;
  typeChar: (ch: string, tMs: number) => void;
  typeBackspace: (tMs: number) => void;
  typeWordBackspace: (tMs: number) => void;
  tickSnapshot: (tNow: number) => void;
  resetTyping: () => void;
}

const INITIAL_TEXT = 'speed wins races on the open road';
const initialSimState = createTypingState(INITIAL_TEXT);

let onMistakeListener: (() => void) | null = null;

export function setTypingMistakeListener(listener: (() => void) | null) {
  onMistakeListener = listener;
}

export const useTypingStore = create<TypingStoreState>((set, get) => ({
  typingState: initialSimState,
  snapshot: getTypingSnapshot(initialSimState, 0),
  version: 0,

  initText: (target: string) => {
    const nextState = createTypingState(target);
    set({
      typingState: nextState,
      snapshot: getTypingSnapshot(nextState, 0),
      version: get().version + 1,
    });
  },

  typeChar: (ch: string, tMs: number) => {
    const { typingState, version } = get();
    const event = onChar(typingState, ch, tMs);

    if (event.type === 'correct') {
      audioEngine.playKeystroke(ch === ' ');
      if (typingState.streak > 0 && typingState.streak % 10 === 0) {
        audioEngine.playStreakMilestone(typingState.streak);
      }
    } else if (event.type === 'mistake') {
      audioEngine.playKeystroke(ch === ' ');
      audioEngine.triggerMistakeBogDown();
      if (onMistakeListener) {
        onMistakeListener();
      }
    }

    set({
      snapshot: getTypingSnapshot(typingState, tMs),
      version: version + 1,
    });
  },

  typeBackspace: (tMs: number) => {
    const { typingState, version } = get();
    onBackspace(typingState, tMs);
    audioEngine.playKeystroke(false);

    set({
      snapshot: getTypingSnapshot(typingState, tMs),
      version: version + 1,
    });
  },

  typeWordBackspace: (tMs: number) => {
    const { typingState, version } = get();
    onWordBackspace(typingState, tMs);
    audioEngine.playKeystroke(false);

    set({
      snapshot: getTypingSnapshot(typingState, tMs),
      version: version + 1,
    });
  },

  tickSnapshot: (tNow: number) => {
    const { typingState } = get();
    set({ snapshot: getTypingSnapshot(typingState, tNow) });
  },

  resetTyping: () => {
    const { typingState } = get();
    const nextState = createTypingState(typingState.target);
    set({
      typingState: nextState,
      snapshot: getTypingSnapshot(nextState, 0),
      version: get().version + 1,
    });
  },
}));
