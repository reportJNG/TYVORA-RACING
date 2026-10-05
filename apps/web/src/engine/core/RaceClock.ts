// apps/web/src/engine/core/RaceClock.ts

export class RaceClock {
  public wallTimeMs: number = 0;
  public raceTimeMs: number = 0;
  public lastFrameWallMs: number = 0;
  public isPaused: boolean = false;
  public isRacing: boolean = false;

  public reset(initialWallTimeMs: number = performance.now()): void {
    this.wallTimeMs = initialWallTimeMs;
    this.raceTimeMs = 0;
    this.lastFrameWallMs = initialWallTimeMs;
    this.isPaused = false;
    this.isRacing = false;
  }

  public startRacing(wallTimeMs: number = performance.now()): void {
    this.wallTimeMs = wallTimeMs;
    this.lastFrameWallMs = wallTimeMs;
    this.raceTimeMs = 0;
    this.isRacing = true;
    this.isPaused = false;
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(wallTimeMs: number = performance.now()): void {
    this.isPaused = false;
    this.wallTimeMs = wallTimeMs;
    this.lastFrameWallMs = wallTimeMs;
  }

  /**
   * Advances the clock on each frame by wall delta, returning active deltaMs for simulation.
   */
  public advance(nowWallMs: number): number {
    const rawDelta = nowWallMs - this.lastFrameWallMs;
    this.lastFrameWallMs = nowWallMs;
    this.wallTimeMs = nowWallMs;

    if (this.isPaused || !this.isRacing) {
      return 0;
    }

    // Clamp delta to prevent huge jumps from background tabs
    const clampedDelta = Math.min(250, Math.max(0, rawDelta));
    this.raceTimeMs += clampedDelta;
    return clampedDelta;
  }

  /**
   * Translates an input event timestamp (from KeyboardEvent.timeStamp) to exact race time.
   */
  public nowRaceMs(eventTimeStamp?: number): number {
    if (!this.isRacing) return 0;
    if (typeof eventTimeStamp !== 'number' || eventTimeStamp <= 0) {
      return this.raceTimeMs;
    }

    // KeyboardEvent.timeStamp shares performance.now() time-origin
    const offset = eventTimeStamp - this.lastFrameWallMs;
    const clampedOffset = Math.max(-100, Math.min(100, offset));
    return Math.max(0, this.raceTimeMs + clampedOffset);
  }
}
