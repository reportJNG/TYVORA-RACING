// apps/web/src/engine/track/TrackPath.ts
import * as THREE from 'three';
import { TRACKS_DATA, TrackDefinition } from '../../data/tracks.js';

export interface TrackPose {
  x: number;
  y: number;
  z: number;
  yaw: number;
  slope: number;
  curvature: number;
  tanX: number;
  tanY: number;
  tanZ: number;
  normX: number;
  normZ: number;
}

export function createEmptyTrackPose(): TrackPose {
  return {
    x: 0,
    y: 0,
    z: 0,
    yaw: 0,
    slope: 0,
    curvature: 0,
    tanX: 0,
    tanY: 0,
    tanZ: 1,
    normX: 1,
    normZ: 0,
  };
}

export class TrackPath {
  public readonly raceDistance: number;
  public readonly trackId: string;
  public readonly trackDef: TrackDefinition;

  public readonly minD: number = -120; // 120m pre-roll behind start line for camera & grid
  public readonly maxD: number; // distance + 450m post-finish run-out
  public readonly sampleCount: number;

  private posX: Float32Array;
  private posY: Float32Array;
  private posZ: Float32Array;
  private tanX: Float32Array;
  private tanY: Float32Array;
  private tanZ: Float32Array;
  private normX: Float32Array;
  private normZ: Float32Array;
  private yaw: Float32Array;
  private slope: Float32Array;
  private curvature: Float32Array;

  constructor(raceDistance: number, trackId: string = 'pacific-coast') {
    this.raceDistance = raceDistance;
    this.trackId = trackId;
    this.trackDef = TRACKS_DATA[trackId] || TRACKS_DATA['pacific-coast'];
    this.maxD = raceDistance + 450;

    const totalSpan = this.maxD - this.minD;
    this.sampleCount = Math.ceil(totalSpan) + 1;

    this.posX = new Float32Array(this.sampleCount);
    this.posY = new Float32Array(this.sampleCount);
    this.posZ = new Float32Array(this.sampleCount);
    this.tanX = new Float32Array(this.sampleCount);
    this.tanY = new Float32Array(this.sampleCount);
    this.tanZ = new Float32Array(this.sampleCount);
    this.normX = new Float32Array(this.sampleCount);
    this.normZ = new Float32Array(this.sampleCount);
    this.yaw = new Float32Array(this.sampleCount);
    this.slope = new Float32Array(this.sampleCount);
    this.curvature = new Float32Array(this.sampleCount);

    this.buildLut();
  }

  private buildLut(): void {
    const { spline } = this.trackDef;
    const { curveScale, curveFrequency, tunnelStartProg, tunnelEndProg, tunnelElevation, bridgeStartProg, bridgeEndProg, bridgeHeight } = spline;

    // Generate high-resolution reference spline with pre-roll and run-out
    const refPoints: THREE.Vector3[] = [];
    const stepSizeM = 25.0;
    const startM = this.minD - 50;
    const endM = this.maxD + 50;
    const numRefSteps = Math.ceil((endM - startM) / stepSizeM);

    for (let i = 0; i <= numRefSteps; i++) {
      const z = startM + i * stepSizeM;
      const prog = z / Math.max(1, this.raceDistance);

      const x = Math.sin(prog * (this.raceDistance / 50) * curveFrequency) * curveScale +
                Math.cos(prog * (this.raceDistance / 50) * curveFrequency * 0.5) * (curveScale * 0.35);

      let y = 0;
      if (tunnelStartProg > 0 && prog >= tunnelStartProg && prog <= tunnelEndProg) {
        const tunnelMid = (tunnelStartProg + tunnelEndProg) / 2;
        const tunnelSpan = (tunnelEndProg - tunnelStartProg) / 2;
        const t = (prog - tunnelMid) / tunnelSpan;
        y = tunnelElevation * (1.0 - t * t);
      } else if (bridgeStartProg > 0 && prog >= bridgeStartProg && prog <= bridgeEndProg) {
        const bridgeProg = (prog - bridgeStartProg) / (bridgeEndProg - bridgeStartProg);
        y = Math.sin(bridgeProg * Math.PI) * bridgeHeight;
      }

      refPoints.push(new THREE.Vector3(x, y, z));
    }

    const rawCurve = new THREE.CatmullRomCurve3(refPoints, false, 'centripetal');

    // Build dense arc-length table to map uniform true meters -> curve parameter u
    const denseSubdivs = Math.max(2000, Math.ceil((endM - startM) * 3));
    const densePoints: THREE.Vector3[] = [];
    const denseLengths: number[] = [0];

    densePoints.push(rawCurve.getPointAt(0));
    let totalCurveLength = 0;

    for (let i = 1; i <= denseSubdivs; i++) {
      const pt = rawCurve.getPointAt(i / denseSubdivs);
      densePoints.push(pt);
      totalCurveLength += pt.distanceTo(densePoints[i - 1]);
      denseLengths.push(totalCurveLength);
    }

    // Find curve arc-length at z = 0 (race start line)
    let startArcLength = 0;
    for (let i = 0; i < denseSubdivs; i++) {
      if (densePoints[i].z <= 0 && densePoints[i + 1].z >= 0) {
        const frac = -densePoints[i].z / (densePoints[i + 1].z - densePoints[i].z);
        startArcLength = denseLengths[i] + frac * (denseLengths[i + 1] - denseLengths[i]);
        break;
      }
    }

    // Helper to sample curve by distance relative to start line (d = 0)
    const getPointAndTangentAtMeter = (d: number, outP: THREE.Vector3, outT: THREE.Vector3) => {
      const targetLen = startArcLength + d;
      const clampedLen = Math.max(0, Math.min(totalCurveLength, targetLen));

      // Binary search in denseLengths
      let low = 0;
      let high = denseSubdivs;
      while (low <= high) {
        const mid = (low + high) >> 1;
        if (denseLengths[mid] < clampedLen) {
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      const idx = Math.max(0, Math.min(denseSubdivs - 1, high));
      const segLen = denseLengths[idx + 1] - denseLengths[idx];
      const frac = segLen > 0 ? (clampedLen - denseLengths[idx]) / segLen : 0;
      const u = (idx + frac) / denseSubdivs;

      rawCurve.getPointAt(Math.max(0, Math.min(1, u)), outP);
      rawCurve.getTangentAt(Math.max(0, Math.min(1, u)), outT);
    };

    const p = new THREE.Vector3();
    const t = new THREE.Vector3();
    const tNext = new THREE.Vector3();
    const pNext = new THREE.Vector3();

    for (let i = 0; i < this.sampleCount; i++) {
      const d = this.minD + i;
      getPointAndTangentAtMeter(d, p, t);
      getPointAndTangentAtMeter(d + 1.0, pNext, tNext);

      t.normalize();
      tNext.normalize();

      this.posX[i] = p.x;
      this.posY[i] = p.y;
      this.posZ[i] = p.z;

      this.tanX[i] = t.x;
      this.tanY[i] = t.y;
      this.tanZ[i] = t.z;

      // Normal on XZ horizontal plane
      const normLen = Math.sqrt(t.z * t.z + t.x * t.x);
      const nx = normLen > 0.0001 ? -t.z / normLen : 1;
      const nz = normLen > 0.0001 ? t.x / normLen : 0;
      this.normX[i] = nx;
      this.normZ[i] = nz;

      this.yaw[i] = Math.atan2(t.x, t.z);
      this.slope[i] = Math.asin(Math.max(-1, Math.min(1, t.y)));

      // Signed curvature = change in yaw per unit arc length
      let dyaw = Math.atan2(tNext.x, tNext.z) - this.yaw[i];
      if (dyaw > Math.PI) dyaw -= Math.PI * 2;
      if (dyaw < -Math.PI) dyaw += Math.PI * 2;
      this.curvature[i] = dyaw; // per 1 meter
    }
  }

  /**
   * Fast, allocation-free O(1) sampling into the provided outPose.
   */
  public sample(d: number, lateralOffset: number, outPose: TrackPose): TrackPose {
    const clampedD = Math.max(this.minD, Math.min(this.maxD - 0.01, d));
    const offsetIndex = clampedD - this.minD;
    const baseIdx = Math.floor(offsetIndex);
    const frac = offsetIndex - baseIdx;
    const nextIdx = Math.min(this.sampleCount - 1, baseIdx + 1);

    // Linear interpolation between consecutive 1m samples
    const invFrac = 1.0 - frac;
    const px = this.posX[baseIdx] * invFrac + this.posX[nextIdx] * frac;
    const py = this.posY[baseIdx] * invFrac + this.posY[nextIdx] * frac;
    const pz = this.posZ[baseIdx] * invFrac + this.posZ[nextIdx] * frac;

    const tx = this.tanX[baseIdx] * invFrac + this.tanX[nextIdx] * frac;
    const ty = this.tanY[baseIdx] * invFrac + this.tanY[nextIdx] * frac;
    const tz = this.tanZ[baseIdx] * invFrac + this.tanZ[nextIdx] * frac;

    const nx = this.normX[baseIdx] * invFrac + this.normX[nextIdx] * frac;
    const nz = this.normZ[baseIdx] * invFrac + this.normZ[nextIdx] * frac;

    // Apply lateral offset along track normal vector
    outPose.x = px + nx * lateralOffset;
    outPose.y = py;
    outPose.z = pz + nz * lateralOffset;

    outPose.tanX = tx;
    outPose.tanY = ty;
    outPose.tanZ = tz;
    outPose.normX = nx;
    outPose.normZ = nz;

    // Interpolate angles properly
    let y0 = this.yaw[baseIdx];
    let y1 = this.yaw[nextIdx];
    if (y1 - y0 > Math.PI) y1 -= Math.PI * 2;
    if (y1 - y0 < -Math.PI) y1 += Math.PI * 2;
    outPose.yaw = y0 * invFrac + y1 * frac;

    outPose.slope = this.slope[baseIdx] * invFrac + this.slope[nextIdx] * frac;
    outPose.curvature = this.curvature[baseIdx] * invFrac + this.curvature[nextIdx] * frac;

    return outPose;
  }
}
