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
import { TypingState, burstWpm, liveWpm } from './typing.js';

export interface RacerSim {
  id: string;
  name: string;
  isPlayer: boolean;
  lane: 'A' | 'B' | 'C'; // A: Rival (left), B: Player (center), C: Pacer (right)
  v: number; // current speed in m/s
  d: number; // current distance along track in meters
  stallUntilMs: number; // timestamp until which acceleration is suppressed
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
  targetDistance: number,
  leadOpponentDistance?: number,
  playerBehindDistance?: number
): void {
  // 1. Calculate typing pace speed:
  // Convert current typing pace into a responsive, punchy velocity curve.
  // Even moderate typing (30-45 WPM) delivers high speed and keeps up with opponents!
  const bWpm = burstWpm(typing, tMs);
  const lWpm = liveWpm(typing, tMs);
  const effectiveWpm = Math.max(bWpm, lWpm);

  let paceFraction = 0;
  if (effectiveWpm > 0) {
    paceFraction = Math.min(1.0, 0.45 + 0.55 * Math.pow(Math.min(1.0, effectiveWpm / 75), 0.7));
  } else if (typing.correctKeyTimes.length > 0) {
    paceFraction = 0.40; // Initial launch momentum
  }

  const vTypingTarget = MIN_RACE_SPEED + (car.vMax - MIN_RACE_SPEED) * paceFraction;

  let vDes = vTypingTarget;
  if (typing.completedAt !== null && typing.W === 0) {
    // Sprint to the finish line once text is complete
    vDes = car.vMax;
  }

  // 2. Slipstream / Drafting Mechanic:
  // When player is trailing the lead opponent, drafting reduces drag and grants catch-up surge!
  if (r.isPlayer && leadOpponentDistance !== undefined && leadOpponentDistance > r.d + 2) {
    const gap = leadOpponentDistance - r.d;
    const draftBoost = Math.min(0.28, (gap / 30) * 0.28);
    vDes = Math.min(car.vMax * 1.15, vDes * (1 + draftBoost));
  }

  // 3. AI Rubber-Banding:
  // Prevent AI from building an uncatchable lead (> 18m), ensuring exciting wheel-to-wheel racing!
  if (!r.isPlayer && playerBehindDistance !== undefined && r.d > playerBehindDistance + 18) {
    vDes = Math.min(vDes, car.vMax * 0.85);
  }

  // 4. Acceleration limits & Streak bonuses
  const streakLevel = Math.floor(typing.streak / STREAK_STEP);
  const streakMul = 1 + Math.min(STREAK_BONUS_MAX, streakLevel * STREAK_BONUS_PER_STEP);
  const stallMul = tMs < r.stallUntilMs ? STALL_ACCEL_MULT : 1;
  let aMax = car.accel * streakMul * stallMul;

  // Streak bonus on desired velocity
  if (streakLevel > 0 && effectiveWpm > 20) {
    vDes = Math.min(car.vMax * 1.1, vDes * streakMul);
    aMax *= 1.25;
  }

  // 5. Speed integration
  const dv = vDes - r.v;
  if (dv > 0) {
    r.v += Math.min(dv, aMax * dt);
  } else {
    r.v += Math.max(dv, -BRAKE_DECEL * dt);
  }

  // Enforce positive minimum speed during active race (never stops)
  r.v = Math.max(MIN_RACE_SPEED, r.v);

  // 6. Distance integration
  r.d += r.v * dt;

  // Never advance past finish threshold unless text is complete
  const isComplete = typing.completedAt !== null && typing.W === 0;
  if (!isComplete && r.d >= targetDistance - 2) {
    r.d = targetDistance - 2;
    r.v = MIN_RACE_SPEED;
  }

  // 7. Finish detection with sub-tick interpolation once complete
  if (isComplete && r.finishMs === null && r.d >= targetDistance) {
    const over = r.d - targetDistance;
    const speed = Math.max(r.v, 0.001);
    r.finishMs = Math.round(tMs - (over / speed) * 1000);
  }
}
