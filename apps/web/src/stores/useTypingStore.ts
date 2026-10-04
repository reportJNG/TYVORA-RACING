// apps/web/src/stores/useTypingStore.ts
import { create } from 'zustand';
import {
  createTypingState,
  onChar,
  onBackspace,
  onWordBackspace,
  getTypingSnapshot,
  getWordWindow,
  TypingState,
  TypingSnapshot,
  WordWindow,
  Passage,
  createPassage,
} from '@typerace/sim';
import { audioEngine } from '../audio/AudioEngine.js';

export interface TypingStoreState {
  passage: Passage;
  typingState: TypingState;
  snapshot: TypingSnapshot;
  wordWindow: WordWindow;
  version: number;

  initPassage: (passage: Passage) => void;
  initText: (target: string) => void;
  typeChar: (ch: string, tMs: number) => void;
  typeBackspace: (tMs: number) => void;
  typeWordBackspace: (tMs: number) => void;
  tickSnapshot: (tNow: number) => void;
  resetTyping: () => void;
}

const INITIAL_TEXT = 'speed wins races on the open road';
const initialPassage = createPassage({ id: 'init', text: INITIAL_TEXT, difficulty: 'normal' });
const initialSimState = createTypingState(initialPassage);

let onMistakeListener: (() => void) | null = null;

export function setTypingMistakeListener(listener: (() => void) | null) {
  onMistakeListener = listener;
}

export const useTypingStore = create<TypingStoreState>((set, get) => ({
  passage: initialPassage,
  typingState: initialSimState,
  snapshot: getTypingSnapshot(initialSimState, 0),
  wordWindow: getWordWindow(initialSimState),
  version: 0,

  initPassage: (passage: Passage) => {
    const nextState = createTypingState(passage);
    set({
      passage,
      typingState: nextState,
      snapshot: getTypingSnapshot(nextState, 0),
      wordWindow: getWordWindow(nextState),
      version: get().version + 1,
    });
  },

  initText: (target: string) => {
    const passage = createPassage({ id: `target_${Date.now()}`, text: target, difficulty: 'normal' });
    const nextState = createTypingState(passage);
    set({
      passage,
      typingState: nextState,
      snapshot: getTypingSnapshot(nextState, 0),
      wordWindow: getWordWindow(nextState),
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
      wordWindow: getWordWindow(typingState),
      version: version + 1,
    });
  },

  typeBackspace: (tMs: number) => {
    const { typingState, version } = get();
    onBackspace(typingState, tMs);
    audioEngine.playKeystroke(false);

    set({
      snapshot: getTypingSnapshot(typingState, tMs),
      wordWindow: getWordWindow(typingState),
      version: version + 1,
    });
  },

  typeWordBackspace: (tMs: number) => {
    const { typingState, version } = get();
    onWordBackspace(typingState, tMs);
    audioEngine.playKeystroke(false);

    set({
      snapshot: getTypingSnapshot(typingState, tMs),
      wordWindow: getWordWindow(typingState),
      version: version + 1,
    });
  },

  tickSnapshot: (tNow: number) => {
    const { typingState } = get();
    set({
      snapshot: getTypingSnapshot(typingState, tNow),
    });
  },

  resetTyping: () => {
    const { passage } = get();
    const nextState = createTypingState(passage);
    set({
      typingState: nextState,
      snapshot: getTypingSnapshot(nextState, 0),
      wordWindow: getWordWindow(nextState),
      version: get().version + 1,
    });
  },
}));
