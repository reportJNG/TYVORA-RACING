# Atomic Components Architecture Guide

**Project**: TYVORA-RACING  
**Module Directory**: `apps/web/src/components/race/`  
**Paradigm**: Atomic Domain Separation (Atoms, Molecules, Organisms)

---

## 1. Domain Directory Structure

```
apps/web/src/components/race/
├── maps/
│   ├── CircuitCard.tsx            # Circuit info card with conditions & click handler
│   ├── CircuitSelector.tsx        # Responsive grid/compact circuit selector
│   └── CircuitTelemetryBadge.tsx  # Telemetry status pill (name, location, time)
├── players/
│   ├── BotConfigSelector.tsx      # Bot count (1-4) & difficulty selector (Easy/Mid/Hard)
│   ├── RacerAvatarBadge.tsx       # Avatar badge with name, WPM, and position
│   └── OpponentStandingsCard.tsx  # Podium & standings breakdown list
├── cars/
│   ├── CarSpecBar.tsx             # Animated rating bar with differential (+/-) indicator
│   ├── CarSpecComparison.tsx      # Side-by-side spec comparison ("choose diff & buy")
│   ├── CarCardSelector.tsx        # Horizontal/grid vehicle thumbnail strip
│   ├── PaintStudio.tsx            # 11-shade metallic & clearcoat livery customizer
│   └── BuyCarButton.tsx           # Points purchase, balance verification, & equip button
├── animation/
│   ├── CountdownOverlay.tsx       # 3-2-1-GO starting lights animation overlay
│   ├── OvertakeFlash.tsx          # Dynamic overtake alert banner (+1 OVERTAKE // P2)
│   └── VictoryConfetti.tsx        # Confetti celebration trigger for wins
├── rounds/
│   ├── RoundIndicator.tsx         # Minimal multi-round badge (R1/3)
│   └── RoundCompleteOverlay.tsx   # Intermission modal between match heats
└── hud/
    ├── TypingHUD.tsx              # Main cockpit HUD (stream + speedometer + WPM)
    ├── TypingStream.tsx           # 5-word kinetic sliding stream
    ├── WordBlock.tsx              # Word block with per-char correctness styling
    ├── RaceProgressBar.tsx        # Top hairline race progress rail
    ├── PauseOverlay.tsx           # ESC pause modal
    └── RaceResultModal.tsx        # Match final results, stats, & action CTAs
```

---

## 2. Component Specifications

### 2.1 Maps Domain (`maps/`)
* **`CircuitCard`**: Renders scenery metadata (location, time-of-day, weather, difficulty). Compact mode is optimized for modals; expanded mode for `/race/maps`.
* **`CircuitSelector`**: Renders all 6 tracks:
  1. `pacific-coast` (Big Sur, Sunset, Coastal)
  2. `alpine-pass` (Swiss Alps, Morning, Alpine)
  3. `tokyo-bay` (Tokyo Bay, Night, City)
  4. `red-rock` (Red Rock Canyon, Afternoon, Canyon)
  5. `monaco-marina` (Monaco, Twilight, Marina)
  6. `sakura-valley` (Sakura Valley, Dusk, Sakura)

### 2.2 Players Domain (`players/`)
* **`BotConfigSelector`**: Allows granular customization of offline opponents. Sets `botCount` (1–4) and `difficulty` (`easy`, `normal`, `hard`) mapped to simulated WPM paces:
  - Easy: ~30 WPM
  - Mid (Normal): ~48 WPM
  - Hard: ~68 WPM
* **`OpponentStandingsCard`**: Displays live and final standings with winner trophy, 2nd/3rd medal badges, and exact finish times.

### 2.3 Cars Domain (`cars/`)
* **`CarSpecComparison`**: Implements the "choose diff and buy" UX requirement. Compares:
  - Top Speed (km/h) delta
  - 0–100 km/h acceleration delta
  - Handling rating (1–5 stars)
  - Body style & chassis category
* **`BuyCarButton`**:
  - If owned & equipped: Displays green "EQUIPPED & READY TO RACE" badge.
  - If owned but not equipped: "EQUIP CAR" CTA.
  - If locked & affordable: "BUY VEHICLE FOR X PTS" gradient button. Deducts points in SQLite WASM and saves to IndexedDB.
  - If locked & cannot afford: Displays points needed to unlock.
* **`PaintStudio`**: Updates vehicle livery in real time with 11 custom formulations (Pearl White, Nardo Grey, Liquid Silver, Apex Red, Miami Blue, Acid Green, Solar Yellow, Sunset Bronze, British Green, Royal Violet, Obsidian Black).

### 2.4 Animations Domain (`animation/`)
* **`OvertakeFlash`**: Floating HUD banner rendered whenever player rank advances during active racing.
* **`VictoryConfetti`**: High-density canvas confetti blast triggered on match win or new vehicle unlock.

### 2.5 Rounds Domain (`rounds/`)
* **`RoundIndicator`**: Shows current round vs total rounds (e.g. `R1/3`).
* **`RoundCompleteOverlay`**: Shown after round 1 and 2, displaying round standings, WPM, and accuracy before countdown into the next heat.

---

## 3. Performance Guarantees
* **Keystroke Latency**: Typing input capture is decoupled from Three.js scene updates, guaranteeing sub-millisecond input response.
* **Component Memoization**: Heavy overlays and telemetry pods use `React.memo` to eliminate redundant reconciliation during racing.
* **Zero Context Leaks**: Canvases unmount cleanly on navigation between `/race`, `/race/garage`, `/race/maps`, and `/race/playing`.
