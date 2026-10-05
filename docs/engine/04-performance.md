# 04 — Performance

## 1. Budget (60 FPS baseline → 16.67 ms per frame)

| Slice | Target (CPU) | Notes |
| ----- | ------------ | ----- |
| Engine frame (sim steps + interpolation + camera) | ≤ 1.0 ms | 2 × 120 Hz steps per 60 Hz frame |
| R3F `useFrame` subscribers (copy view → Object3D) | ≤ 0.5 ms | ~10 subscribers |
| `gl.render` submit | ≤ 4 ms | ≈ 20–40 draw calls |
| React during gameplay | 0 ms per frame | only on keystrokes (typing stream) / rare events |
| Headroom (GC, browser, compositor) | ≥ 10 ms | |

## 2. Hot-loop rules

* No `new`, `[]`, `{}`, closures, template strings, `Array.prototype.map/filter` in per-frame code.
* Module-level scratch objects (`const _v = new Vector3()`), `out` parameters everywhere.
* Typed arrays for buffers (`Float32Array` path LUT, `Float64Array` prev-state, ring buffers).
* Never `material.color.set('#hex')` per frame (string parse); precompute `Color`s and only write
  when the value changes.
* DOM HUD writes: only when the displayed value changes (`textContent` / `transform`).
* Events (`EventBus.emit`) are for discrete moments only — never per frame.

## 3. Instrumentation (`engine/perf/PerfMonitor.ts`)

* Ring buffer (`Float32Array(240)`) of frame intervals + CPU work (engine + render submit).
* Live: FPS (EMA), avg / p95 / max interval over the last second (sorted on a scratch copy at
  4 Hz, not per frame), count of long frames (> 25 ms), sim steps last frame.
* Renderer stats from `gl.info.render` (calls, triangles) and `gl.info.memory`.
* `PerfOverlay` (DOM, imperative 4 Hz updates): shown in dev builds, with `?perf`, or toggled by
  **F3**.

## 4. Adaptive quality (`engine/perf/QualityManager.ts`)

| Knob | High | Medium | Low |
| ---- | ---- | ------ | --- |
| DPR cap | min(dpr, 2) | min(dpr, 1.5) | 1 |
| Sun shadows | 2048² | 1024² | off (blob decals only) |
| Speed particles | 100 % | 60 % | 25 % |
| Detail layer (extra trees/props) | on | on | off |
| View distance × | 1.0 | 0.8 | 0.6 (+ thicker fog) |
| Prop shadow casting | on | off | off |

**Initial tier** (`deviceProfile.ts`): software renderers (`SwiftShader`, `llvmpipe`) or
≤ 2 cores / ≤ 2 GB → low; ≤ 4 cores, coarse pointer / mobile → medium; else high.
Overrides: settings `graphicsQuality` (`auto | high | medium | low`) and `?quality=`.

**Runtime policy** (only while racing, ignoring 2 s after load/tier change for warm-up):

* **Downgrade** when ≥ 25 % of frames in the last 2 s exceed 20 ms (below ~50 FPS) or the
  average exceeds 18.5 ms.
* **Upgrade** (only back toward the initial tier) after 12 s with p95 < 17.5 ms.
* If a tier is downgraded twice, it is **locked** for the session (no oscillation).
* Tier changes are events → R3F `QualityBinding` applies them (never per frame).

## 5. Verification

* Unit tests: fixed-step determinism under random frame pacing, interpolation continuity,
  path accuracy, camera lag ≈ 0 along travel, quality hysteresis.
* Browser run (Playwright + Chromium) of a full scripted race: no console errors,
  perf overlay numbers, draw-call count, React commit count during gameplay ≈ keystrokes only.
