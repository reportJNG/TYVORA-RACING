// apps/web/test/typing.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useTypingStore } from '../src/stores/useTypingStore.js';
import { passageEngine } from '@typerace/sim';

describe('Web Typing Store & Word Window Integration', () => {
  beforeEach(() => {
    useTypingStore.getState().resetTyping();
  });

  it('initializes with passage and builds initial word window', () => {
    const passage = passageEngine.getPassageForRound('normal', 1, 42);
    useTypingStore.getState().initPassage(passage);

    const { typingState, snapshot, wordWindow } = useTypingStore.getState();
    expect(typingState.target).toBe(passage.text);
    expect(snapshot.target).toBe(passage.text);
    expect(wordWindow.blocks.length).toBeGreaterThan(0);
    expect(wordWindow.currentWordIndex).toBe(0);
    expect(wordWindow.blocks[0].status).toBe('current');
  });

  it('updates word window smoothly as words are completed', () => {
    const passage = passageEngine.getPassageForRound('easy', 1, 99);
    useTypingStore.getState().initPassage(passage);

    const firstWord = passage.words[0].word;

    // Type the first word characters
    let t = 100;
    for (const ch of firstWord) {
      useTypingStore.getState().typeChar(ch, t);
      t += 60;
    }

    // Word 0 is still current until space is typed
    expect(useTypingStore.getState().wordWindow.currentWordIndex).toBe(0);

    // Type trailing space
    useTypingStore.getState().typeChar(' ', t);
    t += 60;

    // Now current word advances to 1
    const { wordWindow } = useTypingStore.getState();
    expect(wordWindow.currentWordIndex).toBe(1);
    expect(wordWindow.blocks[0].status).toBe('completed');
    expect(wordWindow.blocks[0].isFullyCorrect).toBe(true);
    expect(wordWindow.blocks[1].status).toBe('current');
  });

  it('handles backspace typo correction in real time', () => {
    const passage = passageEngine.getPassageForRound('normal', 2, 7);
    useTypingStore.getState().initPassage(passage);

    const firstChar = passage.text[0];
    const wrongChar = firstChar === 'z' ? 'a' : 'z';

    // Type typo
    useTypingStore.getState().typeChar(wrongChar, 100);
    expect(useTypingStore.getState().snapshot.wrongCount).toBe(1);
    expect(useTypingStore.getState().wordWindow.blocks[0].hasMistake).toBe(true);

    // Backspace
    useTypingStore.getState().typeBackspace(150);
    expect(useTypingStore.getState().snapshot.wrongCount).toBe(0);
    expect(useTypingStore.getState().snapshot.K).toBe(0);

    // Type correct
    useTypingStore.getState().typeChar(firstChar, 200);
    expect(useTypingStore.getState().snapshot.correctCount).toBe(1);
    expect(useTypingStore.getState().snapshot.wrongCount).toBe(0);
    expect(useTypingStore.getState().wordWindow.blocks[0].hasMistake).toBe(false);
  });

  it('handles ultra-fast typing stream simulation (140+ WPM)', () => {
    const passage = passageEngine.getPassageForRound('easy', 1, 12);
    useTypingStore.getState().initPassage(passage);

    let t = 100;
    for (let i = 0; i < passage.text.length; i++) {
      useTypingStore.getState().typeChar(passage.text[i], t);
      t += 75; // ~160 WPM cadence
    }

    const { snapshot, wordWindow } = useTypingStore.getState();
    expect(snapshot.isComplete).toBe(true);
    expect(snapshot.accuracy).toBe(100);
    expect(wordWindow.isComplete).toBe(true);
  });
});
