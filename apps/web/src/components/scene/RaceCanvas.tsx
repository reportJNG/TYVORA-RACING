// apps/web/src/components/scene/RaceCanvas.tsx
import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { TrackMesh, buildTrackSpline } from './TrackMesh.js';
import { Vehicle3D } from './Vehicle3D.js';
import { ChaseCamera } from './ChaseCamera.js';
import { SpeedStreaks } from './SpeedStreaks.js';
import { useRaceStore } from '../../stores/useRaceStore.js';
import { useTypingStore } from '../../stores/useTypingStore.js';
import { TRACKS_DATA } from '../../data/tracks.js';

export const RaceCanvas: React.FC = React.memo(() => {
  const raceDistance = useRaceStore((state) => state.raceDistance);
  const selectedCarId = useRaceStore((state) => state.selectedCarId);
  const selectedTrackId = useRaceStore((state) => state.selectedTrackId);
  const customPaintColor = useRaceStore((state) => state.customPaintColor);
  const playerSim = useRaceStore((state) => state.playerSim);
  const opponents = useRaceStore((state) => state.opponents);
  const streak = useTypingStore((state) => state.snapshot.streak);

  const track = TRACKS_DATA[selectedTrackId] || TRACKS_DATA['pacific-coast'];
  const trackSpline = useMemo(() => buildTrackSpline(raceDistance, selectedTrackId), [raceDistance, selectedTrackId]);

  // Compute 3D position and orientation for player car (Lane B = 0 offset)
  const playerPos = trackSpline.getPointAtDistance(playerSim.d);
  const playerTangent = trackSpline.getTangentAtDistance(playerSim.d).normalize();
  const playerRotY = Math.atan2(playerTangent.x, playerTangent.z);

  // Compute AI 1 (Rival - Lane A = -3.6 offset)
  const opp1 = opponents[0];
  const opp1Pos = opp1
    ? trackSpline.getPointAtDistance(opp1.racer.d).clone().add(
        new THREE.Vector3().crossVectors(playerTangent, new THREE.Vector3(0, 1, 0)).multiplyScalar(3.6)
      )
    : new THREE.Vector3(0, 0, 0);
  const opp1RotY = playerRotY;

  // Compute AI 2 (Pacer - Lane C = +3.6 offset)
  const opp2 = opponents[1];
  const opp2Pos = opp2
    ? trackSpline.getPointAtDistance(opp2.racer.d).clone().add(
        new THREE.Vector3().crossVectors(playerTangent, new THREE.Vector3(0, 1, 0)).multiplyScalar(-3.6)
      )
    : new THREE.Vector3(0, 0, 0);
  const opp2RotY = playerRotY;

  const playerSpeedKmh = playerSim.v * 3.6;
  const isPlayerStalled = playerSim.stallUntilMs > Date.now();

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
      <Canvas
        camera={{ position: [0, 14.5, -8], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        shadows
      >
        {/* CLEAN ATMOSPHERIC SKY & HORIZON FOG */}
        <color attach="background" args={[track.lighting.skyTop]} />
        <fogExp2 attach="fog" args={[track.lighting.fogColor, track.lighting.fogDensity]} />

        {/* BRIGHT REALISTIC LIGHTING SYSTEM */}
        <ambientLight intensity={track.lighting.ambientIntensity} color={track.lighting.ambientColor} />
        <directionalLight
          position={track.lighting.sunPosition}
          intensity={track.lighting.sunIntensity}
          color={track.lighting.sunColor}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={180}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
        />
        <hemisphereLight
          args={[track.lighting.hemiSky, track.lighting.hemiGround, track.lighting.hemiIntensity]}
        />

        {/* SCENIC CLEAN RACETRACK & 3D ENVIRONMENT */}
        <TrackMesh raceDistance={raceDistance} trackId={selectedTrackId} />

        {/* SPEED PARTICLES & CLEAN WIND TRAILS */}
        <SpeedStreaks
          playerPos={playerPos}
          playerTangent={playerTangent}
          speedKmh={playerSpeedKmh}
        />

        {/* PLAYER CLEAN VEHICLE (Lane B) */}
        <Vehicle3D
          carId={selectedCarId}
          colorOverride={customPaintColor || undefined}
          speedKmh={playerSpeedKmh}
          isBraking={isPlayerStalled}
          streak={streak}
          position={[playerPos.x, playerPos.y, playerPos.z]}
          rotation={[0, playerRotY, 0]}
        />

        {/* AI RIVAL VEHICLE (Lane A) */}
        {opp1 && (
          <Vehicle3D
            carId={opp1.car.id}
            speedKmh={opp1.racer.v * 3.6}
            position={[opp1Pos.x, opp1Pos.y, opp1Pos.z]}
            rotation={[0, opp1RotY, 0]}
          />
        )}

        {/* AI PACER VEHICLE (Lane C) */}
        {opp2 && (
          <Vehicle3D
            carId={opp2.car.id}
            speedKmh={opp2.racer.v * 3.6}
            position={[opp2Pos.x, opp2Pos.y, opp2Pos.z]}
            rotation={[0, opp2RotY, 0]}
          />
        )}

        {/* SMOOTH CHASE CAMERA */}
        <ChaseCamera
          targetPosition={playerPos}
          targetTangent={playerTangent}
          speedKmh={playerSpeedKmh}
          isStalled={isPlayerStalled}
        />
      </Canvas>
    </div>
  );
});
