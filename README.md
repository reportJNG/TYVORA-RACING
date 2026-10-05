# TYVORA-RACING — Frontend-Only 3D Typing Racing Game

> **"Type fast. Drive fast. Earn points. Unlock the fleet."**

TYVORA-RACING is a high-velocity, 3D arcade browser typing racing game built with React 19, Three.js / React Three Fiber, Zustand, and an in-browser SQLite WASM database engine. Keyboard keystrokes drive throttle, acceleration, and top speed in real-time.

---

## 1. Architecture Overview (Frontend-Only & Zero-Backend)

TYVORA-RACING is architected as an **entirely static, client-only application**. There is no backend server, no external API server, and no hosted database:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        BROWSER RUNTIME (STATIC)                        │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                         React 19 UI                            │   │
│   │   [Home]          [Race]          [Leaderboard]      [Profile] │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │                                    │
│   ┌───────────────────────────────▼────────────────────────────────┐   │
│   │                 Local Authentication & Stores                  │   │
│   │      (useAuthStore, useRaceStore, useTypingStore, settings)   │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │                                    │
│   ┌───────────────────────────────▼────────────────────────────────┐   │
│   │              Client-Side SQLite WASM Engine (sql.js)           │   │
│   │   - users          - unlocked_cars         - race_history      │   │
│   │   - leaderboard    - user_settings                             │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │                                    │
│   ┌───────────────────────────────▼────────────────────────────────┐   │
│   │                 Browser Persistence Layer                      │   │
│   │       IndexedDB (TyvoraRacingDB) + localStorage fallback       │   │
│   │       + Direct Binary File Download/Restore (.sqlite)          │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Why Frontend-Only?
- **Zero Cloud Infrastructure:** Deployed entirely as static files (Vercel, GitHub Pages, Netlify, Cloudflare Pages, S3).
- **Zero Ops & Maintenance:** No database clusters to manage, zero API maintenance, and no server bills.
- **Player Data Ownership:** The full SQLite database lives inside the player's browser. Players can export their raw `.sqlite` binary file or JSON backup at any time, switch browsers, and restore their career progress instantly.
- **Acceptable Threat Model:** Because TYVORA-RACING is an arcade mini-game / toy project rather than a financial application, client-side data storage and authentication are intentionally chosen for simplicity and portability.

---

## 2. Navigation & User Interface

The navigation is streamlined into **three core tabs** plus the driver profile at the top right:

```text
┌───────────────────────────────────────────────────────────────────────────────┐
│ [🏁 TYVORA-RACING]     [Home]     [Race]     [Leaderboard]     [⭐ 1,420 PTS 👤] │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Home Tab (Landing Page & Modern 3D Design)
The Home tab serves as the showcase landing page for TYVORA-RACING:
- **Interactive 3D Showroom:** Real-time WebGL turntable showcasing current unlocked vehicles with dynamic lighting, underglow, and orbital camera controls.
- **Driver Dossier Telemetry Card:** Live snapshot of the player's license tier, championship points, unlocked fleet count, best WPM, and win rate.
- **Instant Play Action:** Direct launch button transitioning straight into staging.
- **Architecture & Feature Highlights:** Visual cards explaining zero-backend SQLite WASM, the "Never-Stop" physics rule, procedural Web Audio, and zero-cascade typing.
- **Global Podium Preview:** Live preview of the top 3 drivers currently dominating the championship leaderboard.
- **Vehicle Progression Roadmap:** Visual progress preview from the trash starter car to exotic hypercars.

### 2.2 Race Tab (Staging Lobby & Cockpit Viewport)
The Race tab unifies vehicle staging and real-time racing into a single flow:
- **Vehicle Staging Carousel:** Browse all vehicles with complete technical telemetry (Top Speed, 0–100 Acceleration, Stability, Difficulty, and Point Requirements).
- **Lock / Unlock Status:** Locked vehicles display their point unlock threshold alongside the player's progress bar.
- **Livery Paint Customizer:** Select custom high-gloss automotive finishes (Obsidian, Racing Red, Electric Cyan, Solar Yellow, Ultra Violet, Pure White, Emerald Green, Titanium).
- **Standardized Competition Spec:** Circuit switcher and starting speed dropdowns have been removed. All competitors race on the standardized championship circuit at standard starting speed for consistent competition.
- **Real-Time 3D Race Viewport:** Seamlessly launches into the 3D race canvas with dynamic chase camera, speed streaks, cockpit HUD, and AI rivals.

### 2.3 Leaderboard Tab
- **Championship Standings:** Real-time global rankings calculated from race victories, best times, and accumulated championship points.
- **Driver Dossier Modal:** Click any racer in the leaderboard to inspect their full career stats, win rate, best WPM, favorite car, and license rank.

### 2.4 Top-Right Profile Badge & Data Hub
Clicking the profile badge in the top right opens the driver dropdown:
- **Profile Screen:** Comprehensive career dossier with license progression, vehicle fleet status, recent race telemetry, and the **Data Management Hub**.
- **Settings Screen:** Procedural engine audio volume, sound effects, typography preferences, and motion accessibility.

---

## 3. Vehicle Progression: Trash Car to Hypercar

All new drivers start equally with a beat-up starter trash car. High-performance vehicles are unlocked by competing and earning championship points on the leaderboard:

| Vehicle | Archetype | Top Speed | 0–100 Accel | Unlock Points | Status |
|---|---|---|---|---|---|
| **Rust-Runner 94** (`scrapper-rust`) | Beater / Scrap Runner | $240\text{ km/h}$ | $11.2\text{ m/s}^2$ | **0 PTS** | **FREE (Starter)** |
| **Volta E** | Electric Supercar | $300\text{ km/h}$ | $15.5\text{ m/s}^2$ | **150 PTS** | Tier 1 Unlock |
| **Cyclone RS** | Trackday Special | $310\text{ km/h}$ | $14.5\text{ m/s}^2$ | **400 PTS** | Tier 2 Unlock |
| **Strada R** | High-Downforce GT | $320\text{ km/h}$ | $14.0\text{ m/s}^2$ | **800 PTS** | Tier 3 Unlock |
| **Meridian GT** | Grand Tourer | $300\text{ km/h}$ | $13.0\text{ m/s}^2$ | **1,400 PTS** | Tier 4 Unlock |
| **Apex GTR** | Le Mans Homologation | $335\text{ km/h}$ | $16.0\text{ m/s}^2$ | **2,200 PTS** | Tier 5 Unlock |
| **Phantom Spyder** | Open-Cockpit Speedster | $345\text{ km/h}$ | $17.0\text{ m/s}^2$ | **3,000 PTS** | Tier 6 Unlock |
| **Vanguard V12** | Naturally-Aspirated Monster | $360\text{ km/h}$ | $16.5\text{ m/s}^2$ | **4,000 PTS** | Tier 7 Unlock |
| **Solaris Hyper** | Quad-Motor Hypercar | $380\text{ km/h}$ | $18.5\text{ m/s}^2$ | **5,000 PTS** | Ultimate Unlock |

### How Points Are Earned
Points are awarded at the conclusion of every 3-round race match based on performance:
$$\text{Points} = (\text{Win Bonus: } 100 \text{ or } 40) + \left\lfloor\frac{\text{WPM}}{2}\right\rfloor + \left\lfloor\frac{\text{Accuracy} - 80}{2}\right\rfloor + (\text{Flawless Bonus: } 30)$$

When your total championship points meet or exceed a vehicle's unlock threshold, the SQLite WASM database automatically records the unlock, and the vehicle becomes immediately selectable in the race staging lobby.

---

## 4. In-Browser SQLite WASM Data Architecture

TYVORA-RACING bundles `sql.js` (SQLite compiled to WebAssembly) to provide a true relational database inside the browser.

### Database Schema
```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  member_since TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS unlocked_cars (
  user_id TEXT NOT NULL,
  car_id TEXT NOT NULL,
  unlocked_at TEXT NOT NULL,
  PRIMARY KEY (user_id, car_id)
);

CREATE TABLE IF NOT EXISTS race_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  is_win INTEGER NOT NULL,
  time_seconds REAL NOT NULL,
  wpm REAL NOT NULL,
  accuracy REAL NOT NULL,
  mistakes INTEGER NOT NULL,
  car_id TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  points_earned INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS leaderboard (
  user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  avatar_seed TEXT NOT NULL,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  win_rate REAL DEFAULT 0,
  best_wpm REAL DEFAULT 0,
  best_time_seconds REAL DEFAULT 999.0,
  favorite_car_id TEXT DEFAULT 'scrapper-rust',
  total_points INTEGER DEFAULT 0
);
```

### Data Backup & Migration Hub
Accessible anytime via **Profile → Data Management**:
1. **Download SQLite File (`.sqlite`):** Exports the raw, live SQLite database binary directly to disk. Can be opened and inspected in tools like *DB Browser for SQLite* or *DBeaver*.
2. **Restore SQLite File:** Upload any previously exported `.sqlite` binary. The database replaces the active browser state and persists to IndexedDB.
3. **Export JSON Backup:** Human-readable JSON export containing all users, unlocked cars, race logs, and settings.
4. **Import JSON Backup:** Parse and restore data from a valid TYVORA JSON backup.
5. **Factory Reset:** Clears local storage and re-initializes the database with starter values.

---

## 5. Core Engine & Simulation Principles

1. **The "Never-Stop" Rule:** Vehicles maintain a guaranteed minimum cruising speed ($v_{\min} = 11.11\text{ m/s} \approx 40\text{ km/h}$). Hesitation or mistakes slow the vehicle down dynamically, but never freeze it to a halt.
2. **Zero-Cascade Typing:** Character evaluation is independent. A mistyped character never invalidates subsequent correct keystrokes.
3. **Non-Punitive Backspace:** Backspace is strictly an editing and navigation tool; it never counts as an additional mistake.
4. **120Hz Fixed-Timestep Physics:** Deterministic physics loop running at $\Delta t = \frac{1}{120}\text{ s}$ independent of display refresh rate.
5. **Procedural Web Audio:** Real-time dual-oscillator synthesized engine audio and mechanical keyboard acoustics with zero external MP3/WAV dependencies.

---

## 6. Monorepo Structure

```text
carstyping/
├── packages/
│   └── sim/                     # Pure deterministic game engine (Zero dependencies)
│       ├── src/
│       │   ├── constants.ts     # Physics specs, vehicle definitions, trash car parameters
│       │   ├── typing.ts        # Independent character evaluation, WPM & accuracy math
│       │   ├── physics.ts       # 120Hz fixed timestep integration & velocity models
│       │   ├── ai.ts            # Realistic human typing cadence & AI opponents
│       │   └── index.ts         # Public contracts
│       └── test/                # 22 Vitest unit tests
│
├── apps/
│   ├── web/                     # High-performance React 19 + Three.js client
│   │   ├── public/
│   │   │   └── sql-wasm.wasm    # SQLite WebAssembly binary
│   │   ├── src/
│   │   │   ├── audio/           # Procedural Web Audio API sound synthesizer
│   │   │   ├── components/
│   │   │   │   ├── layout/      # Header (3 tabs + profile), Footer
│   │   │   │   ├── scene/       # 3D Three.js canvas, procedural vehicles & tracks
│   │   │   │   ├── race/        # Cockpit instrument, HUD, results modal
│   │   │   │   └── screens/     # HomeScreen (landing), RaceScreen, LeaderboardScreen, ProfileScreen
│   │   │   ├── db/              # In-browser SQLite WASM service & persistence
│   │   │   ├── data/            # Car specs, point thresholds, standard track config
│   │   │   └── stores/          # Zustand domain stores (auth, race, typing, settings)
│   │   └── test/                # 12 Vitest store, SQLite WASM & match tests
│   │
│   └── api/                     # Node.js + Express backend (retained for headless replay verification)
│       └── test/                # 6 API integration test cases
│
└── package.json                 # Monorepo workspaces & build scripts
```

---

## 7. Developer Quickstart & Verification

### Prerequisites
- Node.js $\ge 20.0.0$
- npm $\ge 10.0.0$

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Tests
```bash
npm test
```
*Executes all 40 tests across `@typerace/sim`, `@typerace/api`, and `@typerace/web`.*

### 3. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```
Generates the fully self-contained static distribution in `apps/web/dist/`, ready for immediate static web deployment.

---

## 8. Verification Matrix

| Workspace | Test Suite | Passing Tests | Build Status |
|---|---|---|---|
| `@typerace/sim` | `typing.test.ts`, `physics.test.ts`, `passage.test.ts`, `ai.test.ts` | **22 / 22** | PASS (`tsc --noEmit`) |
| `@typerace/api` | `api.test.ts` (Replay verification & bot rejection) | **6 / 6** | PASS (`tsc`) |
| `@typerace/web` | `stores.test.ts` (SQLite WASM, unlocks, auth, 3-round lifecycle), `typing.test.ts` | **12 / 12** | PASS (`tsc && vite build`) |
| **Total** | **Full Monorepo Verification** | **40 / 40 (100%)** | **PASS (0 Errors)** |
