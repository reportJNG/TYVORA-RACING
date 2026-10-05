// apps/web/src/engine/core/FixedStepLoop.ts
import { DT } from '@typerace/sim';

export class FixedStepLoop {
  public readonly dtSec: number = DT; // 1 / 120 s = 0.008333...
  public readonly dtMs: number = DT * 1000; // ~8.3333 ms
  public readonly maxStepsPerFrame: number = 8; // spiral-of-death prevention clamp
  public accumulatorMs: number = 0;
  public alpha: number = 0;

  public reset(): void {
    this.accumulatorMs = 0;
    this.alpha = 0;
  }

  /**
   * Consumes frame delta time, executing fixed simulation steps and returning alpha for interpolation.
   */
  public update(
    deltaMs: number,
    onStep: (dtSec: number, stepIndex: number) => void
  ): number {
    this.accumulatorMs += deltaMs;
    let steps = 0;

    while (this.accumulatorMs >= this.dtMs && steps < this.maxStepsPerFrame) {
      onStep(this.dtSec, steps);
      this.accumulatorMs -= this.dtMs;
      steps++;
    }

    // Drop excess time debt if frame took too long
    if (steps >= this.maxStepsPerFrame) {
      this.accumulatorMs = Math.min(this.accumulatorMs, this.dtMs);
    }

    this.alpha = Math.max(0, Math.min(1.0, this.accumulatorMs / this.dtMs));
    return this.alpha;
  }
}
