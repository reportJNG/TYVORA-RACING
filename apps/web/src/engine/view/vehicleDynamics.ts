// apps/web/src/engine/view/vehicleDynamics.ts
import { RacerView } from './EngineView.js';
import { damp, clamp } from '../math/engineMath.js';

export function updateVehicleDynamics(
  view: RacerView,
  dt: number,
  timeSec: number,
  playerD: number,
  isStalled: boolean,
  reducedMotion: boolean = false
): void {
  const speedMs = view.v;
  view.speedKmh = speedMs * 3.6;

  // 1. Suspension Pitch (Squat on throttle, Dive on braking)
  let targetPitch = 0;
  if (isStalled) {
    targetPitch = 0.052; // Active brake dive
  } else if (view.accel > 0.8) {
    targetPitch = -Math.min(0.038, (view.accel / 16.0) * 0.038); // Throttle squat
  } else if (view.accel < -1.2) {
    targetPitch = Math.min(0.048, (-view.accel / 14.0) * 0.048); // Braking dive
  }

  view.bodyPitch = damp(view.bodyPitch, targetPitch, 10.0, dt);

  // 2. Curvature-derived Body Roll (Centrifugal cornering lean)
  // Lateral acceleration = v^2 * kappa (derived from path LUT, never differenced)
  const centripetalA = (speedMs * speedMs) * view.curvature;
  const targetRoll = clamp(-centripetalA * 0.028, -0.14, 0.14);
  view.bodyRoll = damp(view.bodyRoll, targetRoll, 9.0, dt);

  // 3. Wheel rotation angle
  if (speedMs > 0.1) {
    // Wheel effective rolling radius is ~0.33m
    const dTheta = (speedMs / 0.33) * dt;
    view.wheelAngle = (view.wheelAngle - dTheta) % (Math.PI * 2);
  }

  // 4. Subtle road micro-bounce & engine vibration
  if (!reducedMotion) {
    const speedRatio = Math.min(1.0, view.speedKmh / 260);
    const idleVibe = view.speedKmh < 10 ? Math.sin(timeSec * 22) * 0.0016 : 0;
    const roadVibe = Math.sin(timeSec * 48) * 0.003 * speedRatio;
    view.bounce = idleVibe + roadVibe;
  } else {
    view.bounce = 0;
  }

  // 5. Brake light glow
  const isHardBraking = isStalled || view.accel < -3.5;
  const targetBrake = isHardBraking ? 1.0 : 0.0;
  view.brake = damp(view.brake, targetBrake, 14.0, dt);

  // 6. Proximity glow (for ghosts relative to player)
  const gap = Math.abs(view.d - playerD);
  view.proximity = Math.max(0, 1.0 - gap / 16.0);
}
