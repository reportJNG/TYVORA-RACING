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
  const { screenShake, reducedMotion } = useSettingsStore();

  const currentCamPos = useRef(new THREE.Vector3(0, 2.5, -6));
  const currentLookAt = useRef(new THREE.Vector3(0, 1, 10));

  useFrame((_, delta) => {
    const persCam = camera as THREE.PerspectiveCamera;
    const speed01 = Math.min(1.0, Math.max(0.0, speedKmh / 300));

    // Dynamic FOV
    if (!reducedMotion) {
      const targetFov = 52 + 12 * speed01;
      persCam.fov += (targetFov - persCam.fov) * Math.min(1, delta * 3.0);
      persCam.updateProjectionMatrix();
    }

    // Camera base offsets
    const pullBack = (!reducedMotion ? 0.8 * speed01 : 0) - (isStalled ? 0.35 : 0);
    const height = 2.2 - (speed01 * 0.3);

    // Compute rear offset aligned with track tangent without allocations
    _tangent.copy(targetTangent).normalize();

    _desiredPos.copy(targetPosition)
      .addScaledVector(_tangent, -(6.2 + pullBack))
      .addScaledVector(_up, height);

    // High speed road vibration
    if (screenShake && !reducedMotion && speedKmh > 200) {
      const vib = (Math.random() - 0.5) * 0.02 * speed01;
      _desiredPos.x += vib;
      _desiredPos.y += vib;
    }

    // Look-ahead point
    const lookDist = 10.0 + speed01 * 6.0;
    _desiredLookAt.copy(targetPosition)
      .addScaledVector(_tangent, lookDist)
      .addScaledVector(_up, 0.8);

    // Spring smooth follow
    const spring = Math.min(1.0, delta * 8.0);
    currentCamPos.current.lerp(_desiredPos, spring);
    currentLookAt.current.lerp(_desiredLookAt, spring * 1.2);

    persCam.position.copy(currentCamPos.current);
    persCam.lookAt(currentLookAt.current);
  });

  return null;
};
