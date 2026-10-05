// apps/web/src/engine/GameEngine.ts
import { EventBus } from './core/EventBus.js';
import { RaceClock } from './core/RaceClock.js';
import { FixedStepLoop } from './core/FixedStepLoop.js';
import { TrackPath, createEmptyTrackPose, TrackPose } from './track/TrackPath.js';
import { RaceSimulation, RaceEntrant } from '@typerace/sim';
import { EngineView } from './view/EngineView.js';
import { updateVehicleDynamics } from './view/vehicleDynamics.js';
import { CameraRig } from './camera/CameraRig.js';
import { PerfMonitor } from './perf/PerfMonitor.js';
import { QualityManager } from './perf/QualityManager.js';

export type GamePhase = 'idle' | 'countdown' | 'racing' | 'paused' | 'cooldown';

export interface GameEngineSettings {
  screenShake: boolean;
  reducedMotion: boolean;
}

export class GameEngine {
  public phase: GamePhase = 'idle';

  public readonly eventBus: EventBus = new EventBus();
  public readonly clock: RaceClock = new RaceClock();
  public readonly loop: FixedStepLoop = new FixedStepLoop();
  public trackPath: TrackPath | null = null;
  public readonly sim: RaceSimulation = new RaceSimulation([]);
  public readonly view: EngineView = new EngineView();
  public readonly cameraRig: CameraRig = new CameraRig();
  public readonly perf: PerfMonitor = new PerfMonitor();
  public readonly quality: QualityManager;

  public settings: GameEngineSettings = {
    screenShake: true,
    reducedMotion: false,
  };

  // Double-buffering typed arrays for zero-allocation interpolation
  private prevD: Float64Array = new Float64Array(8);
  private prevV: Float64Array = new Float64Array(8);
  private prevLat: Float64Array = new Float64Array(8);
  private prevAccel: Float64Array = new Float64Array(8);

  // Scratch pose object for zero-allocation track sampling
  private scratchPose: TrackPose = createEmptyTrackPose();

  // Countdown state
  private countdownElapsedMs: number = 0;
  private readonly countdownTotalMs: number = 3000;
  private lastReportedCountdown: number = 3;

  // Rank tracking
  private prevPlayerRank: number = 1;
  private playerEntrantIndex: number = 0;

  // Registered imperative frame listeners (e.g. HUD, Audio)
  private frameListeners: Set<(engine: GameEngine) => void> = new Set();

  constructor() {
    this.quality = new QualityManager(this.eventBus);
  }

  public onFrame(listener: (engine: GameEngine) => void): () => void {
    this.frameListeners.add(listener);
    return () => {
      this.frameListeners.delete(listener);
    };
  }

  /**
   * Initializes a race with track and entrants, preallocating double-buffers and views.
   */
  public loadRace(
    trackId: string,
    raceDistance: number,
    entrants: RaceEntrant[],
    settings?: Partial<GameEngineSettings>
  ): void {
    if (settings) {
      this.settings = { ...this.settings, ...settings };
    }

    this.phase = 'idle';
    this.trackPath = new TrackPath(raceDistance, trackId);
    this.sim.setEntrants(entrants);
    this.view.init(entrants.length);
    this.cameraRig.reset();
    this.clock.reset();
    this.loop.reset();

    const n = entrants.length;
    if (this.prevD.length < n) {
      this.prevD = new Float64Array(n);
      this.prevV = new Float64Array(n);
      this.prevLat = new Float64Array(n);
      this.prevAccel = new Float64Array(n);
    }

    this.playerEntrantIndex = 0;
    for (let i = 0; i < n; i++) {
      const e = entrants[i];
      if (e.racer.isPlayer) {
        this.playerEntrantIndex = i;
      }
      this.prevD[i] = e.racer.d;
      this.prevV[i] = e.racer.v;
      this.prevLat[i] = e.racer.lat;
      this.prevAccel[i] = e.racer.accel;
    }

    this.prevPlayerRank = 1;

    // Immediately sample initial poses into view
    this.interpolateAndSample(0, performance.now());
  }

  public startCountdown(nowWallMs?: number): void {
    this.phase = 'countdown';
    this.countdownElapsedMs = 0;
    this.lastReportedCountdown = 3;
    this.cameraRig.reset();
    this.clock.lastFrameWallMs = typeof nowWallMs === 'number' ? nowWallMs : 0;
    this.eventBus.emit('countdown', { count: 3 });
  }

  public pause(): void {
    if (this.phase === 'racing') {
      this.phase = 'paused';
      this.clock.pause();
    }
  }

  public resume(): void {
    if (this.phase === 'paused') {
      this.phase = 'racing';
      this.clock.resume();
    }
  }

  public handleMistake(): void {
    const playerEntrant = this.sim.entrants[this.playerEntrantIndex];
    if (playerEntrant) {
      playerEntrant.mistakeTwitchSign = -playerEntrant.mistakeTwitchSign;
      playerEntrant.racer.latV += playerEntrant.mistakeTwitchSign * 0.9;
    }
    this.cameraRig.triggerMistakeShake(1.0);
    this.eventBus.emit('mistake', { entrantIndex: this.playerEntrantIndex });
  }

  /**
   * Main per-frame tick called by EngineDriver at the start of requestAnimationFrame.
   */
  public frame(nowWallMs: number): void {
    const frameStart = performance.now();
    let simSteps = 0;

    if (this.phase === 'countdown') {
      if (this.clock.lastFrameWallMs === 0) {
        this.clock.lastFrameWallMs = nowWallMs;
      }
      // Step countdown timer
      const rawDelta = nowWallMs - this.clock.lastFrameWallMs;
      this.clock.lastFrameWallMs = nowWallMs;
      const delta = Math.max(0, rawDelta);
      this.countdownElapsedMs += delta;

      const remainingSec = Math.max(0, Math.ceil((this.countdownTotalMs - this.countdownElapsedMs) / 1000));
      if (remainingSec > 0 && remainingSec !== this.lastReportedCountdown) {
        this.lastReportedCountdown = remainingSec;
        this.eventBus.emit('countdown', { count: remainingSec });
      }

      if (this.countdownElapsedMs >= this.countdownTotalMs) {
        this.phase = 'racing';
        this.clock.startRacing(nowWallMs);
        this.loop.reset();
        this.eventBus.emit('go', undefined);
      }

      // Smooth camera intro sweep during countdown
      const countdownFrac = Math.min(1.0, this.countdownElapsedMs / this.countdownTotalMs);
      this.interpolateAndSample(0, nowWallMs, countdownFrac);
    } else if (this.phase === 'racing' || this.phase === 'cooldown') {
      const activeDeltaMs = this.clock.advance(nowWallMs);
      const targetDist = this.trackPath?.raceDistance || 500;

      this.loop.update(activeDeltaMs, (dtSec, _stepIdx) => {
        simSteps++;
        const entrants = this.sim.entrants;
        const count = entrants.length;

        // 1. Snapshot previous state into double-buffer before sim step
        for (let i = 0; i < count; i++) {
          const r = entrants[i].racer;
          this.prevD[i] = r.d;
          this.prevV[i] = r.v;
          this.prevLat[i] = r.lat;
          this.prevAccel[i] = r.accel;
        }

        // 2. Step fixed-step physics & AI
        this.sim.step(dtSec, this.clock.raceTimeMs, targetDist);

        // 3. Process finish events
        if (this.sim.finishedCount > 0) {
          for (let f = 0; f < this.sim.finishedCount; f++) {
            const finishedIdx = this.sim.finishedThisStep[f];
            if (finishedIdx === this.playerEntrantIndex && this.phase === 'racing') {
              this.phase = 'cooldown';
              const rank = this.sim.rankOf(this.playerEntrantIndex);
              const timeMs = this.sim.entrants[this.playerEntrantIndex].racer.finishMs ?? this.clock.raceTimeMs;
              this.eventBus.emit('playerFinish', { rank, timeMs });
            }
          }
        }

        // 4. Track rank changes for low-frequency notification
        const curRank = this.sim.rankOf(this.playerEntrantIndex);
        if (curRank !== this.prevPlayerRank) {
          this.eventBus.emit('rankChange', {
            oldRank: this.prevPlayerRank,
            newRank: curRank,
          });
          this.prevPlayerRank = curRank;
        }
      });

      // Interpolate double-buffered state into EngineView
      this.interpolateAndSample(this.loop.alpha, nowWallMs, 1.0);
    }

    // Notify registered imperative frame listeners (e.g. DOM HUD speed text, Audio pitch)
    this.frameListeners.forEach((listener) => {
      try {
        listener(this);
      } catch (err) {
        console.error('Error in engine onFrame listener:', err);
      }
    });

    // Record performance metrics
    const frameDuration = performance.now() - frameStart;
    const deltaWallMs = nowWallMs - (this.perf as any).lastWallMs || 16.6;
    (this.perf as any).lastWallMs = nowWallMs;
    this.perf.recordFrame(deltaWallMs, frameDuration, simSteps);

    // Adaptive quality tier evaluation
    this.quality.evaluate(this.perf.getMetrics(nowWallMs), nowWallMs, this.phase === 'racing');
  }

  private interpolateAndSample(
    alpha: number,
    nowWallMs: number,
    countdownFraction: number = 1.0
  ): void {
    if (!this.trackPath) return;

    const entrants = this.sim.entrants;
    const count = entrants.length;
    const playerD = this.view.racers[this.playerEntrantIndex]?.d ?? 0;
    const timeSec = nowWallMs / 1000.0;
    const dt = 1.0 / 60.0; // standard visual damping dt

    for (let i = 0; i < count; i++) {
      const e = entrants[i];
      const r = e.racer;
      const v = this.view.racers[i];
      if (!v) continue;

      // 1. Interpolate double-buffered simulation numbers
      v.d = this.prevD[i] + (r.d - this.prevD[i]) * alpha;
      v.v = this.prevV[i] + (r.v - this.prevV[i]) * alpha;
      v.lat = this.prevLat[i] + (r.lat - this.prevLat[i]) * alpha;
      v.accel = this.prevAccel[i] + (r.accel - this.prevAccel[i]) * alpha;

      // 2. Sample uniform arc-length track LUT (Zero allocation!)
      const worldLateral = e.laneOffset + v.lat;
      this.trackPath.sample(v.d, worldLateral, this.scratchPose);

      v.x = this.scratchPose.x;
      v.y = this.scratchPose.y;
      v.z = this.scratchPose.z;
      v.yaw = this.scratchPose.yaw;
      v.slope = this.scratchPose.slope;
      v.curvature = this.scratchPose.curvature;

      // 3. Update visual dynamics (suspension pitch/roll/dive, wheels, brake glow)
      const isStalled = r.stallUntilMs > this.clock.raceTimeMs;
      updateVehicleDynamics(
        v,
        dt,
        timeSec,
        playerD,
        isStalled,
        this.settings.reducedMotion
      );

      // Distance culling: hide ghost cars if they are far behind the player's view
      if (!r.isPlayer) {
        const distFromPlayer = v.d - playerD;
        v.visible = distFromPlayer >= -45 && distFromPlayer <= 220;
      } else {
        v.visible = true;
      }
    }

    // 4. Update CameraRig from interpolated player pose
    const playerView = this.view.racers[this.playerEntrantIndex];
    if (playerView) {
      this.cameraRig.update(
        this.view.camera,
        playerView,
        dt,
        this.phase,
        countdownFraction,
        this.settings.screenShake,
        this.settings.reducedMotion
      );
    }
  }
}

// Global engine singleton instance
export const gameEngine = new GameEngine();
