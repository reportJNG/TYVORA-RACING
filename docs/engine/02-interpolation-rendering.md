# 02 — Interpolation & Rendering

## 1. Double-buffered sim state → interpolated view

The engine keeps, per entrant, preallocated `Float64Array`s `prevD / prevV / prevLat / prevAccel`.
Before every fixed step it copies the racer's current values into `prev*`; after the frame's steps:

```text
d     = prevD   + (racer.d   − prevD)   · alpha
v     = prevV   + (racer.v   − prevV)   · alpha
lat   = prevLat + (racer.lat − prevLat) · alpha
```

On `load()` and at GO, `prev = curr` (no interpolation across a reset/teleport).

`EngineView` (`apps/web/src/engine/view/EngineView.ts`) holds one preallocated `RacerView` per
entrant and one `CameraView`:

```ts
interface RacerView {
  d, v, accel, lat;                 // interpolated sim values
  x, y, z, yaw, slope, curvature;   // world pose from TrackPath
  speedKmh;
  bodyPitch, bodyRoll, bounce;      // spring-damped suspension
  wheelAngle;                       // integrated from interpolated speed
  brake;                            // 0..1 smoothed brake-light intensity
  proximity;                        // 0..1 closeness to player (ghost fade)
  visible;                          // inside the render window
}
```

R3F components read these numbers in `useFrame` and write them to `Object3D`s. No props change per
frame, so React never re-renders during gameplay.

## 2. Track path (`engine/track/TrackPath.ts`)

The Catmull-Rom design curve is resampled once per race into a **uniform arc-length lookup table**
(1 m spacing) stored in `Float32Array`s: position, unit tangent, signed curvature.

* `sample(d, lateral, out)` — O(1): index = `(d + pre) / 1 m`, linear blend of two samples,
  tangent renormalised, lateral offset along the right vector. Writes into a reusable `out` object.
* `d` is true metres along the road ⇒ visual speed == sim speed (fixes A7).
* Covers `[-120 m, D + 500 m]` so the camera behind the start line and the post-finish run-out
  are both on real road.
* Curvature is precomputed (from tangent change per metre) → body roll from lateral acceleration
  `v²·κ`, not from noisy per-frame differencing (fixes A8).
* Slope (`asin(tangent.y)`) pitches cars on bridges / dips.

## 3. Static world (`engine/track/TrackBuilder.ts` + `GeometryBatcher.ts`)

Built once per race, chunked along the track (150 m chunks), merged by material bucket:

| Bucket | Material | Contents |
| ------ | -------- | -------- |
| `road` | `MeshStandardMaterial` vertex colours, receive shadows | asphalt ribbon with subtle lane-wear tint, shoulders |
| `paint` | `MeshBasicMaterial` vertex colours | lane dashes, edge lines, checkered start/finish, banners, flood lights |
| `matte` | `MeshStandardMaterial` vertex colours | curbs (continuous red/white strip), posts, trees, bluffs, grandstands |
| `metal` | `MeshStandardMaterial` vertex colours, metalness | guardrail ribbons, gantries, pylons, towers |
| `detail` | same as matte | extra trees / props — hidden on lower quality tiers |

* `GeometryBatcher` appends transformed template primitives (box, cylinder, cone, sphere, ribbon
  quads) into growing typed arrays — no per-primitive `BufferGeometry` objects.
* Draw calls drop from **~3,000** to **≈ 4–5 per visible chunk** (≈ 15–25 total).
* Opponent lanes derive from road width (`laneSpacing = width / 3`), lane dashes at `±width/6`
  (fixes A12).

### Render only what is visible

* Each chunk is a group; a single `useFrame` toggles `group.visible` for chunks outside
  `[playerD − 120 m, playerD + viewDistance]`.
* `viewDistance` derives from fog density (distance where fog reaches 97 %) × tier multiplier;
  camera `far` is matched to it. Lower tiers also thicken fog so the cut is invisible.
* Three.js frustum culling still applies per chunk mesh (tight bounding spheres per chunk).
* Ghosts beyond the window or > 40 m behind the camera are hidden (`group.visible = false`).

## 4. R3F layer (`apps/web/src/components/scene/race/`)

| Component | Role |
| --------- | ---- |
| `EngineDriver` | `useFrame(-1000)`: `gameEngine.frame(now)` — runs before every other subscriber |
| `RenderDriver` | `useFrame(+1000)`: takes over rendering, `gl.render()` + CPU timing → `PerfMonitor` |
| `SceneAtmosphere` | background, fog, ambient/hemi lights, **sun rig that follows the player** |
| `TrackWorld` | chunk meshes, ground & water planes, visibility window |
| `RaceCar` | player (full materials, shadows) or ghost (shared translucent material) |
| `SpeedFx` | wind streaks + road dust, instance counts from quality tier |
| `CameraBinding` | applies `CameraView` to the R3F camera (position, lookAt, fov) |
| `QualityBinding` | applies tier: DPR, shadows, detail layer, view distance |
| `ShaderWarmup` | `gl.compile(scene, camera)` once assets resolve → no shader hitch at GO |
| `PerfOverlay` (DOM) | FPS / frame ms / draw calls / tier; F3 or `?perf` |

`RaceCanvas` itself only re-renders when a **new race** is loaded (`raceSeq` changes).

## 5. Assets

* All car GLBs are preloaded at module import (`useGLTF.preload`).
* Cars sit in a `<Suspense>` boundary; `EngineDriver` lives outside it so the loop never stalls.
* `ShaderWarmup` compiles every program during the countdown.
* Shared materials/geometries are created once per race and disposed on unload.
