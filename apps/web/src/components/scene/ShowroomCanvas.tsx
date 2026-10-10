// apps/web/src/components/scene/ShowroomCanvas.tsx
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Vehicle3D } from './Vehicle3D.js';

export interface ShowroomCanvasProps {
  selectedCarId: string;
  colorOverride?: string;
}

const Turntable: React.FC<{ selectedCarId: string; colorOverride?: string }> = ({
  selectedCarId,
  colorOverride,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.28;
    }
  });

  return (
    <group ref={groupRef}>
      <Vehicle3D
        carId={selectedCarId}
        colorOverride={colorOverride}
        speedKmh={0}
        position={[0, 0, 0]}
      />
    </group>
  );
};

export const ShowroomCanvas: React.FC<ShowroomCanvasProps> = ({
  selectedCarId,
  colorOverride,
}) => {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing select-none">
      <Canvas
        camera={{ position: [0, 3.8, 5.6], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        shadows
      >
        {/* CINEMATIC THREE-POINT SHOWROOM LIGHTING */}
        <ambientLight intensity={0.9} color="#94A3B8" />
        <directionalLight
          position={[6, 9, 6]}
          intensity={2.8}
          color="#FFFFFF"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-6, 7, -5]} intensity={1.6} color="#38BDF8" />
        <directionalLight position={[0, -2, 5]} intensity={0.6} color="#1E293B" />
        <pointLight position={[0, 4.5, 0]} intensity={1.8} color="#FF6B4A" />

        {/* HIGH-TECH OBSIDIAN TURNTABLE PODIUM */}
        <group position={[0, -0.01, 0]}>
          {/* Main obsidian glass turntable platform */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[4.8, 64]} />
            <meshStandardMaterial
              color="#0B0F19"
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
          {/* Glowing neon accent halo ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
            <ringGeometry args={[4.75, 4.88, 64]} />
            <meshBasicMaterial
              color="#FF4B26"
              transparent
              opacity={0.85}
            />
          </mesh>
          {/* Outer brushed titanium edge ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
            <ringGeometry args={[4.88, 5.4, 64]} />
            <meshStandardMaterial
              color="#1E293B"
              metalness={0.9}
              roughness={0.3}
            />
          </mesh>
          {/* Ambient soft glow ground falloff */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
            <ringGeometry args={[5.4, 6.8, 64]} />
            <meshBasicMaterial
              color="#FF4B26"
              transparent
              opacity={0.08}
            />
          </mesh>
        </group>

        {/* ROTATING VEHICLE */}
        <Turntable selectedCarId={selectedCarId} colorOverride={colorOverride} />

        {/* INTUITIVE ORBIT CONTROLS */}
        <OrbitControls
          target={[0, 0.85, 0]}
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
};
