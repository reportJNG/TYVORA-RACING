// apps/web/src/components/scene/RaceCanvas.tsx
import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { TrackMesh, buildTrackSpline } from './TrackMesh.js';
import { Vehicle3D } from './Vehicle3D.js';
import { GhostVehicle3D } from './GhostVehicle3D.js';
import { PlayerFollowCamera } from './PlayerFollowCamera.js';
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

  // Compute 3D position and orientation for player car (Lane B = center offset 0)
  const playerPos = trackSpline.getPointAtDistance(playerSim.d);
  const playerTangent = trackSpline.getTangentAtDistance(playerSim.d).normalize();
  const playerRotY = Math.atan2(playerTangent.x, playerTangent.z);

  // Compute Ghost 1 (Rival - Lane A = -3.4 offset, accurately following its own spline section)
  const opp1 = opponents[0];
  const opp1Pos = useMemo(() => {
    if (!opp1) return new THREE.Vector3();
    const pt = trackSpline.getPointAtDistance(opp1.racer.d);
    const tangent = trackSpline.getTangentAtDistance(opp1.racer.d).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    return pt.add(normal.multiplyScalar(3.4));
  }, [opp1?.racer.d, trackSpline]);
  const opp1Tangent = opp1 ? trackSpline.getTangentAtDistance(opp1.racer.d).normalize() : playerTangent;
  const opp1RotY = Math.atan2(opp1Tangent.x, opp1Tangent.z);

  // Compute Ghost 2 (Pacer - Lane C = +3.4 offset, accurately following its own spline section)
  const opp2 = opponents[1];
  const opp2Pos = useMemo(() => {
    if (!opp2) return new THREE.Vector3();
    const pt = trackSpline.getPointAtDistance(opp2.racer.d);
    const tangent = trackSpline.getTangentAtDistance(opp2.racer.d).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    return pt.add(normal.multiplyScalar(-3.4));
  }, [opp2?.racer.d, trackSpline]);
  const opp2Tangent = opp2 ? trackSpline.getTangentAtDistance(opp2.racer.d).normalize() : playerTangent;
  const opp2RotY = Math.atan2(opp2Tangent.x, opp2Tangent.z);

  const playerSpeedKmh = playerSim.v * 3.6;
  const isPlayerStalled = playerSim.stallUntilMs > Date.now();

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
      <Canvas
        camera={{ position: [0, 14.5, -8], fov: 43 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        shadows
      >
        {/* ATMOSPHERIC SKY & HORIZON FOG */}
        <color attach="background" args={[track.lighting.skyTop]} />
        <fogExp2 attach="fog" args={[track.lighting.fogColor, track.lighting.fogDensity]} />

        {/* CINEMATIC LIGHTING SYSTEM */}
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

        {/* SCENIC CONTINUOUS RACETRACK & 3D WORLD */}
        <TrackMesh raceDistance={raceDistance} trackId={selectedTrackId} />

        {/* SPEED PARTICLES & AERODYNAMIC WIND TRAILS */}
        <SpeedStreaks
          playerPos={playerPos}
          playerTangent={playerTangent}
          speedKmh={playerSpeedKmh}
        />

        {/* SOLE PHYSICAL PLAYER CAR (Lane B) */}
        <Vehicle3D
          carId={selectedCarId}
          colorOverride={customPaintColor || undefined}
          speedKmh={playerSpeedKmh}
          isBraking={isPlayerStalled}
          streak={streak}
          position={[playerPos.x, playerPos.y, playerPos.z]}
          rotation={[0, playerRotY, 0]}
        />

        {/* GHOST RIVAL RACER (Crimson Spectral Trail, Lane A) */}
        {opp1 && (
          <GhostVehicle3D
            carId={opp1.car.id}
            role="rival"
            speedKmh={opp1.racer.v * 3.6}
            position={[opp1Pos.x, opp1Pos.y, opp1Pos.z]}
            rotation={[0, opp1RotY, 0]}
            playerDistance={playerSim.d}
            ghostDistance={opp1.racer.d}
          />
        )}

        {/* GHOST PACER RACER (Electric Cyan Trail, Lane C) */}
        {opp2 && (
          <GhostVehicle3D
            carId={opp2.car.id}
            role="pacer"
            speedKmh={opp2.racer.v * 3.6}
            position={[opp2Pos.x, opp2Pos.y, opp2Pos.z]}
            rotation={[0, opp2RotY, 0]}
            playerDistance={playerSim.d}
            ghostDistance={opp2.racer.d}
          />
        )}

        {/* ADAPTIVE SMOOTH PLAYER-FOLLOW CAMERA */}
        <PlayerFollowCamera
          targetPosition={playerPos}
          targetTangent={playerTangent}
          speedKmh={playerSpeedKmh}
          isStalled={isPlayerStalled}
        />
      </Canvas>
    </div>
  );
});
