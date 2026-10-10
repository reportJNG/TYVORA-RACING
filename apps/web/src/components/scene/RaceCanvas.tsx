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
  const raceTimeMs = useRaceStore((state) => state.raceTimeMs);
  const streak = useTypingStore((state) => state.snapshot.streak);

  const track = TRACKS_DATA[selectedTrackId] || TRACKS_DATA['pacific-coast'];
  const trackSpline = useMemo(() => buildTrackSpline(raceDistance, selectedTrackId), [raceDistance, selectedTrackId]);

  // Compute 3D position and orientation for player car (Lane B = center offset 0)
  const playerPos = trackSpline.getPointAtDistance(playerSim.d);
  const playerTangent = trackSpline.getTangentAtDistance(playerSim.d).normalize();
  const playerRotY = Math.atan2(playerTangent.x, playerTangent.z);

  const LANE_OFFSETS = [3.4, -3.4, 1.8, -1.8, 4.5, -4.5];
  const GHOST_ROLES: ('rival' | 'pacer' | 'challenger')[] = ['rival', 'pacer', 'challenger', 'rival', 'pacer'];

  const playerSpeedKmh = playerSim.v * 3.6;
  const isPlayerStalled = playerSim.stallUntilMs > raceTimeMs;

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
          accel={playerSim.accel}
          isBraking={isPlayerStalled}
          streak={streak}
          position={[playerPos.x, playerPos.y, playerPos.z]}
          rotation={[0, playerRotY, 0]}
        />

        {/* DYNAMIC OPPONENT GHOST CARS */}
        {opponents.map((opp, idx) => {
          const offsetDist = LANE_OFFSETS[idx % LANE_OFFSETS.length];
          const pt = trackSpline.getPointAtDistance(opp.racer.d);
          const tangent = trackSpline.getTangentAtDistance(opp.racer.d).normalize();
          const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
          const pos = pt.add(normal.multiplyScalar(offsetDist));
          const rotY = Math.atan2(tangent.x, tangent.z);
          const role = GHOST_ROLES[idx % GHOST_ROLES.length];

          return (
            <GhostVehicle3D
              key={opp.racer.id || idx}
              carId={opp.car.id}
              role={role}
              speedKmh={opp.racer.v * 3.6}
              accel={opp.racer.accel}
              position={[pos.x, pos.y, pos.z]}
              rotation={[0, rotY, 0]}
              playerDistance={playerSim.d}
              ghostDistance={opp.racer.d}
            />
          );
        })}

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
