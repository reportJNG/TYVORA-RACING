// apps/web/src/engine/render/TrackWorldBuilder.ts
import * as THREE from 'three';
import { TrackPath, createEmptyTrackPose } from '../track/TrackPath.js';
import { GeometryBatcher } from './GeometryBatcher.js';

export interface WorldChunk {
  group: THREE.Group;
  startD: number;
  endD: number;
  centerZ: number;
  detailMesh?: THREE.Mesh;
}

export interface BuiltWorld {
  chunks: WorldChunk[];
  roadMaterial: THREE.MeshStandardMaterial;
  paintMaterial: THREE.MeshBasicMaterial;
  matteMaterial: THREE.MeshStandardMaterial;
  metalMaterial: THREE.MeshStandardMaterial;
  groundMesh: THREE.Mesh;
  waterMesh: THREE.Mesh | null;
  dispose: () => void;
}

const CHUNK_LENGTH_M = 150.0;

export function buildTrackWorld(path: TrackPath): BuiltWorld {
  const trackDef = path.trackDef;
  const raceDistance = path.raceDistance;
  const roadWidth = trackDef.road.width;

  // Shared hardware materials for all chunks (reused across all chunk geometries)
  const roadMaterial = new THREE.MeshStandardMaterial({
    color: trackDef.road.asphaltColor,
    roughness: 0.72,
    metalness: 0.18,
  });

  const paintMaterial = new THREE.MeshBasicMaterial({
    vertexColors: true,
  });

  const matteMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    metalness: 0.1,
  });

  const metalMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.25,
    metalness: 0.85,
  });

  const totalMinD = path.minD; // -120
  const totalMaxD = path.maxD; // raceDistance + 450
  const chunkCount = Math.ceil((totalMaxD - totalMinD) / CHUNK_LENGTH_M);

  const chunks: WorldChunk[] = [];
  const roadBatcher = new GeometryBatcher();
  const paintBatcher = new GeometryBatcher();
  const matteBatcher = new GeometryBatcher();
  const metalBatcher = new GeometryBatcher();
  const detailBatcher = new GeometryBatcher();

  const scratchPose1 = createEmptyTrackPose();
  const scratchPose2 = createEmptyTrackPose();

  const curbRed = new THREE.Color(trackDef.road.curbPrimary);
  const curbWhite = new THREE.Color(trackDef.road.curbSecondary);
  const laneColor = new THREE.Color(trackDef.road.laneMarkingColor);
  const guardColor = new THREE.Color(trackDef.road.guardrailColor);

  for (let c = 0; c < chunkCount; c++) {
    const chunkStartD = totalMinD + c * CHUNK_LENGTH_M;
    const chunkEndD = Math.min(totalMaxD, chunkStartD + CHUNK_LENGTH_M);

    roadBatcher.clear();
    paintBatcher.clear();
    matteBatcher.clear();
    metalBatcher.clear();
    detailBatcher.clear();

    const segCount = Math.ceil((chunkEndD - chunkStartD) / 3.0);
    const stepM = (chunkEndD - chunkStartD) / segCount;

    // 1. Asphalt Road Ribbon Quads
    for (let s = 0; s < segCount; s++) {
      const d1 = chunkStartD + s * stepM;
      const d2 = d1 + stepM;

      path.sample(d1, 0, scratchPose1);
      path.sample(d2, 0, scratchPose2);

      const halfW = roadWidth * 0.5;
      // Road segment box (ribbon with small vertical depth)
      const midPos: [number, number, number] = [
        (scratchPose1.x + scratchPose2.x) * 0.5,
        (scratchPose1.y + scratchPose2.y) * 0.5 - 0.05,
        (scratchPose1.z + scratchPose2.z) * 0.5,
      ];
      const segLen = Math.hypot(scratchPose2.x - scratchPose1.x, scratchPose2.z - scratchPose1.z);
      roadBatcher.addBox(midPos, [roadWidth, 0.1, segLen + 0.1], [scratchPose1.slope, scratchPose1.yaw, 0], '#242A36');

      // 2. Center dashed lane markings & solid outer edge lines
      // Dashes at ±3.6m (between Lane A & B, and Lane B & C)
      const isDash = Math.floor(d1 / 4.0) % 2 === 1;
      const laneOffsets = [-3.6, 3.6];

      if (isDash) {
        for (const lo of laneOffsets) {
          path.sample((d1 + d2) * 0.5, lo, scratchPose1);
          paintBatcher.addBox(
            [scratchPose1.x, scratchPose1.y + 0.02, scratchPose1.z],
            [0.18, 0.02, stepM * 0.95],
            [scratchPose1.slope, scratchPose1.yaw, 0],
            laneColor
          );
        }
      }

      // Solid edge stripes at outer edges (±halfW * 0.96)
      const edgeOffsets = [-halfW * 0.96, halfW * 0.96];
      for (const eo of edgeOffsets) {
        path.sample((d1 + d2) * 0.5, eo, scratchPose1);
        paintBatcher.addBox(
          [scratchPose1.x, scratchPose1.y + 0.02, scratchPose1.z],
          [0.2, 0.02, stepM + 0.05],
          [scratchPose1.slope, scratchPose1.yaw, 0],
          laneColor
        );
      }
    }

    // 3. Curb Rumble Strips (red/white alternating 3D rumble blocks)
    const curbStep = 3.5;
    const curbCount = Math.floor((chunkEndD - chunkStartD) / curbStep);
    for (let i = 0; i < curbCount; i++) {
      const d = chunkStartD + i * curbStep;
      path.sample(d, 0, scratchPose1);
      const isRed = Math.floor(d / curbStep) % 2 === 0;
      const color = isRed ? curbRed : curbWhite;

      // Left curb
      const leftW = roadWidth * 0.5 + 0.4;
      path.sample(d, leftW, scratchPose2);
      matteBatcher.addBox(
        [scratchPose2.x, scratchPose2.y + 0.05, scratchPose2.z],
        [0.7, 0.1, curbStep * 0.95],
        [scratchPose2.slope, scratchPose2.yaw, 0],
        color
      );

      // Right curb
      const rightW = -(roadWidth * 0.5 + 0.4);
      path.sample(d, rightW, scratchPose2);
      matteBatcher.addBox(
        [scratchPose2.x, scratchPose2.y + 0.05, scratchPose2.z],
        [0.7, 0.1, curbStep * 0.95],
        [scratchPose2.slope, scratchPose2.yaw, 0],
        color
      );
    }

    // 4. Guardrails (posts every 12m, continuous beams)
    const guardStep = 12.0;
    const guardCount = Math.floor((chunkEndD - chunkStartD) / guardStep);
    for (let i = 0; i < guardCount; i++) {
      const d = chunkStartD + i * guardStep;
      const guardW = roadWidth * 0.5 + 1.25;

      // Left post and beam
      path.sample(d, guardW, scratchPose1);
      metalBatcher.addBox(
        [scratchPose1.x, scratchPose1.y + 0.45, scratchPose1.z],
        [0.12, 0.9, 0.12],
        [0, scratchPose1.yaw, 0],
        guardColor
      );
      metalBatcher.addBox(
        [scratchPose1.x, scratchPose1.y + 0.7, scratchPose1.z],
        [0.08, 0.35, guardStep + 0.2],
        [scratchPose1.slope, scratchPose1.yaw, 0],
        guardColor
      );

      // Right post and beam
      path.sample(d, -guardW, scratchPose2);
      metalBatcher.addBox(
        [scratchPose2.x, scratchPose2.y + 0.45, scratchPose2.z],
        [0.12, 0.9, 0.12],
        [0, scratchPose2.yaw, 0],
        guardColor
      );
      metalBatcher.addBox(
        [scratchPose2.x, scratchPose2.y + 0.7, scratchPose2.z],
        [0.08, 0.35, guardStep + 0.2],
        [scratchPose2.slope, scratchPose2.yaw, 0],
        guardColor
      );
    }

    // 5. Scenery Props within this chunk (trees & buildings)
    const treeCount = Math.floor((trackDef.scenery.treeDensity / (raceDistance / CHUNK_LENGTH_M)) * 1.5);
    for (let i = 0; i < treeCount; i++) {
      const d = chunkStartD + (i + 0.5) * (CHUNK_LENGTH_M / Math.max(1, treeCount));
      const side = i % 2 === 0 ? 1 : -1;
      const dist = 14 + (i % 4) * 8;
      path.sample(d, side * dist, scratchPose1);

      // Tree trunk + canopy
      const trunkColor = '#5D4037';
      const leafColor = trackDef.scenery.treeType === 'sakura' ? '#F472B6' : '#2E7D32';

      if (i % 2 === 0) {
        // Base trees in matte batcher
        matteBatcher.addCylinder([scratchPose1.x, scratchPose1.y + 2.5, scratchPose1.z], 0.2, 0.35, 5.0, 6, [0, 0, 0], trunkColor);
        matteBatcher.addCylinder([scratchPose1.x, scratchPose1.y + 6.0, scratchPose1.z], 0.1, 2.2, 4.5, 6, [0, 0, 0], leafColor);
      } else {
        // Extra detail trees in detail batcher (hidden on low tier)
        detailBatcher.addCylinder([scratchPose1.x, scratchPose1.y + 2.5, scratchPose1.z], 0.2, 0.35, 5.0, 6, [0, 0, 0], trunkColor);
        detailBatcher.addCylinder([scratchPose1.x, scratchPose1.y + 6.0, scratchPose1.z], 0.1, 2.2, 4.5, 6, [0, 0, 0], leafColor);
      }
    }

    // 6. Checkered Start Line & Finish Line if this chunk contains them
    if (chunkStartD <= 0 && chunkEndD >= 0) {
      path.sample(0, 0, scratchPose1);
      // Start Line Grid
      paintBatcher.addBox([scratchPose1.x, scratchPose1.y + 0.03, scratchPose1.z], [roadWidth * 0.94, 0.02, 2.0], [0, scratchPose1.yaw, 0], '#FFFFFF');
      // Overhead start gantry truss
      metalBatcher.addBox([scratchPose1.x, scratchPose1.y + 6.2, scratchPose1.z], [roadWidth + 4.0, 1.2, 1.2], [0, scratchPose1.yaw, 0], '#0F172A');
      metalBatcher.addBox([scratchPose1.x + scratchPose1.normX * (roadWidth * 0.5 + 1.8), scratchPose1.y + 3.0, scratchPose1.z + scratchPose1.normZ * (roadWidth * 0.5 + 1.8)], [0.8, 6.0, 0.8], [0, 0, 0], '#0F172A');
      metalBatcher.addBox([scratchPose1.x - scratchPose1.normX * (roadWidth * 0.5 + 1.8), scratchPose1.y + 3.0, scratchPose1.z - scratchPose1.normZ * (roadWidth * 0.5 + 1.8)], [0.8, 6.0, 0.8], [0, 0, 0], '#0F172A');
    }

    if (chunkStartD <= raceDistance && chunkEndD >= raceDistance) {
      path.sample(raceDistance, 0, scratchPose1);
      // Finish Checkered Banner Carpet
      paintBatcher.addBox([scratchPose1.x, scratchPose1.y + 0.03, scratchPose1.z], [roadWidth * 0.94, 0.02, 3.2], [0, scratchPose1.yaw, 0], '#DC2626');
      // Finish line arch
      metalBatcher.addBox([scratchPose1.x, scratchPose1.y + 6.4, scratchPose1.z], [roadWidth + 4.5, 1.5, 1.5], [0, scratchPose1.yaw, 0], '#DC2626');
      metalBatcher.addBox([scratchPose1.x + scratchPose1.normX * (roadWidth * 0.5 + 2.0), scratchPose1.y + 3.2, scratchPose1.z + scratchPose1.normZ * (roadWidth * 0.5 + 2.0)], [0.9, 6.4, 0.9], [0, 0, 0], '#1E293B');
      metalBatcher.addBox([scratchPose1.x - scratchPose1.normX * (roadWidth * 0.5 + 2.0), scratchPose1.y + 3.2, scratchPose1.z - scratchPose1.normZ * (roadWidth * 0.5 + 2.0)], [0.9, 6.4, 0.9], [0, 0, 0], '#1E293B');
    }

    // Assemble chunk group
    const chunkGroup = new THREE.Group();
    chunkGroup.name = `chunk_${c}`;

    const roadGeo = roadBatcher.buildGeometry();
    if (roadBatcher.count > 0) {
      const roadMesh = new THREE.Mesh(roadGeo, roadMaterial);
      roadMesh.receiveShadow = true;
      chunkGroup.add(roadMesh);
    }

    const paintGeo = paintBatcher.buildGeometry();
    if (paintBatcher.count > 0) {
      const paintMesh = new THREE.Mesh(paintGeo, paintMaterial);
      chunkGroup.add(paintMesh);
    }

    const matteGeo = matteBatcher.buildGeometry();
    if (matteBatcher.count > 0) {
      const matteMesh = new THREE.Mesh(matteGeo, matteMaterial);
      matteMesh.receiveShadow = true;
      chunkGroup.add(matteMesh);
    }

    const metalGeo = metalBatcher.buildGeometry();
    if (metalBatcher.count > 0) {
      const metalMesh = new THREE.Mesh(metalGeo, metalMaterial);
      metalMesh.receiveShadow = true;
      chunkGroup.add(metalMesh);
    }

    let detailMesh: THREE.Mesh | undefined;
    const detailGeo = detailBatcher.buildGeometry();
    if (detailBatcher.count > 0) {
      detailMesh = new THREE.Mesh(detailGeo, matteMaterial);
      detailMesh.receiveShadow = true;
      chunkGroup.add(detailMesh);
    }

    path.sample((chunkStartD + chunkEndD) * 0.5, 0, scratchPose1);

    chunks.push({
      group: chunkGroup,
      startD: chunkStartD,
      endD: chunkEndD,
      centerZ: scratchPose1.z,
      detailMesh,
    });
  }

  // Large Ground Terrain Underlay
  const groundGeo = new THREE.PlaneGeometry(240, raceDistance + 600);
  const groundMat = new THREE.MeshStandardMaterial({
    color: trackDef.road.shoulderColor,
    roughness: 0.92,
    metalness: 0.08,
  });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.position.set(0, -0.18, (raceDistance + 300) * 0.5 - 100);
  groundMesh.rotation.set(-Math.PI / 2, 0, 0);
  groundMesh.receiveShadow = true;

  // Water Surface (if track has water)
  let waterMesh: THREE.Mesh | null = null;
  if (trackDef.scenery.hasWater) {
    const waterGeo = new THREE.PlaneGeometry(500, raceDistance + 700);
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: trackDef.scenery.waterColor ?? '#0077B6',
      roughness: 0.08,
      metalness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.88,
    });
    waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.set(0, trackDef.scenery.waterElevation ?? -4.5, (raceDistance + 300) * 0.5 - 100);
    waterMesh.rotation.set(-Math.PI / 2, 0, 0);
  }

  return {
    chunks,
    roadMaterial,
    paintMaterial,
    matteMaterial,
    metalMaterial,
    groundMesh,
    waterMesh,
    dispose: () => {
      chunks.forEach((chk) => {
        chk.group.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const m = obj as THREE.Mesh;
            m.geometry.dispose();
          }
        });
      });
      roadMaterial.dispose();
      paintMaterial.dispose();
      matteMaterial.dispose();
      metalMaterial.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      if (waterMesh) {
        waterMesh.geometry.dispose();
        (waterMesh.material as THREE.Material).dispose();
      }
    },
  };
}
