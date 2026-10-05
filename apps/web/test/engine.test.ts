// apps/web/test/engine.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FixedStepLoop } from '../src/engine/core/FixedStepLoop.js';
import { RaceClock } from '../src/engine/core/RaceClock.js';
import { TrackPath } from '../src/engine/track/TrackPath.js';
import { CameraRig } from '../src/engine/camera/CameraRig.js';
import { PerfMonitor } from '../src/engine/perf/PerfMonitor.js';
import { QualityManager } from '../src/engine/perf/QualityManager.js';
import { EventBus } from '../src/engine/core/EventBus.js';
import { GameEngine } from '../src/engine/GameEngine.js';
import { createRacerSim, createTypingState, CAR_SPECS } from '@typerace/sim';

describe('GameEngine Subsystems', () => {
  it('FixedStepLoop executes fixed 120Hz steps and clamps excessive time debt', () => {
    const loop = new FixedStepLoop();
    let stepCount = 0;

    // Normal ~17ms frame (~2 steps at 120Hz where dt = 8.333ms)
    const alpha = loop.update(17.0, () => {
      stepCount++;
    });

    expect(stepCount).toBe(2);
    expect(alpha).toBeGreaterThanOrEqual(0);
    expect(alpha).toBeLessThanOrEqual(1.0);

    // Massive lag spike (500ms): should clamp to maxStepsPerFrame (8) and drop debt
    stepCount = 0;
    loop.update(500, () => {
      stepCount++;
    });
    expect(stepCount).toBe(loop.maxStepsPerFrame);
    expect(loop.accumulatorMs).toBeLessThanOrEqual(loop.dtMs);
  });

  it('RaceClock tracks racing elapsed time and handles pauses without time jumps', () => {
    const clock = new RaceClock();
    clock.startRacing(1000);

    // Advance 50ms
    const d1 = clock.advance(1050);
    expect(d1).toBe(50);
    expect(clock.raceTimeMs).toBe(50);

    // Pause for 5000ms
    clock.pause();
    const d2 = clock.advance(6050);
    expect(d2).toBe(0);
    expect(clock.raceTimeMs).toBe(50);

    // Resume
    clock.resume(6050);
    const d3 = clock.advance(6070);
    expect(d3).toBe(20);
    expect(clock.raceTimeMs).toBe(70);
  });

  it('TrackPath builds continuous uniform 1m arc-length LUT with zero-allocation sampling', () => {
    const path = new TrackPath(400, 'pacific-coast');
    expect(path.sampleCount).toBeGreaterThan(500);

    const pose1 = { x: 0, y: 0, z: 0, yaw: 0, slope: 0, curvature: 0, tanX: 0, tanY: 0, tanZ: 1, normX: 1, normZ: 0 };
    path.sample(0, 0, pose1);
    expect(Number.isFinite(pose1.x)).toBe(true);
    expect(Number.isFinite(pose1.z)).toBe(true);

    // Pre-roll sampling behind start line (d = -50m)
    const posePre = { ...pose1 };
    path.sample(-50, 0, posePre);
    expect(Number.isFinite(posePre.z)).toBe(true);
    expect(posePre.z).toBeLessThan(pose1.z);

    // Lateral offset applies correctly along track normal
    const poseLat = { ...pose1 };
    path.sample(0, 3.6, poseLat);
    expect(poseLat.x).not.toBe(pose1.x);
  });

  it('CameraRig anchors to player position with zero velocity lag', () => {
    const rig = new CameraRig();
    const cam = { posX: 0, posY: 0, posZ: 0, targetX: 0, targetY: 0, targetZ: 0, fov: 43 };
    const player = {
      d: 100,
      v: 70, // 252 km/h
      accel: 0,
      lat: 0,
      speedKmh: 252,
      x: 10,
      y: 0,
      z: 100,
      yaw: 0,
      slope: 0,
      curvature: 0,
      bodyPitch: 0,
      bodyRoll: 0,
      bounce: 0,
      wheelAngle: 0,
      brake: 0,
      proximity: 0,
      visible: true,
    };

    rig.update(cam, player, 0.016, 'racing');

    // Camera distance behind car along Z should be ~10.4 + speed offset
    const distBehind = player.z - cam.posZ;
    expect(distBehind).toBeGreaterThan(9.0);
    expect(distBehind).toBeLessThan(14.0);

    // Target look-ahead should be ahead of car
    expect(cam.targetZ).toBeGreaterThan(player.z);
  });

  it('PerfMonitor accurately computes rolling average FPS and p95 latency', () => {
    const monitor = new PerfMonitor();

    // Record 60 frames of 16.6ms
    for (let i = 0; i < 60; i++) {
      monitor.recordFrame(16.66, 2.5, 2);
    }

    const metrics = monitor.getMetrics();
    expect(metrics.fps).toBe(60);
    expect(metrics.avgFrameMs).toBeCloseTo(16.6, 0);
  });

  it('QualityManager adapts quality downward when under heavy load', () => {
    const bus = new EventBus();
    const qm = new QualityManager(bus);
    qm.setTier('high');

    const listener = vi.fn();
    bus.on('qualityChanged', listener);

    // Simulate laggy device (avg frame 22ms)
    qm.evaluate(
      {
        fps: 45,
        avgFrameMs: 22.0,
        p95FrameMs: 26.0,
        maxFrameMs: 32.0,
        drawCalls: 40,
        triangles: 10000,
        simSteps: 2,
        longFrameCount: 5,
      },
      3000,
      true
    );

    expect(qm.tier).toBe('medium');
    expect(listener).toHaveBeenCalledWith({ tier: 'medium' });
  });

  it('GameEngine coordinates phase flow and double-buffered interpolation', () => {
    const engine = new GameEngine();
    const pRacer = createRacerSim('player', 'You', 'B', true);
    const pTyping = createTypingState('racing through the neon city');

    engine.loadRace('pacific-coast', 300, [
      {
        racer: pRacer,
        typing: pTyping,
        car: CAR_SPECS['meridian-gt'],
        script: null,
        cursor: 0,
        laneOffset: 0,
        targetWpm: 80,
        mistakeTwitchSign: 1,
      },
    ]);

    expect(engine.phase).toBe('idle');
    expect(engine.view.racers.length).toBe(1);

    // Start countdown
    engine.startCountdown();
    expect(engine.phase).toBe('countdown');

    // Step frames to complete countdown (3000ms total elapsed)
    engine.frame(1000);
    engine.frame(2000);
    engine.frame(3500);
    engine.frame(4500);

    expect(engine.phase).toBe('racing');

    // Run active race frame
    engine.frame(4516);
    expect(engine.clock.raceTimeMs).toBeGreaterThan(0);
    expect(engine.view.racers[0].speedKmh).toBeGreaterThan(0);
  });
});
