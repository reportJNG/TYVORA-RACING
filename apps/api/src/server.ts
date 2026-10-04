import express, { Request, Response } from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import {
  createTypingState,
  onChar,
  onBackspace,
  liveWpm,
  finalWpm,
  accuracyPercentage,
  generateAiLog,
  AI_DIFFICULTY_PROFILES,
  Difficulty,
} from '@typerace/sim';

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface UserStats {
  totalRaces: number;
  wins: number;
  losses: number;
  winRate: number;
  bestWpm: number;
  avgWpm: number;
  bestAccuracy: number;
  avgAccuracy: number;
  bestTimeSeconds: number;
  currentStreak: number;
  longestStreak: number;
  favoriteCarId: string;
  recentWpm: number[];
  carUsage: Record<string, number>;
}

export interface ActiveRace {
  id: string;
  userId: string;
  seed: number;
  difficulty: Difficulty;
  carId: string;
  passage: {
    id: string;
    text: string;
    length: number;
  };
  opponents: Array<{
    name: string;
    carId: string;
    targetWpm: number;
    finishMs?: number;
  }>;
  status: 'started' | 'finished' | 'rejected';
  createdAt: number;
}

export interface FinishedRaceRecord {
  id: string;
  userId: string;
  username: string;
  isWin: boolean;
  timeSeconds: number;
  wpm: number;
  accuracy: number;
  mistakes: number;
  carId: string;
  difficulty: Difficulty;
  timestamp: string;
}

// In-Memory Database
const users = new Map<string, UserAccount>(); // username.toLowerCase() -> UserAccount
const sessions = new Map<string, string>(); // token -> userId
const stats = new Map<string, UserStats>(); // userId -> UserStats
const races = new Map<string, ActiveRace>(); // raceId -> ActiveRace
const raceHistory: FinishedRaceRecord[] = [];

// Seed Default Passages
const PASSAGES = [
  {
    id: 'norm_01',
    text: 'Every race is a battle between your fingers and the clock. Stay smooth, avoid mistakes, and let the speed come to you.',
  },
  {
    id: 'easy_01',
    text: 'Typing fast is like shifting gears. You must find your rhythm and keep moving forward.',
  },
  {
    id: 'hard_01',
    text: 'High-speed cornering requires surgical precision. A single misplaced keystroke bleeds critical velocity on the straightaway.',
  },
];

// Helper: Hash password
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper: Default stats
function createDefaultStats(): UserStats {
  return {
    totalRaces: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    bestWpm: 0,
    avgWpm: 0,
    bestAccuracy: 0,
    avgAccuracy: 0,
    bestTimeSeconds: 0,
    currentStreak: 0,
    longestStreak: 0,
    favoriteCarId: 'meridian-gt',
    recentWpm: [],
    carUsage: { 'meridian-gt': 0, 'strada-r': 0, 'volta-e': 0 },
  };
}

// Seed Demo Bot Users for Global Leaderboard
const SEED_USERS = [
  { username: 'GhostDriver', wpm: 122, wins: 154, winRate: 88.5 },
  { username: 'ApexPredator', wpm: 114, wins: 128, winRate: 82.1 },
  { username: 'ShiftKeyKid', wpm: 106, wins: 94, winRate: 77.4 },
  { username: 'NitroNova', wpm: 98, wins: 81, winRate: 71.0 },
  { username: 'CyberRacer', wpm: 91, wins: 64, winRate: 66.8 },
];

for (const seed of SEED_USERS) {
  const id = crypto.randomUUID();
  const acc: UserAccount = {
    id,
    username: seed.username,
    email: `${seed.username.toLowerCase()}@typerace.dev`,
    passwordHash: hashPassword('password123'),
    createdAt: new Date().toISOString(),
  };
  users.set(acc.username.toLowerCase(), acc);
  stats.set(id, {
    totalRaces: Math.round(seed.wins / (seed.winRate / 100)),
    wins: seed.wins,
    losses: Math.round(seed.wins / (seed.winRate / 100)) - seed.wins,
    winRate: seed.winRate,
    bestWpm: seed.wpm,
    avgWpm: Math.round(seed.wpm * 0.92),
    bestAccuracy: 98.6,
    avgAccuracy: 96.2,
    bestTimeSeconds: 15.4,
    currentStreak: 4,
    longestStreak: 12,
    favoriteCarId: 'strada-r',
    recentWpm: [seed.wpm - 4, seed.wpm, seed.wpm - 2],
    carUsage: { 'meridian-gt': 10, 'strada-r': 90, 'volta-e': 20 },
  });
}

export function createApp() {
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  // Middleware: Auth check
  const getUserIdFromReq = (req: Request): string | null => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return sessions.get(token) || null;
    }
    const tokenHeader = req.headers['x-session-token'];
    if (typeof tokenHeader === 'string') {
      return sessions.get(tokenHeader) || null;
    }
    return null;
  };

  // Health
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'TypeRace API v1.0', time: new Date().toISOString() });
  });

  // Auth: Sign Up
  app.post('/api/auth/signup', (req: Request, res: Response): any => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const cleanUsername = String(username).trim();
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (users.has(cleanUsername.toLowerCase())) {
      return res.status(409).json({ error: 'Username is already taken' });
    }

    const userId = crypto.randomUUID();
    const newUser: UserAccount = {
      id: userId,
      username: cleanUsername,
      email: String(email).trim().toLowerCase(),
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };

    users.set(cleanUsername.toLowerCase(), newUser);
    stats.set(userId, createDefaultStats());

    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, userId);

    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
      stats: stats.get(userId),
    });
  });

  // Auth: Login
  app.post('/api/auth/login', (req: Request, res: Response): any => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required' });
    }

    const clean = String(identifier).trim().toLowerCase();
    const user = users.get(clean);
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, user.id);

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
      stats: stats.get(user.id),
    });
  });

  // Auth: Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessions.delete(authHeader.substring(7));
    }
    const tokenHeader = req.headers['x-session-token'];
    if (typeof tokenHeader === 'string') {
      sessions.delete(tokenHeader);
    }
    res.json({ success: true });
  });

  // Auth: Me
  app.get('/api/auth/me', (req: Request, res: Response): any => {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let userFound: UserAccount | null = null;
    for (const u of users.values()) {
      if (u.id === userId) {
        userFound = u;
        break;
      }
    }

    if (!userFound) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        id: userFound.id,
        username: userFound.username,
        email: userFound.email,
        createdAt: userFound.createdAt,
      },
      stats: stats.get(userId) || createDefaultStats(),
    });
  });

  // Races: Request / Start Race
  app.post('/api/races', (req: Request, res: Response): any => {
    const userId = getUserIdFromReq(req) || 'guest';
    const { carId = 'meridian-gt', difficulty = 'normal' } = req.body;

    const seed = Math.floor(Math.random() * 2147483647);
    const passage = PASSAGES[seed % PASSAGES.length];

    // Generate AI opponents via @typerace/sim
    const diff = (difficulty as Difficulty) || 'normal';
    const profiles = AI_DIFFICULTY_PROFILES[diff] || AI_DIFFICULTY_PROFILES.normal;

    const rivalAi = generateAiLog(
      seed,
      passage.text,
      profiles.rival.targetWpm,
      profiles.rival.errorRatePermille
    );
    const pacerAi = generateAiLog(
      seed + 1,
      passage.text,
      profiles.pacer.targetWpm,
      profiles.pacer.errorRatePermille
    );

    const raceId = crypto.randomUUID();
    const race: ActiveRace = {
      id: raceId,
      userId,
      seed,
      difficulty: diff,
      carId,
      passage: {
        id: passage.id,
        text: passage.text,
        length: passage.text.length,
      },
      opponents: [
        {
          name: profiles.rival.name,
          carId: 'strada-r',
          targetWpm: profiles.rival.targetWpm,
          finishMs: rivalAi.log.length > 0 ? rivalAi.log[rivalAi.log.length - 1][0] : 25000,
        },
        {
          name: profiles.pacer.name,
          carId: 'volta-e',
          targetWpm: profiles.pacer.targetWpm,
          finishMs: pacerAi.log.length > 0 ? pacerAi.log[pacerAi.log.length - 1][0] : 28000,
        },
      ],
      status: 'started',
      createdAt: Date.now(),
    };

    races.set(raceId, race);

    return res.status(201).json({
      raceId,
      seed: race.seed,
      difficulty: race.difficulty,
      passage: race.passage,
      opponents: race.opponents,
    });
  });

  // Races: Finish & Replay Verification
  app.post('/api/races/:id/finish', (req: Request, res: Response): any => {
    try {
      const raceId = req.params.id;
    const race = races.get(raceId);
    if (!race) {
      return res.status(404).json({ error: 'Race session not found or expired' });
    }

    if (race.status !== 'started') {
      return res.status(400).json({ error: 'Race has already been resolved' });
    }

    const {
      completedAt,
      finishMs,
      finalWpm: claimedFinalWpm,
      accuracy: claimedAccuracy,
      mistakes: claimedMistakes,
      keystrokesLog,
    } = req.body;

    // --- REPLAY SIMULATION VERIFICATION VIA @typerace/sim ---
    if (!Array.isArray(keystrokesLog) || keystrokesLog.length === 0) {
      race.status = 'rejected';
      return res.status(422).json({ error: 'Missing or malformed keystrokes log for replay' });
    }

    // Step 1: Replay character actions through sim typing state
    let simTypingState = createTypingState(race.passage.text);
    let previousTimestamp = 0;
    let suspiciouslyFastCount = 0;

    for (const entry of keystrokesLog) {
      const [ts, key] = entry;

      // Anti-Cheat: physically plausible cadence check
      const delta = ts - previousTimestamp;
      if (delta < 15 && delta >= 0) {
        suspiciouslyFastCount++;
      }
      previousTimestamp = ts;

      if (key === 'Backspace') {
        onBackspace(simTypingState, ts);
      } else if (typeof key === 'string' && key.length === 1) {
        onChar(simTypingState, key, ts);
      }
    }

    // Step 2: Verify completion criteria
    const playerTimeMs = finishMs || completedAt || 20000;
    const verifiedWpm = simTypingState.completedAt
      ? finalWpm(simTypingState)
      : liveWpm(simTypingState, playerTimeMs);
    const verifiedAcc = accuracyPercentage(simTypingState);

    // Anti-Cheat: Reject bot with unrealistic burst key sends
    if (suspiciouslyFastCount > 25 && verifiedWpm > 220) {
      race.status = 'rejected';
      return res.status(403).json({
        verified: false,
        error: 'Anti-cheat violation: Inhuman typing speed or latency detected',
      });
    }

    // Step 3: Determine win vs AI opponents
    let isWin = true;
    let rank = 1;

    for (const opponent of race.opponents) {
      if (opponent.finishMs && opponent.finishMs < playerTimeMs) {
        isWin = false;
        rank++;
      }
    }

    race.status = 'finished';

    // Step 4: Update career stats if registered user
    const newBests: string[] = [];
    let updatedStats: UserStats | undefined;

    if (race.userId !== 'guest') {
      const userStat = stats.get(race.userId) || createDefaultStats();
      userStat.totalRaces += 1;
      if (isWin) {
        userStat.wins += 1;
        userStat.currentStreak += 1;
        if (userStat.currentStreak > userStat.longestStreak) {
          userStat.longestStreak = userStat.currentStreak;
        }
      } else {
        userStat.losses += 1;
        userStat.currentStreak = 0;
      }

      userStat.winRate = Math.round((userStat.wins / userStat.totalRaces) * 1000) / 10;

      if (verifiedWpm > userStat.bestWpm) {
        userStat.bestWpm = verifiedWpm;
        newBests.push('wpm');
      }

      if (verifiedAcc > userStat.bestAccuracy) {
        userStat.bestAccuracy = verifiedAcc;
        newBests.push('accuracy');
      }

      const timeSec = playerTimeMs / 1000;
      if (userStat.bestTimeSeconds === 0 || timeSec < userStat.bestTimeSeconds) {
        userStat.bestTimeSeconds = Math.round(timeSec * 100) / 100;
        newBests.push('time');
      }

      userStat.recentWpm.push(verifiedWpm);
      if (userStat.recentWpm.length > 50) userStat.recentWpm.shift();

      userStat.avgWpm = Math.round(
        userStat.recentWpm.reduce((a, b) => a + b, 0) / userStat.recentWpm.length
      );

      userStat.carUsage[race.carId] = (userStat.carUsage[race.carId] || 0) + 1;

      // Update favorite car
      let maxUsage = 0;
      for (const [cId, count] of Object.entries(userStat.carUsage)) {
        if (count > maxUsage) {
          maxUsage = count;
          userStat.favoriteCarId = cId;
        }
      }

      stats.set(race.userId, userStat);
      updatedStats = userStat;

      // Record to history
      let username = 'Racer';
      for (const u of users.values()) {
        if (u.id === race.userId) {
          username = u.username;
          break;
        }
      }

      raceHistory.unshift({
        id: race.id,
        userId: race.userId,
        username,
        isWin,
        timeSeconds: Math.round((playerTimeMs / 1000) * 100) / 100,
        wpm: verifiedWpm,
        accuracy: verifiedAcc,
        mistakes: simTypingState.mistakes,
        carId: race.carId,
        difficulty: race.difficulty,
        timestamp: new Date().toISOString(),
      });
      if (raceHistory.length > 500) raceHistory.pop();
    }

      return res.json({
        verified: true,
        position: rank,
        isWin,
        timeSeconds: Math.round((playerTimeMs / 1000) * 100) / 100,
        wpm: verifiedWpm,
        accuracy: verifiedAcc,
        mistakes: simTypingState.mistakes,
        newBests,
        updatedStats,
      });
    } catch (err: any) {
      console.error('FINISH REPLAY ERROR:', err?.stack || err);
      return res.status(500).json({ error: err?.message || String(err) });
    }
  });

  // Leaderboard
  app.get('/api/leaderboard', (req: Request, res: Response) => {
    const list: any[] = [];

    for (const [userId, uStats] of stats.entries()) {
      if (uStats.totalRaces === 0) continue;
      let uname = 'Unknown';
      for (const u of users.values()) {
        if (u.id === userId) {
          uname = u.username;
          break;
        }
      }

      list.push({
        userId,
        username: uname,
        wins: uStats.wins,
        losses: uStats.losses,
        winRate: uStats.winRate,
        bestWpm: uStats.bestWpm,
        favoriteCarId: uStats.favoriteCarId,
      });
    }

    // Sort by wins desc, then winRate desc, then bestWpm desc
    list.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.bestWpm - a.bestWpm;
    });

    const ranked = list.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));

    res.json({
      entries: ranked,
      total: ranked.length,
    });
  });

  // User Profile
  app.get('/api/users/:username', (req: Request, res: Response): any => {
    const uname = req.params.username.toLowerCase();
    const user = users.get(uname);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const uStats = stats.get(user.id) || createDefaultStats();
    return res.json({
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
      stats: uStats,
    });
  });

  // User Race History
  app.get('/api/users/:username/races', (req: Request, res: Response): any => {
    const uname = req.params.username.toLowerCase();
    const user = users.get(uname);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userRaces = raceHistory.filter((r) => r.userId === user.id);
    return res.json({
      races: userRaces.slice(0, 20),
    });
  });

  return app;
}

// Standalone start if run directly
const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'test') {
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`[TypeRace API] running on http://localhost:${PORT}`);
  });
}
