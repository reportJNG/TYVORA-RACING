// packages/sim/src/physics.ts
import {
  BRAKE_DECEL,
  MISTAKE_SPEED_MULT,
  MISTAKE_STALL_MS,
  STALL_ACCEL_MULT,
  STREAK_STEP,
  STREAK_BONUS_PER_STEP,
  STREAK_BONUS_MAX,
  MIN_RACE_SPEED,
  CarSpec,
} from './constants.js';
import { TypingState, burstWpm } from './typing.js';

export interface RacerSim {
  id: string;
  name: string;
  isPlayer: boolean;
  lane: 'A' | 'B' | 'C'; // A: Rival (left), B: Player (center), C: Pacer (right)
  v: number; // current speed in m/s
  d: number; // current distance along track in meters
  stallUntilMs: number; // timestamp until which acceleration is halved
  finishMs: number | null; // race ms when crossing the finish line
}

export function createRacerSim(
  id: string,
  name: string,
  lane: 'A' | 'B' | 'C',
  isPlayer: boolean
): RacerSim {
  return {
    id,
    name,
    isPlayer,
    lane,
    v: MIN_RACE_SPEED,
    d: 0,
    stallUntilMs: 0,
    finishMs: null,
  };
}

export function onMistake(r: RacerSim, car: CarSpec, tMs: number): void {
  const loss = (1 - MISTAKE_SPEED_MULT) * car.mistakePenaltyScale;
  r.v = Math.max(MIN_RACE_SPEED, r.v * (1 - loss));
  r.stallUntilMs = tMs + MISTAKE_STALL_MS;
}

export function stepCar(
  r: RacerSim,
  typing: TypingState,
  car: CarSpec,
  tMs: number,
  dt: number,
  targetDistance: number
): void {
  // 1. Calculate typing pace speed:
  // Convert current burst typing speed into a target velocity
  // 0 WPM -> MIN_RACE_SPEED
  // 110+ WPM -> car.vMax
  const wpm = burstWpm(typing, tMs);
  const paceFraction = Math.min(1.0, Math.max(0, wpm / 110));
  const vTypingTarget = MIN_RACE_SPEED + (car.vMax - MIN_RACE_SPEED) * paceFraction;

  let vDes = vTypingTarget;
  if (typing.completedAt !== null && typing.W === 0) {
    // Sprint to the finish line once text is complete
    vDes = car.vMax;
  }

  // 2. Acceleration limits & Streak bonuses
  const streakLevel = Math.floor(typing.streak / STREAK_STEP);
  const streakMul = 1 + Math.min(STREAK_BONUS_MAX, streakLevel * STREAK_BONUS_PER_STEP);
  const stallMul = tMs < r.stallUntilMs ? STALL_ACCEL_MULT : 1;
  const aMax = car.accel * streakMul * stallMul;

  // Streak bonus on desired velocity
  if (streakLevel > 0 && wpm > 25) {
    vDes = Math.min(car.vMax, vDes * streakMul);
  }

  // 3. Speed integration
  const dv = vDes - r.v;
  if (dv > 0) {
    r.v += Math.min(dv, aMax * dt);
  } else {
    r.v += Math.max(dv, -BRAKE_DECEL * dt);
  }

  // Enforce positive minimum speed during active race (never stops)
  r.v = Math.max(MIN_RACE_SPEED, r.v);

  // 4. Distance integration
  r.d += r.v * dt;

  // Never advance past finish threshold unless text is complete
  const isComplete = typing.completedAt !== null && typing.W === 0;
  if (!isComplete && r.d >= targetDistance - 2) {
    r.d = targetDistance - 2;
    r.v = MIN_RACE_SPEED;
  }

  // 5. Finish detection with sub-tick interpolation once complete
  if (isComplete && r.finishMs === null && r.d >= targetDistance) {
    const over = r.d - targetDistance;
    const speed = Math.max(r.v, 0.001);
    r.finishMs = Math.round(tMs - (over / speed) * 1000);
  }
}
