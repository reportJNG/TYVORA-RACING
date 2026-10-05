export type Difficulty = 'easy' | 'normal' | 'hard' | 'extreme';

export const SIM_VERSION = 1;
export const TICK_HZ = 120;
export const DT = 1 / TICK_HZ; // 0.008333333333333333 s

// SUPERCAR REALISTIC RACING VELOCITY & PACING
export const SPEED_SCALE = 1.0;

export const M = 10.0; // 10.0 meters per char (smooth, readable track progression)
export const K_GAP = 1.6; // catch-up gain toward earned distance (s^-1)
export const COAST_DECEL = 3.2; // 3.2 m/s^2 natural coasting drag between words & keystrokes (smooth glide)
export const BRAKE_DECEL = 14.0; // 14.0 m/s^2 firm braking deceleration during mistakes/stall

export const MISTAKE_SPEED_MULT = 0.65; // base speed retained on mistake (35% reduction)
export const MISTAKE_STALL_MS = 600; // duration acceleration is suppressed after a mistake (ms)
export const STALL_ACCEL_MULT = 0.5; // acceleration multiplier during mistake stall
export const MIN_RACE_SPEED = 25.0; // 25.0 m/s (90 km/h cruising floor - never stalls out)

export const STREAK_STEP = 5; // correct keystrokes per streak level
export const STREAK_BONUS_PER_STEP = 0.03; // +3% acceleration boost per streak level
export const STREAK_BONUS_MAX = 0.30; // maximum +30% acceleration boost

export const BURST_WINDOW_MS = 2000; // rolling window for instantaneous burst WPM (ms)
export const FINISH_RUNOUT_M = 150; // meters of road past the finish arch for deceleration
export const MAX_RACE_MS = 300000; // 5 minute hard timeout -> DNF

export interface CarSpec {
  id: string;
  name: string;
  category: 'Balanced' | 'Speed' | 'Acceleration';
  vMax: number; // m/s (80 m/s = 288 km/h, 89 m/s = 320 km/h)
  accel: number; // m/s^2 (14 - 17 m/s^2 for punchy sports car throttle)
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
  'scrapper-rust': {
    id: 'scrapper-rust',
    name: 'Rust-Runner 94',
    category: 'Balanced',
    vMax: 66.67, // 240 km/h - starter beater
    accel: 11.2,
    mistakePenaltyScale: 1.25,
    stars: {
      acceleration: 1,
      topSpeed: 2,
      control: 2,
    },
    displaySpecs: {
      topSpeedKph: 240,
      zeroToHundredSec: 5.2,
    },
  },
  'meridian-gt': {
    id: 'meridian-gt',
    name: 'Meridian GT',
    category: 'Balanced',
    vMax: 80.0, // 288 km/h
    accel: 14.5,
    mistakePenaltyScale: 0.90,
    stars: {
      acceleration: 4,
      topSpeed: 4,
      control: 4,
    },
    displaySpecs: {
      topSpeedKph: 288,
      zeroToHundredSec: 2.8,
    },
  },
  'strada-r': {
    id: 'strada-r',
    name: 'Strada R',
    category: 'Speed',
    vMax: 86.11, // 310 km/h
    accel: 15.2,
    mistakePenaltyScale: 1.10,
    stars: {
      acceleration: 5,
      topSpeed: 5,
      control: 3,
    },
    displaySpecs: {
      topSpeedKph: 310,
      zeroToHundredSec: 2.5,
    },
  },
  'volta-e': {
    id: 'volta-e',
    name: 'Volta E',
    category: 'Acceleration',
    vMax: 80.0, // 288 km/h
    accel: 16.5,
    mistakePenaltyScale: 1.00,
    stars: {
      acceleration: 5,
      topSpeed: 4,
      control: 4,
    },
    displaySpecs: {
      topSpeedKph: 288,
      zeroToHundredSec: 2.2,
    },
  },
  'apex-gtr': {
    id: 'apex-gtr',
    name: 'Apex GT-R',
    category: 'Balanced',
    vMax: 83.33, // 300 km/h
    accel: 15.0,
    mistakePenaltyScale: 0.92,
    stars: {
      acceleration: 4,
      topSpeed: 5,
      control: 5,
    },
    displaySpecs: {
      topSpeedKph: 300,
      zeroToHundredSec: 2.6,
    },
  },
  'vanguard-v12': {
    id: 'vanguard-v12',
    name: 'Vanguard V12',
    category: 'Speed',
    vMax: 88.89, // 320 km/h
    accel: 14.8,
    mistakePenaltyScale: 1.05,
    stars: {
      acceleration: 4,
      topSpeed: 5,
      control: 4,
    },
    displaySpecs: {
      topSpeedKph: 320,
      zeroToHundredSec: 2.7,
    },
  },
  'cyclone-rs': {
    id: 'cyclone-rs',
    name: 'Cyclone RS',
    category: 'Acceleration',
    vMax: 81.94, // 295 km/h
    accel: 16.0,
    mistakePenaltyScale: 1.02,
    stars: {
      acceleration: 5,
      topSpeed: 4,
      control: 3,
    },
    displaySpecs: {
      topSpeedKph: 295,
      zeroToHundredSec: 2.3,
    },
  },
  'phantom-spyder': {
    id: 'phantom-spyder',
    name: 'Phantom Spyder',
    category: 'Speed',
    vMax: 85.0, // 306 km/h
    accel: 15.5,
    mistakePenaltyScale: 0.92,
    stars: {
      acceleration: 5,
      topSpeed: 5,
      control: 4,
    },
    displaySpecs: {
      topSpeedKph: 306,
      zeroToHundredSec: 2.5,
    },
  },
  'solaris-hyper': {
    id: 'solaris-hyper',
    name: 'Solaris Hypercar',
    category: 'Acceleration',
    vMax: 88.0, // 317 km/h
    accel: 16.5,
    mistakePenaltyScale: 1.08,
    stars: {
      acceleration: 5,
      topSpeed: 5,
      control: 4,
    },
    displaySpecs: {
      topSpeedKph: 317,
      zeroToHundredSec: 2.1,
    },
  },
};
