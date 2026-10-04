// apps/web/src/components/scene/ChaseCamera.tsx
import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSettingsStore } from '../../stores/useSettingsStore.js';

export interface ChaseCameraProps {
  targetPosition: THREE.Vector3;
  targetTangent: THREE.Vector3;
  speedKmh: number;
  isStalled: boolean;
}

const _tangent = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _desiredPos = new THREE.Vector3();
const _desiredLookAt = new THREE.Vector3();

export const ChaseCamera: React.FC<ChaseCameraProps> = ({
  targetPosition,
  targetTangent,
  speedKmh,
  isStalled,
}) => {
  const { camera } = useThree();
  const { reducedMotion } = useSettingsStore();

  const currentCamPos = useRef(new THREE.Vector3(0, 14.5, -8));
  const currentLookAt = useRef(new THREE.Vector3(0, 0.5, 5));

  useFrame((_, delta) => {
    const persCam = camera as THREE.PerspectiveCamera;
    const speed01 = Math.min(1.0, Math.max(0.0, (speedKmh - 60) / 240));

    // Dynamic FOV: crisp, semi-isometric 2.5D perspective
    const targetFov = reducedMotion ? 45 : 45 + 3 * speed01;
    persCam.fov += (targetFov - persCam.fov) * Math.min(1, delta * 5.0);
    persCam.updateProjectionMatrix();

    // Normalized track tangent direction
    _tangent.copy(targetTangent).normalize();

    // Modern Top-Down 2.5D Camera: High angle, looking down onto the track and vehicles
    const pullBack = (!reducedMotion ? 1.0 * speed01 : 0) - (isStalled ? 0.3 : 0);
    const camDist = 7.5 + pullBack;
    const camHeight = 14.5 + (!reducedMotion ? 1.0 * speed01 : 0);

    _desiredPos.copy(targetPosition)
      .addScaledVector(_tangent, -camDist)
      .addScaledVector(_up, camHeight);

    // Look-ahead target: focused ahead on the track in front of the vehicle
    const lookDist = 5.0 + speed01 * 2.5;
    _desiredLookAt.copy(targetPosition)
      .addScaledVector(_tangent, lookDist)
      .addScaledVector(_up, 0.4);

    // Silky smooth exponential damping for modern arcade top-down follow
    const posLerp = 1.0 - Math.exp(-12.0 * Math.min(0.05, delta));
    const lookLerp = 1.0 - Math.exp(-14.0 * Math.min(0.05, delta));

    currentCamPos.current.lerp(_desiredPos, posLerp);
    currentLookAt.current.lerp(_desiredLookAt, lookLerp);

    persCam.position.copy(currentCamPos.current);
    persCam.lookAt(currentLookAt.current);
  });

  return null;
};
