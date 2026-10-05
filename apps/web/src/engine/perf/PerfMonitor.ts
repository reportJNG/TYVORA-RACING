// apps/web/src/engine/perf/PerfMonitor.ts

export interface PerfMetrics {
  fps: number;
  avgFrameMs: number;
  p95FrameMs: number;
  maxFrameMs: number;
  drawCalls: number;
  triangles: number;
  simSteps: number;
  longFrameCount: number;
}

export class PerfMonitor {
  private static readonly BUFFER_SIZE = 240;
  private frameDeltas: Float32Array = new Float32Array(PerfMonitor.BUFFER_SIZE);
  private workDeltas: Float32Array = new Float32Array(PerfMonitor.BUFFER_SIZE);
  private writeIndex: number = 0;
  private count: number = 0;

  // Running EMA
  public emaFps: number = 60.0;
  public drawCalls: number = 0;
  public triangles: number = 0;
  public simStepsLastFrame: number = 0;
  public longFrameCount: number = 0;

  private lastCalcTime: number = 0;
  private cachedMetrics: PerfMetrics = {
    fps: 60,
    avgFrameMs: 16.6,
    p95FrameMs: 16.6,
    maxFrameMs: 16.6,
    drawCalls: 0,
    triangles: 0,
    simSteps: 0,
    longFrameCount: 0,
  };

  public recordFrame(frameDeltaMs: number, workMs: number, simSteps: number): void {
    const idx = this.writeIndex;
    this.frameDeltas[idx] = frameDeltaMs;
    this.workDeltas[idx] = workMs;
    this.writeIndex = (idx + 1) % PerfMonitor.BUFFER_SIZE;
    if (this.count < PerfMonitor.BUFFER_SIZE) this.count++;

    this.simStepsLastFrame = simSteps;

    if (frameDeltaMs > 25.0) {
      this.longFrameCount++;
    }

    // Instantaneous FPS with exponential smoothing
    if (frameDeltaMs > 0.001) {
      const instantFps = 1000.0 / frameDeltaMs;
      this.emaFps += (instantFps - this.emaFps) * 0.08;
    }
  }

  public recordRendererInfo(drawCalls: number, triangles: number): void {
    this.drawCalls = drawCalls;
    this.triangles = triangles;
  }

  public getMetrics(nowWallMs: number = performance.now()): PerfMetrics {
    // Recompute statistics at at most 4 Hz (every 250ms) to avoid sorting cost on every frame
    if (nowWallMs - this.lastCalcTime < 250 && this.lastCalcTime > 0) {
      this.cachedMetrics.drawCalls = this.drawCalls;
      this.cachedMetrics.triangles = this.triangles;
      this.cachedMetrics.simSteps = this.simStepsLastFrame;
      this.cachedMetrics.longFrameCount = this.longFrameCount;
      return this.cachedMetrics;
    }

    this.lastCalcTime = nowWallMs;

    if (this.count === 0) {
      return this.cachedMetrics;
    }

    const n = this.count;
    const samples = new Float32Array(n);
    let sum = 0;
    let max = 0;

    for (let i = 0; i < n; i++) {
      const v = this.frameDeltas[i];
      samples[i] = v;
      sum += v;
      if (v > max) max = v;
    }

    samples.sort();
    const p95Idx = Math.floor(n * 0.95);
    const p95 = samples[Math.min(n - 1, p95Idx)];
    const avg = sum / n;
    const fps = avg > 0 ? Math.round(1000.0 / avg) : 60;

    this.cachedMetrics = {
      fps,
      avgFrameMs: Number(avg.toFixed(1)),
      p95FrameMs: Number(p95.toFixed(1)),
      maxFrameMs: Number(max.toFixed(1)),
      drawCalls: this.drawCalls,
      triangles: this.triangles,
      simSteps: this.simStepsLastFrame,
      longFrameCount: this.longFrameCount,
    };

    return this.cachedMetrics;
  }
}
