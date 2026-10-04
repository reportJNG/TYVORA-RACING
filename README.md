# TypeRace — Complete Architecture, Engine & Game System Guide

> **"Type fast. Drive fast. Recover from mistakes. Win."**

TypeRace is a high-velocity, arcade browser typing racing game built as a modern TypeScript monorepo. Keyboard keystrokes directly drive vehicle throttle, acceleration, and top speed in a real-time 3D Three.js environment.

---

## 1. What We Have Built (Current Architecture)

TypeRace is structured as a clean, modular monorepo with three coordinated workspaces:

```text
carstyping/
├── packages/
│   └── sim/                     # Pure, deterministic game engine & simulation (Zero dependencies)
│       ├── src/
│       │   ├── constants.ts     # Physics constants, vehicle specs, tuning parameters
│       │   ├── typing.ts        # Independent character evaluation, WPM & accuracy mathematics
│       │   ├── physics.ts       # 120Hz fixed timestep integration, Never-Stop speed model
│       │   ├── ai.ts            # Realistic human typing cadence & AI opponents (Rival & Pacer)
│       │   ├── rng.ts           # Mulberry32 deterministic seeded random number generator
│       │   └── index.ts         # Public exports & simulation contracts
│       └── test/                # 11 Vitest unit tests covering typing, physics & AI
│
├── apps/
│   ├── web/                     # High-performance React 19 + Three.js / React Three Fiber client
│   │   ├── src/
│   │   │   ├── audio/           # Procedural Web Audio API sound synthesizer
│   │   │   │   └── AudioEngine.ts
│   │   │   ├── components/
│   │   │   │   ├── common/      # Atomic UI primitives (Button, Modal, Avatar, Stars)
│   │   │   │   ├── layout/      # Global navigation Header & Footer
│   │   │   │   ├── scene/       # 3D Three.js canvas, vehicles, spline tracks, camera
│   │   │   │   │   ├── Vehicle3D.tsx       # Automotive PBR cars (body, rotating wheels, underglow)
│   │   │   │   │   ├── TrackMesh.tsx       # Catmull-Rom asphalt spline & modular world sectors
│   │   │   │   │   ├── ChaseCamera.tsx     # Zero-GC dynamic FOV camera follower
│   │   │   │   │   ├── SpeedStreaks.tsx    # Velocity light streaks & warp particles
│   │   │   │   │   ├── ShowroomCanvas.tsx  # 3D vehicle inspection showroom
│   │   │   │   │   └── RaceCanvas.tsx      # Main decoupled WebGL race canvas
│   │   │   │   ├── race/        # In-race cockpit instruments & overlays
│   │   │   │   │   ├── TypingHUD.tsx            # Integrated cockpit instrument & telemetry
│   │   │   │   │   ├── RaceProgressBar.tsx      # Streamlined track rail & racer progress
│   │   │   │   │   ├── CountdownOverlay.tsx     # 3-2-1-GO & round start overlay
│   │   │   │   │   ├── RoundCompleteOverlay.tsx # Seamless 1.8s inter-round interstitial
│   │   │   │   │   ├── PauseOverlay.tsx         # Escape pause modal
│   │   │   │   │   └── RaceResultModal.tsx      # Aggregated 3-round match results modal
│   │   │   │   └── screens/     # Full application screens
│   │   │   │       ├── HomeScreen.tsx           # Showroom centerpiece, PLAY & ONLINE locked
│   │   │   │       ├── CarSelectScreen.tsx      # Vehicle & circuit selector with custom liveries
│   │   │   │       ├── RaceScreen.tsx           # 3-Round championship race lifecycle
│   │   │   │       ├── LeaderboardScreen.tsx    # Global racer win rankings
│   │   │   │       ├── ProfileScreen.tsx        # Career statistics & performance records
│   │   │   │       ├── SettingsScreen.tsx       # Audio bus sliders, themes, accessibility
│   │   │   │       ├── OnlineModal.tsx          # "COMING SOON" locked multiplayer preview
│   │   │   │       ├── AuthModal.tsx            # Guest signin & account creation
│   │   │   │       └── LegalModal.tsx           # Terms, privacy & engineering credits
│   │   │   ├── data/            # Tuned car specs, curated passages, tracks, leaderboard
│   │   │   └── stores/          # Zustand domain stores (race, typing, settings, auth)
│   │   └── test/                # 6 Web store & 3-round match lifecycle unit tests
│   │
│   └── api/                     # Node.js + Express backend with authoritative anti-cheat verification
│       ├── src/
│       │   └── server.ts        # REST endpoints, auth, sessions, rankings, replay validator
│       └── test/                # 5 API integration & bot-rejection test cases
│
└── package.json                 # Monorepo workspaces & build orchestration
```

---

## 2. What We Are Doing (Mission & Design Target)

We have rebuilt TypeRace from the ground up to solve the core frustrations of web typing games:

1. **Eliminate Typing Cascade Failures:** An error at one character position does not invalidate subsequent characters.
2. **Natural Non-Punitive Backspace Recovery:** Erasing mistakes steps backward cleanly without creating additional mistake penalties.
3. **The "Never Stop" Car Movement Rule:** During an active race, cars **always move continuously**. Typing mistakes slow the car down dynamically, but never freeze it to a standstill.
4. **Direct Speed-to-Typing Connection:** Speed is governed continuously by typing cadence ($WPM$) and streak consistency. Fast typing accelerates the car immediately; mistakes drop RPM and speed; recovering typing momentum restores full top speed.
5. **Addictive 3-Round Match Structure:** Races are structured into fast 3-round matches spanning approximately **2 to 3 minutes total**.
6. **Cockpit Race-Instrument Layout:** The 3D world is the hero. The typing interface and telemetry are integrated into a sleek, minimal cockpit instrument rather than clunky floating cards.
7. **Production Performance Bar:** 100% test pass rate across sim, api, and web, with zero-allocation render loops and decoupled React state updates.

---

## 3. How We Are Designing Stuff (Cockpit UX & Design System)

### 3.1 Visual Hierarchy & HUD Priority
The 3D racing world is the hero. The player needs to instantly absorb typing cues, opponent positions, and vehicle speed without visual clutter:

```text
┌────────────────────────────────────────────────────────┐
│  ROUND 1 / 3         POSITION 1 / 3            00:18   │
│                                                        │
│                                                        │
│                    3D RACING SCENE                     │
│                                                        │
│                       🚗 PLAYER                        │
│             🚗 Rival              🚗 Pacer             │
│                                                        │
│                                                        │
│         ─────────────────────────────────────          │
│         RHYTHM IS YOUR THROTTLE ACCURACY IS            │
│         ─────────────────────────────────────          │
│                                                        │
│         184 KM/H · GEAR 5        94 WPM · 99% ACC      │
│         [==== 62% RACE PROGRESS =================]     │
└────────────────────────────────────────────────────────┘
```

1. **Typing Stream (Primary Focus):** Crisp monospace text with high-contrast character states:
   - `Pending (0)`: Faint muted grey (`#475569`).
   - `Correct (1)`: High-contrast crisp white (`#F8FAFC`).
   - `Mistake (2)`: Soft ruby red with underline (`#EF4444`, `bg-danger/25`).
   - `Current (3)`: Active glowing orange caret pill with subtle drop shadow.
2. **3D World & Cars:** Clear, unobstructed middle viewport showing road curvature, opponent cars, and environmental lighting.
3. **Telemetry Strip (Cockpit Instrument):** Integrated directly at the bottom of the typing panel:
   - Left: Digital speedometer ($KM/H$) and transmission gear indicator ($1\text{--}6$).
   - Center: Streak milestone badge (`STREAK ×14 · +9% BOOST`) or mistake correction alert (`PRESS BACKSPACE TO FIX`).
   - Right: Live $WPM$ and accuracy percentage ($ACC$).
4. **Top Information Rail:**
   - Left: `ESC // PAUSE` and circuit name badge.
   - Center: Track progress bar showing Player, Rival, and Pacer positions advancing to the checkered flag.
   - Right: Active round pill (`ROUND 1 / 3`).

### 3.2 Visual Tokens & Theme
- **Background / Scene:** Deep racing obsidian (`#0A0D12`).
- **Surface / Instrument:** Translucent glassmorphism (`rgba(18, 22, 31, 0.85)`).
- **Brand Accent:** Ignition Orange (`#FF551C`).
- **Hyper Accent:** Neon Cyan (`#00F2FE`).
- **Deceleration / Error Alert:** Ruby Red (`#EF4444`).
- **Victory / Flawless:** Emerald Green (`#10B981`).
- **Typography:** `Rajdhani` (Headers & Display), `Inter` (UI elements), `JetBrains Mono` (Typing stream & telemetry).

### 3.3 Procedural Web Audio Engine
The audio engine synthesizes all sounds in real-time using the Web Audio API without requiring any external audio files:
- **Mechanical Keystroke Clicks:** 12ms bandpassed white-noise transient paired with a decaying triangle wave key bottom-out clack.
- **Engine Synthesizer:** Dual oscillators (sawtooth harmonic + sub-bass triangle) routed through a resonant lowpass filter with cutoff mapped directly to car speed.
- **Mistake Engine Bog-Down:** Instant filter dampening and RPM pitch drop upon an incorrect keystroke.
- **Milestone Chimes:** Sparkling ascending harmonic powerup chords every 10 consecutive flawless keystrokes.
- **Cinematic Chimes:** 3-2-1 countdown beeps, high-octave GO chime, victory fanfare, and loss sounds.

---

## 4. How the Engine Works (Technical Architecture)

### 4.1 Independent Character Evaluation Model
The typing engine in [`packages/sim/src/typing.ts`](file:///home/sky/Work/gamevibe/carstyping/packages/sim/src/typing.ts) judges each position independently:
- Given target string $T$ and typed buffer $B$, position $i$ evaluates as:
  $$\text{State}[i] = \begin{cases} \text{Correct } (1) & \text{if } B[i] = T[i] \\ \text{Mistake } (2) & \text{if } B[i] \ne T[i] \end{cases}$$
- For example, if target is `HELLO` and player types `HELOO`:
  - Index 0: `'H' == 'H'` $\rightarrow$ Correct ($\checkmark$)
  - Index 1: `'E' == 'E'` $\rightarrow$ Correct ($\checkmark$)
  - Index 2: `'L' == 'L'` $\rightarrow$ Correct ($\checkmark$)
  - Index 3: `'O' != 'L'` $\rightarrow$ Mistake ($\times$)
  - Index 4: `'O' == 'O'` $\rightarrow$ Correct ($\checkmark$)
- The error at position 3 **never** causes a cascade failure for subsequent keys.

### 4.2 Non-Punitive Backspace Recovery
- Pressing `Backspace` removes the character at cursor $K - 1$.
- If the removed character was an error, the active error count $W$ decreases.
- Backspace is classified strictly as a **navigation/correction event** — it never increments the mistake counter.
- `Ctrl+Backspace` (or `Alt+Backspace`) steps backwards word by word.
- Race completion requires $K = \text{target.length}$ and zero remaining errors ($W = 0$).

### 4.3 120Hz Fixed Timestep Simulation & Physics Integration
To guarantee deterministic physics across all monitor refresh rates (60Hz, 120Hz, 240Hz), simulation steps on a fixed timestep:
$$\Delta t = \frac{1}{120}\text{ s} \approx 8.333\text{ ms}$$

### 4.4 The "Never Stop" Physics Rule
In [`packages/sim/src/physics.ts`](file:///home/sky/Work/gamevibe/carstyping/packages/sim/src/physics.ts), vehicles maintain a guaranteed minimum cruising speed during active racing:
$$v_{\min} = 11.11\text{ m/s} \approx 40\text{ km/h}$$
$$v(t) \ge v_{\min}$$

### 4.5 Velocity & Throttle Mapping
Desired vehicle speed $v_{\text{des}}$ balances typing pace, streak bonus, and top speed:
$$v_{\text{pace}} = v_{\min} + (v_{\max} - v_{\min}) \times \min\left(1.0, \frac{\text{burstWpm}}{110}\right)$$
$$v_{\text{des}} = \min\left(v_{\max}, v_{\text{pace}} \times (1 + \text{streakBonus})\right)$$

- **Streak Acceleration Boost:**
  $$M_{\text{streak}} = 1.0 + \min\left(0.30, \left\lfloor\frac{\text{streak}}{5}\right\rfloor \times 0.03\right)$$
  *(Flawless streaks grant up to $+30\%$ additional acceleration and velocity).*

- **Mistake Deceleration & Stall:**
  On an incorrect keystroke, vehicle speed drops immediately by $\sim 35\%$ (scaled by vehicle spec):
  $$v \longleftarrow \max\left(v_{\min}, v \times (1 - \text{loss})\right)$$
  Acceleration is halved for $600\text{ms}$ ($\text{stallUntilMs} = t + 600$), ruby taillights flare, and engine audio bogs down.

- **Speed Integration:**
  $$dv = v_{\text{des}} - v$$
  $$\text{if } dv > 0: \quad v \longleftarrow v + \min(dv, a_{\max} \cdot \Delta t)$$
  $$\text{if } dv < 0: \quad v \longleftarrow v + \max(dv, -d_{\text{brake}} \cdot \Delta t)$$
  $$v \longleftarrow \max(v_{\min}, v)$$
  $$d \longleftarrow d + v \cdot \Delta t$$

- **Finish Detection:** Once the text is complete without errors, crossing $d \ge D_{\text{total}}$ triggers the finish line with sub-tick interpolation:
  $$t_{\text{finish}} = t - \frac{d - D_{\text{total}}}{v} \times 1000\text{ ms}$$

### 4.6 Humanized AI Opponents
AI competitors (`Rival` in Lane A and `Pacer` in Lane C) are generated by [`packages/sim/src/ai.ts`](file:///home/sky/Work/gamevibe/carstyping/packages/sim/src/ai.ts):
- Log-normal keystroke intervals matching target $WPM$ profiles.
- Human reaction delays ($180\text{--}380\text{ms}$) after countdown GO.
- QWERTY physical neighbor key mistypes (e.g. typing `'w'` instead of `'e'`).
- Realistic mistake reaction delay ($180\text{--}420\text{ms}$) followed by Backspace and correct key.
- Word-boundary cadence variations and occasional hesitation.

### 4.7 Authoritative Headless Anti-Cheat Verification
The backend server in [`apps/api/src/server.ts`](file:///home/sky/Work/gamevibe/carstyping/apps/api/src/server.ts) validates race submissions:
1. Client submits an immutable keystroke ledger: `[ [timestampMs, characterOrAction], ... ]`.
2. Server executes `@typerace/sim` in a sandbox, simulating every keystroke and physics tick.
3. Calculates official finish time, $WPM$, and accuracy on the server.
4. **Bot Rejection:** Rejects any race containing consecutive keystroke latencies $< 15\text{ms}$ or sustained speeds $> 225\text{ WPM}$ (`400 Bad Request`).

---

## 5. How the Game Works (Gameplay & Match Lifecycle)

### 5.1 Fast 3-Round Match Structure
A complete match consists of 3 distinct, rapid rounds completed in roughly **2 to 3 minutes**:

```text
       ┌───────────┐
       │ ROUND 1/3 │  Warmup Sprint (~90–110 chars, 20–35s)
       └─────┬─────┘
             │ 1.8s Seamless Interstitial
       ┌─────▼─────┐
       │ ROUND 2/3 │  Rhythm & Pace (~115–130 chars, 30–45s)
       └─────┬─────┘
             │ 1.8s Seamless Interstitial
       ┌─────▼─────┐
       │ ROUND 3/3 │  High-Velocity Climax (~130–160 chars, 35–50s)
       └─────┬─────┘
             │ All Rounds Complete
       ┌─────▼──────┐
       │   MATCH    │  Championship Results & Career Progression
       │  RESULTS   │  Primary Action: RACE AGAIN (Instant Restart)
       └────────────┘
```

- **Seamless Transitions:** Between rounds, [`RoundCompleteOverlay.tsx`](file:///home/sky/Work/gamevibe/carstyping/apps/web/src/components/race/RoundCompleteOverlay.tsx) displays current round finish rank and speed, advancing to the next round in $1.8\text{ seconds}$ without unmounting the 3D scene or reloading assets.
- **Aggregated Match Report:** [`RaceResultModal.tsx`](file:///home/sky/Work/gamevibe/carstyping/apps/web/src/components/race/RaceResultModal.tsx) reports:
  - Match Outcome (Championship Win / Match Complete)
  - Total Match Time across all 3 rounds
  - Average $WPM$ & Peak $WPM$
  - Overall Accuracy % & Total Mistakes
  - Best Round Indicator
  - Round-by-Round breakdown cards (Round 1, 2, 3)
  - Instant **RACE AGAIN** button for immediate restart.

### 5.2 Vehicle Lineup
Three distinct flagship vehicle archetypes:

| Vehicle | Archetype | Top Speed | Acceleration | Penalty Scale | Personality |
|---|---|---|---|---|---|
| **Meridian GT** | Balanced Gran Turismo | $300\text{ km/h}$ | $13.0\text{ m/s}^2$ | $0.90\times$ (31.5% drop) | Composed at any speed, forgiving recovery |
| **Strada R** | High-Downforce Supercar | $320\text{ km/h}$ | $14.0\text{ m/s}^2$ | $1.10\times$ (38.5% drop) | Built for top end velocity and aggressive pace |
| **Volta E** | Aerodynamic Hypercar | $300\text{ km/h}$ | $15.5\text{ m/s}^2$ | $1.00\times$ (35.0% drop) | Instant electric torque and lightning recovery |

Vehicles feature full automotive PBR materials (clearcoat $1.0$, metalness $0.85\text{--}0.92$), rotating 3D alloy wheels with brake calipers, reactive underglow fields, taillight brake flares on mistake/deceleration, and active cyan/violet plasma exhaust cones on streaks $\ge 5$.

### 5.3 3D Circuits & World Sectors
Racetracks are generated along continuous 3D splines with 5 modular environmental sectors:
1. **Starting Gantry:** Overhead start bridge with countdown illumination.
2. **City Highway:** Multi-lane asphalt flanked by highway lights and cyberpunk skyline towers.
3. **Neon Tunnel:** Hexagonal tunnel ribs with animated emissive light stripes.
4. **Suspension Bridge:** Cable-stayed structural towers over scenic terrain.
5. **Final Stretch:** Checkered arch with strobe floodlights and grandstands.

Available circuits: `Pacific Coast`, `Alpine Pass`, `Tokyo Bay`, `Red Rock`, `Monaco Marina`, and `Sakura Valley`.

---

## 6. Global Important Rules & Contracts

1. **Cars Never Stop During Racing:**
   No typing mistake, hesitation, or stall will ever reduce player car speed to zero. Speed is always clamped to $v \ge v_{\min}$ ($40\text{ km/h}$).
2. **Zero-Cascade Character Typing:**
   Position evaluation is strictly independent. Backspace is a navigation event, not a mistake.
3. **Decoupled Simulation & Zero Render Churn:**
   Keystrokes do not trigger React re-renders of the 3D scene or parent containers. The 3D scene reads positions via zero-allocation temporary vectors.
4. **Zero External 3D/Audio File Dependencies:**
   All 3D vehicle geometries, spline tracks, particles, and audio instruments are procedurally generated in code, guaranteeing instantaneous sub-second application boot times.
5. **Authoritative Server Replay:**
   The backend independently validates keystroke logs through `@typerace/sim` to eliminate client-side cheating.

---

## 7. Developer Quickstart & Verification

### Prerequisites
- Node.js $\ge 20.0.0$
- npm $\ge 10.0.0$

### Install Dependencies
```bash
npm install
```

### Run Tests Across All Workspaces
```bash
npm test
```
*Executes all 22 tests across `@typerace/sim`, `@typerace/api`, and `@typerace/web`.*

### Start Local Development Server
```bash
# Starts both web client (http://localhost:5173) and backend API (http://localhost:3001)
npm run dev:all

# Or start web client only
npm run dev
```

### Build for Production
```bash
npm run build
```
*Compiles TypeScript across all packages and bundles optimized production assets via Vite.*

---

## 8. Verification Matrix

| Workspace | Test Suite | Tests Passing | Build Status |
|---|---|---|---|
| `@typerace/sim` | `test/typing.test.ts`, `test/physics.test.ts`, `test/ai.test.ts` | **11 / 11** | PASS (`tsc --noEmit`) |
| `@typerace/api` | `test/api.test.ts` (Replay verification & anti-cheat) | **5 / 5** | PASS (`tsc`) |
| `@typerace/web` | `test/stores.test.ts` (3-round progression, stores, configs) | **6 / 6** | PASS (`tsc && vite build`) |
| **Total** | **Full Monorepo Verification** | **22 / 22 (100%)** | **PASS** |
