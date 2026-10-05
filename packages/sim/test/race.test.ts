// packages/sim/test/race.test.ts
import { describe, it, expect } from 'vitest';
import {
  CAR_SPECS,
  DT,
  M,
  createRacerSim,
  createTypingState,
  onChar,
  RaceSimulation,
  RaceEntrant,
  generateAiLog,
  stepCar,
} from '../src/index.js';

describe('RaceSimulation and Physics Pipeline', () => {
  const targetText = 'speed and precision lead the championship across every open road';
  const targetDistance = targetText.length * M;

  it('maintains strict determinism across multiple runs with identical input', () => {
    const createTestRace = () => {
      const pRacer = createRacerSim('player', 'You', 'B', true);
      const pTyping = createTypingState(targetText);

      const aiScript = generateAiLog(4488, targetText, 65, 30);
      const aiRacer = createRacerSim('ai-rival', 'Rival', 'A', false);
      const aiTyping = createTypingState(targetText);

      const entrants: RaceEntrant[] = [
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
        {
          racer: aiRacer,
          typing: aiTyping,
          car: CAR_SPECS['strada-r'],
          script: aiScript.log,
          cursor: 0,
          laneOffset: -3.6,
          targetWpm: 65,
          mistakeTwitchSign: -1,
        },
      ];

      return new RaceSimulation(entrants);
    };

    const sim1 = createTestRace();
    const sim2 = createTestRace();

    // Type 20 characters into player in both runs
    let t = 0;
    for (let i = 0; i < 20; i++) {
      onChar(sim1.entrants[0].typing, targetText[i], t);
      onChar(sim2.entrants[0].typing, targetText[i], t);
      for (let s = 0; s < 12; s++) {
        t += DT * 1000;
        sim1.step(DT, t, targetDistance);
        sim2.step(DT, t, targetDistance);
      }
    }

    expect(sim1.entrants[0].racer.d).toBe(sim2.entrants[0].racer.d);
    expect(sim1.entrants[0].racer.v).toBe(sim2.entrants[0].racer.v);
    expect(sim1.entrants[1].racer.d).toBe(sim2.entrants[1].racer.d);
    expect(sim1.entrants[1].racer.v).toBe(sim2.entrants[1].racer.v);
  });

  it('smoothly decelerates towards hold line without sudden velocity clamping when text is incomplete', () => {
    const car = CAR_SPECS['meridian-gt'];
    const racer = createRacerSim('player', 'You', 'B', true);
    const typing = createTypingState(targetText);

    // Place car right before the finish line (10 meters away)
    racer.d = targetDistance - 10;
    racer.v = 60.0;

    let t = 10000;
    // Step simulation without completing text
    for (let step = 0; step < 60; step++) {
      t += DT * 1000;
      stepCar(racer, typing, car, t, DT, targetDistance);
    }

    // Car must not cross finish threshold before text is done
    expect(racer.d).toBeLessThanOrEqual(targetDistance - 2);
    // Velocity must be smooth, low, and not bugged at 25 m/s
    expect(racer.v).toBeLessThan(10.0);
    expect(racer.finishMs).toBeNull();
  });

  it('executes post-finish run-out deceleration and stops smoothly', () => {
    const car = CAR_SPECS['apex-gtr'];
    const racer = createRacerSim('player', 'You', 'B', true);
    const typing = createTypingState(targetText);

    // Complete typing
    for (let i = 0; i < targetText.length; i++) {
      onChar(typing, targetText[i], i * 80);
    }
    expect(typing.completedAt).not.toBeNull();

    // Place right at the finish line
    racer.d = targetDistance;
    racer.v = 70.0;
    racer.finishMs = 5000;

    let t = 5000;
    for (let step = 0; step < 1200; step++) {
      t += DT * 1000;
      stepCar(racer, typing, car, t, DT, targetDistance);
    }

    // Car should have rolled into run-out area and stopped
    expect(racer.d).toBeGreaterThan(targetDistance);
    expect(racer.d).toBeLessThanOrEqual(targetDistance + 150);
    expect(racer.v).toBe(0);
  });

  it('applies anti-overlap lateral avoidance so passing cars do not clip', () => {
    const racer1 = createRacerSim('p1', 'Player 1', 'B', true);
    const racer2 = createRacerSim('p2', 'Player 2', 'B', false);
    const typing1 = createTypingState(targetText);
    const typing2 = createTypingState(targetText);

    // Both cars in same lane at same longitudinal distance
    racer1.d = 100;
    racer2.d = 100.5;
    racer1.lat = 0.2;
    racer2.lat = -0.2;

    const entrants: RaceEntrant[] = [
      {
        racer: racer1,
        typing: typing1,
        car: CAR_SPECS['strada-r'],
        script: null,
        cursor: 0,
        laneOffset: 0,
        targetWpm: 70,
        mistakeTwitchSign: 1,
      },
      {
        racer: racer2,
        typing: typing2,
        car: CAR_SPECS['volta-e'],
        script: null,
        cursor: 0,
        laneOffset: 0,
        targetWpm: 70,
        mistakeTwitchSign: -1,
      },
    ];

    const sim = new RaceSimulation(entrants);
    for (let step = 0; step < 30; step++) {
      sim.step(DT, step * DT * 1000, targetDistance);
    }

    // Both cars should have pushed laterally apart from each other
    expect(racer1.lat).toBeGreaterThan(0.2);
    expect(racer2.lat).toBeLessThan(-0.2);
  });

  it('calculates deterministic finish estimates for AI racers', () => {
    const aiScript = generateAiLog(777, targetText, 60, 20);
    const aiRacer = createRacerSim('ai', 'AI Racer', 'A', false);
    const aiTyping = createTypingState(targetText);

    const entrant: RaceEntrant = {
      racer: aiRacer,
      typing: aiTyping,
      car: CAR_SPECS['scrapper-rust'],
      script: aiScript.log,
      cursor: 0,
      laneOffset: -3.6,
      targetWpm: 60,
      mistakeTwitchSign: 1,
    };

    const sim = new RaceSimulation([entrant]);
    const estimate = sim.estimateFinishMs(0, 0, targetDistance);

    expect(estimate).toBeGreaterThan(5000);
    expect(estimate).toBeLessThan(120000);
  });
});
