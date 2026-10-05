// apps/web/src/engine/camera/CameraRig.ts
import { CameraView, RacerView } from '../view/EngineView.js';
import { damp, smoothDampAngle, clamp, VelocityRef } from '../math/engineMath.js';

export class CameraRig {
  // Smoothed camera orientation and framing
  public smoothedYaw: number = 0;
  private yawVel: VelocityRef = { val: 0 };
  public smoothedHeight: number = 7.2;
  public smoothedDist: number = 10.5;
  public smoothedY: number = 0;
  public smoothedFov: number = 43.0;

  // Dynamic throttle/brake kick offset
  private kick: number = 0;
  private kickVel: number = 0;

  // Impact camera shake
  private shakeIntensity: number = 0;

  // Initialization flag to prevent first-frame wild swings
  private initialized: boolean = false;

  public reset(): void {
    this.initialized = false;
    this.yawVel.val = 0;
    this.kick = 0;
    this.kickVel = 0;
    this.shakeIntensity = 0;
  }

  public triggerMistakeShake(intensity: number = 1.0): void {
    this.shakeIntensity = Math.min(1.5, this.shakeIntensity + intensity);
  }

  /**
   * Updates camera view from interpolated player pose with zero travel lag.
   */
  public update(
    cam: CameraView,
    player: RacerView,
    dt: number,
    phase: 'idle' | 'countdown' | 'racing' | 'paused' | 'cooldown',
    countdownFraction: number = 1.0, // 0.0 at 3s, 1.0 at GO
    screenShake: boolean = true,
    reducedMotion: boolean = false
  ): void {
    if (!this.initialized) {
      this.smoothedYaw = player.yaw;
      this.smoothedY = player.y;
      this.initialized = true;
    }

    const speed01 = clamp(player.speedKmh / 260, 0, 1.0);

    // 1. Throttle / Brake Kick Spring
    let targetKick = 0;
    if (!reducedMotion) {
      if (player.accel > 1.0) {
        targetKick = Math.min(0.7, (player.accel / 16.0) * 0.7); // Camera pulls back under throttle
      } else if (player.accel < -1.5) {
        targetKick = Math.max(-0.6, (player.accel / 14.0) * 0.6); // Camera pushes in under braking
      }
    }
    const kickOmega = 8.0;
    const kickForce = kickOmega * kickOmega * (targetKick - this.kick) - 2.0 * kickOmega * this.kickVel;
    this.kickVel += kickForce * dt;
    this.kick += this.kickVel * dt;

    // 2. Camera Orientation (Yaw)
    // Smoothly rotates around player with critically-damped angle follower
    this.smoothedYaw = smoothDampAngle(
      this.smoothedYaw,
      player.yaw,
      this.yawVel,
      0.18, // 180ms smooth time gives buttery-smooth cornering feel
      dt
    );

    // Soften bridge/tunnel vertical elevation swings
    this.smoothedY = damp(this.smoothedY, player.y, 8.0, dt);

    // 3. Framing parameters
    const targetDist = 10.4 + speed01 * 1.6 - this.kick;
    const targetHeight = 6.8 + speed01 * 0.8;
    this.smoothedDist = damp(this.smoothedDist, targetDist, 4.0, dt);
    this.smoothedHeight = damp(this.smoothedHeight, targetHeight, 4.0, dt);

    // 4. Dynamic FOV
    const baseFov = 43.0;
    const targetFov = reducedMotion ? baseFov : baseFov + 6.0 * speed01;
    this.smoothedFov = damp(this.smoothedFov, targetFov, 3.0, dt);
    cam.fov = this.smoothedFov;

    // 5. Compute Camera World Position & LookAt Target
    // Anchored directly to player world position (Zero travel lag!)
    let effectiveYaw = this.smoothedYaw;
    let effectiveDist = this.smoothedDist;
    let effectiveHeight = this.smoothedHeight;

    // Cinematic Countdown Intro Sweep (orbits from front-three-quarter hero angle)
    if (phase === 'countdown' && countdownFraction < 1.0) {
      const ease = countdownFraction * countdownFraction * (3.0 - 2.0 * countdownFraction); // smoothstep
      const orbitAngle = (1.0 - ease) * 1.8; // ~100 deg hero angle to 0 deg chase
      effectiveYaw = player.yaw + orbitAngle;
      effectiveDist = 7.0 + (1.0 - ease) * 1.5 + ease * this.smoothedDist;
      effectiveHeight = 3.5 + (1.0 - ease) * 1.2 + ease * this.smoothedHeight;
    }

    const sinYaw = Math.sin(effectiveYaw);
    const cosYaw = Math.cos(effectiveYaw);

    // Camera sits behind the car along effectiveYaw
    cam.posX = player.x - sinYaw * effectiveDist;
    cam.posY = this.smoothedY + effectiveHeight;
    cam.posZ = player.z - cosYaw * effectiveDist;

    // Look-ahead target along the road ahead
    const lookAheadDist = 12.0 + speed01 * 4.0;
    cam.targetX = player.x + Math.sin(player.yaw) * lookAheadDist;
    cam.targetY = player.y + 0.8;
    cam.targetZ = player.z + Math.cos(player.yaw) * lookAheadDist;

    // 6. Camera Shake
    if (this.shakeIntensity > 0.001) {
      if (screenShake && !reducedMotion) {
        const shakeX = (Math.random() - 0.5) * 0.18 * this.shakeIntensity;
        const shakeY = (Math.random() - 0.5) * 0.14 * this.shakeIntensity;
        cam.posX += shakeX;
        cam.posY += shakeY;
      }
      this.shakeIntensity = damp(this.shakeIntensity, 0, 10.0, dt);
    }
  }
}
