// apps/web/src/components/scene/Vehicle3D.tsx
import React, { useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { CARS_DATA, getCarSpriteUrl } from '../../data/cars.js';

export interface Vehicle3DProps {
  carId: string;
  speedKmh?: number;
  isBraking?: boolean;
  streak?: number;
  colorOverride?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export const Vehicle3D: React.FC<Vehicle3DProps> = ({
  carId,
  speedKmh = 0,
  isBraking = false,
  streak = 0,
  colorOverride,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1.0,
}) => {
  const car = CARS_DATA[carId] || CARS_DATA['meridian-gt'];
  const spriteUrl = getCarSpriteUrl(car.id, colorOverride);

  // Load pixel art texture
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

  const chassisRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Group>(null);
  const prevRotY = useRef<number>(rotation[1]);

  const width = car.width || 1.85;
  const length = car.length || 4.40;

  // Dynamic chassis roll and suspension pitch
  useFrame((_, delta) => {
    if (!chassisRef.current) return;

    // Detect angular velocity around Y (turning)
    let rotDelta = rotation[1] - prevRotY.current;
    if (rotDelta > Math.PI) rotDelta -= Math.PI * 2;
    if (rotDelta < -Math.PI) rotDelta += Math.PI * 2;
    prevRotY.current = rotation[1];

    const turnRate = Math.max(-1, Math.min(1, rotDelta / (delta || 0.016)));
    const targetRoll = -turnRate * 0.05; // Lean into corners
    const targetPitch = isBraking ? -0.04 : speedKmh > 20 ? 0.02 : 0; // Pitch under brake/accel

    chassisRef.current.rotation.z += (targetRoll - chassisRef.current.rotation.z) * Math.min(1, delta * 10);
    chassisRef.current.rotation.x += (targetPitch - chassisRef.current.rotation.x) * Math.min(1, delta * 10);

    // Flame flicker animation
    if (flameRef.current && streak >= 5) {
      const flicker = 0.85 + Math.random() * 0.3;
      flameRef.current.scale.set(flicker, flicker, flicker);
    }
  });

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* 1. DYNAMIC GROUND DROP SHADOW */}
      <mesh
        position={[0.12, 0.03, -0.08]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[width * 1.06, length * 1.06]} />
        <meshBasicMaterial
          map={texture}
          color="#000000"
          transparent
          opacity={0.42}
          depthWrite={false}
        />
      </mesh>

      {/* 2. DYNAMIC ASPHALT HEADLIGHT BEAMS */}
      <group position={[0, 0.04, length * 0.48]}>
        {/* Left beam */}
        <mesh position={[-width * 0.28, 0, 1.8]} rotation={[-Math.PI / 2, 0, 0.06]}>
          <planeGeometry args={[0.9, 3.8]} />
          <meshBasicMaterial
            color="#FFFBEB"
            transparent
            opacity={0.16}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {/* Right beam */}
        <mesh position={[width * 0.28, 0, 1.8]} rotation={[-Math.PI / 2, 0, -0.06]}>
          <planeGeometry args={[0.9, 3.8]} />
          <meshBasicMaterial
            color="#FFFBEB"
            transparent
            opacity={0.16}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* 3. 2.5D ELEVATED CHASSIS BODY */}
      <group ref={chassisRef} position={[0, 0.28, 0]}>
        {/* Primary Pixel Art Vehicle Plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow>
          <planeGeometry args={[width, length]} />
          <meshStandardMaterial
            map={texture}
            transparent
            alphaTest={0.08}
            roughness={0.35}
            metalness={0.15}
          />
        </mesh>

        {/* Dynamic Brake Light Glows */}
        <group position={[0, 0.02, -length * 0.48]}>
          <mesh position={[-width * 0.36, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.18, 12]} />
            <meshBasicMaterial
              color="#FF0000"
              transparent
              opacity={isBraking ? 0.95 : 0.4}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[width * 0.36, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.18, 12]} />
            <meshBasicMaterial
              color="#FF0000"
              transparent
              opacity={isBraking ? 0.95 : 0.4}
              depthWrite={false}
            />
          </mesh>

          {/* Intense Brake Halo when actively stopping */}
          {isBraking && (
            <mesh position={[0, 0.01, -0.1]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[width * 1.1, 0.8]} />
              <meshBasicMaterial
                color="#EF4444"
                transparent
                opacity={0.45}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          )}
        </group>

        {/* 4. DYNAMIC RETRO BOOST NITRO FLAMES (When streak >= 5) */}
        {streak >= 5 && speedKmh > 30 && (
          <group ref={flameRef} position={[0, 0.02, -length * 0.52]}>
            {/* Left exhaust burst */}
            <mesh position={[-width * 0.24, 0, -0.45]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.32, 0.95]} />
              <meshBasicMaterial
                color={streak >= 15 ? '#00E5FF' : '#FF551C'}
                transparent
                opacity={0.88}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            {/* Right exhaust burst */}
            <mesh position={[width * 0.24, 0, -0.45]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.32, 0.95]} />
              <meshBasicMaterial
                color={streak >= 15 ? '#00E5FF' : '#FF551C'}
                transparent
                opacity={0.88}
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
