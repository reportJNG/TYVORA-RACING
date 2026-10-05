// apps/web/src/components/scene/Vehicle3D.tsx
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { CARS_DATA, getCarModelUrl } from '../../data/cars.js';

export interface Vehicle3DProps {
  carId: string;
  speedKmh?: number;
  accel?: number;
  isBraking?: boolean;
  streak?: number;
  colorOverride?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

// Preload common 3D car models for instant rendering
const PRELOAD_MODELS = [
  '/assets/cars/models/carblack.glb',
  '/assets/cars/models/carblue.glb',
  '/assets/cars/models/carred.glb',
  '/assets/cars/models/carwhite.glb',
  '/assets/cars/models/caryellow.glb',
  '/assets/cars/models/caryellowvariant.glb',
  '/assets/cars/models/cargreen.glb',
  '/assets/cars/models/cargreenvariant1.glb',
  '/assets/cars/models/cargreenvariant2.glb',
];
PRELOAD_MODELS.forEach((url) => {
  try {
    useGLTF.preload(url);
  } catch {
    // ignore in environments without browser window
  }
});

export const Vehicle3D: React.FC<Vehicle3DProps> = ({
  carId,
  speedKmh = 0,
  accel = 0,
  isBraking = false,
  colorOverride,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1.0,
}) => {
  const car = CARS_DATA[carId] || CARS_DATA['meridian-gt'];
  const modelUrl = getCarModelUrl(car.id, colorOverride);

  // Load 3D GLB model
  const { scene } = useGLTF(modelUrl);

  const chassisRef = useRef<THREE.Group>(null);
  const prevRotY = useRef<number>(rotation[1]);
  const turnRateSmoothed = useRef<number>(0);
  const pitchSmoothed = useRef<number>(0);
  const rollSmoothed = useRef<number>(0);
  const wheelMeshes = useRef<THREE.Object3D[]>([]);
  const backlightMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Generate smooth radial-falloff contact shadow texture
  const shadowTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const grad = ctx.createRadialGradient(64, 64, 12, 64, 64, 64);
    grad.addColorStop(0, 'rgba(2, 6, 18, 0.72)');
    grad.addColorStop(0.45, 'rgba(2, 6, 18, 0.48)');
    grad.addColorStop(0.8, 'rgba(2, 6, 18, 0.16)');
    grad.addColorStop(1, 'rgba(2, 6, 18, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  // Deep clone scene graph and gather wheel nodes for physics animation
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    const wheels: THREE.Object3D[] = [];

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const nameLower = child.name.toLowerCase();

        // Detect tail lights for dynamic brake glow
        if (nameLower.includes('backlight') || nameLower.includes('taillight')) {
          const brakeMat = new THREE.MeshStandardMaterial({
            color: '#7F1D1D',
            emissive: new THREE.Color('#990011'),
            emissiveIntensity: 0.5,
            roughness: 0.2,
            metalness: 0.1,
          });
          mesh.material = brakeMat;
          backlightMatRef.current = brakeMat;
          return;
        }

        // Detect headlights for crisp xenon forward beam glow
        if (nameLower.includes('lightinfront') || nameLower.includes('headlight')) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#F8FAFC',
            emissive: new THREE.Color('#E0F2FE'),
            emissiveIntensity: 1.5,
            roughness: 0.1,
            metalness: 0.2,
          });
          return;
        }

        // Enhance body material reflectivity and metallic finish
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map((m) => {
              const clonedMat = m.clone() as THREE.MeshStandardMaterial;
              clonedMat.roughness = Math.min(clonedMat.roughness ?? 0.4, 0.38);
              clonedMat.metalness = Math.max(clonedMat.metalness ?? 0.3, 0.48);
              return clonedMat;
            });
          } else {
            const clonedMat = mesh.material.clone() as THREE.MeshStandardMaterial;
            clonedMat.roughness = Math.min(clonedMat.roughness ?? 0.4, 0.38);
            clonedMat.metalness = Math.max(clonedMat.metalness ?? 0.3, 0.48);
            mesh.material = clonedMat;
          }
        }
      }

      // Detect wheel nodes for rolling rotation
      if (child.name.toLowerCase().includes('wheel')) {
        wheels.push(child);
      }
    });

    wheelMeshes.current = wheels;
    return clone;
  }, [scene]);

  // Scaled dimensions:
  // Base model is ~8.125 length (X), ~3.926 width (Z), ~3.464 height (Y).
  // Model scale factor 0.52 produces length 4.22m, width 2.04m, height 1.80m.
  const modelScale = 0.52;
  const carWidth = car.width || 2.04;
  const carLength = car.length || 4.22;

  // Dynamic physics simulation: wheel roll, cornering body lean, suspension dive/squat
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
    const targetRoll = -Math.max(-0.85, Math.min(0.85, turnRateSmoothed.current)) * 0.048;

    // 2. Physical suspension pitch:
    // Dynamic squat under throttle acceleration, front dive under braking/mistake
    let targetPitch = 0;
    if (isBraking) {
      targetPitch = -0.052; // Active brake dive
    } else if (accel > 0.8) {
      targetPitch = Math.min(0.036, (accel / 16.0) * 0.036); // Throttle squat
    } else if (accel < -1.2) {
      targetPitch = Math.max(-0.040, (accel / 14.0) * 0.040); // Coasting decel
    }

    // Critically damped chassis spring easing
    pitchSmoothed.current += (targetPitch - pitchSmoothed.current) * Math.min(1.0, clampedDt * 10.0);
    rollSmoothed.current += (targetRoll - rollSmoothed.current) * Math.min(1.0, clampedDt * 10.0);
    chassisRef.current.rotation.x = pitchSmoothed.current;
    chassisRef.current.rotation.z = rollSmoothed.current;

    // 3. Engine idle purr & High-speed aerodynamic road vibration
    const time = state.clock.getElapsedTime();
    const speedRatio = Math.min(1.0, speedKmh / 260);
    const idleVibe = speedKmh < 10 ? Math.sin(time * 20) * 0.0016 : 0;
    const roadVibe = Math.sin(time * 46) * 0.0032 * speedRatio;
    chassisRef.current.position.y = idleVibe + roadVibe;

    // 4. Physical wheel spin matching car velocity
    if (speedKmh > 0.5 && wheelMeshes.current.length > 0) {
      const speedMs = speedKmh / 3.6;
      // Wheel local radius is ~0.63 units
      const dTheta = (speedMs / 0.33) * clampedDt;
      for (const wheel of wheelMeshes.current) {
        wheel.rotation.z -= dTheta;
      }
    }

    // 5. Reactive tail light glow during braking
    if (backlightMatRef.current) {
      const isHotBraking = isBraking || accel < -4.0;
      backlightMatRef.current.emissive.set(isHotBraking ? '#FF1E28' : '#7F1D1D');
      backlightMatRef.current.emissiveIntensity = isHotBraking ? 2.6 : 0.45;
    }
  });

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* 1. SOFT AMBIENT OCCLUSION GROUND CONTACT SHADOW */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[carWidth * 1.35, carLength * 1.25]} />
        {shadowTexture ? (
          <meshBasicMaterial
            map={shadowTexture}
            transparent
            opacity={0.85}
            depthWrite={false}
          />
        ) : (
          <meshBasicMaterial
            color="#030712"
            transparent
            opacity={0.4}
            depthWrite={false}
          />
        )}
      </mesh>

      {/* 2. DYNAMIC SUSPENSION CHASSIS WITH TRUE 3D LOW-POLY MODEL */}
      <group ref={chassisRef} position={[0, 0, 0]}>
        {/* 3D Model Node:
            Rotated -90° on Y so front (+X) aligns with track forward (+Z).
            Raised by 2.378 in local coordinates so wheel bottoms touch ground Y = 0.
        */}
        <group
          position={[0, 2.378 * modelScale, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={modelScale}
        >
          <primitive object={clonedScene} />
        </group>
      </group>
    </group>
  );
};

