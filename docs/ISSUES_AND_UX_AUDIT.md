# Comprehensive Audit: Application Architecture, Routing, UX & Component Performance

**Project**: TYVORA-RACING (React 18 + Three.js / R3F + Zustand + SQLite WASM)  
**Date**: October 2026  
**Status**: Goal 1 Audit Complete — Proceeding to Goal 2 Implementation

---

## 1. Executive Summary

This audit assesses the current state of the application architecture, user experience, component hierarchy, client-side routing, and state persistence. The application features a 60 FPS WebGL 3D racing simulator and typing engine, but suffers from architectural bottlenecks, monolithic screens, missing sub-routes, lack of atomic modularization, and incomplete garage purchasing workflows.

This document catalogs **all discovered issues**, their root causes, system impact, and exact implementation specifications to resolve them.

---

## 2. Listing of Discovered Issues

### Issue 1: Monolithic Screen State & Absence of Real Client-Side Routing
* **Location**: [`apps/web/src/App.tsx`](file:///home/sky/Work/gamevibe/carstyping/apps/web/src/App.tsx), [`apps/web/src/components/screens/RaceScreen.tsx`](file:///home/sky/Work/gamevibe/carstyping/apps/web/src/components/screens/RaceScreen.tsx)
* **Root Cause**: The application relies on custom `window.history.pushState` and a coarse flat union type `'home' | 'race' | 'leaderboard' | 'profile' | 'settings' | 'landing'`. It lacks true nested and parameterized routing (`react-router-dom`).
* **Symptom / Impact**:
  - URLs like `/race/garage`, `/race/playing`, and `/race/playing/:id` cannot be natively routed or deep-linked.
  - Browser Back and Forward buttons trigger full manual `popstate` re-evaluations without route guards or lifecycle management.
  - State does not naturally follow the user's location in the app.

---

### Issue 2: Entangled Pre-Race Hangar and Active Gameplay Monolith
* **Location**: [`apps/web/src/components/screens/RaceScreen.tsx`](file:///home/sky/Work/gamevibe/carstyping/apps/web/src/components/screens/RaceScreen.tsx)
* **Root Cause**: A single 610-line file handles both `status === 'idle'` (vehicle showroom, AI bot config modal, track selection) and `status !== 'idle'` (high-speed 3D WebGL racetrack, real-time typing loop, live clock, overtake flashes, overlays, and modals).
* **Symptom / Impact**:
  - Two completely separate 3D WebGL canvases (`ShowroomCanvas` and `RaceCanvas`) exist inside conditional branches of the same component, increasing risk of canvas context retention and memory spikes.
  - State updates during active racing trigger re-evaluation of unused showroom hooks and references.
  - Difficult to test, maintain, and profile independently.

---

### Issue 3: Missing Dedicated Garage & Vehicle Spec Comparison Page (`/race/garage`)
* **Location**: [`apps/web/src/components/screens/CarSelectScreen.tsx`](file:///home/sky/Work/gamevibe/carstyping/apps/web/src/components/screens/CarSelectScreen.tsx), [`apps/web/src/components/screens/RaceScreen.tsx`](file:///home/sky/Work/gamevibe/carstyping/apps/web/src/components/screens/RaceScreen.tsx)
* **Root Cause**: Vehicle customization, livery painting, and car specs are crammed into cramped bottom strips or older legacy screens without a dedicated showroom experience.
* **Symptom / Impact**:
  - Players cannot easily inspect side-by-side vehicle differentials (Top Speed, Acceleration, Handling, Weight, Stability).
  - Lack of a dedicated purchasing experience: Players cannot directly unlock/buy locked vehicles using their accumulated race points or currency.

---

### Issue 4: Missing Dedicated Active Race Playing Pages (`/race/playing` & `/race/playing/:id`)
* **Location**: [`apps/web/src/components/screens/RaceScreen.tsx`](file:///home/sky/Work/gamevibe/carstyping/apps/web/src/components/screens/RaceScreen.tsx), [`apps/web/src/components/screens/OnlineModal.tsx`](file:///home/sky/Work/gamevibe/carstyping/apps/web/src/components/screens/OnlineModal.tsx)
* **Root Cause**: Active racing lacks dedicated standalone pages. Offline play and online multiplayer racing share the same unparameterized screen.
* **Symptom / Impact**:
  - Offline play (`/race/playing`): Cannot be launched cleanly with explicit bot count, AI difficulty, and map params.
  - Online play (`/race/playing/:id`): Online matchmaking modal has an infinite spinner without room ID creation or transition to an active multiplayer session.

---

### Issue 5: Missing Explicit Car Purchase / Unlock Workflow in Garage
* **Location**: [`apps/web/src/db/sqlite.ts`](file:///home/sky/Work/gamevibe/carstyping/apps/web/src/db/sqlite.ts), [`apps/web/src/stores/useAuthStore.ts`](file:///home/sky/Work/gamevibe/carstyping/apps/web/src/stores/useAuthStore.ts)
* **Root Cause**: `sqliteService` only offered automatic unlock when `totalPoints` crossed a car's unlock requirement during `recordRace()`. There was no explicit method `buyCar(userId, carId)` to let users spend points or unlock cars directly inside the Garage.
* **Symptom / Impact**:
  - Users viewing locked cars in the Garage had no interactive button to "Buy / Unlock Car" with their balance.
  - No transactional safety ensuring points deduction and persistence to in-browser SQLite WASM and IndexedDB.

---

### Issue 6: Non-Atomic Component Organization Across Race Features
* **Location**: `apps/web/src/components/race/`
* **Root Cause**: Sub-features (circuit maps, player bots, cars, animation effects, round management, and HUD instruments) are mixed in single flat folders or embedded directly in screen code.
* **Symptom / Impact**:
  - Lacks clean atomic structure: Atoms (badges, gauges, swatches), Molecules (stat cards, bot pills, round indicators), Organisms (circuit selector, showroom turntable, typing HUD), and Templates/Pages.
  - Difficult to reuse components across `/race`, `/race/garage`, and `/race/playing`.

---

### Issue 7: Keystroke Latency & Re-render Cascades
* **Location**: [`apps/web/src/components/race/TypingHUD.tsx`](file:///home/sky/Work/gamevibe/carstyping/apps/web/src/components/race/TypingHUD.tsx), [`apps/web/src/stores/useTypingStore.ts`](file:///home/sky/Work/gamevibe/carstyping/apps/web/src/stores/useTypingStore.ts)
* **Root Cause**: Subscriptions in `TypingHUD` listen to changes in typing snapshots, which can trigger React reconciliation of sibling telemetry elements on every keystroke.
* **Symptom / Impact**:
  - At high typing speeds (100+ WPM), redundant component render cycles consume JS thread time that should belong to the 60 FPS WebGL simulation loop.

---

### Issue 8: WebGL Context Lifecycle & Memory Leaks on Navigation
* **Location**: [`apps/web/src/components/scene/ShowroomCanvas.tsx`](file:///home/sky/Work/gamevibe/carstyping/apps/web/src/components/scene/ShowroomCanvas.tsx), [`apps/web/src/components/scene/RaceCanvas.tsx`](file:///home/sky/Work/gamevibe/carstyping/apps/web/src/components/scene/RaceCanvas.tsx)
* **Root Cause**: Unmounting and mounting R3F Canvases between rapid route changes can leave Three.js textures, geometries, or animation frame loops running if cleanup handlers are not strictly paired.
* **Symptom / Impact**:
  - Risk of "Too many active WebGL contexts" browser warning.

---

## 3. Architecture Blueprint for Goal 2

```
                                  [react-router-dom]
                                           |
     +-------------------+-----------------+-------------------+-------------------+
     |                   |                                     |                   |
   ["/"]              ["/race"]                          ["/leaderboard"]    ["/profile"]
 HomeScreen      RaceModeSelectScreen                    LeaderboardScreen   ProfileScreen
(Cinematic 3D)  (Offline vs Online Hub)
                         |
        +----------------+----------------+
        |                                 |
 ["/race/garage"]                ["/race/playing"]
  GarageScreen                   RacePlayingScreen (Offline: Solo vs Bots)
  - 3D Showroom Turntable        - 3D RaceCanvas
  - Spec Differentials           - Live TypingHUD & Stream
  - Buy/Unlock Cars with PTS     - Rounds (1-3), Countdown, Results
  - Livery Paint Studio                   |
                                 ["/race/playing/:id"]
                                 RacePlayingScreen (Online: Room/Lobby ID)
                                 - Live Match Sync & Telemetry
```

### Atomic Directory Structure:
```
apps/web/src/components/race/
├── maps/
│   ├── CircuitCard.tsx
│   ├── CircuitSelector.tsx
│   └── CircuitTelemetryBadge.tsx
├── players/
│   ├── BotConfigSelector.tsx
│   ├── RacerAvatarBadge.tsx
│   └── OpponentStandingsCard.tsx
├── cars/
│   ├── CarSpecBar.tsx
│   ├── CarSpecComparison.tsx
│   ├── CarCardSelector.tsx
│   └── PaintStudio.tsx
├── animation/
│   ├── CountdownOverlay.tsx
│   ├── OvertakeFlash.tsx
│   └── VictoryConfetti.tsx
├── rounds/
│   ├── RoundIndicator.tsx
│   └── RoundCompleteOverlay.tsx
└── hud/
    ├── TypingHUD.tsx
    ├── TypingStream.tsx
    ├── WordBlock.tsx
    ├── SpeedGauge.tsx
    └── RaceProgressBar.tsx
```

---

## 4. Implementation Checklist for Goal 2

1. [x] Audit all architectural and UX issues in `docs/ISSUES_AND_UX_AUDIT.md`.
2. [ ] Install and configure `react-router-dom` in `apps/web`.
3. [ ] Build Atomic Race Components (`maps/`, `players/`, `cars/`, `animation/`, `rounds/`, `hud/`).
4. [ ] Enhance SQLite Service & Auth Store for direct car purchasing (`buyCar`).
5. [ ] Implement `/race` (`RaceModeSelectScreen`): Clean mode picker (Solo Offline customizer vs Online Match search) + entry to Garage.
6. [ ] Implement `/race/garage` (`GarageScreen`): 3D Turntable, spec comparison, paint customizer, buy/unlock with balance.
7. [ ] Implement `/race/playing` and `/race/playing/:id` (`RacePlayingScreen`): Decoupled 3D gameplay, countdown, typing stream, multi-round progression, and online room support.
8. [ ] Update Navigation Header and global routing integration in `App.tsx`.
9. [ ] Run full test suite (`npm test`) and production build (`npm run build`).
10. [ ] Commit every feature incrementally with clear git commits.
