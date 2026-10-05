// packages/sim/src/race.ts
import { CarSpec, DT } from './constants.js';
import { TypingState, KeystrokeEntry, onChar, onBackspace, cloneTypingState } from './typing.js';
import { RacerSim, stepCar, stepRacerLateral, cloneRacerSim } from './physics.js';

export interface RaceEntrant {
  racer: RacerSim;
  typing: TypingState;
  car: CarSpec;
  script: KeystrokeEntry[] | null; // AI keystroke script (null for human player)
  cursor: number; // current index in script (avoids Array.shift())
  laneOffset: number; // base lane position in meters (- = left, 0 = center, + = right)
  targetWpm: number;
  mistakeTwitchSign: number;
}

export class RaceSimulation {
  public entrants: RaceEntrant[];
  public finishedThisStep: number[];
  public finishedCount: number;

  constructor(entrants: RaceEntrant[] = []) {
    this.entrants = entrants;
    this.finishedThisStep = new Array(entrants.length || 8).fill(-1);
    this.finishedCount = 0;
  }

  public setEntrants(entrants: RaceEntrant[]): void {
    this.entrants = entrants;
    if (this.finishedThisStep.length < entrants.length) {
      this.finishedThisStep = new Array(entrants.length).fill(-1);
    }
    this.finishedCount = 0;
  }

  /**
   * Executes one fixed simulation tick.
   */
  public step(dt: number, tMs: number, targetDistance: number): void {
    this.finishedCount = 0;
    const count = this.entrants.length;

    // 1. Advance AI typing scripts up to tMs without array mutations
    for (let i = 0; i < count; i++) {
      const e = this.entrants[i];
      if (e.script !== null && e.racer.finishMs === null) {
        while (e.cursor < e.script.length && e.script[e.cursor][0] <= tMs) {
          const entry = e.script[e.cursor];
          e.cursor++;
          if (entry[1] === 'BS') {
            onBackspace(e.typing, entry[0]);
          } else {
            onChar(e.typing, entry[1], entry[0]);
          }
        }
      }
    }

    // 2. Identify player and opponents for slipstream & rubber-banding
    let playerEntrant: RaceEntrant | null = null;
    let leadOpponentDistance = 0;
    let leadOpponentLane = 0;

    for (let i = 0; i < count; i++) {
      const e = this.entrants[i];
      if (e.racer.isPlayer) {
        playerEntrant = e;
      }
    }

    if (playerEntrant) {
      const pDist = playerEntrant.racer.d;
      let minGap = Infinity;
      for (let i = 0; i < count; i++) {
        const e = this.entrants[i];
        if (!e.racer.isPlayer && e.racer.finishMs === null && e.racer.d > pDist) {
          const gap = e.racer.d - pDist;
          if (gap < minGap) {
            minGap = gap;
            leadOpponentDistance = e.racer.d;
            leadOpponentLane = e.laneOffset + e.racer.lat;
          }
        }
      }
    }

    // 3. Step longitudinal car physics
    for (let i = 0; i < count; i++) {
      const e = this.entrants[i];
      const hadFinished = e.racer.finishMs !== null;

      stepCar(
        e.racer,
        e.typing,
        e.car,
        tMs,
        dt,
        targetDistance,
        e.racer.isPlayer ? leadOpponentDistance : undefined,
        !e.racer.isPlayer && playerEntrant ? playerEntrant.racer.d : undefined
      );

      if (!hadFinished && e.racer.finishMs !== null) {
        this.finishedThisStep[this.finishedCount++] = i;
      }
    }

    // 4. Lateral dynamics: slipstream drift & anti-overlap buffering
    for (let i = 0; i < count; i++) {
      const e = this.entrants[i];
      let targetLat = 0;

      // Player slipstream subtle pull toward the lead car
      if (e.racer.isPlayer && leadOpponentDistance > e.racer.d + 1.5) {
        const gap = leadOpponentDistance - e.racer.d;
        if (gap <= 20) {
          const draftStrength = 1.0 - gap / 20;
          const driftDir = leadOpponentLane > 0 ? 1 : leadOpponentLane < 0 ? -1 : 0;
          targetLat += driftDir * 0.55 * draftStrength;
        }
      }

      // Smooth anti-overlap avoidance: if two cars are adjacent longitudinally (< 5.0m),
      // ensure they never visually intersect or clip by exerting a smooth repulsive nudge!
      for (let j = 0; j < count; j++) {
        if (i === j) continue;
        const other = this.entrants[j];
        const distGap = Math.abs(e.racer.d - other.racer.d);
        if (distGap < 4.8) {
          const worldLatSelf = e.laneOffset + e.racer.lat;
          const worldLatOther = other.laneOffset + other.racer.lat;
          const latGap = worldLatSelf - worldLatOther;
          const minSeparation = 2.4; // minimum safe visual lane clearance

          if (Math.abs(latGap) < minSeparation) {
            const pushDir = latGap >= 0 ? 1 : -1;
            const overlapAmount = minSeparation - Math.abs(latGap);
            const proximityFactor = 1.0 - distGap / 4.8;
            targetLat += pushDir * overlapAmount * 0.6 * proximityFactor;
          }
        }
      }

      stepRacerLateral(e.racer, dt, targetLat);
    }
  }

  /**
   * Returns the 1-based standing of entrant i.
   */
  public rankOf(entrantIndex: number): number {
    const target = this.entrants[entrantIndex];
    if (!target) return 1;

    let rank = 1;
    const targetFinished = target.racer.finishMs !== null;

    for (let i = 0; i < this.entrants.length; i++) {
      if (i === entrantIndex) continue;
      const other = this.entrants[i];
      const otherFinished = other.racer.finishMs !== null;

      if (targetFinished && otherFinished) {
        if (other.racer.finishMs! < target.racer.finishMs!) {
          rank++;
        }
      } else if (targetFinished && !otherFinished) {
        // Target already finished, other has not -> target is ahead
      } else if (!targetFinished && otherFinished) {
        // Other finished first -> other is ahead
        rank++;
      } else {
        // Neither finished -> compare distance along track
        if (other.racer.d > target.racer.d) {
          rank++;
        }
      }
    }

    return rank;
  }

  /**
   * Deterministically fast-forwards a clone of entrant i to estimate exact finish time.
   */
  public estimateFinishMs(
    entrantIndex: number,
    currentMs: number,
    targetDistance: number
  ): number {
    const entrant = this.entrants[entrantIndex];
    if (!entrant) return currentMs;
    if (entrant.racer.finishMs !== null) return entrant.racer.finishMs;

    // Fast-forward on cloned objects
    const simRacer = cloneRacerSim(entrant.racer);
    const simTyping = cloneTypingState(entrant.typing);
    let simCursor = entrant.cursor;
    const script = entrant.script;
    let t = currentMs;
    const fastDt = DT * 2; // 60 Hz step for fast calculation

    const maxSimMs = currentMs + 120000; // 2 minute safety guard
    while (simRacer.finishMs === null && t < maxSimMs) {
      t += fastDt * 1000;

      if (script !== null) {
        while (simCursor < script.length && script[simCursor][0] <= t) {
          const entry = script[simCursor];
          simCursor++;
          if (entry[1] === 'BS') {
            onBackspace(simTyping, entry[0]);
          } else {
            onChar(simTyping, entry[1], entry[0]);
          }
        }
      }

      stepCar(simRacer, simTyping, entrant.car, t, fastDt, targetDistance);
    }

    return simRacer.finishMs ?? Math.round(t);
  }
}
