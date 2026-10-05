// packages/sim/src/physics.ts
import {
  COAST_DECEL,
  BRAKE_DECEL,
  MISTAKE_SPEED_MULT,
  MISTAKE_STALL_MS,
  STALL_ACCEL_MULT,
  STREAK_STEP,
  STREAK_BONUS_PER_STEP,
  STREAK_BONUS_MAX,
  MIN_RACE_SPEED,
  FINISH_RUNOUT_M,
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
  lat: number; // lateral offset in meters relative to lane center (- = left, + = right)
  latV: number; // lateral velocity in m/s
  stallUntilMs: number; // timestamp until which acceleration is suppressed
  finishMs: number | null; // race ms when crossing the finish line
  accel: number; // instantaneous physical acceleration in m/s^2 (for smooth suspension animations)
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
    lat: 0,
    latV: 0,
    stallUntilMs: 0,
    finishMs: null,
    accel: 0,
  };
}

export function cloneRacerSim(src: RacerSim): RacerSim {
  return {
    id: src.id,
    name: src.name,
    isPlayer: src.isPlayer,
    lane: src.lane,
    v: src.v,
    d: src.d,
    lat: src.lat,
    latV: src.latV,
    stallUntilMs: src.stallUntilMs,
    finishMs: src.finishMs,
    accel: src.accel,
  };
}

export function onMistake(r: RacerSim, car: CarSpec, tMs: number, twitchSign: number = 1): void {
  const loss = (1 - MISTAKE_SPEED_MULT) * car.mistakePenaltyScale;
  r.v = Math.max(MIN_RACE_SPEED, r.v * (1 - loss));
  r.stallUntilMs = tMs + MISTAKE_STALL_MS;
  r.accel = -BRAKE_DECEL;
  // Natural visual jerk/twitch impulse on mistake (smoothly damped back to lane center)
  r.latV += twitchSign * 1.0;
}

/**
 * Critically-damped lateral spring for smooth lane centering, slipstream drift, and bump reaction.
 */
export function stepRacerLateral(r: RacerSim, dt: number, targetLat: number = 0): void {
  const omega = 3.4; // natural spring frequency (rad/s)
  const error = targetLat - r.lat;
  const aLat = omega * omega * error - 2.0 * omega * r.latV;
  r.latV += aLat * dt;
  // Cap lateral velocity to prevent sudden snapping
  r.latV = Math.max(-2.8, Math.min(2.8, r.latV));
  r.lat += r.latV * dt;
  // Prevent excessive wander off track bounds
  r.lat = Math.max(-2.2, Math.min(2.2, r.lat));
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
  const isComplete = typing.completedAt !== null && typing.W === 0;
  const isPostFinish = isComplete && r.finishMs !== null && r.d >= targetDistance;

  // 1. Calculate typing pace speed:
  // Convert typing pace into a responsive, smooth supercar velocity curve.
  // Sustains momentum between words so the car glides cleanly without start-stop jerking!
  const lastKeyTime = typing.correctKeyTimes.length > 0
    ? typing.correctKeyTimes[typing.correctKeyTimes.length - 1]
    : 0;
  const timeSinceLastKey = typing.correctKeyTimes.length > 0 ? Math.max(0, tMs - lastKeyTime) : Infinity;

  // Active typing pace when typing:
  const bWpm = burstWpm(typing, Math.max(tMs, lastKeyTime));
  const lWpm = liveWpm(typing, tMs);
  let effectiveWpm = Math.max(bWpm, lWpm);

  // Momentum retention:
  // Within 650ms of a keystroke, player is actively typing words -> 100% full momentum sustained!
  // Beyond 650ms, speed gently coasts down with a smooth exponential half-life.
  if (typing.correctKeyTimes.length > 0) {
    if (timeSinceLastKey > 650) {
      const decay = Math.exp(-(timeSinceLastKey - 650) / 1200);
      effectiveWpm *= decay;
    }
  }

  let paceFraction = 0;
  if (effectiveWpm > 0) {
    // Progressive throttle curve:
    // 35 WPM -> ~0.62 (cruising sports speed)
    // 60 WPM -> ~0.82 (high-speed rally pace)
    // 90 WPM -> ~0.95 (supercar velocity)
    // 110+ WPM -> 1.00 (maximum top speed)
    const normWpm = Math.min(1.0, effectiveWpm / 85);
    paceFraction = Math.min(1.0, 0.42 + 0.58 * Math.pow(normWpm, 0.72));
  } else if (typing.correctKeyTimes.length > 0) {
    paceFraction = 0.38; // Initial launch momentum
  }

  const vTypingTarget = MIN_RACE_SPEED + (car.vMax - MIN_RACE_SPEED) * paceFraction;

  let vDes = vTypingTarget;
  if (isComplete) {
    // Sprint to the finish line once text is complete
    vDes = car.vMax;
  }

  // Progress coupling:
  // Couples car velocity mildly to earned character distance to ensure visual race positions
  // correspond faithfully to typing progress while keeping motion smooth.
  if (!isComplete && typing.L > 0 && r.d < targetDistance - 30) {
    const earnedDistance = (typing.C / typing.L) * targetDistance;
    const gap = earnedDistance - r.d;
    const progressFactor = Math.max(-0.6, Math.min(0.4, gap / 60));
    vDes *= (1 + progressFactor * 0.22);
  }

  // 2. Aerodynamic Slipstream / Drafting Mechanic:
  // When drafting behind a lead car, reduced drag grants smooth catch-up slingshot surge!
  // Strongest when close (1.5m to 7m), smoothly fading out to 0 beyond 22m.
  let draftBoost = 0;
  if (r.isPlayer && leadOpponentDistance !== undefined && leadOpponentDistance > r.d + 1.5) {
    const gap = leadOpponentDistance - r.d;
    if (gap <= 22) {
      const draftT = Math.max(0, Math.min(1, (gap - 1.5) / 20.5));
      draftBoost = 0.22 * (1.0 - draftT * draftT);
      vDes = Math.min(car.vMax * 1.15, vDes * (1 + draftBoost));
    }
  }

  // 3. AI Continuous Rubber-Banding:
  // Smoothly dampens or aids AI velocity to maintain exciting, wheel-to-wheel competitive racing
  // without any binary threshold stuttering or artificial brake spikes!
  // Disabled once the player has crossed the finish line to keep AI finish estimates clean.
  if (!r.isPlayer && playerBehindDistance !== undefined && r.finishMs === null) {
    const lead = r.d - playerBehindDistance;
    if (lead > 8) {
      // Smoothly attenuate lead as distance grows from 8m to 25m
      const t = Math.min(1.0, (lead - 8) / 17);
      const ease = t * t * (3 - 2 * t); // smoothstep
      vDes *= (1.0 - 0.18 * ease);
    } else if (lead < -10) {
      // Smooth catch-up assistance when falling behind (-10m to -25m)
      const t = Math.min(1.0, (-lead - 10) / 15);
      const ease = t * t * (3 - 2 * t);
      vDes *= (1.0 + 0.14 * ease);
    }
  }

  // 4. Acceleration limits & Streak bonuses
  const streakLevel = Math.floor(typing.streak / STREAK_STEP);
  const streakMul = 1 + Math.min(STREAK_BONUS_MAX, streakLevel * STREAK_BONUS_PER_STEP);
  const stallMul = tMs < r.stallUntilMs ? STALL_ACCEL_MULT : 1;
  const draftAccelMul = 1 + draftBoost * 0.75;
  let aMax = car.accel * streakMul * stallMul * draftAccelMul;

  // Streak bonus on desired velocity
  if (streakLevel > 0 && effectiveWpm > 20) {
    vDes = Math.min(car.vMax * 1.12, vDes * streakMul);
    aMax *= 1.25;
  }

  // 5. Hold-Line and Run-Out Braking Curves (replaces sudden teleport clamps!)
  if (!isComplete && r.d >= targetDistance - 35) {
    // If text is not complete yet, smoothly brake to hold at finish line threshold (D - 2m)
    const distToHold = Math.max(0, targetDistance - 2 - r.d);
    const vHoldLimit = Math.sqrt(2 * 18.0 * Math.max(0.01, distToHold));
    vDes = Math.min(vDes, vHoldLimit);
  } else if (isPostFinish) {
    // After crossing finish line, decelerate smoothly to a stop across the 150m run-out area
    const distToEnd = Math.max(0, targetDistance + FINISH_RUNOUT_M - r.d);
    const vRunoutLimit = Math.sqrt(2 * 8.0 * Math.max(0.01, distToEnd));
    vDes = Math.min(vDes, vRunoutLimit);
  }

  // 6. Dual-Regime Speed Integration (Smooth Momentum Coasting vs Firm Braking)
  const prevV = r.v;
  const dv = vDes - r.v;
  if (dv > 0) {
    r.v += Math.min(dv, aMax * dt);
  } else {
    // If racer is in mistake penalty, holding at finish, or decelerating past finish:
    const isStalled = tMs < r.stallUntilMs;
    const isHardBraking = isStalled || (!isComplete && r.d >= targetDistance - 35) || isPostFinish;

    const decelRate = isHardBraking ? BRAKE_DECEL : COAST_DECEL;
    r.v += Math.max(dv, -decelRate * dt);
  }

  // Enforce positive minimum speed during active race (never stops unless holding at finish or finished)
  if (!isPostFinish && (isComplete || r.d < targetDistance - 20)) {
    r.v = Math.max(MIN_RACE_SPEED, r.v);
  } else {
    r.v = Math.max(0, r.v);
  }

  // Compute true physical acceleration for suspension pitch/roll/dive
  r.accel = dt > 0 ? (r.v - prevV) / dt : 0;

  // 7. Distance integration
  r.d += r.v * dt;

  // Hard safety limit at finish hold line if text incomplete
  if (!isComplete && r.d >= targetDistance - 2) {
    r.d = targetDistance - 2;
    r.v = Math.min(r.v, 0.2);
    r.accel = 0;
  }

  // Safety stop at end of run-out
  if (isPostFinish && r.d >= targetDistance + FINISH_RUNOUT_M) {
    r.d = targetDistance + FINISH_RUNOUT_M;
    r.v = 0;
    r.accel = 0;
  }

  // 8. Finish detection with sub-tick interpolation once complete
  if (isComplete && r.finishMs === null && r.d >= targetDistance) {
    const over = r.d - targetDistance;
    const speed = Math.max(r.v, 0.001);
    r.finishMs = Math.round(tMs - (over / speed) * 1000);
  }
}
