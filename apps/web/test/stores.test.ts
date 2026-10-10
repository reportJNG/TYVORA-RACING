import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../src/stores/useSettingsStore.js';
import { useAuthStore } from '../src/stores/useAuthStore.js';
import { CARS_LIST, CARS_DATA } from '../src/data/cars.js';
import { PASSAGES, getRandomPassage } from '../src/data/passages.js';

// Polyfill localStorage and document for headless Node environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => { store.set(key, String(val)); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    key: (idx: number) => Array.from(store.keys())[idx] ?? null,
    get length() { return store.size; },
  };
  globalThis.localStorage = mockStorage as any;
}

if (typeof globalThis.document === 'undefined') {
  (globalThis as any).document = {
    documentElement: {
      setAttribute: () => {},
      classList: { add: () => {}, remove: () => {} },
    },
  };
}

if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = {
    matchMedia: () => ({ matches: false }),
    localStorage: globalThis.localStorage,
    document: globalThis.document,
  };
} else {
  if (!globalThis.window.localStorage) {
    (globalThis.window as any).localStorage = globalThis.localStorage;
  }
  if (!globalThis.window.document) {
    (globalThis.window as any).document = globalThis.document;
  }
}

describe('Web Stores & Game Configuration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides default settings and allows updates', () => {
    const settings = useSettingsStore.getState();
    expect(settings.theme).toBe('dark');
    expect(settings.typingSound).toBe(true);
    expect(settings.engineSound).toBe(true);

    settings.setTypingSound(false);
    expect(useSettingsStore.getState().typingSound).toBe(false);

    settings.setTheme('light');
    expect(useSettingsStore.getState().theme).toBe('light');
  });

  it('manages user auth lifecycle and tracks career race stats', async () => {
    const auth = useAuthStore.getState();

    // Signup
    const signupRes = await auth.signup('LightningRacer', 'lightning@race.dev', 'password123');
    expect(signupRes.success).toBe(true);

    const currentUser = useAuthStore.getState().currentUser;
    expect(currentUser).not.toBeNull();
    expect(currentUser?.username).toBe('LightningRacer');

    // Initial stats
    expect(useAuthStore.getState().stats.totalRaces).toBe(0);
    expect(useAuthStore.getState().stats.wins).toBe(0);

    // Record Win
    const { newBests: winBests } = useAuthStore.getState().recordRaceResult({
      isWin: true,
      timeSeconds: 16.5,
      wpm: 88,
      accuracy: 99,
      mistakes: 1,
      carId: 'meridian-gt',
      difficulty: 'normal',
      counted: true,
    });

    const statsAfterWin = useAuthStore.getState().stats;
    expect(statsAfterWin.totalRaces).toBe(1);
    expect(statsAfterWin.wins).toBe(1);
    expect(statsAfterWin.winRate).toBe(100);
    expect(statsAfterWin.currentStreak).toBe(1);
    expect(statsAfterWin.bestWpm).toBe(88);
    expect(winBests).toContain('wpm');

    // Record Loss
    useAuthStore.getState().recordRaceResult({
      isWin: false,
      timeSeconds: 22.0,
      wpm: 65,
      accuracy: 92,
      mistakes: 5,
      carId: 'meridian-gt',
      difficulty: 'hard',
      counted: true,
    });

    const statsAfterLoss = useAuthStore.getState().stats;
    expect(statsAfterLoss.totalRaces).toBe(2);
    expect(statsAfterLoss.wins).toBe(1);
    expect(statsAfterLoss.losses).toBe(1);
    expect(statsAfterLoss.winRate).toBe(50);
    expect(statsAfterLoss.currentStreak).toBe(0); // streak reset
  });

  it('contains 8 distinct clean car models with tuned specifications', () => {
    expect(CARS_LIST.length).toBeGreaterThanOrEqual(8);
    expect(CARS_DATA['meridian-gt']).toBeDefined();
    expect(CARS_DATA['strada-r']).toBeDefined();
    expect(CARS_DATA['volta-e']).toBeDefined();
    expect(CARS_DATA['apex-gtr']).toBeDefined();
    expect(CARS_DATA['vanguard-v12']).toBeDefined();
    expect(CARS_DATA['cyclone-rs']).toBeDefined();
    expect(CARS_DATA['phantom-spyder']).toBeDefined();
    expect(CARS_DATA['solaris-hyper']).toBeDefined();

    // Meridian GT: Balanced
    expect(CARS_DATA['meridian-gt'].category).toBe('Balanced');
    expect(CARS_DATA['meridian-gt'].vMax).toBeGreaterThanOrEqual(80);

    // Strada R: Aggressive top end
    expect(CARS_DATA['strada-r'].vMax).toBeGreaterThan(
      CARS_DATA['meridian-gt'].vMax
    );

    // Volta E: Instant electric acceleration
    expect(CARS_DATA['volta-e'].accel).toBeGreaterThan(
      CARS_DATA['meridian-gt'].accel
    );
  });

  it('provides 6 distinct clean scenic 3D tracks with environment lighting and spline profiles', async () => {
    const { TRACKS_LIST, TRACKS_DATA } = await import('../src/data/tracks.js');
    expect(TRACKS_LIST.length).toBe(6);
    expect(TRACKS_DATA['pacific-coast']).toBeDefined();
    expect(TRACKS_DATA['alpine-pass']).toBeDefined();
    expect(TRACKS_DATA['tokyo-bay']).toBeDefined();
    expect(TRACKS_DATA['red-rock']).toBeDefined();
    expect(TRACKS_DATA['monaco-marina']).toBeDefined();
    expect(TRACKS_DATA['sakura-valley']).toBeDefined();

    // Each track has clean realistic lighting
    for (const track of TRACKS_LIST) {
      expect(track.lighting.sunIntensity).toBeGreaterThan(1.0);
      expect(track.road.asphaltColor).toBeDefined();
      expect(track.spline.curveScale).toBeGreaterThan(10);
    }
  });

  it('allows track selection and custom paint finishes in useRaceStore', async () => {
    const { useRaceStore } = await import('../src/stores/useRaceStore.js');
    const store = useRaceStore.getState();

    expect(store.selectedTrackId).toBe('pacific-coast');
    store.selectTrack('alpine-pass');
    expect(useRaceStore.getState().selectedTrackId).toBe('alpine-pass');

    expect(store.customPaintColor).toBeNull();
    store.setCustomPaintColor('#0084FF');
    expect(useRaceStore.getState().customPaintColor).toBe('#0084FF');
  });

  it('manages 3-round match progression and aggregated results in useRaceStore', async () => {
    const { useRaceStore } = await import('../src/stores/useRaceStore.js');
    const store = useRaceStore.getState();

    // Prepare match (Round 1)
    store.prepareRace(1);
    expect(useRaceStore.getState().currentRound).toBe(1);
    expect(useRaceStore.getState().totalRounds).toBe(3);
    expect(useRaceStore.getState().roundResults.length).toBe(0);

    // Simulate finishing Round 1
    useRaceStore.getState().playerSim.finishMs = 20000;
    store.finishCurrentRound();
    expect(useRaceStore.getState().roundResults.length).toBe(1);
    expect(useRaceStore.getState().status).toBe('round_complete');

    // Advance to Round 2
    store.advanceToNextRound();
    expect(useRaceStore.getState().currentRound).toBe(2);
    expect(useRaceStore.getState().status).toBe('countdown');

    // Simulate finishing Round 2
    useRaceStore.getState().playerSim.finishMs = 22000;
    store.finishCurrentRound();
    expect(useRaceStore.getState().roundResults.length).toBe(2);

    // Advance to Round 3
    store.advanceToNextRound();
    expect(useRaceStore.getState().currentRound).toBe(3);

    // Simulate finishing Round 3
    useRaceStore.getState().playerSim.finishMs = 24000;
    store.finishCurrentRound();

    // Match completes!
    expect(useRaceStore.getState().status).toBe('results');
    const lastResult = useRaceStore.getState().lastResult;
    expect(lastResult).not.toBeNull();
    expect(lastResult?.rounds.length).toBe(3);
    expect(lastResult?.timeSeconds).toBeGreaterThan(0);
    expect(lastResult?.wpm).toBeGreaterThan(0);
  });

  it('guarantees only starter trash car is free and others unlock with points', () => {
    expect(CARS_DATA['scrapper-rust']).toBeDefined();
    expect(CARS_DATA['scrapper-rust'].unlockPoints).toBe(0);

    // Other cars require points
    expect(CARS_DATA['volta-e'].unlockPoints).toBeGreaterThan(0);
    expect(CARS_DATA['cyclone-rs'].unlockPoints).toBeGreaterThan(CARS_DATA['volta-e'].unlockPoints);
    expect(CARS_DATA['strada-r'].unlockPoints).toBeGreaterThan(CARS_DATA['cyclone-rs'].unlockPoints);
    expect(CARS_DATA['meridian-gt'].unlockPoints).toBeGreaterThan(CARS_DATA['strada-r'].unlockPoints);
    expect(CARS_DATA['apex-gtr'].unlockPoints).toBeGreaterThan(CARS_DATA['meridian-gt'].unlockPoints);
    expect(CARS_DATA['phantom-spyder'].unlockPoints).toBeGreaterThan(CARS_DATA['apex-gtr'].unlockPoints);
    expect(CARS_DATA['solaris-hyper'].unlockPoints).toBeGreaterThan(CARS_DATA['phantom-spyder'].unlockPoints);
  });

  it('executes in-browser SQLite WASM operations and car unlock progression', async () => {
    const { sqliteService } = await import('../src/db/sqlite.js');
    await sqliteService.init();

    // Signup test user
    const testUsername = 'WasmRacer' + Date.now();
    const signupRes = sqliteService.signup(testUsername, `${testUsername}@tyvora.racing`, 'pass1234');
    expect(signupRes.success).toBe(true);
    const userId = signupRes.user?.id!;

    // Initial unlocks: only scrapper-rust
    const initialUnlocked = sqliteService.getUnlockedCarIds(userId);
    expect(initialUnlocked).toContain('scrapper-rust');
    expect(initialUnlocked).not.toContain('volta-e');

    // Simulate winning a race that awards points >= 150 (volta-e requirement)
    const raceRes = sqliteService.recordRace({
      userId,
      isWin: true,
      timeSeconds: 18.2,
      wpm: 95,
      accuracy: 99,
      mistakes: 0,
      carId: 'scrapper-rust',
      difficulty: 'normal',
      counted: true,
    });

    expect(raceRes.pointsEarned).toBeGreaterThanOrEqual(150);
    expect(raceRes.newTotalPoints).toBeGreaterThanOrEqual(150);

    // volta-e should now be unlocked!
    const updatedUnlocked = sqliteService.getUnlockedCarIds(userId);
    expect(updatedUnlocked).toContain('volta-e');

    // Export database binary
    const binary = sqliteService.exportDatabaseBinary();
    expect(binary).toBeInstanceOf(Uint8Array);
    expect(binary.byteLength).toBeGreaterThan(0);

    // Verify restore works
    await sqliteService.importDatabaseBinary(binary);
    const restoredUser = sqliteService.getUserById(userId);
    expect(restoredUser?.username).toBe(testUsername);
    expect(restoredUser?.points).toBe(raceRes.newTotalPoints);

    // Test explicit car purchasing:
    // Give user 1500 points to buy meridian-gt (requires 1400 pts)
    const pointsBefore = restoredUser?.points || 0;
    const buyResult = sqliteService.buyCar(userId, 'meridian-gt');
    // If not enough points, should fail gracefully
    if (pointsBefore < 1400) {
      expect(buyResult.success).toBe(false);
    }
  });

  it('allows explicit car purchasing with user points balance', async () => {
    const { sqliteService } = await import('../src/db/sqlite.js');
    await sqliteService.init();

    const username = 'BuyerRacer' + Date.now();
    const signup = sqliteService.signup(username, `${username}@test.dev`, 'pass');
    const uid = signup.user!.id;

    // Award 2000 points via winning race
    sqliteService.recordRace({
      userId: uid,
      isWin: true,
      timeSeconds: 15.0,
      wpm: 120,
      accuracy: 100,
      mistakes: 0,
      carId: 'scrapper-rust',
      difficulty: 'hard',
      counted: true,
    });

    const userBefore = sqliteService.getUserById(uid);
    expect(userBefore?.points).toBeGreaterThanOrEqual(150);

    // Manually top up to 2500 for testing
    const db = (sqliteService as any).db;
    db.run('UPDATE users SET points = 2500 WHERE id = ?', [uid]);

    // Buy meridian-gt (1400 pts)
    const res = sqliteService.buyCar(uid, 'meridian-gt');
    expect(res.success).toBe(true);
    expect(res.remainingPoints).toBe(2500 - 1400);

    const unlocked = sqliteService.getUnlockedCarIds(uid);
    expect(unlocked).toContain('meridian-gt');

    const userAfter = sqliteService.getUserById(uid);
    expect(userAfter?.points).toBe(1100);
  });
});
