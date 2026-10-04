// packages/sim/test/typing.test.ts
import { describe, it, expect } from 'vitest';
import {
  createTypingState,
  onChar,
  onBackspace,
  onWordBackspace,
  getTypingSnapshot,
  getWordWindow,
  createTypingSession,
  finalWpm,
  accuracyPercentage,
  accuracyFloatPercentage,
} from '../src/typing.js';
import { createPassage } from '../src/passage.js';

describe('Typing Engine & Word Window System', () => {
  it('implements exact typing (Case 1: HELLO -> HELLO)', () => {
    const state = createTypingState('HELLO');
    for (let i = 0; i < 'HELLO'.length; i++) {
      const res = onChar(state, 'HELLO'[i], (i + 1) * 100);
      expect(res.type).toBe('correct');
    }

    expect(state.C).toBe(5);
    expect(state.W).toBe(0);
    expect(state.mistakes).toBe(0);
    expect(state.K).toBe(5);
    expect(state.completedAt).toBe(500);

    const snapshot = getTypingSnapshot(state, 500);
    expect(snapshot.isComplete).toBe(true);
    expect(snapshot.states.every((s) => s === 1)).toBe(true);
    expect(snapshot.accuracy).toBe(100);
    expect(snapshot.progress).toBe(1);
  });

  it('implements independent position evaluation (Golden Rule: mistakes never cascade)', () => {
    // Target: "HELLO"
    // Player types: "HELOO"
    const state = createTypingState('HELLO');

    onChar(state, 'H', 100);
    onChar(state, 'E', 200);
    onChar(state, 'L', 300);
    onChar(state, 'O', 400); // Index 3 is 'O' instead of 'L' -> Mistake!
    onChar(state, 'O', 500); // Index 4 is 'O' matching target 'O' -> Correct!

    expect(state.C).toBe(4);
    expect(state.W).toBe(1);
    expect(state.mistakes).toBe(1);
    expect(state.K).toBe(5);
    expect(state.completedAt).toBeNull(); // Cannot complete with errors

    const snapshot = getTypingSnapshot(state, 500);
    expect(snapshot.states[0]).toBe(1); // 'H' correct
    expect(snapshot.states[1]).toBe(1); // 'E' correct
    expect(snapshot.states[2]).toBe(1); // 'L' correct
    expect(snapshot.states[3]).toBe(2); // 'O' wrong
    expect(snapshot.states[4]).toBe(1); // 'O' correct (independent evaluation!)
    expect(snapshot.isFullWithErrors).toBe(true);
    expect(snapshot.isComplete).toBe(false);
  });

  it('implements backspace and full correction (HELOO -> BS -> BS -> L -> O -> HELLO)', () => {
    const state = createTypingState('HELLO');

    onChar(state, 'H', 100);
    onChar(state, 'E', 200);
    onChar(state, 'L', 300);
    onChar(state, 'O', 400); // Typo
    onChar(state, 'O', 500); // Typo continuation

    expect(state.W).toBe(1);
    expect(state.K).toBe(5);

    // Backspace once: removes 'O' at index 4 (which was correct)
    onBackspace(state, 550);
    expect(state.K).toBe(4);
    expect(state.buffer.join('')).toBe('HELO');

    // Backspace twice: removes 'O' at index 3 (which was the typo!)
    onBackspace(state, 600);
    expect(state.K).toBe(3);
    expect(state.buffer.join('')).toBe('HEL');
    expect(state.W).toBe(0); // Typo eliminated!

    // Backspace does NOT increment mistakes
    expect(state.mistakes).toBe(1);
    expect(state.backspaces).toBe(2);

    // Now type correct 'L' and 'O'
    onChar(state, 'L', 650);
    onChar(state, 'O', 700);

    expect(state.K).toBe(5);
    expect(state.C).toBe(5);
    expect(state.W).toBe(0);
    expect(state.completedAt).toBe(700);

    const snapshot = getTypingSnapshot(state, 700);
    expect(snapshot.isComplete).toBe(true);
    expect(snapshot.isFullWithErrors).toBe(false);
    expect(snapshot.states.every((s) => s === 1)).toBe(true);
  });

  it('handles multiple mistakes in different positions across words', () => {
    const target = 'clean fast racer';
    const state = createTypingState(target);

    // Type "xlean fsst racer"
    const input = 'xlean fsst racer';
    for (let i = 0; i < input.length; i++) {
      onChar(state, input[i], (i + 1) * 50);
    }

    expect(state.mistakes).toBe(2); // 'x' at 0, 's' at 7
    expect(state.W).toBe(2);
    expect(state.C).toBe(14);
    expect(state.K).toBe(target.length);
    expect(state.completedAt).toBeNull(); // Blocked by mistakes

    const snapshot = getTypingSnapshot(state, 1000);
    expect(snapshot.isFullWithErrors).toBe(true);
    expect(snapshot.isComplete).toBe(false);
    expect(snapshot.states[0]).toBe(2); // 'x' wrong
    expect(snapshot.states[7]).toBe(2); // 's' wrong
    expect(snapshot.states[1]).toBe(1); // 'l' correct
    expect(snapshot.states[8]).toBe(1); // 't' correct
  });

  it('handles word-backspace across spaces and word boundaries cleanly', () => {
    const state = createTypingState('the quick brown fox');

    for (let i = 0; i < 'the quick bro'.length; i++) {
      onChar(state, 'the quick bro'[i], i * 50);
    }

    expect(state.K).toBe(13); // Cursor after 'bro'
    onWordBackspace(state, 700);

    // Deletes 'bro' back to space
    expect(state.buffer.join('')).toBe('the quick ');
    expect(state.K).toBe(10);

    // Another word backspace: should delete trailing space AND 'quick'
    onWordBackspace(state, 750);
    expect(state.buffer.join('')).toBe('the ');
    expect(state.K).toBe(4);
  });

  it('verifies ultra-high speed typing (140+ WPM / 200 WPM burst)', () => {
    const target = 'the fastest driver wins every championship with raw precision and focus';
    const state = createTypingState(target);

    // Simulate 150 WPM (approx 80ms per character)
    for (let i = 0; i < target.length; i++) {
      onChar(state, target[i], i * 80);
    }

    expect(state.C).toBe(target.length);
    expect(state.W).toBe(0);
    expect(state.K === state.L && state.W === 0).toBe(true);
    expect(accuracyPercentage(state)).toBe(100);
    expect(finalWpm(state)).toBeGreaterThanOrEqual(140);
  });

  it('computes word window with eye-lead (past, current, and upcoming words)', () => {
    const passage = createPassage({
      id: 'win_test',
      text: 'the quick brown fox jumps over the lazy dog and accelerates',
      difficulty: 'normal',
    });

    const state = createTypingState(passage);

    // Initial state: cursor at 0 ("the")
    let window = getWordWindow(state, { pastWords: 1, futureWords: 4 });
    expect(window.currentWordIndex).toBe(0);
    expect(window.blocks.map((b) => b.word)).toEqual(['the', 'quick', 'brown', 'fox', 'jumps']);
    expect(window.blocks[0].status).toBe('current');
    expect(window.blocks[1].status).toBe('upcoming');
    expect(window.blocks[0].characters[0].isCursor).toBe(true);

    // Type "the " (advance to "quick")
    for (const ch of 'the ') {
      onChar(state, ch, 100);
    }

    window = getWordWindow(state, { pastWords: 1, futureWords: 4 });
    expect(window.currentWordIndex).toBe(1); // "quick"
    expect(window.blocks.map((b) => b.word)).toEqual(['the', 'quick', 'brown', 'fox', 'jumps', 'over']);
    expect(window.blocks[0].status).toBe('completed');
    expect(window.blocks[0].isFullyCorrect).toBe(true);
    expect(window.blocks[1].status).toBe('current');
    expect(window.blocks[2].status).toBe('upcoming');

    // Type "quick " and "brown " (advance to "fox")
    for (const ch of 'quick brown ') {
      onChar(state, ch, 100);
    }

    window = getWordWindow(state, { pastWords: 1, futureWords: 4 });
    expect(window.currentWordIndex).toBe(3); // "fox"
    // Past word visible for context: "brown", current: "fox", upcoming: "jumps", "over", "the", "lazy"
    expect(window.blocks[0].word).toBe('brown');
    expect(window.blocks[1].word).toBe('fox');
    expect(window.blocks[1].status).toBe('current');
  });

  it('provides clean object-oriented TypingSession API contract', () => {
    const session = createTypingSession('type fast');

    expect(session.isComplete()).toBe(false);
    expect(session.getProgress()).toBe(0);

    session.handleCharacter('t', 100);
    session.handleCharacter('y', 200);
    session.handleCharacter('p', 300);
    session.handleCharacter('e', 400);
    session.handleCharacter(' ', 500);

    expect(session.getProgress()).toBe(0.556);
    expect(session.getState().C).toBe(5);

    // Type rest
    session.handleCharacter('f', 600);
    session.handleCharacter('a', 700);
    session.handleCharacter('s', 800);
    session.handleCharacter('t', 900);

    expect(session.isComplete()).toBe(true);
    expect(session.getAccuracy()).toBe(100);
    expect(session.getFinalWpm()).toBeGreaterThan(0);
  });

  it('automatically jumps space when word finishes cleanly without forcing space click', () => {
    const state = createTypingState('drive fast win');

    // Type "drive"
    onChar(state, 'd', 100);
    onChar(state, 'r', 150);
    onChar(state, 'i', 200);
    onChar(state, 'v', 250);
    const lastEvent = onChar(state, 'e', 300);

    // Auto-jump triggered!
    expect(lastEvent.autoJumpedSpace).toBe(true);
    expect(state.buffer.join('')).toBe('drive ');
    expect(state.K).toBe(6); // cursor is already at index 6 ('f')
    expect(state.C).toBe(6);

    // Typist instinctively presses Spacebar right after - should absorb cleanly without mistake!
    const redundantEvent = onChar(state, ' ', 320);
    expect(redundantEvent.type).toBe('ignored_space_redundant');
    expect(state.W).toBe(0);
    expect(state.mistakes).toBe(0);
    expect(state.streak).toBe(6);

    // Type "fast"
    onChar(state, 'f', 400);
    onChar(state, 'a', 450);
    onChar(state, 's', 500);
    onChar(state, 't', 550);

    expect(state.buffer.join('')).toBe('drive fast ');
    expect(state.K).toBe(11); // cursor already at 'w'

    // Type "win"
    onChar(state, 'w', 600);
    onChar(state, 'i', 650);
    onChar(state, 'n', 700);

    expect(state.K).toBe(14);
    expect(state.W).toBe(0);
    expect(state.completedAt).toBe(700);
    expect(getTypingSnapshot(state, 700).isComplete).toBe(true);
  });
});
