// apps/web/src/engine/render/GeometryBatcher.ts
import * as THREE from 'three';

export interface BatchVertex {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
  r: number;
  g: number;
  b: number;
  u?: number;
  v?: number;
}

export class GeometryBatcher {
  private positions: number[] = [];
  private normals: number[] = [];
  private colors: number[] = [];
  private uvs: number[] = [];
  private indices: number[] = [];
  private vertexCount: number = 0;

  public clear(): void {
    this.positions.length = 0;
    this.normals.length = 0;
    this.colors.length = 0;
    this.uvs.length = 0;
    this.indices.length = 0;
    this.vertexCount = 0;
  }

  public get count(): number {
    return this.vertexCount;
  }

  /**
   * Appends an oriented 3D box primitive into the batch.
   */
  public addBox(
    center: [number, number, number],
    size: [number, number, number],
    rotation: [number, number, number] = [0, 0, 0],
    color: string | THREE.Color = '#FFFFFF'
  ): void {
    const c = typeof color === 'string' ? new THREE.Color(color) : color;
    const [cx, cy, cz] = center;
    const [sx, sy, sz] = [size[0] * 0.5, size[1] * 0.5, size[2] * 0.5];

    const rotMatrix = new THREE.Matrix4().makeRotationFromEuler(
      new THREE.Euler(rotation[0], rotation[1], rotation[2])
    );
    const transMatrix = new THREE.Matrix4().makeTranslation(cx, cy, cz);
    const matrix = transMatrix.multiply(rotMatrix);

    // 6 faces * 4 vertices = 24 vertices
    const faceNormals: [number, number, number][] = [
      [1, 0, 0], [-1, 0, 0],
      [0, 1, 0], [0, -1, 0],
      [0, 0, 1], [0, 0, -1],
    ];

    const faceQuads: [number, number, number][][] = [
      [[sx, -sy, -sz], [sx, sy, -sz], [sx, sy, sz], [sx, -sy, sz]],       // +X
      [[-sx, -sy, sz], [-sx, sy, sz], [-sx, sy, -sz], [-sx, -sy, -sz]],   // -X
      [[-sx, sy, -sz], [-sx, sy, sz], [sx, sy, sz], [sx, sy, -sz]],       // +Y
      [[-sx, -sy, sz], [-sx, -sy, -sz], [sx, -sy, -sz], [sx, -sy, sz]],   // -Y
      [[-sx, -sy, sz], [sx, -sy, sz], [sx, sy, sz], [-sx, sy, sz]],       // +Z
      [[sx, -sy, -sz], [-sx, -sy, -sz], [-sx, sy, -sz], [sx, sy, -sz]],   // -Z
    ];

    const v = new THREE.Vector3();
    const n = new THREE.Vector3();
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);

    for (let f = 0; f < 6; f++) {
      const fn = faceNormals[f];
      n.set(fn[0], fn[1], fn[2]).applyMatrix3(normalMatrix).normalize();
      const base = this.vertexCount;

      for (let p = 0; p < 4; p++) {
        const pt = faceQuads[f][p];
        v.set(pt[0], pt[1], pt[2]).applyMatrix4(matrix);

        this.positions.push(v.x, v.y, v.z);
        this.normals.push(n.x, n.y, n.z);
        this.colors.push(c.r, c.g, c.b);
        this.uvs.push(p === 0 || p === 3 ? 0 : 1, p < 2 ? 0 : 1);
      }

      this.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
      this.vertexCount += 4;
    }
  }

  /**
   * Appends an oriented cylinder/cone into the batch.
   */
  public addCylinder(
    center: [number, number, number],
    radiusTop: number,
    radiusBottom: number,
    height: number,
    radialSegments: number = 8,
    rotation: [number, number, number] = [0, 0, 0],
    color: string | THREE.Color = '#FFFFFF'
  ): void {
    const c = typeof color === 'string' ? new THREE.Color(color) : color;
    const rotMatrix = new THREE.Matrix4().makeRotationFromEuler(
      new THREE.Euler(rotation[0], rotation[1], rotation[2])
    );
    const matrix = new THREE.Matrix4().makeTranslation(center[0], center[1], center[2]).multiply(rotMatrix);
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);

    const halfH = height * 0.5;
    const v = new THREE.Vector3();
    const n = new THREE.Vector3();

    const startIdx = this.vertexCount;

    for (let i = 0; i <= radialSegments; i++) {
      const theta = (i / radialSegments) * Math.PI * 2;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      // Top vertex
      v.set(sinTheta * radiusTop, halfH, cosTheta * radiusTop).applyMatrix4(matrix);
      n.set(sinTheta, (radiusBottom - radiusTop) / height, cosTheta).applyMatrix3(normalMatrix).normalize();
      this.positions.push(v.x, v.y, v.z);
      this.normals.push(n.x, n.y, n.z);
      this.colors.push(c.r, c.g, c.b);
      this.uvs.push(i / radialSegments, 1);

      // Bottom vertex
      v.set(sinTheta * radiusBottom, -halfH, cosTheta * radiusBottom).applyMatrix4(matrix);
      this.positions.push(v.x, v.y, v.z);
      this.normals.push(n.x, n.y, n.z);
      this.colors.push(c.r, c.g, c.b);
      this.uvs.push(i / radialSegments, 0);
    }

    for (let i = 0; i < radialSegments; i++) {
      const top1 = startIdx + i * 2;
      const bot1 = top1 + 1;
      const top2 = top1 + 2;
      const bot2 = top1 + 3;

      this.indices.push(top1, bot1, top2);
      this.indices.push(bot1, bot2, top2);
    }

    this.vertexCount += (radialSegments + 1) * 2;
  }

  /**
   * Appends an oriented sphere into the batch.
   */
  public addSphere(
    center: [number, number, number],
    radius: number,
    widthSegments: number = 8,
    heightSegments: number = 6,
    color: string | THREE.Color = '#FFFFFF'
  ): void {
    const c = typeof color === 'string' ? new THREE.Color(color) : color;
    const [cx, cy, cz] = center;
    const startIdx = this.vertexCount;

    for (let y = 0; y <= heightSegments; y++) {
      const vLat = y / heightSegments;
      const theta = vLat * Math.PI;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let x = 0; x <= widthSegments; x++) {
        const uLon = x / widthSegments;
        const phi = uLon * Math.PI * 2;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const nx = -cosPhi * sinTheta;
        const ny = cosTheta;
        const nz = sinPhi * sinTheta;

        this.positions.push(cx + nx * radius, cy + ny * radius, cz + nz * radius);
        this.normals.push(nx, ny, nz);
        this.colors.push(c.r, c.g, c.b);
        this.uvs.push(uLon, vLat);
      }
    }

    for (let y = 0; y < heightSegments; y++) {
      for (let x = 0; x < widthSegments; x++) {
        const a = startIdx + y * (widthSegments + 1) + x;
        const b = startIdx + (y + 1) * (widthSegments + 1) + x;
        const cIdx = b + 1;
        const d = a + 1;

        this.indices.push(a, b, d);
        this.indices.push(b, cIdx, d);
      }
    }

    this.vertexCount += (heightSegments + 1) * (widthSegments + 1);
  }

  /**
   * Compiles the batch into an immutable, hardware-ready BufferGeometry.
   */
  public buildGeometry(): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry();
    if (this.positions.length === 0) return geo;

    geo.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(this.normals, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(this.uvs, 2));
    geo.setIndex(this.indices);
    geo.computeBoundingSphere();
    return geo;
  }
}
