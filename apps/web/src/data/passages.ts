// apps/web/src/data/passages.ts
import {
  Difficulty,
  Passage,
  passageEngine,
  PASSAGE_LIBRARY,
} from '@typerace/sim';

export interface PassageItem {
  id: string;
  difficulty: Difficulty;
  text: string;
  length: number;
  category: 'racing' | 'mechanics' | 'focus' | 'technical' | 'street' | 'endurance';
}

export const PASSAGES: PassageItem[] = PASSAGE_LIBRARY.map((p) => ({
  id: p.id,
  difficulty: p.difficulty,
  text: p.text,
  length: p.text.length,
  category: p.metadata.category,
}));

export function getRandomPassage(difficulty: Difficulty, seed?: number): PassageItem {
  const p = passageEngine.getRandomPassage(difficulty, seed);
  return {
    id: p.id,
    difficulty: p.difficulty,
    text: p.text,
    length: p.text.length,
    category: p.metadata.category,
  };
}

export { passageEngine, PASSAGE_LIBRARY };
export type { Passage };
