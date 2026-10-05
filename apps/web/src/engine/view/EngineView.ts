// apps/web/src/engine/view/EngineView.ts

export interface RacerView {
  d: number;
  v: number;
  accel: number;
  lat: number;
  speedKmh: number;

  // 3D world pose
  x: number;
  y: number;
  z: number;
  yaw: number;
  slope: number;
  curvature: number;

  // Physical suspension & visual animations
  bodyPitch: number;
  bodyRoll: number;
  bounce: number;
  wheelAngle: number;
  brake: number; // 0.0 to 1.0 smoothed brake light intensity
  proximity: number; // 0.0 to 1.0 proximity glow for ghosts
  visible: boolean;
}

export interface CameraView {
  posX: number;
  posY: number;
  posZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  fov: number;
}

export class EngineView {
  public racers: RacerView[] = [];
  public camera: CameraView = {
    posX: 0,
    posY: 14.5,
    posZ: -8,
    targetX: 0,
    targetY: 0.5,
    targetZ: 5,
    fov: 43,
  };

  public init(entrantCount: number): void {
    this.racers = Array.from({ length: entrantCount }, () => ({
      d: 0,
      v: 0,
      accel: 0,
      lat: 0,
      speedKmh: 0,
      x: 0,
      y: 0,
      z: 0,
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
    }));
  }
}
