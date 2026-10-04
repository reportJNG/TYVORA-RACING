// apps/web/src/components/scene/Vehicle3D.tsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CARS_DATA, CarVisualConfig } from '../../data/cars.js';

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

/**
 * High-detail alloy wheel with rubber tire, detailed rim, brake rotor and caliper.
 */
const WheelAssembly: React.FC<{
  position: [number, number, number];
  isLeft: boolean;
  accentColor: string;
  rimStyle?: CarVisualConfig['rimStyle'];
  groupRefSetter: (el: THREE.Group | null) => void;
}> = ({ position, isLeft, accentColor, rimStyle = 'spoke5', groupRefSetter }) => {
  return (
    <group position={position}>
      {/* Non-spinning brake assembly */}
      <group position={[isLeft ? 0.04 : -0.04, 0, 0]}>
        {/* Ventilated Steel Brake Rotor */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.02, 24]} />
          <meshStandardMaterial color="#B0B5BC" metalness={0.92} roughness={0.25} />
        </mesh>
        {/* Performance Brake Caliper */}
        <mesh position={[0, 0.14, 0]}>
          <boxGeometry args={[0.08, 0.12, 0.16]} />
          <meshStandardMaterial color={accentColor} metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* Spinning Wheel (Tire + Rim + Spokes) */}
      <group ref={groupRefSetter}>
        {/* Rubber Tire */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.25, 28]} />
          <meshStandardMaterial color="#141619" roughness={0.88} metalness={0.08} />
        </mesh>

        {/* Outer Rim Lip */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.26, 0.26, 0.255, 24]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.95} roughness={0.15} />
        </mesh>

        {/* Center Hub */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.262, 16]} />
          <meshStandardMaterial color="#1E293B" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Wheel Spokes according to style */}
        {rimStyle === 'spoke5' &&
          [0, 72, 144, 216, 288].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <group key={angle} rotation={[rad, 0, 0]}>
                <mesh position={[isLeft ? 0.11 : -0.11, 0.14, 0]}>
                  <boxGeometry args={[0.03, 0.18, 0.035]} />
                  <meshStandardMaterial color="#CBD5E1" metalness={0.95} roughness={0.12} />
                </mesh>
              </group>
            );
          })}

        {rimStyle === 'multi' &&
          [0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <group key={angle} rotation={[rad, 0, 0]}>
                <mesh position={[isLeft ? 0.11 : -0.11, 0.13, 0]}>
                  <boxGeometry args={[0.025, 0.20, 0.02]} />
                  <meshStandardMaterial color="#94A3B8" metalness={0.92} roughness={0.2} />
                </mesh>
              </group>
            );
          })}

        {rimStyle === 'aero' && (
          <group>
            <mesh rotation={[0, 0, Math.PI / 2]} position={[isLeft ? 0.12 : -0.12, 0, 0]}>
              <cylinderGeometry args={[0.25, 0.25, 0.015, 24]} />
              <meshStandardMaterial color="#1E293B" metalness={0.85} roughness={0.25} />
            </mesh>
            {[0, 90, 180, 270].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              return (
                <group key={angle} rotation={[rad, 0, 0]}>
                  <mesh position={[isLeft ? 0.122 : -0.122, 0.15, 0]}>
                    <boxGeometry args={[0.01, 0.06, 0.04]} />
                    <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.6} />
                  </mesh>
                </group>
              );
            })}
          </group>
        )}

        {(rimStyle === 'mesh' || rimStyle === 'rally') &&
          [0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <group key={angle} rotation={[rad, 0, 0]}>
                <mesh position={[isLeft ? 0.11 : -0.11, 0.13, 0]}>
                  <boxGeometry args={[0.025, 0.20, 0.025]} />
                  <meshStandardMaterial color="#E2E8F0" metalness={0.95} roughness={0.15} />
                </mesh>
              </group>
            );
          })}
      </group>
    </group>
  );
};

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
  const groupRef = useRef<THREE.Group>(null);
  const wheelsRef = useRef<THREE.Group[]>([]);
  const flameLeftRef = useRef<THREE.Mesh>(null);
  const flameRightRef = useRef<THREE.Mesh>(null);

  const carData = CARS_DATA[carId] || CARS_DATA['meridian-gt'];
  const bodyColor = colorOverride || carData.primaryColor;
  const underglowColor = carData.accentColor || '#0084FF';

  // Smooth wheel spinning & active flame pulsing
  useFrame(({ clock }, delta) => {
    if (speedKmh > 0) {
      const wheelRadius = 0.35; // meters
      const speedMps = (speedKmh * 1000) / 3600;
      const rotDelta = (speedMps / wheelRadius) * delta;
      wheelsRef.current.forEach((wheel) => {
        if (wheel) {
          wheel.rotation.x += rotDelta;
        }
      });
    }

    // Dynamic streak flame animation
    if (streak >= 5 && speedKmh > 40) {
      const pulse = 0.85 + 0.35 * Math.sin(clock.elapsedTime * 40) * Math.cos(clock.elapsedTime * 25);
      const flameLen = Math.min(2.2, 0.5 + (streak / 20) * 1.3) * pulse;
      if (flameLeftRef.current) {
        flameLeftRef.current.scale.set(pulse, flameLen, pulse);
      }
      if (flameRightRef.current) {
        flameRightRef.current.scale.set(pulse, flameLen, pulse);
      }
    }
  });

  // Wheel placement coordinates [x, y, z]
  const wheelPositions: [number, number, number][] = [
    [-0.98, 0.35, 1.35], // Front Left
    [0.98, 0.35, 1.35], // Front Right
    [-0.98, 0.35, -1.35], // Rear Left
    [0.98, 0.35, -1.35], // Rear Right
  ];

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* ======================================================== */}
      {/* 3D VEHICLE BODY GEOMETRIES TAILORED PER CAR MODEL */}
      {/* ======================================================== */}

      {carId === 'strada-r' && (
        // STRADA R: Aggressive Mid-Engine Supercar
        <group position={[0, 0.44, 0]}>
          {/* Main Wedge Body */}
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[1.98, 0.42, 4.5]} />
            <meshPhysicalMaterial
              color={bodyColor}
              metalness={0.88}
              roughness={0.16}
              clearcoat={1.0}
              clearcoatRoughness={0.06}
            />
          </mesh>
          {/* Sloping Front Hood Scoop */}
          <mesh position={[0, 0.16, 1.4]} rotation={[-0.12, 0, 0]}>
            <boxGeometry args={[1.65, 0.22, 1.6]} />
            <meshPhysicalMaterial color={bodyColor} metalness={0.88} roughness={0.16} clearcoat={1.0} />
          </mesh>
          {/* Cab-Forward Aerodynamic Canopy */}
          <mesh position={[0, 0.40, -0.15]}>
            <boxGeometry args={[1.42, 0.45, 2.1]} />
            <meshPhysicalMaterial color="#0B0E14" roughness={0.04} metalness={0.2} transparent opacity={0.92} />
          </mesh>
          {/* Front Carbon Splitter */}
          <mesh position={[0, -0.18, 2.28]}>
            <boxGeometry args={[1.96, 0.05, 0.35]} />
            <meshStandardMaterial color="#111827" metalness={0.85} roughness={0.3} />
          </mesh>
          {/* Side Air Intakes */}
          <mesh position={[-0.96, 0.06, -0.5]}>
            <boxGeometry args={[0.08, 0.24, 0.8]} />
            <meshStandardMaterial color="#111827" roughness={0.6} />
          </mesh>
          <mesh position={[0.96, 0.06, -0.5]}>
            <boxGeometry args={[0.08, 0.24, 0.8]} />
            <meshStandardMaterial color="#111827" roughness={0.6} />
          </mesh>
          {/* Elevated Supercar Rear Wing */}
          <mesh position={[0, 0.76, -1.95]}>
            <boxGeometry args={[1.9, 0.05, 0.42]} />
            <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.25} />
          </mesh>
          <mesh position={[-0.72, 0.54, -1.95]}>
            <boxGeometry args={[0.05, 0.4, 0.2]} />
            <meshStandardMaterial color="#0F172A" metalness={0.9} />
          </mesh>
          <mesh position={[0.72, 0.54, -1.95]}>
            <boxGeometry args={[0.05, 0.4, 0.2]} />
            <meshStandardMaterial color="#0F172A" metalness={0.9} />
          </mesh>
        </group>
      )}

      {carId === 'volta-e' && (
        // VOLTA E: Hyper-Modern Electric Hypercar
        <group position={[0, 0.44, 0]}>
          {/* Sleek Teardrop Chassis */}
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[2.02, 0.40, 4.45]} />
            <meshPhysicalMaterial
              color={bodyColor}
              metalness={0.82}
              roughness={0.14}
              clearcoat={1.0}
              clearcoatRoughness={0.05}
            />
          </mesh>
          {/* Seamless Curved Cockpit Dome */}
          <mesh position={[0, 0.42, 0.05]}>
            <boxGeometry args={[1.36, 0.46, 2.2]} />
            <meshPhysicalMaterial color="#0A1118" roughness={0.03} metalness={0.1} transparent opacity={0.94} />
          </mesh>
          {/* Front Aero Winglets */}
          <mesh position={[0, -0.16, 2.2]}>
            <boxGeometry args={[1.98, 0.05, 0.32]} />
            <meshStandardMaterial color="#1E293B" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Rear Active Flap Blades */}
          <mesh position={[-0.6, 0.30, -2.15]} rotation={[-0.15, 0, 0]}>
            <boxGeometry args={[0.65, 0.04, 0.35]} />
            <meshStandardMaterial color="#0F172A" metalness={0.9} />
          </mesh>
          <mesh position={[0.6, 0.30, -2.15]} rotation={[-0.15, 0, 0]}>
            <boxGeometry args={[0.65, 0.04, 0.35]} />
            <meshStandardMaterial color="#0F172A" metalness={0.9} />
          </mesh>
          {/* Aero Side Skirts */}
          <mesh position={[-1.0, -0.14, 0]}>
            <boxGeometry args={[0.08, 0.08, 2.6]} />
            <meshStandardMaterial color="#0084FF" emissive="#0084FF" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[1.0, -0.14, 0]}>
            <boxGeometry args={[0.08, 0.08, 2.6]} />
            <meshStandardMaterial color="#0084FF" emissive="#0084FF" emissiveIntensity={0.6} />
          </mesh>
        </group>
      )}

      {carId === 'apex-gtr' && (
        // APEX GT-R: Widebody JDM Track Monster
        <group position={[0, 0.46, 0]}>
          {/* Muscular Widebody */}
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[2.04, 0.46, 4.55]} />
            <meshPhysicalMaterial
              color={bodyColor}
              metalness={0.86}
              roughness={0.18}
              clearcoat={1.0}
            />
          </mesh>
          {/* Vented Track Hood */}
          <mesh position={[0, 0.26, 1.2]}>
            <boxGeometry args={[1.5, 0.12, 1.4]} />
            <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Coupe Cockpit */}
          <mesh position={[0, 0.46, -0.2]}>
            <boxGeometry args={[1.44, 0.48, 2.25]} />
            <meshPhysicalMaterial color="#0F172A" roughness={0.05} transparent opacity={0.92} />
          </mesh>
          {/* High GT-Wing on Stanchions */}
          <mesh position={[0, 0.88, -2.0]}>
            <boxGeometry args={[1.96, 0.05, 0.48]} />
            <meshStandardMaterial color="#0F172A" metalness={0.95} roughness={0.15} />
          </mesh>
          <mesh position={[-0.65, 0.58, -1.98]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[0.06, 0.55, 0.18]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.95} />
          </mesh>
          <mesh position={[0.65, 0.58, -1.98]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[0.06, 0.55, 0.18]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.95} />
          </mesh>
          {/* Large Intercooler Grille */}
          <mesh position={[0, -0.04, 2.28]}>
            <boxGeometry args={[1.2, 0.24, 0.08]} />
            <meshStandardMaterial color="#64748B" metalness={0.95} roughness={0.2} />
          </mesh>
        </group>
      )}

      {carId === 'vanguard-v12' && (
        // VANGUARD V12: British Luxury Grand Tourer
        <group position={[0, 0.48, 0]}>
          {/* Sculpted Long-Hood Body */}
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[1.96, 0.48, 4.7]} />
            <meshPhysicalMaterial
              color={bodyColor}
              metalness={0.90}
              roughness={0.15}
              clearcoat={1.0}
              clearcoatRoughness={0.04}
            />
          </mesh>
          {/* Elegant Coupe Greenhouse */}
          <mesh position={[0, 0.46, -0.35]}>
            <boxGeometry args={[1.44, 0.46, 2.3]} />
            <meshPhysicalMaterial color="#111827" roughness={0.04} transparent opacity={0.93} />
          </mesh>
          {/* Polished Chrome Mesh Front Grille */}
          <mesh position={[0, 0.05, 2.36]}>
            <boxGeometry args={[1.1, 0.32, 0.06]} />
            <meshStandardMaterial color="#E2E8F0" metalness={0.98} roughness={0.1} />
          </mesh>
          {/* Subtle Rear Trunk Ducktail Lip */}
          <mesh position={[0, 0.30, -2.32]}>
            <boxGeometry args={[1.6, 0.08, 0.14]} />
            <meshStandardMaterial color="#1E293B" metalness={0.8} />
          </mesh>
        </group>
      )}

      {carId === 'cyclone-rs' && (
        // CYCLONE RS: Modern Aggressive Muscle Car
        <group position={[0, 0.48, 0]}>
          {/* Wide Muscular Haunches */}
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[2.02, 0.50, 4.6]} />
            <meshPhysicalMaterial
              color={bodyColor}
              metalness={0.84}
              roughness={0.22}
              clearcoat={0.95}
            />
          </mesh>
          {/* High-Rise Shaker Hood Scoop */}
          <mesh position={[0, 0.32, 1.1]}>
            <boxGeometry args={[0.7, 0.16, 1.2]} />
            <meshStandardMaterial color="#0F172A" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Angular Cabin */}
          <mesh position={[0, 0.48, -0.2]}>
            <boxGeometry args={[1.48, 0.48, 2.2]} />
            <meshPhysicalMaterial color="#0B0F19" roughness={0.06} transparent opacity={0.94} />
          </mesh>
          {/* Ducktail Muscle Spoiler */}
          <mesh position={[0, 0.40, -2.25]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[1.82, 0.16, 0.2]} />
            <meshStandardMaterial color="#0F172A" metalness={0.9} />
          </mesh>
          {/* Deep Front Chin Splitter with Support Rods */}
          <mesh position={[0, -0.20, 2.32]}>
            <boxGeometry args={[1.96, 0.06, 0.3]} />
            <meshStandardMaterial color="#0F172A" metalness={0.8} />
          </mesh>
        </group>
      )}

      {carId === 'phantom-spyder' && (
        // PHANTOM SPYDER: Open-Cockpit Track Prototype
        <group position={[0, 0.40, 0]}>
          {/* Ultra Low-Slung Chassis */}
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[1.96, 0.36, 4.4]} />
            <meshPhysicalMaterial
              color={bodyColor}
              metalness={0.92}
              roughness={0.14}
              clearcoat={1.0}
            />
          </mesh>
          {/* Open Cockpit Cutout */}
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[1.2, 0.22, 1.8]} />
            <meshStandardMaterial color="#0B0F19" roughness={0.7} />
          </mesh>
          {/* Minimalist Aero Windshield Wrap */}
          <mesh position={[0, 0.28, 0.7]} rotation={[-0.4, 0, 0]}>
            <boxGeometry args={[1.3, 0.24, 0.04]} />
            <meshPhysicalMaterial color="#38BDF8" roughness={0.02} transparent opacity={0.5} />
          </mesh>
          {/* Dual Aerodynamic Roll Hoops */}
          <mesh position={[-0.4, 0.34, -0.4]}>
            <boxGeometry args={[0.22, 0.36, 0.3]} />
            <meshStandardMaterial color="#334155" metalness={0.95} />
          </mesh>
          <mesh position={[0.4, 0.34, -0.4]}>
            <boxGeometry args={[0.22, 0.36, 0.3]} />
            <meshStandardMaterial color="#334155" metalness={0.95} />
          </mesh>
          {/* Rear High Downforce Aerofoil */}
          <mesh position={[0, 0.68, -1.9]}>
            <boxGeometry args={[1.86, 0.04, 0.38]} />
            <meshStandardMaterial color="#0F172A" metalness={0.9} />
          </mesh>
        </group>
      )}

      {carId === 'solaris-hyper' && (
        // SOLARIS HYPERCAR: Le Mans Prototype-Inspired Hypercar
        <group position={[0, 0.42, 0]}>
          {/* Sculpted Ground Effect Body */}
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[2.06, 0.38, 4.6]} />
            <meshPhysicalMaterial
              color={bodyColor}
              metalness={0.88}
              roughness={0.16}
              clearcoat={1.0}
              clearcoatRoughness={0.04}
            />
          </mesh>
          {/* Central Teardrop Canopy */}
          <mesh position={[0, 0.40, 0.1]}>
            <boxGeometry args={[1.28, 0.44, 2.0]} />
            <meshPhysicalMaterial color="#030712" roughness={0.02} transparent opacity={0.96} />
          </mesh>
          {/* Dorsal Stabilizer Fin */}
          <mesh position={[0, 0.54, -0.9]}>
            <boxGeometry args={[0.04, 0.44, 1.6]} />
            <meshStandardMaterial color="#0F172A" metalness={0.9} />
          </mesh>
          {/* Integrated Super-Wing */}
          <mesh position={[0, 0.74, -2.0]}>
            <boxGeometry args={[2.0, 0.05, 0.46]} />
            <meshStandardMaterial color="#0F172A" metalness={0.95} />
          </mesh>
          <mesh position={[-0.85, 0.50, -2.0]}>
            <boxGeometry args={[0.08, 0.45, 0.3]} />
            <meshStandardMaterial color="#0F172A" metalness={0.95} />
          </mesh>
          <mesh position={[0.85, 0.50, -2.0]}>
            <boxGeometry args={[0.08, 0.45, 0.3]} />
            <meshStandardMaterial color="#0F172A" metalness={0.95} />
          </mesh>
        </group>
      )}

      {carId === 'meridian-gt' && (
        // MERIDIAN GT: Classic Balanced Gran Turismo Coupe
        <group position={[0, 0.48, 0]}>
          {/* Long Sculpted Hood and Fastback */}
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[1.92, 0.48, 4.6]} />
            <meshPhysicalMaterial
              color={bodyColor}
              metalness={0.88}
              roughness={0.18}
              clearcoat={1.0}
              clearcoatRoughness={0.05}
            />
          </mesh>
          {/* Glass Greenhouse */}
          <mesh position={[0, 0.46, -0.3]}>
            <boxGeometry args={[1.42, 0.46, 2.3]} />
            <meshPhysicalMaterial color="#0F172A" roughness={0.04} transparent opacity={0.92} />
          </mesh>
          {/* Rear Deck Lip Spoiler */}
          <mesh position={[0, 0.28, -2.25]}>
            <boxGeometry args={[1.7, 0.08, 0.16]} />
            <meshStandardMaterial color="#1E293B" metalness={0.8} />
          </mesh>
        </group>
      )}

      {/* ======================================================== */}
      {/* SIDE MIRRORS */}
      {/* ======================================================== */}
      <group position={[0, 0.65, 0.6]}>
        <mesh position={[-0.98, 0, 0]}>
          <boxGeometry args={[0.18, 0.08, 0.14]} />
          <meshStandardMaterial color="#1E293B" metalness={0.8} />
        </mesh>
        <mesh position={[0.98, 0, 0]}>
          <boxGeometry args={[0.18, 0.08, 0.14]} />
          <meshStandardMaterial color="#1E293B" metalness={0.8} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* HEADLIGHTS (Projectors + LED Daytime Running Lights) */}
      {/* ======================================================== */}
      <group position={[0, 0.46, 2.26]}>
        {/* Left Projector & DRL Strip */}
        <mesh position={[-0.72, 0, 0]}>
          <boxGeometry args={[0.34, 0.08, 0.05]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#E0F2FE"
            emissiveIntensity={3.2}
          />
        </mesh>
        {/* Right Projector & DRL Strip */}
        <mesh position={[0.72, 0, 0]}>
          <boxGeometry args={[0.34, 0.08, 0.05]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#E0F2FE"
            emissiveIntensity={3.2}
          />
        </mesh>
        {/* Forward Headlight Illumination Pointlight */}
        <pointLight position={[0, 0.1, 1.2]} color="#E0F2FE" intensity={1.8} distance={20} />
      </group>

      {/* ======================================================== */}
      {/* TAILLIGHTS (Ruby Red LED Light Bar, Brightens on Brake) */}
      {/* ======================================================== */}
      <group position={[0, 0.48, -2.26]}>
        <mesh position={[-0.72, 0, 0]}>
          <boxGeometry args={[0.36, 0.08, 0.05]} />
          <meshStandardMaterial
            color="#EF4444"
            emissive="#DC2626"
            emissiveIntensity={isBraking ? 5.0 : 2.0}
          />
        </mesh>
        <mesh position={[0.72, 0, 0]}>
          <boxGeometry args={[0.36, 0.08, 0.05]} />
          <meshStandardMaterial
            color="#EF4444"
            emissive="#DC2626"
            emissiveIntensity={isBraking ? 5.0 : 2.0}
          />
        </mesh>
        {/* Continuous LED Center Bar */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.9, 0.04, 0.04]} />
          <meshStandardMaterial
            color="#EF4444"
            emissive="#DC2626"
            emissiveIntensity={isBraking ? 4.5 : 1.5}
          />
        </mesh>
        {/* Brake Light Flare */}
        {isBraking && (
          <pointLight position={[0, 0.2, -0.4]} color="#EF4444" intensity={4.0} distance={7} />
        )}
      </group>

      {/* ======================================================== */}
      {/* 4 ROTATING ALLOY WHEELS WITH DISCS & CALIPERS */}
      {/* ======================================================== */}
      {wheelPositions.map((pos, idx) => (
        <WheelAssembly
          key={idx}
          position={pos}
          isLeft={pos[0] < 0}
          accentColor={carData.accentColor}
          rimStyle={carData.rimStyle}
          groupRefSetter={(el) => {
            if (el) wheelsRef.current[idx] = el;
          }}
        />
      ))}

      {/* ======================================================== */}
      {/* CLEAN UNDERGLOW ACCENT (Subtle Ground Halo) */}
      {/* ======================================================== */}
      <group position={[0, 0.06, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.85, 3.8]} />
          <meshBasicMaterial
            color={underglowColor}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
        <pointLight position={[0, 0.08, 0]} color={underglowColor} intensity={0.9} distance={3.8} />
      </group>

      {/* ======================================================== */}
      {/* EXHAUST PIPES & NITRO JET FLAMES */}
      {/* ======================================================== */}
      <group position={[0, 0.26, -2.28]}>
        {/* Left Chrome Exhaust Tip */}
        <mesh position={[-0.45, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.16, 16]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.95} roughness={0.15} />
        </mesh>
        {/* Right Chrome Exhaust Tip */}
        <mesh position={[0.45, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.16, 16]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.95} roughness={0.15} />
        </mesh>

        {/* Dynamic Streak Exhaust Nitro Flames */}
        {streak >= 5 && speedKmh > 40 && (
          <>
            <mesh
              ref={flameLeftRef}
              position={[-0.45, 0, -0.45]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <coneGeometry args={[0.1, 0.85, 12]} />
              <meshBasicMaterial
                color={streak >= 20 ? '#00D8FF' : '#FF6B00'}
                transparent
                opacity={0.88}
              />
            </mesh>
            <mesh
              ref={flameRightRef}
              position={[0.45, 0, -0.45]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <coneGeometry args={[0.1, 0.85, 12]} />
              <meshBasicMaterial
                color={streak >= 20 ? '#00D8FF' : '#FF6B00'}
                transparent
                opacity={0.88}
              />
            </mesh>
          </>
        )}
      </group>
    </group>
  );
};
