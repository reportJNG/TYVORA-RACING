// apps/web/src/components/scene/PlayerFollowCamera.tsx
import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSettingsStore } from '../../stores/useSettingsStore.js';

export interface PlayerFollowCameraProps {
  targetPosition: THREE.Vector3;
  targetTangent: THREE.Vector3;
  speedKmh: number;
  isStalled: boolean;
}

const _tangent = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _desiredCamPos = new THREE.Vector3();
const _desiredLookAt = new THREE.Vector3();

export const PlayerFollowCamera: React.FC<PlayerFollowCameraProps> = ({
  targetPosition,
  targetTangent,
  speedKmh,
  isStalled,
}) => {
  const { camera } = useThree();
  const { reducedMotion } = useSettingsStore();

  const currentCamPos = useRef(new THREE.Vector3(0, 14.5, -8));
  const currentLookAt = useRef(new THREE.Vector3(0, 0.5, 5));
  const prevSpeed = useRef(speedKmh);
  const smoothedAccel = useRef(0);
  const prevTangent = useRef(new THREE.Vector3(0, 0, 1));
  const isInitialized = useRef(false);

  useFrame((_, delta) => {
    const persCam = camera as THREE.PerspectiveCamera;
    const clampedDelta = Math.min(0.05, Math.max(0.001, delta));

    // Instantaneous acceleration calculation
    const rawAccel = (speedKmh - prevSpeed.current) / clampedDelta;
    prevSpeed.current = speedKmh;

    // Smooth acceleration to avoid single-frame keystroke spikes
    smoothedAccel.current += (rawAccel - smoothedAccel.current) * Math.min(1.0, clampedDelta * 8.0);
    const accelNorm = Math.max(-1.0, Math.min(1.0, smoothedAccel.current / 25.0));

    const speed01 = Math.min(1.0, Math.max(0.0, speedKmh / 220));

    // Dynamic FOV: subtle, cinematic 2.5D expansion at speed
    const baseFov = 43.0;
    const targetFov = reducedMotion ? baseFov : baseFov + 5.5 * speed01;
    persCam.fov += (targetFov - persCam.fov) * Math.min(1.0, clampedDelta * 6.0);
    persCam.updateProjectionMatrix();

    // Normalized track tangent direction
    _tangent.copy(targetTangent).normalize();

    // Detect track cornering curvature: angle delta between tangents
    const turnDot = Math.max(-1, Math.min(1, _tangent.dot(prevTangent.current)));
    const turnAngle = Math.acos(turnDot);
    prevTangent.current.copy(_tangent);
    const isCornering = turnAngle > 0.002;

    // Camera geometry relative to player:
    // Physical momentum: acceleration pulls camera back slightly; stalling eases forward
    const momentumPull = reducedMotion ? 0 : accelNorm * 0.45;
    const stallEase = isStalled ? -0.4 : 0;
    const camDist = 7.8 + speed01 * 0.8 + momentumPull + stallEase;
    const camHeight = 14.2 + speed01 * 0.6;

    _desiredCamPos.copy(targetPosition)
      .addScaledVector(_tangent, -camDist)
      .addScaledVector(_up, camHeight);

    // Look-ahead target focused along the road ahead of the car
    const lookDist = 5.2 + speed01 * 3.2;
    _desiredLookAt.copy(targetPosition)
      .addScaledVector(_tangent, lookDist)
      .addScaledVector(_up, 0.45);

    // Initial snap on first frame to prevent flying across the world on race start
    if (!isInitialized.current) {
      currentCamPos.current.copy(_desiredCamPos);
      currentLookAt.current.copy(_desiredLookAt);
      isInitialized.current = true;
    }

    // Adaptive smoothing damping rate:
    // Straight driving: softer rate (~9.5) for buttery smoothness
    // Cornering / High acceleration: firmer rate (~15.0) to eliminate camera lag or clipping
    const posRate = isCornering ? 15.0 : 10.0 + speed01 * 2.0;
    const lookRate = isCornering ? 16.0 : 11.0 + speed01 * 2.0;

    const posLerp = 1.0 - Math.exp(-posRate * clampedDelta);
    const lookLerp = 1.0 - Math.exp(-lookRate * clampedDelta);

    currentCamPos.current.lerp(_desiredCamPos, posLerp);
    currentLookAt.current.lerp(_desiredLookAt, lookLerp);

    persCam.position.copy(currentCamPos.current);
    persCam.lookAt(currentLookAt.current);
  });

  return null;
};
