# 05 — Roadmap & Status

Legend: `[ ]` todo · `[/]` in progress · `[x]` done

## Phase 0 — Planning
- [x] Audit current pipeline (README §1)
- [x] Architecture, simulation, rendering, camera/FX, performance docs

## Phase 1 — Simulation core (`packages/sim`)
- [ ] `RacerSim` lateral state (`lat`, `latV`)
- [ ] Physics: progress coupling, hold-line braking curve, post-finish run-out, no teleport clamp
- [ ] `RaceSimulation`: AI script cursor, nearest-car slipstream, lateral dynamics, finish events
- [ ] `estimateFinishMs` deterministic fast-forward, `cloneTypingState`
- [ ] Tests: determinism, smooth hold-line, run-out stop, slipstream drift, overlap avoidance

## Phase 2 — Engine core (`apps/web/src/engine`)
- [ ] `FixedStepLoop`, `RaceClock`, `EventBus`, math helpers (damp, smoothDamp, angles)
- [ ] `TrackPath` arc-length LUT + track curve builder
- [ ] `EngineView` interpolation + `vehicleDynamics` springs
- [ ] `CameraRig` (anchored chase, intro sweep, kick, shake)
- [ ] `PerfMonitor`, `QualityManager`, `deviceProfile`
- [ ] `GameEngine` façade + singleton, phases, events, frame listeners
- [ ] Tests for all of the above

## Phase 3 — State integration
- [ ] `useRaceStore` → commands engine, no per-frame `set`, results via `estimateFinishMs`
- [ ] Countdown driven by engine events; GO flash
- [ ] Keystroke timestamps from `nowRaceMs(e.timeStamp)`
- [ ] Auto-pause on tab hidden
- [ ] Update store tests

## Phase 4 — Render layer
- [ ] `GeometryBatcher` + `TrackBuilder` (chunked merged world)
- [ ] `TrackWorld` with visibility window
- [ ] `RaceCar` (player + ghost), shared materials, refs only
- [ ] `SceneAtmosphere` + following sun rig
- [ ] `SpeedFx` (tiered instanced particles)
- [ ] `CameraBinding`, `QualityBinding`, `ShaderWarmup`, `EngineDriver`, `RenderDriver`
- [ ] Imperative HUD (speed readout, progress bar), rank via events
- [ ] `PerfOverlay` (F3 / `?perf` / dev)
- [ ] Remove obsolete `TrackMesh`, `GhostVehicle3D`, `PlayerFollowCamera`, `ChaseCamera`, `SpeedStreaks`

## Phase 5 — Verification
- [ ] `tsc` clean, all unit tests green, production build
- [ ] Browser race run (Playwright): no errors, perf numbers, draw calls, React commits
- [ ] Update this roadmap with measured results

## Acceptance criteria
1. Zero React re-renders per frame during racing (only keystroke / event-driven commits).
2. Simulation results identical under 30 / 60 / 144 Hz and jittery frame pacing.
3. Camera keeps the player at a constant screen position along travel (lag < 0.05 m at constant speed).
4. Draw calls during racing ≤ 60 (was ~3,000).
5. No allocations in the per-frame path (code review + rules in 04-performance.md).
6. FPS / frame time visible in development; quality degrades automatically on weak devices.
