# 03 — Camera & Visual FX

## 1. Camera rig (`engine/camera/CameraRig.ts`)

**Problem (A6):** position-lerp chase cameras lag by `v / k` metres. At 80 m/s and k = 8.5 that is
~9.4 m, and it changes every time the car accelerates — the car visibly "swims" on screen.

**Design:** the camera is *anchored* to the interpolated player position every frame; only
orientation and framing parameters are smoothed.

```text
yawS      = smoothDampAngle(yawS, playerYaw, yawVel, 0.18 s)     // swing through corners
dist      = damp(dist,   10.4 + 1.6·speed01 − kick, λ=4)
height    = damp(height,  6.6 + 0.9·speed01,        λ=4)
fov       = damp(fov,    46 + 7·speed01 (+boost),   λ=3)
kick      = spring(accel)  // ±0.7 m pull-back on throttle, push-in on brake / mistake
yS        = damp(yS, player.y, λ=10)                // soften bridge crests

camPos    = (player.x, yS, player.z) + R(yawS)·(lateral, height, −dist)
lookAt    = player + forward(yawS)·lookAhead + up·0.9
```

* Travel direction has **zero lag**, so the car stays pinned in frame at any speed.
* All damping is frame-rate independent (`1 − e^(−λ·dt)` / critically-damped smooth-damp).
* **Intro sweep** during countdown: orbit from a front-¾ hero angle to the chase view, eased by
  countdown progress — the transition is driven by the same engine timer as the countdown.
* **Shake**: short decaying offset on mistakes (respects `screenShake` / `reducedMotion`).
* High-speed micro-vibration scales with speed (disabled with `reducedMotion`).

## 2. Car animation (`engine/view/vehicleDynamics.ts`)

All targets are computed from interpolated sim values and smoothed with critically-damped springs
(state stored in `RacerView`, no per-frame allocation):

| Channel | Target | Notes |
| ------- | ------ | ----- |
| Body pitch | `−accel · 0.0024` (squat / dive) + brake dive on stall | clamped ±0.05 rad |
| Body roll | `−v²·κ · 0.0035` + lane-change lateral velocity | from path curvature, not differencing |
| Slope | `asin(tangent.y)` | applied to the outer group |
| Bounce | road vibration ∝ speed, tiny idle purr | disabled on `reducedMotion` |
| Wheels | `θ += v·dt / r` | from interpolated speed |
| Brake lights | smoothed 0..1 from stall / hard decel | material updated only when value changes |

## 3. Ghost racers

* One shared translucent material per ghost (`transparent`, `depthWrite: false`, emissive role
  colour). Opacity/emissive intensity updated from `proximity` — a single uniform write.
* No shadow casting, no tail-light logic, scene cloned **once** (fixes A4).
* Idle "life": tiny lateral wander `0.18·sin(d·0.011 + phase)` computed in the view from
  interpolated distance (smooth at any frame rate).
* Hidden when outside the render window.

## 4. Shadows

* Directional sun light + target **follow the player** every frame; the light offset keeps the
  track's sun direction. Shadow camera box ±28 m around the car.
* Position snapped to shadow-map texel size → no shimmering while moving.
* Only cars (and high-tier props) cast; the road only receives.
* Tier: high 2048², medium 1024², low off (soft blob shadow decal under cars always present).

## 5. Particles (`SpeedFx`)

* Wind streaks (instanced boxes, additive) and road dust (instanced low-poly spheres), positions
  in the player's track frame. Counts from tier (`InstancedMesh.count`).
* All buffers preallocated; deterministic pseudo-random respawn from a cheap LCG
  (no `Math.random` dependence for reproducible visuals).

## 6. Transitions

| Moment | Visual |
| ------ | ------ |
| Countdown 3-2-1 | Camera intro sweep (engine timer) |
| GO | Overlay "GO!" for 700 ms; camera reaches chase pose exactly at GO |
| Mistake | Car twitch (sim lateral impulse), brake lights, camera push-in + shake |
| Overtake | Rank change event → toast (React, low frequency) |
| Finish | Cars brake into the run-out (cooldown phase); overlay over a living scene |
