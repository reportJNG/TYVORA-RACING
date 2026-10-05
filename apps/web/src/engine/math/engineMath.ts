// apps/web/src/engine/math/engineMath.ts

export function clamp(val: number, min: number, max: number): number {
  return val < min ? min : val > max ? max : val;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Frame-rate independent exponential smoothing:
 * lambda is the decay rate (e.g. 8.0).
 */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/**
 * Returns shortest signed difference between two radian angles.
 */
export function deltaAngle(current: number, target: number): number {
  let diff = (target - current) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

export interface VelocityRef {
  val: number;
}

/**
 * Critically-damped spring smoothing for angles (radians).
 */
export function smoothDampAngle(
  current: number,
  target: number,
  currentVelocity: VelocityRef,
  smoothTime: number,
  dt: number,
  maxSpeed: number = Infinity
): number {
  smoothTime = Math.max(0.0001, smoothTime);
  const omega = 2 / smoothTime;

  const x = omega * dt;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);

  let change = deltaAngle(current, target);
  const maxChange = maxSpeed * smoothTime;
  change = clamp(change, -maxChange, maxChange);
  const targetActual = current + change;

  const temp = (currentVelocity.val + omega * change) * dt;
  currentVelocity.val = (currentVelocity.val - omega * temp) * exp;

  let output = targetActual - (change + temp) * exp;

  // Prevent overshoot if original was exceeded
  if ((targetActual - current > 0) === (output > targetActual)) {
    output = targetActual;
    currentVelocity.val = 0;
  }

  return output;
}
