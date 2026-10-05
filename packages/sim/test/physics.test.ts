// packages/sim/test/physics.test.ts
import { describe, it, expect } from 'vitest';
import { CAR_SPECS, DT, M } from '../src/constants.js';
import { createTypingState, onChar } from '../src/typing.js';
import { createRacerSim, stepCar, onMistake } from '../src/physics.js';

describe('Car Physics Simulation', () => {
  it('accelerates smoothly as typing pace increases and never stops during racing', () => {
    const car = CAR_SPECS['meridian-gt'];
    const racer = createRacerSim('player', 'Player', 'B', true);
    const target = 'speed wins races on the track';
    const typing = createTypingState(target);
    const targetDistance = target.length * M;

    // Type 10 chars at a steady 100 WPM pace (120ms per char)
    let t = 0;
    for (let i = 0; i < 10; i++) {
      onChar(typing, target[i], t);
      // Step physics for 120ms (at 120Hz = ~14 ticks)
      for (let step = 0; step < 14; step++) {
        t += DT * 1000;
        stepCar(racer, typing, car, t, DT, targetDistance);
      }
    }

    // Velocity should be positive and greater than minimum speed
    expect(racer.v).toBeGreaterThanOrEqual(11.11);
    expect(racer.d).toBeGreaterThan(0);
  });

  it('drops speed immediately on mistake penalty but never below minimum speed (Case 5 & 6)', () => {
    const car = CAR_SPECS['meridian-gt'];
    const racer = createRacerSim('player', 'Player', 'B', true);
    racer.v = 50.0; // 50 m/s (~180 km/h)

    onMistake(racer, car, 5000);

    // Meridian GT penalty scale is 0.90 -> loss = (1 - 0.65) * 0.90 = 0.315 -> 31.5% drop
    // New speed should be 50 * (1 - 0.315) = 34.25 m/s
    expect(racer.v).toBeCloseTo(34.25, 1);
    expect(racer.stallUntilMs).toBe(5600);

    // Repeated mistakes must never drop speed below MIN_RACE_SPEED (Never Stop rule)
    for (let i = 0; i < 10; i++) {
      onMistake(racer, car, 5600 + i * 100);
    }
    expect(racer.v).toBeGreaterThanOrEqual(11.11);
  });

  it('detects finish crossing with sub-tick accuracy once text is complete', () => {
    const car = CAR_SPECS['strada-r'];
    const racer = createRacerSim('player', 'Player', 'B', true);
    const target = 'race to the end';
    const typing = createTypingState(target);
    const targetDistance = target.length * M;

    // Complete typing at t = 2000ms
    for (let i = 0; i < target.length; i++) {
      onChar(typing, target[i], i * 100);
    }
    expect(typing.completedAt).not.toBeNull();

    // Drive until crossing finish line
    let t = 2000;
    racer.v = 60.0;
    racer.d = targetDistance - 5.0; // 5 meters to finish

    while (racer.finishMs === null && t < 3000) {
      t += DT * 1000;
      stepCar(racer, typing, car, t, DT, targetDistance);
    }

    expect(racer.finishMs).not.toBeNull();
    expect(racer.finishMs).toBeGreaterThan(2000);
    expect(racer.finishMs).toBeLessThanOrEqual(t);
  });

  it('preserves momentum smoothly during inter-word typing pauses without start-stop jerking', () => {
    const car = CAR_SPECS['meridian-gt'];
    const racer = createRacerSim('player', 'Player', 'B', true);
    const target = 'smooth cruising speed';
    const typing = createTypingState(target);
    const targetDistance = target.length * M;

    // Type the first word "smooth " at 80 WPM (150ms per key)
    let t = 0;
    for (let i = 0; i < 7; i++) {
      onChar(typing, target[i], t);
      for (let s = 0; s < 18; s++) {
        t += DT * 1000;
        stepCar(racer, typing, car, t, DT, targetDistance);
      }
    }

    const speedAfterWord = racer.v;
    expect(speedAfterWord).toBeGreaterThan(40.0); // High speed reached

    // Now simulate human hesitation / inter-word pause of 400ms
    const pauseStartSpeed = racer.v;
    for (let s = 0; s < 48; s++) { // 48 * ~8.33ms = 400ms
      t += DT * 1000;
      stepCar(racer, typing, car, t, DT, targetDistance);
    }

    // During a 400ms inter-word pause, momentum is sustained!
    // The car must NOT slam the brakes: speed drop should be minimal (< 2.0 m/s)
    const speedAfterPause = racer.v;
    const speedDrop = pauseStartSpeed - speedAfterPause;
    expect(speedDrop).toBeLessThan(2.0);
    expect(speedAfterPause).toBeGreaterThan(45.0);

    // Physical acceleration should be gentle coasting decel, not emergency braking
    expect(racer.accel).toBeGreaterThan(-4.0);
  });

  it('provides smooth aerodynamic slipstream drafting boost when trailing lead racer', () => {
    const car = CAR_SPECS['apex-gtr'];
    const racerNoDraft = createRacerSim('player1', 'Player 1', 'B', true);
    const racerWithDraft = createRacerSim('player2', 'Player 2', 'B', true);
    const target = 'drafting slingshot maneuver on the straightaway';
    const typing1 = createTypingState(target);
    const typing2 = createTypingState(target);
    const targetDistance = target.length * M;

    // Both racers type 15 characters at same pace
    let t = 0;
    for (let i = 0; i < 15; i++) {
      onChar(typing1, target[i], t);
      onChar(typing2, target[i], t);
      for (let s = 0; s < 15; s++) {
        t += DT * 1000;
        // Racer 1 has no draft
        stepCar(racerNoDraft, typing1, car, t, DT, targetDistance);
        // Racer 2 is drafting closely (4 meters behind lead opponent at d = 50)
        const leadDist = racerWithDraft.d + 4.0;
        stepCar(racerWithDraft, typing2, car, t, DT, targetDistance, leadDist);
      }
    }

    // Drafting racer should gain smooth slingshot advantage
    expect(racerWithDraft.v).toBeGreaterThan(racerNoDraft.v);
    expect(racerWithDraft.d).toBeGreaterThan(racerNoDraft.d);
  });
});

