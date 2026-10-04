export type Difficulty = 'easy' | 'normal' | 'hard' | 'extreme';

export const SIM_VERSION = 1;
export const TICK_HZ = 120;
export const DT = 1 / TICK_HZ; // 0.008333333333333333 s

// 3X GAME SPEED MULTIPLIER
export const SPEED_SCALE = 3.0;

export const M = 8.0 * SPEED_SCALE; // 24.0 meters per char (x3 faster distance traversal)
export const K_GAP = 1.6 * SPEED_SCALE; // catch-up gain toward earned distance (s^-1)
export const BRAKE_DECEL = 22.0 * SPEED_SCALE; // 66.0 m/s^2 natural brake deceleration

export const MISTAKE_SPEED_MULT = 0.65; // base speed retained on mistake (35% reduction)
export const MISTAKE_STALL_MS = 600; // duration acceleration is suppressed after a mistake (ms)
export const STALL_ACCEL_MULT = 0.5; // acceleration multiplier during mistake stall
export const MIN_RACE_SPEED = 11.11 * SPEED_SCALE; // 33.33 m/s (~120 km/h cruising speed)

export const STREAK_STEP = 5; // correct keystrokes per streak level
export const STREAK_BONUS_PER_STEP = 0.03; // +3% acceleration boost per streak level
export const STREAK_BONUS_MAX = 0.30; // maximum +30% acceleration boost

export const BURST_WINDOW_MS = 2000; // rolling window for instantaneous burst WPM (ms)
export const FINISH_RUNOUT_M = 350; // meters of road past the finish arch for high-speed deceleration
export const MAX_RACE_MS = 300000; // 5 minute hard timeout -> DNF

export interface CarSpec {
  id: string;
  name: string;
  category: 'Balanced' | 'Speed' | 'Acceleration';
  vMax: number; // m/s (250 m/s = 900 km/h, 275 m/s = 990 km/h)
  accel: number; // m/s^2
  mistakePenaltyScale: number; // multiplier applied to the base 35% speed drop
  stars: {
    acceleration: number;
    topSpeed: number;
    control: number;
  };
  displaySpecs: {
    topSpeedKph: number;
    zeroToHundredSec: number;
  };
}

export const CAR_SPECS: Record<string, CarSpec> = {
  'meridian-gt': {
    id: 'meridian-gt',
    name: 'Meridian GT',
    category: 'Balanced',
    vMax: 250.0, // 900 km/h (x3 speed)
    accel: 39.0,
    mistakePenaltyScale: 0.90,
    stars: {
      acceleration: 4,
      topSpeed: 4,
      control: 4,
    },
    displaySpecs: {
      topSpeedKph: 900,
      zeroToHundredSec: 1.2,
    },
  },
  'strada-r': {
    id: 'strada-r',
    name: 'Strada R',
    category: 'Speed',
    vMax: 266.67, // 960 km/h (x3 speed)
    accel: 42.0,
    mistakePenaltyScale: 1.10,
    stars: {
      acceleration: 5,
      topSpeed: 5,
      control: 3,
    },
    displaySpecs: {
      topSpeedKph: 960,
      zeroToHundredSec: 1.0,
    },
  },
  'volta-e': {
    id: 'volta-e',
    name: 'Volta E',
    category: 'Acceleration',
    vMax: 250.0, // 900 km/h (x3 speed)
    accel: 45.0,
    mistakePenaltyScale: 1.00,
    stars: {
      acceleration: 5,
      topSpeed: 4,
      control: 4,
    },
    displaySpecs: {
      topSpeedKph: 900,
      zeroToHundredSec: 0.8,
    },
  },
  'apex-gtr': {
    id: 'apex-gtr',
    name: 'Apex GT-R',
    category: 'Balanced',
    vMax: 258.33, // 930 km/h
    accel: 41.4,
    mistakePenaltyScale: 0.92,
    stars: {
      acceleration: 4,
      topSpeed: 5,
      control: 5,
    },
    displaySpecs: {
      topSpeedKph: 930,
      zeroToHundredSec: 1.1,
    },
  },
  'vanguard-v12': {
    id: 'vanguard-v12',
    name: 'Vanguard V12',
    category: 'Speed',
    vMax: 275.0, // 990 km/h
    accel: 40.5,
    mistakePenaltyScale: 1.05,
    stars: {
      acceleration: 4,
      topSpeed: 5,
      control: 4,
    },
    displaySpecs: {
      topSpeedKph: 990,
      zeroToHundredSec: 1.1,
    },
  },
  'cyclone-rs': {
    id: 'cyclone-rs',
    name: 'Cyclone RS',
    category: 'Acceleration',
    vMax: 254.16, // 915 km/h
    accel: 44.4,
    mistakePenaltyScale: 1.02,
    stars: {
      acceleration: 5,
      topSpeed: 4,
      control: 3,
    },
    displaySpecs: {
      topSpeedKph: 915,
      zeroToHundredSec: 0.9,
    },
  },
  'phantom-spyder': {
    id: 'phantom-spyder',
    name: 'Phantom Spyder',
    category: 'Speed',
    vMax: 262.5, // 945 km/h
    accel: 42.6,
    mistakePenaltyScale: 0.92,
    stars: {
      acceleration: 5,
      topSpeed: 5,
      control: 4,
    },
    displaySpecs: {
      topSpeedKph: 945,
      zeroToHundredSec: 1.0,
    },
  },
  'solaris-hyper': {
    id: 'solaris-hyper',
    name: 'Solaris Hypercar',
    category: 'Acceleration',
    vMax: 270.84, // 975 km/h
    accel: 46.2,
    mistakePenaltyScale: 1.08,
    stars: {
      acceleration: 5,
      topSpeed: 5,
      control: 4,
    },
    displaySpecs: {
      topSpeedKph: 975,
      zeroToHundredSec: 0.8,
    },
  },
};
