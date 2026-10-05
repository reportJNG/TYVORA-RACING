// apps/web/src/components/scene/GhostVehicle3D.tsx
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { CARS_DATA, getCarModelUrl } from '../../data/cars.js';

export type GhostRole = 'rival' | 'pacer' | 'challenger';

export interface GhostVehicle3DProps {
  carId: string;
  role: GhostRole;
  speedKmh?: number;
  accel?: number;
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
    label: string;
  }
> = {
  rival: {
    primaryColor: '#FF2A6D',
    glowColor: '#FF1744',
    label: 'RIVAL',
  },
  pacer: {
    primaryColor: '#00F0FF',
    glowColor: '#06B6D4',
    label: 'PACER',
  },
  challenger: {
    primaryColor: '#FBBF24',
    glowColor: '#F59E0B',
    label: 'CHALLENGER',
  },
};

export const GhostVehicle3D: React.FC<GhostVehicle3DProps> = ({
  carId,
  role,
  speedKmh = 0,
  accel = 0,
  position,
  rotation,
  playerDistance,
  ghostDistance,
}) => {
  const car = CARS_DATA[carId] || CARS_DATA['strada-r'];
  const modelUrl = getCarModelUrl(car.id);
  const { scene } = useGLTF(modelUrl);

  const config = GHOST_ROLE_CONFIG[role] || GHOST_ROLE_CONFIG.rival;
  const chassisRef = useRef<THREE.Group>(null);
  const prevRotY = useRef<number>(rotation[1]);
  const turnRateSmoothed = useRef<number>(0);
  const pitchSmoothed = useRef<number>(0);
  const rollSmoothed = useRef<number>(0);
  const wheelMeshes = useRef<THREE.Object3D[]>([]);

  // Proximity to player: when close (|delta| < 4m), aura intensifies
  const distDelta = Math.abs(ghostDistance - playerDistance);
  const proximityBoost = Math.max(0, 1.0 - distDelta / 5.0); // 0.0 to 1.0
  const baseOpacity = 0.65 + proximityBoost * 0.2;

  // Generate smooth contact shadow texture
  const shadowTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const grad = ctx.createRadialGradient(64, 64, 12, 64, 64, 64);
    grad.addColorStop(0, 'rgba(2, 6, 18, 0.60)');
    grad.addColorStop(0.5, 'rgba(2, 6, 18, 0.35)');
    grad.addColorStop(0.85, 'rgba(2, 6, 18, 0.10)');
    grad.addColorStop(1, 'rgba(2, 6, 18, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  // Deep clone scene and apply clean spectral translucent material
  const clonedGhostScene = useMemo(() => {
    const clone = scene.clone(true);
    const wheels: THREE.Object3D[] = [];

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = false;
        mesh.receiveShadow = false;

        // Apply spectral translucent material
        mesh.material = new THREE.MeshStandardMaterial({
          color: config.primaryColor,
          emissive: config.glowColor,
          emissiveIntensity: 0.35 + proximityBoost * 0.25,
          roughness: 0.25,
          metalness: 0.75,
          transparent: true,
          opacity: baseOpacity,
          depthWrite: false,
        });
      }

      if (child.name.toLowerCase().includes('wheel')) {
        wheels.push(child);
      }
    });

    wheelMeshes.current = wheels;
    return clone;
  }, [scene, config, baseOpacity, proximityBoost]);

  const modelScale = 0.52;
  const carWidth = car.width || 2.04;
  const carLength = car.length || 4.22;

  useFrame((state, delta) => {
    if (!chassisRef.current) return;
    const clampedDt = Math.min(0.05, Math.max(0.001, delta));

    // 1. Angular velocity around Y (cornering detection with low-pass filter)
    let rotDelta = rotation[1] - prevRotY.current;
    if (rotDelta > Math.PI) rotDelta -= Math.PI * 2;
    if (rotDelta < -Math.PI) rotDelta += Math.PI * 2;
    prevRotY.current = rotation[1];

    const rawTurnRate = rotDelta / clampedDt;
    turnRateSmoothed.current += (rawTurnRate - turnRateSmoothed.current) * Math.min(1.0, clampedDt * 8.0);
    const targetRoll = -Math.max(-0.8, Math.min(0.8, turnRateSmoothed.current)) * 0.042;

    // 2. Dynamic pitch squat and dive
    let targetPitch = 0;
    if (accel > 0.8) {
      targetPitch = Math.min(0.032, (accel / 16.0) * 0.032);
    } else if (accel < -1.2) {
      targetPitch = Math.max(-0.038, (accel / 14.0) * 0.038);
    }

    pitchSmoothed.current += (targetPitch - pitchSmoothed.current) * Math.min(1.0, clampedDt * 10.0);
    rollSmoothed.current += (targetRoll - rollSmoothed.current) * Math.min(1.0, clampedDt * 10.0);
    chassisRef.current.rotation.x = pitchSmoothed.current;
    chassisRef.current.rotation.z = rollSmoothed.current;

    // 3. Subtle spectral floating hover pulse
    const time = state.clock.getElapsedTime();
    const floatY = Math.sin(time * 3.2 + (role === 'rival' ? 0 : 1.8)) * 0.025;
    chassisRef.current.position.y = floatY;

    // 4. Physical wheel spin matching ghost speed
    if (speedKmh > 0.5 && wheelMeshes.current.length > 0) {
      const speedMs = speedKmh / 3.6;
      const dTheta = (speedMs / 0.33) * clampedDt;
      for (const wheel of wheelMeshes.current) {
        wheel.rotation.z -= dTheta;
      }
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* 1. SOFT GROUND CONTACT SHADOW */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[carWidth * 1.35, carLength * 1.25]} />
        {shadowTexture ? (
          <meshBasicMaterial
            map={shadowTexture}
            transparent
            opacity={0.65}
            depthWrite={false}
          />
        ) : (
          <meshBasicMaterial
            color="#030712"
            transparent
            opacity={0.3}
            depthWrite={false}
          />
        )}
      </mesh>

      {/* 2. TRANSLUCENT SPECTRAL 3D GHOST CHASSIS */}
      <group ref={chassisRef} position={[0, 0, 0]}>
        <group
          position={[0, 2.378 * modelScale, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={modelScale}
        >
          <primitive object={clonedGhostScene} />
        </group>
      </group>
    </group>
  );
};

