// apps/web/src/components/scene/GhostVehicle3D.tsx
import React, { useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { CARS_DATA, getCarSpriteUrl } from '../../data/cars.js';

export type GhostRole = 'rival' | 'pacer' | 'challenger';

export interface GhostVehicle3DProps {
  carId: string;
  role: GhostRole;
  speedKmh?: number;
  position: [number, number, number];
  rotation: [number, number, number];
  playerDistance: number;
  ghostDistance: number;
}

const GHOST_ROLE_CONFIG: Record<
  GhostRole,
  {
    primaryColor: string;
    glowColor: string;
    trailColor: string;
    label: string;
  }
> = {
  rival: {
    primaryColor: '#FF2A6D',
    glowColor: '#FF1744',
    trailColor: '#FF2A6D',
    label: 'RIVAL',
  },
  pacer: {
    primaryColor: '#00F0FF',
    glowColor: '#06B6D4',
    trailColor: '#00F0FF',
    label: 'PACER',
  },
  challenger: {
    primaryColor: '#FBBF24',
    glowColor: '#F59E0B',
    trailColor: '#FBBF24',
    label: 'CHALLENGER',
  },
};

export const GhostVehicle3D: React.FC<GhostVehicle3DProps> = ({
  carId,
  role,
  speedKmh = 0,
  position,
  rotation,
  playerDistance,
  ghostDistance,
}) => {
  const car = CARS_DATA[carId] || CARS_DATA['strada-r'];
  const spriteUrl = getCarSpriteUrl(car.id);
  const texture = useLoader(THREE.TextureLoader, spriteUrl);

  useMemo(() => {
    if (texture) {
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
    }
  }, [texture]);

  const config = GHOST_ROLE_CONFIG[role] || GHOST_ROLE_CONFIG.rival;
  const chassisRef = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.Mesh>(null);
  const prevRotY = useRef<number>(rotation[1]);

  const width = car.width || 1.85;
  const length = car.length || 4.40;

  // Proximity to player: when close (|delta| < 4m), aura intensifies
  const distDelta = Math.abs(ghostDistance - playerDistance);
  const proximityBoost = Math.max(0, 1.0 - distDelta / 5.0); // 0.0 to 1.0

  useFrame((state, delta) => {
    if (!chassisRef.current) return;

    // Detect angular velocity around Y (turning roll)
    let rotDelta = rotation[1] - prevRotY.current;
    if (rotDelta > Math.PI) rotDelta -= Math.PI * 2;
    if (rotDelta < -Math.PI) rotDelta += Math.PI * 2;
    prevRotY.current = rotation[1];

    const turnRate = Math.max(-1, Math.min(1, rotDelta / (delta || 0.016)));
    const targetRoll = -turnRate * 0.04;
    chassisRef.current.rotation.z += (targetRoll - chassisRef.current.rotation.z) * Math.min(1, delta * 10);

    // Subtle ethereal floating pulse
    const time = state.clock.getElapsedTime();
    const floatY = 0.28 + Math.sin(time * 3.5 + (role === 'rival' ? 0 : 1.8)) * 0.02;
    chassisRef.current.position.y = floatY;

    // Trail stretch based on ghost speed
    if (trailRef.current) {
      const speedNorm = Math.min(1.0, Math.max(0, speedKmh / 200));
      const targetTrailLength = 2.0 + speedNorm * 5.0;
      trailRef.current.scale.set(1.0, 1.0, targetTrailLength);
    }
  });

  const baseOpacity = 0.58 + proximityBoost * 0.22;

  return (
    <group position={position} rotation={rotation}>
      {/* 1. ETHEREAL SPECTRAL GROUND SHADOW / AURA */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width * 1.15, length * 1.15]} />
        <meshBasicMaterial
          map={texture}
          color={config.glowColor}
          transparent
          opacity={0.22 + proximityBoost * 0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 2. GHOST SPEED RIBBON TRAIL ON ASPHALT */}
      {speedKmh > 25 && (
        <mesh
          ref={trailRef}
          position={[0, 0.035, -length * 0.5 - 1.2]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[width * 0.75, 1.0]} />
          <meshBasicMaterial
            color={config.trailColor}
            transparent
            opacity={0.25 + proximityBoost * 0.2}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* 3. TRANSLUCENT GHOST CHASSIS */}
      <group ref={chassisRef} position={[0, 0.28, 0]}>
        {/* Core Pixel Car Sprite Plane with Ghost Spectral Blend */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width, length]} />
          <meshBasicMaterial
            map={texture}
            color={config.primaryColor}
            transparent
            opacity={baseOpacity}
            depthWrite={false}
            blending={THREE.NormalBlending}
          />
        </mesh>

        {/* Ethereal Rim Glow Overlay (Holographic Sheen) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <planeGeometry args={[width * 1.04, length * 1.04]} />
          <meshBasicMaterial
            map={texture}
            color="#FFFFFF"
            transparent
            opacity={0.18 + proximityBoost * 0.15}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Spectral Rear Exhaust Glow Motes */}
        {speedKmh > 30 && (
          <group position={[0, 0.01, -length * 0.48]}>
            <mesh position={[-width * 0.28, 0, -0.3]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.25, 0.6]} />
              <meshBasicMaterial
                color={config.glowColor}
                transparent
                opacity={0.45}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            <mesh position={[width * 0.28, 0, -0.3]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.25, 0.6]} />
              <meshBasicMaterial
                color={config.glowColor}
                transparent
                opacity={0.45}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
};
