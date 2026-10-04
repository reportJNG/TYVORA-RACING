import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../src/server.js';
import type { Server } from 'node:http';

describe('TypeRace API & Simulation Replay Verification', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr !== null) {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('responds with 200 for health check', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toContain('TypeRace API');
  });

  it('signs up a new racer, logs in, and gets session profile', async () => {
    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'SpeedDemon99',
        email: 'demon@test.com',
        password: 'password123',
      }),
    });

    expect(signupRes.status).toBe(201);
    const signupData = await signupRes.json();
    expect(signupData.token).toBeDefined();
    expect(signupData.user.username).toBe('SpeedDemon99');

    const token = signupData.token;

    // Login with same credentials
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'SpeedDemon99',
        password: 'password123',
      }),
    });
    expect(loginRes.status).toBe(200);
    const loginData = await loginRes.json();
    expect(loginData.user.username).toBe('SpeedDemon99');

    // Get Me with token
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    expect(meRes.status).toBe(200);
    const meData = await meRes.json();
    expect(meData.user.username).toBe('SpeedDemon99');
    expect(meData.stats.wins).toBe(0);
  });

  it('creates a race session and verifies client replay keystrokes', async () => {
    // 1. Login user
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'SpeedDemon99',
        password: 'password123',
      }),
    });
    const { token } = await loginRes.json();

    // 2. Request race
    const raceRes = await fetch(`${baseUrl}/api/races`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ carId: 'strada-r', difficulty: 'normal' }),
    });
    expect(raceRes.status).toBe(201);
    const raceData = await raceRes.json();
    expect(raceData.raceId).toBeDefined();
    expect(raceData.passage.text).toBeDefined();

    const raceId = raceData.raceId;
    const passageText: string = raceData.passage.text;

    // 3. Build realistic keystrokes log typing the passage text
    const keystrokesLog: Array<[number, string]> = [];
    let currentMs = 200;
    for (const char of passageText) {
      currentMs += 120; // ~100 WPM cadence with natural spacing
      keystrokesLog.push([currentMs, char]);
    }

    // 4. Submit finish for replay verification
    const finishRes = await fetch(`${baseUrl}/api/races/${raceId}/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        completedAt: currentMs,
        finishMs: currentMs,
        finalWpm: 100,
        accuracy: 100,
        mistakes: 0,
        keystrokesLog,
      }),
    });

    expect(finishRes.status).toBe(200);
    const finishData = await finishRes.json();
    expect(finishData.verified).toBe(true);
    expect(finishData.wpm).toBeGreaterThan(0);
    expect(finishData.accuracy).toBe(100);
    expect(finishData.updatedStats).toBeDefined();
    expect(finishData.updatedStats.totalRaces).toBe(1);
  });

  it('rejects bot injection submissions with inhuman zero-latency bursts', async () => {
    // 1. Request race
    const raceRes = await fetch(`${baseUrl}/api/races`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        carId: 'volta-e',
        difficulty: 'extreme',
      }),
    });
    const raceData = await raceRes.json();
    const raceId = raceData.raceId;
    const passageText: string = raceData.passage.text;

    // 2. Simulate bot sending 80 chars in 100ms (< 2ms per key, > 300 WPM)
    const keystrokesLog: Array<[number, string]> = [];
    let currentMs = 10;
    for (let i = 0; i < passageText.length; i++) {
      currentMs += 2;
      keystrokesLog.push([currentMs, passageText[i]]);
    }

    const finishRes = await fetch(`${baseUrl}/api/races/${raceId}/finish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        completedAt: currentMs,
        finishMs: currentMs,
        finalWpm: 400,
        accuracy: 100,
        mistakes: 0,
        keystrokesLog,
      }),
    });

    expect(finishRes.status).toBe(403);
    const finishData = await finishRes.json();
    expect(finishData.verified).toBe(false);
    expect(finishData.error).toContain('Anti-cheat violation');
  });

  it('returns global leaderboard rankings', async () => {
    const res = await fetch(`${baseUrl}/api/leaderboard`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.entries)).toBe(true);
    expect(body.entries.length).toBeGreaterThanOrEqual(5);
    expect(body.entries[0].rank).toBe(1);
    expect(body.entries[0].wins).toBeGreaterThanOrEqual(body.entries[1].wins);
  });
});
