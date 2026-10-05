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

const STREAK_COUNT = 28;
const DUST_COUNT = 16;

const _tangent = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _right = new THREE.Vector3();
const _worldPos = new THREE.Vector3();
const _rotMatrix = new THREE.Matrix4();
const _rotation = new THREE.Euler();
const _zero = new THREE.Vector3(0, 0, 0);

export const SpeedStreaks: React.FC<SpeedStreaksProps> = ({
  playerPos,
  playerTangent,
  speedKmh,
}) => {
  const { reducedMotion } = useSettingsStore();
  const instancedStreaksRef = useRef<THREE.InstancedMesh>(null);
  const instancedDustRef = useRef<THREE.InstancedMesh>(null);

  // Precompute random peripheral offsets around the car trajectory (clean center lane)
  const streakData = useMemo(() => {
    const data: { offset: THREE.Vector3; speedMult: number; length: number }[] = [];
    for (let i = 0; i < STREAK_COUNT; i++) {
      // Peripheral distribution (radius 3.8m to 8.5m on left or right, leaving road center clean)
      const isLeft = i % 2 === 0;
      const sideSign = isLeft ? -1 : 1;
      const x = sideSign * (3.8 + Math.random() * 4.5);
      const y = 0.5 + Math.random() * 2.2;
      const z = (Math.random() - 0.5) * 28.0;
      data.push({
        offset: new THREE.Vector3(x, y, z),
        speedMult: 0.85 + Math.random() * 0.3,
        length: 1.2 + Math.random() * 1.8,
      });
    }
    return data;
  }, []);

  // Precompute asphalt dust particles behind rear wheels
  const dustData = useMemo(() => {
    const data: { offset: THREE.Vector3; life: number; maxLife: number; speed: number }[] = [];
    for (let i = 0; i < DUST_COUNT; i++) {
      const isLeft = i % 2 === 0;
      const sideSign = isLeft ? -1 : 1;
      data.push({
        offset: new THREE.Vector3(
          sideSign * (0.65 + Math.random() * 0.25),
          0.05 + Math.random() * 0.1,
          -2.2 - Math.random() * 4.0
        ),
        life: Math.random(),
        maxLife: 0.6 + Math.random() * 0.5,
        speed: 0.6 + Math.random() * 0.8,
      });
    }
    return data;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (reducedMotion) return;
    const clampedDelta = Math.min(0.05, Math.max(0.001, delta));

    _tangent.copy(playerTangent).normalize();
    _right.crossVectors(_tangent, _up).normalize();

    // 1. AERODYNAMIC WIND STREAKS (Smooth ramp starting at 70 km/h)
    if (instancedStreaksRef.current) {
      const mesh = instancedStreaksRef.current;
      if (speedKmh < 70) {
        mesh.visible = false;
      } else {
        mesh.visible = true;
        const speedNorm = Math.min(1.0, (speedKmh - 70) / 150); // 0.0 at 70 km/h, 1.0 at 220 km/h
        const flowVelocity = (speedKmh * 1000) / 3600; // m/s

        _rotMatrix.lookAt(_zero, _tangent, _up);
        _rotation.setFromRotationMatrix(_rotMatrix);

        for (let i = 0; i < STREAK_COUNT; i++) {
          const item = streakData[i];
          item.offset.z -= flowVelocity * item.speedMult * clampedDelta * 0.45;
          if (item.offset.z < -10) {
            item.offset.z = 20 + Math.random() * 8;
          }

          _worldPos.copy(playerPos)
            .addScaledVector(_right, item.offset.x)
            .addScaledVector(_up, item.offset.y)
            .addScaledVector(_tangent, item.offset.z);

          dummy.position.copy(_worldPos);
          dummy.rotation.copy(_rotation);
          const stretch = item.length * (0.8 + speedNorm * 2.2);
          dummy.scale.set(0.018, 0.018, stretch);
          dummy.updateMatrix();

          mesh.setMatrixAt(i, dummy.matrix);
        }

        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.material instanceof THREE.Material) {
          mesh.material.opacity = 0.05 + speedNorm * 0.28;
        }
      }
    }

    // 2. REAR TIRE ASPHALT SPEED PARTICLES
    if (instancedDustRef.current) {
      const dustMesh = instancedDustRef.current;
      if (speedKmh < 85) {
        dustMesh.visible = false;
      } else {
        dustMesh.visible = true;
        const speedNorm = Math.min(1.0, (speedKmh - 85) / 135);

        for (let i = 0; i < DUST_COUNT; i++) {
          const dust = dustData[i];
          dust.life += clampedDelta * dust.speed * (1.0 + speedNorm);
          if (dust.life > dust.maxLife) {
            dust.life = 0;
            dust.offset.z = -2.2 - Math.random() * 0.5;
            dust.offset.x = (i % 2 === 0 ? -1 : 1) * (0.65 + Math.random() * 0.2);
          }

          dust.offset.z -= clampedDelta * (speedKmh * 0.15);
          dust.offset.y += clampedDelta * 0.15;

          const progress = dust.life / dust.maxLife;
          _worldPos.copy(playerPos)
            .addScaledVector(_right, dust.offset.x)
            .addScaledVector(_up, dust.offset.y)
            .addScaledVector(_tangent, dust.offset.z);

          dummy.position.copy(_worldPos);
          const pScale = (0.04 + progress * 0.08) * (0.8 + speedNorm * 0.5);
          dummy.scale.set(pScale, pScale, pScale);
          dummy.updateMatrix();

          dustMesh.setMatrixAt(i, dummy.matrix);
        }

        dustMesh.instanceMatrix.needsUpdate = true;
        if (dustMesh.material instanceof THREE.Material) {
          dustMesh.material.opacity = 0.12 + speedNorm * 0.22;
        }
      }
    }
  });

  return (
    <group>
      {/* Aerodynamic Wind Ribbon Lines */}
      <instancedMesh
        ref={instancedStreaksRef}
        args={[undefined, undefined, STREAK_COUNT]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#E0F2FE"
          transparent
          opacity={0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>

      {/* Rear Wheel Asphalt Dust Motes */}
      <instancedMesh
        ref={instancedDustRef}
        args={[undefined, undefined, DUST_COUNT]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial
          color="#CBD5E1"
          transparent
          opacity={0.18}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </instancedMesh>
    </group>
  );
};
