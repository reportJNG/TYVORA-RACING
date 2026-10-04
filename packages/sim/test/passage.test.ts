// packages/sim/test/passage.test.ts
import { describe, it, expect } from 'vitest';
import {
  normalizePassageText,
  precomputePassageStructure,
  createPassage,
  PassageEngine,
  PASSAGE_LIBRARY,
} from '../src/passage.js';

describe('Passage Engine', () => {
  it('normalizes smart quotes, curly dashes, and irregular whitespace', () => {
    const raw = '“Speed   comes   from   focus’—maintain  steady  pace.';
    const normalized = normalizePassageText(raw);

    expect(normalized).toBe('"Speed comes from focus\'-maintain steady pace.');
    expect(normalized.includes('“')).toBe(false);
    expect(normalized.includes('’')).toBe(false);
    expect(normalized.includes('—')).toBe(false);
    expect(normalized.includes('  ')).toBe(false);
  });

  it('precomputes exact word boundaries and character metadata', () => {
    const text = 'the quick fox';
    const { words, characters } = precomputePassageStructure(text);

    expect(words).toHaveLength(3);
    expect(words[0]).toEqual({ word: 'the', startIndex: 0, endIndex: 3, wordIndex: 0 });
    expect(words[1]).toEqual({ word: 'quick', startIndex: 4, endIndex: 9, wordIndex: 1 });
    expect(words[2]).toEqual({ word: 'fox', startIndex: 10, endIndex: 13, wordIndex: 2 });

    expect(characters).toHaveLength(13);
    expect(characters[0]).toEqual({ char: 't', index: 0, wordIndex: 0, isSpace: false });
    expect(characters[3]).toEqual({ char: ' ', index: 3, wordIndex: 0, isSpace: true });
    expect(characters[4]).toEqual({ char: 'q', index: 4, wordIndex: 1, isSpace: false });
    expect(characters[12]).toEqual({ char: 'x', index: 12, wordIndex: 2, isSpace: false });
  });

  it('creates complete passage model with metrics', () => {
    const passage = createPassage({
      id: 'test_pass',
      text: 'Keep your focus sharp and your hands steady.',
      difficulty: 'normal',
      category: 'focus',
    });

    expect(passage.id).toBe('test_pass');
    expect(passage.metadata.charCount).toBe(44);
    expect(passage.metadata.wordCount).toBe(8);
    expect(passage.metadata.avgWordLength).toBeGreaterThan(3);
    expect(passage.metadata.category).toBe('focus');
    expect(passage.estimatedDurationSeconds).toBeGreaterThan(0);
    expect(passage.words).toHaveLength(8);
  });

  it('selects appropriate passages per round progression', () => {
    const engine = new PassageEngine();

    // Round 1: Warmup
    const r1 = engine.getPassageForRound('normal', 1, 100);
    expect(r1.round).toBe(1);
    expect(['easy', 'normal']).toContain(r1.difficulty);
    expect(r1.text.length).toBeGreaterThanOrEqual(75);

    // Round 2: Pace
    const r2 = engine.getPassageForRound('normal', 2, 100, [r1.id]);
    expect(r2.round).toBe(2);
    expect(r2.id).not.toBe(r1.id);

    // Round 3: High-speed climax
    const r3 = engine.getPassageForRound('normal', 3, 100, [r1.id, r2.id]);
    expect(r3.round).toBe(3);
    expect(['hard', 'extreme']).toContain(r3.difficulty);
    expect(r3.id).not.toBe(r1.id);
    expect(r3.id).not.toBe(r2.id);
  });

  it('ensures library passages adhere to high quality requirements', () => {
    expect(PASSAGE_LIBRARY.length).toBeGreaterThanOrEqual(15);
    for (const p of PASSAGE_LIBRARY) {
      expect(p.text.length).toBeGreaterThanOrEqual(80);
      expect(p.words.length).toBeGreaterThanOrEqual(10);
      expect(p.words[0].startIndex).toBe(0);
      expect(p.words[p.words.length - 1].endIndex).toBe(p.text.length);
    }
  });
});
