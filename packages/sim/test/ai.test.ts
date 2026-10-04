// packages/sim/test/ai.test.ts
import { describe, it, expect } from 'vitest';
import { generateAiLog, AI_DIFFICULTY_PROFILES } from '../src/ai.js';

describe('AI Keystroke Generator', () => {
  const passage =
    'The road belongs to the fastest driver who maintains a steady rhythm, avoiding early mistakes through every sharp turn.';

  it('is bit-exact and deterministic for the same seed', () => {
    const seed = 4291823;
    const run1 = generateAiLog(seed, passage, 70, 30);
    const run2 = generateAiLog(seed, passage, 70, 30);

    expect(run1.effectiveWpm).toBe(run2.effectiveWpm);
    expect(run1.totalMistakes).toBe(run2.totalMistakes);
    expect(run1.log.length).toBe(run2.log.length);
    expect(run1.log).toEqual(run2.log);
  });

  it('calibrates effective WPM to match target WPM within tolerance', () => {
    const targets = [45, 70, 95];

    for (const target of targets) {
      const result = generateAiLog(12345 + target, passage, target, 25);
      expect(Math.abs(result.effectiveWpm - target)).toBeLessThanOrEqual(2.0);
    }
  });

  it('properly injects mistakes and backspace corrections into the log', () => {
    // 60 permille error rate
    const result = generateAiLog(999, passage, 60, 60);
    expect(result.totalMistakes).toBeGreaterThan(0);

    // Look for BS entries in the log
    const backspaces = result.log.filter(entry => entry[1] === 'BS');
    expect(backspaces.length).toBeGreaterThan(0);
  });
});
