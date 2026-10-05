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
        {/* PRISTINE STUDIO THREE-POINT LIGHTING */}
        <ambientLight intensity={1.1} color="#F8FAFC" />
        <directionalLight
          position={[6, 9, 6]}
          intensity={2.4}
          color="#FFFFFF"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-6, 7, -5]} intensity={1.3} color="#E2E8F0" />
        <directionalLight position={[0, -2, 5]} intensity={0.7} color="#CBD5E1" />
        <pointLight position={[0, 4.5, 0]} intensity={1.5} color="#FFFFFF" />

        {/* PRISTINE STUDIO PODIUM DISC */}
        <group position={[0, -0.01, 0]}>
          {/* Main turntable platform */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[5.2, 64]} />
            <meshStandardMaterial
              color="#F8FAFC"
              roughness={0.18}
              metalness={0.12}
            />
          </mesh>
          {/* Outer beveled brushed metallic edge ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
            <ringGeometry args={[5.2, 5.5, 64]} />
            <meshStandardMaterial
              color="#94A3B8"
              metalness={0.88}
              roughness={0.2}
            />
          </mesh>
          {/* Ambient studio halo rim */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
            <ringGeometry args={[5.5, 7.0, 64]} />
            <meshBasicMaterial
              color="#E2E8F0"
              transparent
              opacity={0.4}
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
