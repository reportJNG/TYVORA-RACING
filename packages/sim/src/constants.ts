export type Difficulty = 'easy' | 'normal' | 'hard' | 'extreme';

export const SIM_VERSION = 1;
export const TICK_HZ = 120;
export const DT = 1 / TICK_HZ; // 0.008333333333333333 s

export const M = 8.0; // meters per char: 100 WPM = 8.33 chars/s * 8 m = 66.67 m/s = 240 km/h
export const K_GAP = 1.6; // catch-up gain toward earned distance (s^-1)
export const BRAKE_DECEL = 22.0; // natural brake deceleration (m/s^2)

export const MISTAKE_SPEED_MULT = 0.65; // base speed retained on mistake (35% reduction)
export const MISTAKE_STALL_MS = 600; // duration acceleration is suppressed after a mistake (ms)
export const STALL_ACCEL_MULT = 0.5; // acceleration multiplier during mistake stall
export const MIN_RACE_SPEED = 11.11; // minimum cruising speed during active racing in m/s (~40 km/h)

export const STREAK_STEP = 5; // correct keystrokes per streak level
export const STREAK_BONUS_PER_STEP = 0.03; // +3% acceleration boost per streak level
export const STREAK_BONUS_MAX = 0.30; // maximum +30% acceleration boost

export const BURST_WINDOW_MS = 2000; // rolling window for instantaneous burst WPM (ms)
export const FINISH_RUNOUT_M = 180; // meters of road past the finish arch for deceleration
export const MAX_RACE_MS = 300000; // 5 minute hard timeout -> DNF

export interface CarSpec {
  id: string;
  name: string;
  category: 'Balanced' | 'Speed' | 'Acceleration';
  vMax: number; // m/s (83.33 m/s = 300 km/h, 88.89 m/s = 320 km/h)
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
    vMax: 83.33, // 300 km/h
    accel: 13.0,
    mistakePenaltyScale: 0.90, // 31.5% speed drop
    stars: {
      acceleration: 4,
      topSpeed: 4,
      control: 4,
    },
    displaySpecs: {
      topSpeedKph: 300,
      zeroToHundredSec: 3.6,
    },
  },
  'strada-r': {
    id: 'strada-r',
    name: 'Strada R',
    category: 'Speed',
    vMax: 88.89, // 320 km/h
    accel: 14.0,
    mistakePenaltyScale: 1.10, // 38.5% speed drop
    stars: {
      acceleration: 5,
      topSpeed: 5,
      control: 3,
    },
    displaySpecs: {
      topSpeedKph: 320,
      zeroToHundredSec: 3.1,
    },
  },
  'volta-e': {
    id: 'volta-e',
    name: 'Volta E',
    category: 'Acceleration',
    vMax: 83.33, // 300 km/h
    accel: 15.0,
    mistakePenaltyScale: 1.00, // 35% speed drop
    stars: {
      acceleration: 5,
      topSpeed: 4,
      control: 4,
    },
    displaySpecs: {
      topSpeedKph: 300,
      zeroToHundredSec: 2.4,
    },
  },
  'apex-gtr': {
    id: 'apex-gtr',
    name: 'Apex GT-R',
    category: 'Balanced',
    vMax: 86.11, // 310 km/h
    accel: 13.8,
    mistakePenaltyScale: 0.92,
    stars: {
      acceleration: 4,
      topSpeed: 5,
      control: 5,
    },
    displaySpecs: {
      topSpeedKph: 310,
      zeroToHundredSec: 3.2,
    },
  },
  'vanguard-v12': {
    id: 'vanguard-v12',
    name: 'Vanguard V12',
    category: 'Speed',
    vMax: 91.67, // 330 km/h
    accel: 13.5,
    mistakePenaltyScale: 1.05,
    stars: {
      acceleration: 4,
      topSpeed: 5,
      control: 4,
    },
    displaySpecs: {
      topSpeedKph: 330,
      zeroToHundredSec: 3.2,
    },
  },
  'cyclone-rs': {
    id: 'cyclone-rs',
    name: 'Cyclone RS',
    category: 'Acceleration',
    vMax: 84.72, // 305 km/h
    accel: 14.8,
    mistakePenaltyScale: 1.02,
    stars: {
      acceleration: 5,
      topSpeed: 4,
      control: 3,
    },
    displaySpecs: {
      topSpeedKph: 305,
      zeroToHundredSec: 2.7,
    },
  },
  'phantom-spyder': {
    id: 'phantom-spyder',
    name: 'Phantom Spyder',
    category: 'Speed',
    vMax: 87.50, // 315 km/h
    accel: 14.2,
    mistakePenaltyScale: 0.92,
    stars: {
      acceleration: 5,
      topSpeed: 5,
      control: 4,
    },
    displaySpecs: {
      topSpeedKph: 315,
      zeroToHundredSec: 2.9,
    },
  },
  'solaris-hyper': {
    id: 'solaris-hyper',
    name: 'Solaris Hypercar',
    category: 'Acceleration',
    vMax: 90.28, // 325 km/h
    accel: 15.4,
    mistakePenaltyScale: 1.08,
    stars: {
      acceleration: 5,
      topSpeed: 5,
      control: 4,
    },
    displaySpecs: {
      topSpeedKph: 325,
      zeroToHundredSec: 2.3,
    },
  },
};
