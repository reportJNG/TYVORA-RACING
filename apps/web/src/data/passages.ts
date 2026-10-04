// apps/web/src/data/passages.ts
import { Difficulty } from '@typerace/sim';

export interface PassageItem {
  id: string;
  difficulty: Difficulty;
  text: string;
  length: number;
  category: 'racing' | 'mechanics' | 'focus' | 'technical';
}

export const PASSAGES: PassageItem[] = [
  // EASY
  {
    id: 'easy_01',
    difficulty: 'easy',
    text: 'keep your eyes on the road ahead and type every word with steady rhythm to reach top speed.',
    length: 93,
    category: 'racing',
  },
  {
    id: 'easy_02',
    difficulty: 'easy',
    text: 'smooth fingers make the engine roar as you chase the finish line with clean and fast typing.',
    length: 93,
    category: 'racing',
  },
  {
    id: 'easy_03',
    difficulty: 'easy',
    text: 'the highway is clear tonight and your car will fly as long as you do not hit any wrong keys.',
    length: 93,
    category: 'racing',
  },
  {
    id: 'easy_04',
    difficulty: 'easy',
    text: 'speed comes from practice and staying calm when the road opens up before your headlights.',
    length: 90,
    category: 'focus',
  },
  {
    id: 'easy_05',
    difficulty: 'easy',
    text: 'drive fast and stay accurate on every corner to build your streak and take home the victory.',
    length: 92,
    category: 'racing',
  },

  // NORMAL
  {
    id: 'norm_01',
    difficulty: 'normal',
    text: 'Every race is a battle between your fingers and the clock. Maintain focus, correct mistakes quickly, and accelerate.',
    length: 119,
    category: 'racing',
  },
  {
    id: 'norm_02',
    difficulty: 'normal',
    text: 'When you make a mistake, don\'t panic. Tap Backspace, fix the error, and watch your engine rebuild momentum immediately.',
    length: 120,
    category: 'mechanics',
  },
  {
    id: 'norm_03',
    difficulty: 'normal',
    text: 'A great typist drives like a professional racer: smooth through the corners and relentlessly fast down every open straight.',
    length: 124,
    category: 'racing',
  },
  {
    id: 'norm_04',
    difficulty: 'normal',
    text: 'The road belongs to the fastest driver who maintains a steady rhythm, avoiding early mistakes through every sharp turn.',
    length: 120,
    category: 'racing',
  },
  {
    id: 'norm_05',
    difficulty: 'normal',
    text: 'Rhythm is your true engine. Type cleanly and the speedometer will climb as your car overtakes the competition with ease.',
    length: 121,
    category: 'focus',
  },

  // HARD
  {
    id: 'hard_01',
    difficulty: 'hard',
    text: 'True velocity requires ruthless consistency; one careless typo drops your RPM, forcing you to fight for every lost second.',
    length: 123,
    category: 'racing',
  },
  {
    id: 'hard_02',
    difficulty: 'hard',
    text: 'The tunnel lights flash by at 240 km/h: "Rhythm is your throttle, accuracy is your steering." Never hesitate on the keys.',
    length: 122,
    category: 'racing',
  },
  {
    id: 'hard_03',
    difficulty: 'hard',
    text: 'Precision under intense pressure separates champions from contenders; remember: raw velocity is nothing without control.',
    length: 122,
    category: 'focus',
  },
  {
    id: 'hard_04',
    difficulty: 'hard',
    text: 'Accelerate through the sweeping curves and keep your fingers moving; every clean keystroke injects fuel into your engine.',
    length: 122,
    category: 'racing',
  },

  // EXTREME
  {
    id: 'extr_01',
    difficulty: 'extreme',
    text: 'Telemetric check: 100% throttle, gear #6 engaged (RPM: 7,200). Can you maintain 120+ WPM without dropping accuracy below 98%?',
    length: 127,
    category: 'technical',
  },
  {
    id: 'extr_02',
    difficulty: 'extreme',
    text: 'SYSTEM NOTICE [v1.0]: Turbo-boost requires 25 consecutive hits! Break through Sector 03 at 300+ km/h and seal the championship.',
    length: 128,
    category: 'technical',
  },
  {
    id: 'extr_03',
    difficulty: 'extreme',
    text: 'Code: SPEED-DEMON; Sector delta = -0.42s! Push into overdrive (WPM >= 125, mistakes = 0) and shatter the existing lap record.',
    length: 126,
    category: 'technical',
  },
];

export function getRandomPassage(difficulty: Difficulty, seed?: number): PassageItem {
  const pool = PASSAGES.filter(p => p.difficulty === difficulty);
  if (pool.length === 0) return PASSAGES[0];
  const idx = seed !== undefined ? Math.abs(seed) % pool.length : Math.floor(Math.random() * pool.length);
  return pool[idx];
}
