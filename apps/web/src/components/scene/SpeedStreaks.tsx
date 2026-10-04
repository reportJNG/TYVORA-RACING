// apps/web/src/components/scene/SpeedStreaks.tsx
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSettingsStore } from '../../stores/useSettingsStore.js';

export interface SpeedStreaksProps {
  playerPos: THREE.Vector3;
  playerTangent: THREE.Vector3;
  speedKmh: number;
}

const STREAK_COUNT = 90;

export const SpeedStreaks: React.FC<SpeedStreaksProps> = ({
  playerPos,
  playerTangent,
  speedKmh,
}) => {
  const { reducedMotion } = useSettingsStore();
  const instancedRef = useRef<THREE.InstancedMesh>(null);

  // Precompute random offsets around the vehicle trajectory
  const streakData = useMemo(() => {
    const data: { offset: THREE.Vector3; speedMult: number; length: number }[] = [];
    for (let i = 0; i < STREAK_COUNT; i++) {
      // Cylindrical distribution around car (radius 2.5m to 7.0m, height -0.5m to 4.5m)
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.2 + Math.random() * 5.5;
      const x = Math.cos(angle) * radius;
      const y = 0.5 + Math.random() * 3.5;
      const z = (Math.random() - 0.5) * 35.0; // distributed along relative z
      data.push({
        offset: new THREE.Vector3(x, y, z),
        speedMult: 0.8 + Math.random() * 0.5,
        length: 1.5 + Math.random() * 3.0,
      });
    }
    return data;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (!instancedRef.current || reducedMotion) return;

    const mesh = instancedRef.current;
    if (speedKmh < 80) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;

    const speedNorm = Math.min(1.0, (speedKmh - 80) / 180);
    const flowVelocity = (speedKmh * 1000) / 3600; // m/s
    const tangent = playerTangent.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(tangent, up).normalize();

    // Orient dummy along track direction
    const rotMatrix = new THREE.Matrix4().lookAt(
      new THREE.Vector3(0, 0, 0),
      tangent,
      up
    );
    const rotation = new THREE.Euler().setFromRotationMatrix(rotMatrix);

    for (let i = 0; i < STREAK_COUNT; i++) {
      const item = streakData[i];
      // Move streak relative to car backwards
      item.offset.z -= flowVelocity * item.speedMult * delta * 0.45;
      // Recycle if it flows behind the camera
      if (item.offset.z < -12) {
        item.offset.z = 22 + Math.random() * 10;
        const angle = Math.random() * Math.PI * 2;
        const radius = 2.2 + Math.random() * 5.5;
        item.offset.x = Math.cos(angle) * radius;
        item.offset.y = 0.5 + Math.random() * 3.5;
      }

      // World position relative to player
      const worldPos = playerPos
        .clone()
        .add(right.clone().multiplyScalar(item.offset.x))
        .add(up.clone().multiplyScalar(item.offset.y))
        .add(tangent.clone().multiplyScalar(item.offset.z));

      dummy.position.copy(worldPos);
      dummy.rotation.copy(rotation);
      // Scale length by speed
      const stretch = item.length * (1.0 + speedNorm * 3.0);
      dummy.scale.set(0.04, 0.04, stretch);
      dummy.updateMatrix();

      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.material instanceof THREE.Material) {
      mesh.material.opacity = 0.25 + speedNorm * 0.65;
    }
  });

  return (
    <instancedMesh
      ref={instancedRef}
      args={[undefined, undefined, STREAK_COUNT]}
      visible={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial
        color="#70DCFF"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
};
