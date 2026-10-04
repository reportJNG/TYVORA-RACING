// packages/sim/test/typing.test.ts
import { describe, it, expect } from 'vitest';
import {
  createTypingState,
  onChar,
  onBackspace,
  onWordBackspace,
  getTypingSnapshot,
  finalWpm,
  accuracyPercentage,
} from '../src/typing.js';

describe('Typing Engine', () => {
  it('implements independent position evaluation (Golden Rule)', () => {
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
    expect(snapshot.states[4]).toBe(1); // 'O' correct
    expect(snapshot.isFullWithErrors).toBe(true);
    expect(snapshot.isComplete).toBe(false);
  });

  it('allows correcting mistakes via Backspace and completes cleanly', () => {
    const state = createTypingState('HELLO');

    onChar(state, 'H', 100);
    onChar(state, 'E', 200);
    onChar(state, 'L', 300);
    onChar(state, 'X', 400); // Mistake at index 3

    expect(state.W).toBe(1);
    expect(state.streak).toBe(0);

    onBackspace(state, 450); // Remove 'X'
    expect(state.W).toBe(0);
    expect(state.K).toBe(3);

    onChar(state, 'L', 500); // Correct 'L'
    expect(state.C).toBe(4);
    expect(state.streak).toBe(1);

    onChar(state, 'O', 600); // Final 'O'
    expect(state.C).toBe(5);
    expect(state.W).toBe(0);
    expect(state.completedAt).toBe(600);

    const snapshot = getTypingSnapshot(state, 600);
    expect(snapshot.isComplete).toBe(true);
    expect(snapshot.mistakes).toBe(1);
    expect(snapshot.accuracy).toBe(83); // 5 correct out of 6 total keystrokes = 83.33% floored to 83%
  });

  it('handles word-backspace properly across word boundaries', () => {
    const state = createTypingState('the quick brown');

    for (let i = 0; i < 'the quick bro'.length; i++) {
      onChar(state, 'the quick bro'[i], i * 50);
    }

    expect(state.K).toBe(13); // Cursor after 'bro'
    onWordBackspace(state, 700);

    // Deletes 'bro' back to space
    expect(state.buffer.join('')).toBe('the quick ');
    expect(state.K).toBe(10);
  });

  it('verifies Case 1: Target HELLO, Input HELLO -> 5/5 correct, 0 final errors', () => {
    const state = createTypingState('HELLO');
    for (let i = 0; i < 'HELLO'.length; i++) {
      onChar(state, 'HELLO'[i], (i + 1) * 100);
    }
    expect(state.C).toBe(5);
    expect(state.W).toBe(0);
    expect(state.mistakes).toBe(0);
    expect(state.K).toBe(5);
    expect(state.completedAt).toBe(500);

    const snapshot = getTypingSnapshot(state, 500);
    expect(snapshot.isComplete).toBe(true);
    expect(snapshot.states.every(s => s === 1)).toBe(true);
    expect(snapshot.accuracy).toBe(100);
  });

  it('verifies Case 8: ultra-high speed typing (140+ WPM) evaluates stably without dropped inputs', () => {
    const target = 'the fastest driver wins every championship with raw precision and focus';
    const state = createTypingState(target);

    // Simulate 140 WPM (approx 85ms per character)
    for (let i = 0; i < target.length; i++) {
      onChar(state, target[i], i * 85);
    }

    expect(state.C).toBe(target.length);
    expect(state.W).toBe(0);
    expect(state.K === state.L && state.W === 0).toBe(true);
    expect(accuracyPercentage(state)).toBe(100);
    expect(finalWpm(state)).toBeGreaterThanOrEqual(135);
  });
});
