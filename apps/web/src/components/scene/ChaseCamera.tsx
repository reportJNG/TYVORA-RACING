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

  const currentCamPos = useRef(new THREE.Vector3(0, 2.5, -6));
  const currentLookAt = useRef(new THREE.Vector3(0, 1, 10));

  useFrame((_, delta) => {
    const persCam = camera as THREE.PerspectiveCamera;
    const speed01 = Math.min(1.0, Math.max(0.0, (speedKmh - 60) / 240));

    // Dynamic FOV: Subtle, cinematic widening (+5 deg max) without fish-eye warping
    const targetFov = reducedMotion ? 52 : 52 + 5 * speed01;
    persCam.fov += (targetFov - persCam.fov) * Math.min(1, delta * 5.0);
    persCam.updateProjectionMatrix();

    // Normalized track tangent direction
    _tangent.copy(targetTangent).normalize();

    // Camera follow parameters: stable, tightly bounded behind car
    const pullBack = (!reducedMotion ? 0.5 * speed01 : 0) - (isStalled ? 0.2 : 0);
    const camDist = 6.4 + pullBack;
    const camHeight = 2.1;

    _desiredPos.copy(targetPosition)
      .addScaledVector(_tangent, -camDist)
      .addScaledVector(_up, camHeight);

    // Look-ahead target: smoothly looking ahead along track curvature
    const lookDist = 11.0 + speed01 * 3.0;
    _desiredLookAt.copy(targetPosition)
      .addScaledVector(_tangent, lookDist)
      .addScaledVector(_up, 0.9);

    // Frame-rate independent exponential damping for rock-solid curve tracking
    const posLerp = 1.0 - Math.exp(-18.0 * Math.min(0.05, delta));
    const lookLerp = 1.0 - Math.exp(-22.0 * Math.min(0.05, delta));

    currentCamPos.current.lerp(_desiredPos, posLerp);
    currentLookAt.current.lerp(_desiredLookAt, lookLerp);

    persCam.position.copy(currentCamPos.current);
    persCam.lookAt(currentLookAt.current);
  });

  return null;
};
