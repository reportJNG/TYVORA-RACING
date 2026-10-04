// apps/web/src/components/scene/TrackMesh.tsx
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { TRACKS_DATA } from '../../data/tracks.js';

export interface TrackMeshProps {
  raceDistance: number;
  trackId?: string;
}

export interface TrackSpline {
  curve: THREE.CatmullRomCurve3;
  getPointAtDistance: (d: number) => THREE.Vector3;
  getTangentAtDistance: (d: number) => THREE.Vector3;
}

/**
 * Builds the continuous Catmull-Rom spline customized for each clean track profile.
 */
export function buildTrackSpline(distance: number, trackId: string = 'pacific-coast'): TrackSpline {
  const track = TRACKS_DATA[trackId] || TRACKS_DATA['pacific-coast'];
  const { curveScale, curveFrequency, tunnelStartProg, tunnelEndProg, tunnelElevation, bridgeStartProg, bridgeEndProg, bridgeHeight } = track.spline;

  const points: THREE.Vector3[] = [];
  const segments = Math.max(12, Math.ceil(distance / 50));

  for (let i = 0; i <= segments + 3; i++) {
    const z = (i * distance) / segments;
    const prog = i / segments;

    // Scenic natural curves
    const x = Math.sin(i * curveFrequency) * curveScale + Math.cos(i * curveFrequency * 0.5) * (curveScale * 0.35);

    // Elevation changes: tunnels dip or bridge crests
    let y = 0;
    if (tunnelStartProg > 0 && prog >= tunnelStartProg && prog <= tunnelEndProg) {
      const tunnelMid = (tunnelStartProg + tunnelEndProg) / 2;
      const tunnelSpan = (tunnelEndProg - tunnelStartProg) / 2;
      const t = (prog - tunnelMid) / tunnelSpan;
      y = tunnelElevation * (1.0 - t * t);
    } else if (bridgeStartProg > 0 && prog >= bridgeStartProg && prog <= bridgeEndProg) {
      const bridgeProg = (prog - bridgeStartProg) / (bridgeEndProg - bridgeStartProg);
      y = Math.sin(bridgeProg * Math.PI) * bridgeHeight;
    }

    points.push(new THREE.Vector3(x, y, z));
  }

  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');

  return {
    curve,
    getPointAtDistance: (d: number) => {
      const u = Math.min(1.0, Math.max(0.0, d / distance));
      return curve.getPointAt(u);
    },
    getTangentAtDistance: (d: number) => {
      const u = Math.min(1.0, Math.max(0.0, d / distance));
      return curve.getTangentAt(u);
    },
  };
}

/**
 * Procedural 3D Palm Tree
 */
const PalmTree: React.FC<{ position: THREE.Vector3; scale?: number }> = ({ position, scale = 1.0 }) => {
  return (
    <group position={position} scale={scale}>
      {/* Curved trunk */}
      <mesh position={[0, 3.5, 0]} rotation={[0.08, 0, 0.05]} castShadow>
        <cylinderGeometry args={[0.2, 0.32, 7, 8]} />
        <meshStandardMaterial color="#8D6E63" roughness={0.9} />
      </mesh>
      {/* Palm leaf fronds canopy */}
      <group position={[0.2, 7.0, 0.2]}>
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <mesh
              key={i}
              rotation={[0.35, rad, 0]}
              position={[Math.sin(rad) * 1.4, -0.4, Math.cos(rad) * 1.4]}
            >
              <boxGeometry args={[0.55, 0.06, 2.8]} />
              <meshStandardMaterial color="#2E7D32" roughness={0.7} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};

/**
 * Procedural 3D Alpine Pine Tree
 */
const PineTree: React.FC<{ position: THREE.Vector3; scale?: number }> = ({ position, scale = 1.0 }) => {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.36, 5, 8]} />
        <meshStandardMaterial color="#4E342E" roughness={0.95} />
      </mesh>
      {/* Layer 1 bottom needles */}
      <mesh position={[0, 4.5, 0]} castShadow>
        <coneGeometry args={[2.0, 3.0, 8]} />
        <meshStandardMaterial color="#1B5E20" roughness={0.8} />
      </mesh>
      {/* Layer 2 mid needles */}
      <mesh position={[0, 6.2, 0]} castShadow>
        <coneGeometry args={[1.5, 2.5, 8]} />
        <meshStandardMaterial color="#2E7D32" roughness={0.8} />
      </mesh>
      {/* Layer 3 top needles */}
      <mesh position={[0, 7.6, 0]} castShadow>
        <coneGeometry args={[1.0, 2.0, 8]} />
        <meshStandardMaterial color="#388E3C" roughness={0.75} />
      </mesh>
    </group>
  );
};

/**
 * Procedural 3D Sakura Cherry Blossom Tree
 */
const SakuraTree: React.FC<{ position: THREE.Vector3; scale?: number }> = ({ position, scale = 1.0 }) => {
  return (
    <group position={position} scale={scale}>
      {/* Dark trunk */}
      <mesh position={[0, 2.2, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.38, 4.4, 8]} />
        <meshStandardMaterial color="#3E2723" roughness={0.9} />
      </mesh>
      {/* Fluffy pink petal canopy spheres */}
      <mesh position={[0, 4.8, 0]} castShadow>
        <sphereGeometry args={[2.2, 12, 12]} />
        <meshStandardMaterial color="#F472B6" roughness={0.85} />
      </mesh>
      <mesh position={[-1.0, 4.2, 0.8]}>
        <sphereGeometry args={[1.5, 10, 10]} />
        <meshStandardMaterial color="#FBCFE8" roughness={0.85} />
      </mesh>
      <mesh position={[1.0, 4.4, -0.6]}>
        <sphereGeometry args={[1.6, 10, 10]} />
        <meshStandardMaterial color="#EC4899" roughness={0.85} />
      </mesh>
    </group>
  );
};

/**
 * Modern Clean Glass Metropolis Skyscraper
 */
const CleanBuilding: React.FC<{
  position: THREE.Vector3;
  size: [number, number, number];
  tint: string;
}> = ({ position, size, tint }) => {
  return (
    <group position={position}>
      {/* Building Tower Core */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshPhysicalMaterial
          color={tint}
          metalness={0.7}
          roughness={0.15}
          clearcoat={0.9}
        />
      </mesh>
      {/* White architectural crown roof frame */}
      <mesh position={[0, size[1] * 0.5 + 0.6, 0]}>
        <boxGeometry args={[size[0] * 0.95, 1.2, size[2] * 0.95]} />
        <meshStandardMaterial color="#F8FAFC" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Sleek roof beacon light */}
      <mesh position={[0, size[1] * 0.5 + 2.5, 0]}>
        <cylinderGeometry args={[0.08, 0.15, 3.5, 8]} />
        <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
      </mesh>
    </group>
  );
};

/**
 * Red Rock Canyon Sandstone Bluff
 */
const CanyonBluff: React.FC<{
  position: THREE.Vector3;
  size: [number, number, number];
}> = ({ position, size }) => {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[size[0] * 0.4, size[0] * 0.55, size[1], 8]} />
        <meshStandardMaterial color="#B45309" roughness={0.95} metalness={0.05} />
      </mesh>
      {/* Stratified rock layer band */}
      <mesh position={[0, size[1] * 0.2, 0]}>
        <cylinderGeometry args={[size[0] * 0.43, size[0] * 0.46, size[1] * 0.15, 8]} />
        <meshStandardMaterial color="#78350F" roughness={0.98} />
      </mesh>
    </group>
  );
};

export const TrackMesh: React.FC<TrackMeshProps> = ({ raceDistance, trackId = 'pacific-coast' }) => {
  const track = TRACKS_DATA[trackId] || TRACKS_DATA['pacific-coast'];
  const { curve } = useMemo(() => buildTrackSpline(raceDistance, trackId), [raceDistance, trackId]);

  // Procedural Pixel Checkerboard Texture for Start and Finish Lines
  const checkerTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 32; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#FFFFFF' : '#0F172A';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 1);
    return tex;
  }, []);

  // Generate ribbon road geometry
  const roadGeometry = useMemo(() => {
    const segments = Math.max(90, Math.ceil(raceDistance / 3.5));
    const width = track.road.width;
    const points = curve.getPoints(segments);

    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const u = i / (points.length - 1);
      const tangent = curve.getTangentAt(u).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      const left = p.clone().add(normal.clone().multiplyScalar(width * 0.5));
      const right = p.clone().add(normal.clone().multiplyScalar(-width * 0.5));

      positions.push(left.x, left.y, left.z);
      positions.push(right.x, right.y, right.z);

      const vTile = (u * raceDistance) / 8.0;
      uvs.push(0, vTile);
      uvs.push(1, vTile);

      if (i < points.length - 1) {
        const row1 = i * 2;
        const row2 = (i + 1) * 2;
        indices.push(row1, row1 + 1, row2);
        indices.push(row1 + 1, row2 + 1, row2);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [curve, raceDistance, track.road.width]);

  // Generate continuous road edge lines & center dashed lines
  const laneGeometry = useMemo(() => {
    const segments = Math.max(100, Math.ceil(raceDistance / 3.5));
    const points = curve.getPoints(segments);
    const positions: number[] = [];
    const indices: number[] = [];
    let vertCount = 0;

    const laneOffsets = [-3.6, 3.6];
    const edgeOffsets = [-track.road.width * 0.48, track.road.width * 0.48];

    // 1. Center dashed lines (3.6m left & right of centerline)
    for (let i = 0; i < points.length - 1; i++) {
      const d = (i / points.length) * raceDistance;
      if (Math.floor(d / 4) % 2 === 0) continue; // 4m dash, 4m gap

      const p1 = points[i];
      const p2 = points[i + 1];
      const u1 = i / (points.length - 1);
      const tangent = curve.getTangentAt(u1).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      for (const offset of laneOffsets) {
        const halfW = 0.12;
        const c1 = p1.clone().add(normal.clone().multiplyScalar(offset));
        const c2 = p2.clone().add(normal.clone().multiplyScalar(offset));

        const v1 = c1.clone().add(normal.clone().multiplyScalar(halfW));
        const v2 = c1.clone().add(normal.clone().multiplyScalar(-halfW));
        const v3 = c2.clone().add(normal.clone().multiplyScalar(halfW));
        const v4 = c2.clone().add(normal.clone().multiplyScalar(-halfW));

        v1.y += 0.025;
        v2.y += 0.025;
        v3.y += 0.025;
        v4.y += 0.025;

        positions.push(v1.x, v1.y, v1.z);
        positions.push(v2.x, v2.y, v2.z);
        positions.push(v3.x, v3.y, v3.z);
        positions.push(v4.x, v4.y, v4.z);

        indices.push(vertCount, vertCount + 1, vertCount + 2);
        indices.push(vertCount + 1, vertCount + 3, vertCount + 2);
        vertCount += 4;
      }
    }

    // 2. Solid Outer Road Edge Stripes
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const u1 = i / (points.length - 1);
      const tangent = curve.getTangentAt(u1).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      for (const offset of edgeOffsets) {
        const halfW = 0.15;
        const c1 = p1.clone().add(normal.clone().multiplyScalar(offset));
        const c2 = p2.clone().add(normal.clone().multiplyScalar(offset));

        const v1 = c1.clone().add(normal.clone().multiplyScalar(halfW));
        const v2 = c1.clone().add(normal.clone().multiplyScalar(-halfW));
        const v3 = c2.clone().add(normal.clone().multiplyScalar(halfW));
        const v4 = c2.clone().add(normal.clone().multiplyScalar(-halfW));

        v1.y += 0.025;
        v2.y += 0.025;
        v3.y += 0.025;
        v4.y += 0.025;

        positions.push(v1.x, v1.y, v1.z);
        positions.push(v2.x, v2.y, v2.z);
        positions.push(v3.x, v3.y, v3.z);
        positions.push(v4.x, v4.y, v4.z);

        indices.push(vertCount, vertCount + 1, vertCount + 2);
        indices.push(vertCount + 1, vertCount + 3, vertCount + 2);
        vertCount += 4;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [curve, raceDistance, track.road.width]);

  // Generate 3D alternating curb rumble strips (red/white) along outer edges
  const curbs = useMemo(() => {
    const list: { pos: THREE.Vector3; rot: THREE.Euler; isPrimary: boolean; isLeft: boolean }[] = [];
    const stepM = 3.5;
    const totalSteps = Math.floor(raceDistance / stepM);

    for (let i = 0; i < totalSteps; i++) {
      const u = (i * stepM) / raceDistance;
      const pt = curve.getPointAt(u);
      const tangent = curve.getTangentAt(u).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const rot = new THREE.Euler(0, Math.atan2(tangent.x, tangent.z), 0);

      const halfW = track.road.width * 0.5 + 0.35;
      const leftPos = pt.clone().add(normal.clone().multiplyScalar(halfW));
      const rightPos = pt.clone().add(normal.clone().multiplyScalar(-halfW));
      const isPrimary = i % 2 === 0;

      list.push({ pos: leftPos, rot, isPrimary, isLeft: true });
      list.push({ pos: rightPos, rot, isPrimary, isLeft: false });
    }
    return list;
  }, [curve, raceDistance, track.road.width]);

  // Roadside Safety Guardrails
  const guardrails = useMemo(() => {
    const list: { pos: THREE.Vector3; rot: THREE.Euler; isLeft: boolean }[] = [];
    const stepM = 12.0;
    const totalSteps = Math.floor(raceDistance / stepM);

    for (let i = 0; i < totalSteps; i++) {
      const u = (i * stepM) / raceDistance;
      const pt = curve.getPointAt(u);
      const tangent = curve.getTangentAt(u).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const rot = new THREE.Euler(0, Math.atan2(tangent.x, tangent.z), 0);

      const offsetDist = track.road.width * 0.5 + 1.2;
      const leftPos = pt.clone().add(normal.clone().multiplyScalar(offsetDist));
      const rightPos = pt.clone().add(normal.clone().multiplyScalar(-offsetDist));

      list.push({ pos: leftPos, rot, isLeft: true });
      list.push({ pos: rightPos, rot, isLeft: false });
    }
    return list;
  }, [curve, raceDistance, track.road.width]);

  // Procedural Scenery instances (trees, buildings, bluffs)
  const sceneryItems = useMemo(() => {
    const trees: { pos: THREE.Vector3; scale: number }[] = [];
    const buildings: { pos: THREE.Vector3; size: [number, number, number]; tint: string }[] = [];
    const bluffs: { pos: THREE.Vector3; size: [number, number, number] }[] = [];

    const treeCount = track.scenery.treeDensity;
    const bldgCount = track.scenery.buildingDensity;

    // Trees placement
    for (let i = 0; i < treeCount; i++) {
      const u = (i + 0.3) / treeCount;
      const pt = curve.getPointAt(u);
      const tangent = curve.getTangentAt(u).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const side = i % 2 === 0 ? 1 : -1;
      const dist = 14 + (i % 5) * 8;
      const pos = pt.clone().add(normal.clone().multiplyScalar(side * dist));
      const scale = 0.85 + ((i * 13) % 40) / 100;
      trees.push({ pos, scale });
    }

    // Buildings or Landmarks placement
    if (track.scenery.terrainType === 'city' || track.scenery.terrainType === 'marina') {
      const tints = ['#F8FAFC', '#E2E8F0', '#CBD5E1', '#94A3B8', '#64748B'];
      for (let i = 0; i < bldgCount; i++) {
        const u = (i + 0.1) / bldgCount;
        const pt = curve.getPointAt(u);
        const tangent = curve.getTangentAt(u).normalize();
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

        const side = i % 2 === 0 ? 1 : -1;
        const dist = 45 + (i % 4) * 22;
        const pos = pt.clone().add(normal.clone().multiplyScalar(side * dist));

        const height = 45 + ((i * 37) % 85);
        pos.y = height * 0.5 - 2;
        const width = 18 + ((i * 19) % 24);
        const depth = 18 + ((i * 23) % 24);
        const tint = tints[i % tints.length];
        buildings.push({ pos, size: [width, height, depth], tint });
      }
    } else if (track.scenery.terrainType === 'canyon') {
      for (let i = 0; i < 35; i++) {
        const u = i / 35;
        const pt = curve.getPointAt(u);
        const tangent = curve.getTangentAt(u).normalize();
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

        const side = i % 2 === 0 ? 1 : -1;
        const dist = 40 + (i % 3) * 25;
        const pos = pt.clone().add(normal.clone().multiplyScalar(side * dist));

        const height = 35 + ((i * 29) % 65);
        pos.y = height * 0.5;
        const radius = 25 + ((i * 17) % 30);
        bluffs.push({ pos, size: [radius, height, radius] });
      }
    }

    return { trees, buildings, bluffs };
  }, [curve, track.scenery]);

  // Start Line Gantry position
  const startPos = useMemo(() => curve.getPointAt(0.01), [curve]);
  const startTangent = useMemo(() => curve.getTangentAt(0.01), [curve]);
  const startRot = useMemo(
    () => new THREE.Euler(0, Math.atan2(startTangent.x, startTangent.z), 0),
    [startTangent]
  );

  // Finish Line Arch position
  const finishPos = useMemo(() => curve.getPointAt(0.995), [curve]);
  const finishTangent = useMemo(() => curve.getTangentAt(0.995), [curve]);
  const finishRot = useMemo(
    () => new THREE.Euler(0, Math.atan2(finishTangent.x, finishTangent.z), 0),
    [finishTangent]
  );

  // Bridge suspension pylons (if track has bridge)
  const bridgePylons = useMemo(() => {
    if (!track.spline.bridgeStartProg) return [];
    const list: { pos: THREE.Vector3; rot: THREE.Euler }[] = [];
    const startM = raceDistance * track.spline.bridgeStartProg;
    const endM = raceDistance * track.spline.bridgeEndProg;
    for (let d = startM; d <= endM; d += 65) {
      const u = d / raceDistance;
      const pos = curve.getPointAt(u);
      const tangent = curve.getTangentAt(u);
      const rot = new THREE.Euler(0, Math.atan2(tangent.x, tangent.z), 0);
      list.push({ pos, rot });
    }
    return list;
  }, [curve, raceDistance, track.spline]);

  return (
    <group>
      {/* ======================================================== */}
      {/* CLEAN ROAD ASPHALT RIBBON */}
      {/* ======================================================== */}
      <mesh geometry={roadGeometry} receiveShadow castShadow>
        <meshStandardMaterial
          color={track.road.asphaltColor}
          roughness={0.65}
          metalness={0.2}
        />
      </mesh>

      {/* ======================================================== */}
      {/* CRISP WHITE / YELLOW LANE & EDGE MARKINGS */}
      {/* ======================================================== */}
      <mesh geometry={laneGeometry}>
        <meshBasicMaterial color={track.road.laneMarkingColor} />
      </mesh>

      {/* ======================================================== */}
      {/* 3D BEVELED CURB RUMBLE STRIPS */}
      {/* ======================================================== */}
      {curbs.map((c, idx) => (
        <group key={`curb-${idx}`} position={c.pos} rotation={c.rot}>
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[0.7, 0.12, 3.2]} />
            <meshStandardMaterial
              color={c.isPrimary ? track.road.curbPrimary : track.road.curbSecondary}
              roughness={0.5}
            />
          </mesh>
        </group>
      ))}

      {/* ======================================================== */}
      {/* ROADSIDE GALVANIZED STEEL GUARDRAILS */}
      {/* ======================================================== */}
      {guardrails.map((g, idx) => (
        <group key={`guard-${idx}`} position={g.pos} rotation={g.rot}>
          {/* Post */}
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[0.12, 0.9, 0.12]} />
            <meshStandardMaterial color={track.road.guardrailColor} metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Rail Beam */}
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[0.08, 0.35, 12.2]} />
            <meshStandardMaterial color={track.road.guardrailColor} metalness={0.85} roughness={0.25} />
          </mesh>
        </group>
      ))}

      {/* ======================================================== */}
      {/* GROUND TERRAIN UNDERLAY (Lush Grass, Beach, or Desert) */}
      {/* ======================================================== */}
      <mesh position={[0, -0.15, raceDistance * 0.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[180, raceDistance + 250]} />
        <meshStandardMaterial
          color={track.road.shoulderColor}
          roughness={0.92}
          metalness={0.08}
        />
      </mesh>

      {/* ======================================================== */}
      {/* WATER SURFACE (Ocean, Bay, or Lake) */}
      {/* ======================================================== */}
      {track.scenery.hasWater && (
        <mesh
          position={[0, track.scenery.waterElevation ?? -4.5, raceDistance * 0.5]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[450, raceDistance + 350]} />
          <meshPhysicalMaterial
            color={track.scenery.waterColor ?? '#0077B6'}
            roughness={0.08}
            metalness={0.2}
            clearcoat={1.0}
            clearcoatRoughness={0.08}
            transparent
            opacity={0.88}
          />
        </mesh>
      )}

      {/* ======================================================== */}
      {/* PROCEDURAL SCENERY TREES */}
      {/* ======================================================== */}
      {sceneryItems.trees.map((t, idx) => {
        if (track.scenery.treeType === 'palm') {
          return <PalmTree key={`tree-${idx}`} position={t.pos} scale={t.scale} />;
        }
        if (track.scenery.treeType === 'pine') {
          return <PineTree key={`tree-${idx}`} position={t.pos} scale={t.scale} />;
        }
        if (track.scenery.treeType === 'sakura') {
          return <SakuraTree key={`tree-${idx}`} position={t.pos} scale={t.scale} />;
        }
        return <PalmTree key={`tree-${idx}`} position={t.pos} scale={t.scale} />;
      })}

      {/* ======================================================== */}
      {/* CLEAN METROPOLIS TOWERS & CANYON FORMATIONS */}
      {/* ======================================================== */}
      {sceneryItems.buildings.map((b, idx) => (
        <CleanBuilding key={`bldg-${idx}`} position={b.pos} size={b.size} tint={b.tint} />
      ))}

      {sceneryItems.bluffs.map((bluff, idx) => (
        <CanyonBluff key={`bluff-${idx}`} position={bluff.pos} size={bluff.size} />
      ))}

      {/* ======================================================== */}
      {/* BRIDGE ARCHES & SUSPENSION TOWERS */}
      {/* ======================================================== */}
      {bridgePylons.map((p, idx) => (
        <group key={`pylon-${idx}`} position={p.pos} rotation={p.rot}>
          {/* Left Pylon Tower */}
          <mesh position={[-8.5, 4.0, 0]} castShadow>
            <boxGeometry args={[0.9, 14, 0.9]} />
            <meshStandardMaterial color="#FFFFFF" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Right Pylon Tower */}
          <mesh position={[8.5, 4.0, 0]} castShadow>
            <boxGeometry args={[0.9, 14, 0.9]} />
            <meshStandardMaterial color="#FFFFFF" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Crossbeam */}
          <mesh position={[0, 10.5, 0]}>
            <boxGeometry args={[18, 0.8, 0.8]} />
            <meshStandardMaterial color="#FFFFFF" metalness={0.8} />
          </mesh>
          {/* Foundation Pier Below Road */}
          <mesh position={[0, -3.0, 0]}>
            <boxGeometry args={[19, 6.0, 3.5]} />
            <meshStandardMaterial color="#475569" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* ======================================================== */}
      {/* START LINE GANTRY */}
      {/* ======================================================== */}
      <group position={startPos} rotation={startRot}>
        {/* Overhead Gantry Truss */}
        <mesh position={[0, 6.0, 0]} castShadow>
          <boxGeometry args={[18, 1.2, 1.2]} />
          <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Left Pylon */}
        <mesh position={[-8.8, 3.0, 0]}>
          <boxGeometry args={[0.8, 6.0, 0.8]} />
          <meshStandardMaterial color="#0F172A" metalness={0.9} />
        </mesh>
        {/* Right Pylon */}
        <mesh position={[8.8, 3.0, 0]}>
          <boxGeometry args={[0.8, 6.0, 0.8]} />
          <meshStandardMaterial color="#0F172A" metalness={0.9} />
        </mesh>
        {/* Start Signboard with Track Name */}
        <mesh position={[0, 6.0, 0.65]}>
          <planeGeometry args={[10, 0.9]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
        {/* Checkered Start Line Grid on Asphalt */}
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[track.road.width * 0.95, 1.6]} />
          {checkerTexture ? (
            <meshBasicMaterial map={checkerTexture} transparent opacity={0.95} />
          ) : (
            <meshBasicMaterial color="#FFFFFF" transparent opacity={0.95} />
          )}
        </mesh>

        {/* Starting Grid Box Outlines (Lanes) */}
        {[-3.0, 0, 3.0].map((laneOffset, i) => (
          <group key={`start-box-${i}`} position={[laneOffset, 0.035, -2.5 - i * 1.8]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[2.0, 3.8]} />
              <meshBasicMaterial color="#FFFFFF" transparent opacity={0.15} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ======================================================== */}
      {/* FINISH LINE VICTORY ARCH */}
      {/* ======================================================== */}
      <group position={finishPos} rotation={finishRot}>
        {/* Checkered Arch Beam */}
        <mesh position={[0, 6.2, 0]} castShadow>
          <boxGeometry args={[18.5, 1.5, 1.6]} />
          <meshStandardMaterial color="#DC2626" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Left Column */}
        <mesh position={[-8.8, 3.1, 0]}>
          <boxGeometry args={[1.0, 6.2, 1.0]} />
          <meshStandardMaterial color="#1E293B" metalness={0.8} />
        </mesh>
        {/* Right Column */}
        <mesh position={[8.8, 3.1, 0]}>
          <boxGeometry args={[1.0, 6.2, 1.0]} />
          <meshStandardMaterial color="#1E293B" metalness={0.8} />
        </mesh>
        {/* Checkered Finish Carpet Decal */}
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[track.road.width * 0.95, 3.2]} />
          {checkerTexture ? (
            <meshBasicMaterial map={checkerTexture} />
          ) : (
            <meshBasicMaterial color="#DC2626" />
          )}
        </mesh>
        {/* Finish Banner Board */}
        <mesh position={[0, 6.2, 0.85]}>
          <planeGeometry args={[12, 1.0]} />
          <meshBasicMaterial color="#F8FAFC" />
        </mesh>
      </group>
    </group>
  );
};
