import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { CARS_LIST, CarVisualConfig } from '../data/cars.js';

export interface DbUser {
  id: string;
  username: string;
  email: string;
  points: number;
  created_at: string;
  member_since: string;
}

export interface DbRaceHistory {
  id: string;
  user_id: string;
  timestamp: string;
  is_win: boolean;
  time_seconds: number;
  wpm: number;
  accuracy: number;
  mistakes: number;
  car_id: string;
  difficulty: string;
  points_earned: number;
}

export interface DbLeaderboardEntry {
  user_id: string;
  username: string;
  avatar_seed: string;
  wins: number;
  losses: number;
  win_rate: number;
  best_wpm: number;
  best_time_seconds: number;
  favorite_car_id: string;
  total_points: number;
  rank: number;
}

const IDB_NAME = 'TyvoraRacingDB';
const IDB_STORE = 'sqlite_storage';
const IDB_KEY = 'tyvora_racing_sqlite_binary';

// Open / create IndexedDB
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Load binary Uint8Array from IndexedDB
async function loadFromIndexedDB(): Promise<Uint8Array | null> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY);
      req.onsuccess = () => {
        if (req.result && req.result instanceof Uint8Array) {
          resolve(req.result);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    if (typeof indexedDB !== 'undefined') {
      console.warn('[SQLite] IndexedDB load failed, trying localStorage fallback:', err);
    }
    try {
      const b64 = localStorage.getItem(IDB_KEY);
      if (b64) {
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) {
          bytes[i] = bin.charCodeAt(i);
        }
        return bytes;
      }
    } catch {}
    return null;
  }
}

// Save binary Uint8Array to IndexedDB
async function saveToIndexedDB(data: Uint8Array): Promise<void> {
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(data, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    if (typeof indexedDB !== 'undefined') {
      console.warn('[SQLite] IndexedDB save failed, trying localStorage fallback:', err);
    }
    try {
      if (data.length < 4 * 1024 * 1024) {
        let binary = '';
        for (let i = 0; i < data.byteLength; i++) {
          binary += String.fromCharCode(data[i]);
        }
        localStorage.setItem(IDB_KEY, btoa(binary));
      }
    } catch (e) {
      console.error('[SQLite] localStorage fallback quota exceeded:', e);
    }
  }
}

class SQLiteService {
  private SQL: SqlJsStatic | null = null;
  private db: Database | null = null;
  private isInitialized = false;
  private saveTimeout: any = null;

  async init(): Promise<Database> {
    if (this.isInitialized && this.db) {
      return this.db;
    }

    try {
      let nodeFs: any = null;
      let nodePath: any = null;
      if (typeof process !== 'undefined') {
        if (typeof (process as any).getBuiltinModule === 'function') {
          nodeFs = (process as any).getBuiltinModule('fs');
          nodePath = (process as any).getBuiltinModule('path');
        }
        if (!nodeFs && typeof (globalThis as any).require === 'function') {
          try {
            nodeFs = (globalThis as any).require('fs');
            nodePath = (globalThis as any).require('path');
          } catch {}
        }
      }

      if (nodeFs && nodePath) {
        try {
          const cwd = typeof process.cwd === 'function' ? process.cwd() : '.';
          const candidates = [
            nodePath.resolve(cwd, 'apps/web/public/sql-wasm.wasm'),
            nodePath.resolve(cwd, 'public/sql-wasm.wasm'),
            nodePath.resolve(cwd, 'node_modules/sql.js/dist/sql-wasm.wasm'),
            nodePath.resolve(cwd, '../../node_modules/sql.js/dist/sql-wasm.wasm'),
            nodePath.resolve(cwd, '../node_modules/sql.js/dist/sql-wasm.wasm'),
          ];
          let foundBinary: ArrayBuffer | null = null;
          for (const p of candidates) {
            if (nodeFs.existsSync(p)) {
              const buf = nodeFs.readFileSync(p);
              foundBinary = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
              break;
            }
          }
          if (foundBinary) {
            this.SQL = await initSqlJs({ wasmBinary: foundBinary });
          } else {
            this.SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
          }
        } catch (nodeErr) {
          console.warn('[SQLite] Node loader fallback:', nodeErr);
          this.SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
        }
      } else {
        this.SQL = await initSqlJs({
          locateFile: () => '/sql-wasm.wasm',
        });
      }
    } catch (err) {
      console.error('[SQLite] Failed to load WASM binary:', err);
      throw err;
    }

    // Attempt to restore persistent database
    const savedBinary = await loadFromIndexedDB();
    if (savedBinary && savedBinary.length > 0) {
      try {
        this.db = new this.SQL.Database(savedBinary);
        this.initSchema();
        this.isInitialized = true;
        return this.db;
      } catch (e) {
        console.warn('[SQLite] Saved DB corrupted, creating fresh instance:', e);
      }
    }

    // Create fresh DB and initialize schema & seeds
    this.db = new this.SQL.Database();
    this.initSchema();
    this.seedDefaults();
    await this.persistImmediately();
    this.isInitialized = true;
    return this.db;
  }

  private initSchema() {
    if (!this.db) return;

    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
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
        win_rate REAL DEFAULT 0.0,
        best_wpm REAL DEFAULT 0.0,
        best_time_seconds REAL DEFAULT 0.0,
        favorite_car_id TEXT NOT NULL,
        total_points INTEGER DEFAULT 0,
        rank INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS user_settings (
        user_id TEXT PRIMARY KEY,
        settings_json TEXT NOT NULL
      );
    `);
  }

  private seedDefaults() {
    if (!this.db) return;

    // Check if default user exists
    const userRes = this.db.exec("SELECT COUNT(*) as count FROM users WHERE id = 'user-speedster'");
    const userCount = userRes[0]?.values[0]?.[0] || 0;

    if (userCount === 0) {
      const now = new Date().toISOString();
      this.db.run(
        `INSERT OR IGNORE INTO users (id, username, email, password_hash, points, created_at, member_since)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['user-speedster', 'Speedster', 'speedster@tyvora.racing', 'pilot123', 0, now, 'Oct 2026']
      );

      // Starter trash car unlocked by default
      this.db.run(
        `INSERT OR IGNORE INTO unlocked_cars (user_id, car_id, unlocked_at)
         VALUES (?, ?, ?)`,
        ['user-speedster', 'scrapper-rust', now]
      );
    }

    // Seed competitive AI racers if leaderboard is empty
    const lbRes = this.db.exec('SELECT COUNT(*) as count FROM leaderboard');
    const lbCount = lbRes[0]?.values[0]?.[0] || 0;

    if (lbCount === 0) {
      const seedRacers = [
        {
          userId: 'bot-apex',
          username: 'ApexPhantom',
          avatarSeed: 'apexphantom',
          wins: 48,
          losses: 4,
          winRate: 92.3,
          bestWpm: 98.4,
          bestTimeSeconds: 28.4,
          favoriteCarId: 'solaris-hyper',
          totalPoints: 4250,
          rank: 1,
        },
        {
          userId: 'bot-turbo',
          username: 'TurboGhost',
          avatarSeed: 'turboghost',
          wins: 39,
          losses: 7,
          winRate: 84.8,
          bestWpm: 92.1,
          bestTimeSeconds: 30.1,
          favoriteCarId: 'vanguard-v12',
          totalPoints: 3600,
          rank: 2,
        },
        {
          userId: 'bot-blade',
          username: 'NeonBlade',
          avatarSeed: 'neonblade',
          wins: 31,
          losses: 6,
          winRate: 83.8,
          bestWpm: 88.5,
          bestTimeSeconds: 31.8,
          favoriteCarId: 'apex-gtr',
          totalPoints: 2950,
          rank: 3,
        },
        {
          userId: 'bot-viper',
          username: 'CyberViper',
          avatarSeed: 'cyberviper',
          wins: 24,
          losses: 8,
          winRate: 75.0,
          bestWpm: 81.2,
          bestTimeSeconds: 33.5,
          favoriteCarId: 'strada-r',
          totalPoints: 2100,
          rank: 4,
        },
        {
          userId: 'bot-shift',
          username: 'ShiftMaster',
          avatarSeed: 'shiftmaster',
          wins: 18,
          losses: 9,
          winRate: 66.7,
          bestWpm: 75.0,
          bestTimeSeconds: 35.2,
          favoriteCarId: 'meridian-gt',
          totalPoints: 1500,
          rank: 5,
        },
        {
          userId: 'bot-drift',
          username: 'VelocityDrifter',
          avatarSeed: 'velocitydrifter',
          wins: 12,
          losses: 8,
          winRate: 60.0,
          bestWpm: 68.4,
          bestTimeSeconds: 37.6,
          favoriteCarId: 'cyclone-rs',
          totalPoints: 900,
          rank: 6,
        },
        {
          userId: 'bot-queen',
          username: 'CircuitQueen',
          avatarSeed: 'circuitqueen',
          wins: 7,
          losses: 6,
          winRate: 53.8,
          bestWpm: 61.2,
          bestTimeSeconds: 41.0,
          favoriteCarId: 'volta-e',
          totalPoints: 450,
          rank: 7,
        },
        {
          userId: 'user-speedster',
          username: 'Speedster',
          avatarSeed: 'speedster',
          wins: 0,
          losses: 0,
          winRate: 0.0,
          bestWpm: 0.0,
          bestTimeSeconds: 0.0,
          favoriteCarId: 'scrapper-rust',
          totalPoints: 0,
          rank: 8,
        },
      ];

      for (const r of seedRacers) {
        this.db.run(
          `INSERT OR REPLACE INTO leaderboard
           (user_id, username, avatar_seed, wins, losses, win_rate, best_wpm, best_time_seconds, favorite_car_id, total_points, rank)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            r.userId,
            r.username,
            r.avatarSeed,
            r.wins,
            r.losses,
            r.winRate,
            r.bestWpm,
            r.bestTimeSeconds,
            r.favoriteCarId,
            r.totalPoints,
            r.rank,
          ]
        );
      }
    }
  }

  // Schedule auto-persistence
  private schedulePersist() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.persistImmediately();
    }, 300);
  }

  async persistImmediately(): Promise<void> {
    if (!this.db) return;
    try {
      const data = this.db.export();
      await saveToIndexedDB(data);
    } catch (err) {
      console.error('[SQLite] Failed to persist DB:', err);
    }
  }

  // -------------------------------------------------------------
  // USER AUTHENTICATION & PROFILE METHODS
  // -------------------------------------------------------------

  getUserById(userId: string): DbUser | null {
    if (!this.db) return null;
    const res = this.db.exec(
      'SELECT id, username, email, points, created_at, member_since FROM users WHERE id = ?',
      [userId]
    );
    if (!res[0] || !res[0].values[0]) return null;
    const row = res[0].values[0];
    return {
      id: String(row[0]),
      username: String(row[1]),
      email: String(row[2]),
      points: Number(row[3]),
      created_at: String(row[4]),
      member_since: String(row[5]),
    };
  }

  getUserByUsername(username: string): DbUser | null {
    if (!this.db) return null;
    const res = this.db.exec(
      'SELECT id, username, email, points, created_at, member_since FROM users WHERE LOWER(username) = LOWER(?)',
      [username.trim()]
    );
    if (!res[0] || !res[0].values[0]) return null;
    const row = res[0].values[0];
    return {
      id: String(row[0]),
      username: String(row[1]),
      email: String(row[2]),
      points: Number(row[3]),
      created_at: String(row[4]),
      member_since: String(row[5]),
    };
  }

  login(identifier: string, password: string): { success: boolean; user?: DbUser; error?: string } {
    if (!this.db) return { success: false, error: 'Database not ready' };
    const ident = identifier.trim().toLowerCase();
    const res = this.db.exec(
      `SELECT id, username, email, password_hash, points, created_at, member_since
       FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?`,
      [ident, ident]
    );

    if (!res[0] || !res[0].values[0]) {
      return { success: false, error: 'Driver profile not found. Please sign up.' };
    }

    const row = res[0].values[0];
    const passwordHash = String(row[3]);
    if (password.trim() !== passwordHash) {
      return { success: false, error: 'Invalid password. Please check your credentials.' };
    }

    return {
      success: true,
      user: {
        id: String(row[0]),
        username: String(row[1]),
        email: String(row[2]),
        points: Number(row[4]),
        created_at: String(row[5]),
        member_since: String(row[6]),
      },
    };
  }

  signup(
    username: string,
    email: string,
    password: string
  ): { success: boolean; user?: DbUser; error?: string } {
    if (!this.db) return { success: false, error: 'Database not ready' };
    const cleanUser = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Check existing
    const existing = this.db.exec(
      'SELECT id FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)',
      [cleanUser, cleanEmail]
    );
    if (existing[0] && existing[0].values.length > 0) {
      return { success: false, error: 'A driver with this username or email already exists.' };
    }

    const userId = 'user-' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();
    const memberSince = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date());

    this.db.run(
      `INSERT INTO users (id, username, email, password_hash, points, created_at, member_since)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, cleanUser, cleanEmail, password, 0, now, memberSince]
    );

    // Unlock only starter trash car for new users
    this.db.run(
      `INSERT INTO unlocked_cars (user_id, car_id, unlocked_at)
       VALUES (?, ?, ?)`,
      [userId, 'scrapper-rust', now]
    );

    // Add entry in leaderboard
    const currentMaxRankRes = this.db.exec('SELECT MAX(rank) FROM leaderboard');
    const maxRank = (currentMaxRankRes[0]?.values[0]?.[0] as number) || 8;

    this.db.run(
      `INSERT INTO leaderboard (user_id, username, avatar_seed, wins, losses, win_rate, best_wpm, best_time_seconds, favorite_car_id, total_points, rank)
       VALUES (?, ?, ?, 0, 0, 0.0, 0.0, 0.0, 'scrapper-rust', 0, ?)`,
      [userId, cleanUser, cleanUser.toLowerCase(), maxRank + 1]
    );

    this.schedulePersist();

    return {
      success: true,
      user: {
        id: userId,
        username: cleanUser,
        email: cleanEmail,
        points: 0,
        created_at: now,
        member_since: memberSince,
      },
    };
  }

  deleteUser(userId: string): void {
    if (!this.db) return;
    this.db.run('DELETE FROM users WHERE id = ?', [userId]);
    this.db.run('DELETE FROM unlocked_cars WHERE user_id = ?', [userId]);
    this.db.run('DELETE FROM race_history WHERE user_id = ?', [userId]);
    this.db.run('DELETE FROM leaderboard WHERE user_id = ?', [userId]);
    this.db.run('DELETE FROM user_settings WHERE user_id = ?', [userId]);
    this.recalculateRanks();
    this.schedulePersist();
  }

  // -------------------------------------------------------------
  // CAR UNLOCKS
  // -------------------------------------------------------------

  getUnlockedCarIds(userId: string): string[] {
    if (!this.db) return ['scrapper-rust'];
    const res = this.db.exec('SELECT car_id FROM unlocked_cars WHERE user_id = ?', [userId]);
    if (!res[0] || !res[0].values) return ['scrapper-rust'];
    const carIds = res[0].values.map((v) => String(v[0]));
    if (!carIds.includes('scrapper-rust')) {
      carIds.push('scrapper-rust');
    }
    return carIds;
  }

  checkAndUnlockCars(userId: string, totalPoints: number): CarVisualConfig[] {
    if (!this.db) return [];
    const unlockedIds = new Set(this.getUnlockedCarIds(userId));
    const newlyUnlocked: CarVisualConfig[] = [];
    const now = new Date().toISOString();

    for (const car of CARS_LIST) {
      if (totalPoints >= car.unlockPoints && !unlockedIds.has(car.id)) {
        this.db.run(
          'INSERT OR IGNORE INTO unlocked_cars (user_id, car_id, unlocked_at) VALUES (?, ?, ?)',
          [userId, car.id, now]
        );
        newlyUnlocked.push(car);
        unlockedIds.add(car.id);
      }
    }

    if (newlyUnlocked.length > 0) {
      this.schedulePersist();
    }

    return newlyUnlocked;
  }

  // -------------------------------------------------------------
  // RACE TELEMETRY & RECORDS
  // -------------------------------------------------------------

  recordRace(race: {
    userId: string;
    isWin: boolean;
    timeSeconds: number;
    wpm: number;
    accuracy: number;
    mistakes: number;
    carId: string;
    difficulty: string;
    counted: boolean;
  }): {
    pointsEarned: number;
    newTotalPoints: number;
    newlyUnlockedCars: CarVisualConfig[];
    newBests: string[];
  } {
    if (!this.db) {
      return { pointsEarned: 0, newTotalPoints: 0, newlyUnlockedCars: [], newBests: [] };
    }

    // Calculate Points
    // Base: Win = 120 pts, Loss/DNF = 35 pts
    let pointsEarned = race.isWin ? 120 : 35;
    // WPM bonus: 1 pt per WPM
    pointsEarned += Math.round(race.wpm);
    // Accuracy bonus:
    if (race.accuracy >= 98) pointsEarned += 45;
    else if (race.accuracy >= 95) pointsEarned += 25;
    else if (race.accuracy >= 90) pointsEarned += 10;

    // Penalty for mistakes: -2 pts per mistake (min 10 pts total)
    pointsEarned = Math.max(10, pointsEarned - race.mistakes * 2);

    const raceId = 'race-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO race_history (id, user_id, timestamp, is_win, time_seconds, wpm, accuracy, mistakes, car_id, difficulty, points_earned)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        raceId,
        race.userId,
        now,
        race.isWin ? 1 : 0,
        race.timeSeconds,
        race.wpm,
        race.accuracy,
        race.mistakes,
        race.carId,
        race.difficulty,
        pointsEarned,
      ]
    );

    // Update user points
    this.db.run('UPDATE users SET points = points + ? WHERE id = ?', [pointsEarned, race.userId]);
    const updatedUser = this.getUserById(race.userId);
    const newTotalPoints = updatedUser?.points || 0;

    // Check unlocks
    const newlyUnlockedCars = this.checkAndUnlockCars(race.userId, newTotalPoints);

    // Update Leaderboard entry & Career Stats
    const stats = this.getUserStats(race.userId);
    const newBests: string[] = [];

    if (race.wpm >= stats.bestWpm) newBests.push('wpm');
    if (race.accuracy >= stats.bestAccuracy) newBests.push('accuracy');
    if (race.isWin && (stats.bestTimeSeconds === 0 || race.timeSeconds < stats.bestTimeSeconds)) {
      newBests.push('time');
    }

    const lbExisting = this.db.exec('SELECT user_id FROM leaderboard WHERE user_id = ?', [race.userId]);
    const username = updatedUser?.username || 'Driver';

    if (lbExisting[0] && lbExisting[0].values.length > 0) {
      this.db.run(
        `UPDATE leaderboard SET
           wins = ?,
           losses = ?,
           win_rate = ?,
           best_wpm = ?,
           best_time_seconds = ?,
           favorite_car_id = ?,
           total_points = ?
         WHERE user_id = ?`,
        [
          stats.wins,
          stats.losses,
          stats.winRate,
          stats.bestWpm,
          stats.bestTimeSeconds,
          stats.favoriteCarId,
          newTotalPoints,
          race.userId,
        ]
      );
    } else {
      this.db.run(
        `INSERT INTO leaderboard
         (user_id, username, avatar_seed, wins, losses, win_rate, best_wpm, best_time_seconds, favorite_car_id, total_points, rank)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 99)`,
        [
          race.userId,
          username,
          username.toLowerCase(),
          stats.wins,
          stats.losses,
          stats.winRate,
          stats.bestWpm,
          stats.bestTimeSeconds,
          stats.favoriteCarId,
          newTotalPoints,
        ]
      );
    }

    this.recalculateRanks();
    this.schedulePersist();

    return {
      pointsEarned,
      newTotalPoints,
      newlyUnlockedCars,
      newBests,
    };
  }

  private recalculateRanks() {
    if (!this.db) return;
    const res = this.db.exec(
      'SELECT user_id FROM leaderboard ORDER BY total_points DESC, wins DESC, best_wpm DESC'
    );
    if (!res[0] || !res[0].values) return;

    res[0].values.forEach((row, idx) => {
      const uId = String(row[0]);
      this.db?.run('UPDATE leaderboard SET rank = ? WHERE user_id = ?', [idx + 1, uId]);
    });
  }

  // -------------------------------------------------------------
  // QUERIES
  // -------------------------------------------------------------

  getLeaderboard(): DbLeaderboardEntry[] {
    if (!this.db) return [];
    const res = this.db.exec(`
      SELECT user_id, username, avatar_seed, wins, losses, win_rate, best_wpm, best_time_seconds, favorite_car_id, total_points, rank
      FROM leaderboard
      ORDER BY rank ASC
    `);

    if (!res[0] || !res[0].values) return [];
    return res[0].values.map((r) => ({
      user_id: String(r[0]),
      username: String(r[1]),
      avatar_seed: String(r[2]),
      wins: Number(r[3]),
      losses: Number(r[4]),
      win_rate: Number(r[5]),
      best_wpm: Number(r[6]),
      best_time_seconds: Number(r[7]),
      favorite_car_id: String(r[8]),
      total_points: Number(r[9]),
      rank: Number(r[10]),
    }));
  }

  getUserRaceHistory(userId: string, limit = 20): DbRaceHistory[] {
    if (!this.db) return [];
    const res = this.db.exec(
      `SELECT id, user_id, timestamp, is_win, time_seconds, wpm, accuracy, mistakes, car_id, difficulty, points_earned
       FROM race_history
       WHERE user_id = ?
       ORDER BY timestamp DESC
       LIMIT ?`,
      [userId, limit]
    );

    if (!res[0] || !res[0].values) return [];
    return res[0].values.map((r) => ({
      id: String(r[0]),
      user_id: String(r[1]),
      timestamp: String(r[2]),
      is_win: Number(r[3]) === 1,
      time_seconds: Number(r[4]),
      wpm: Number(r[5]),
      accuracy: Number(r[6]),
      mistakes: Number(r[7]),
      car_id: String(r[8]),
      difficulty: String(r[9]),
      points_earned: Number(r[10]),
    }));
  }

  getUserStats(userId: string) {
    if (!this.db) {
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
        favoriteCarId: 'scrapper-rust',
        totalPoints: 0,
      };
    }

    const history = this.getUserRaceHistory(userId, 100);
    const totalRaces = history.length;
    let wins = 0;
    let losses = 0;
    let bestWpm = 0;
    let sumWpm = 0;
    let bestAccuracy = 0;
    let sumAccuracy = 0;
    let bestTimeSeconds = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const carUsage: Record<string, number> = {};

    // Chronological order for streak calculation
    const chronoHistory = [...history].reverse();
    for (const h of chronoHistory) {
      if (h.is_win) {
        wins++;
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        if (bestTimeSeconds === 0 || h.time_seconds < bestTimeSeconds) {
          bestTimeSeconds = h.time_seconds;
        }
      } else {
        losses++;
        tempStreak = 0;
      }
      if (h.wpm > bestWpm) bestWpm = h.wpm;
      sumWpm += h.wpm;
      if (h.accuracy > bestAccuracy) bestAccuracy = h.accuracy;
      sumAccuracy += h.accuracy;
      carUsage[h.car_id] = (carUsage[h.car_id] || 0) + 1;
    }

    currentStreak = tempStreak;
    const winRate = totalRaces > 0 ? Number(((wins / totalRaces) * 100).toFixed(1)) : 0;
    const avgWpm = totalRaces > 0 ? Number((sumWpm / totalRaces).toFixed(1)) : 0;
    const avgAccuracy = totalRaces > 0 ? Number((sumAccuracy / totalRaces).toFixed(1)) : 0;

    let favoriteCarId = 'scrapper-rust';
    let maxUsage = 0;
    for (const [cId, count] of Object.entries(carUsage)) {
      if (count > maxUsage) {
        maxUsage = count;
        favoriteCarId = cId;
      }
    }

    const user = this.getUserById(userId);

    return {
      totalRaces,
      wins,
      losses,
      winRate,
      bestWpm,
      avgWpm,
      bestAccuracy,
      avgAccuracy,
      bestTimeSeconds,
      currentStreak,
      longestStreak,
      favoriteCarId,
      totalPoints: user?.points || 0,
    };
  }

  // -------------------------------------------------------------
  // BACKUP, EXPORT & IMPORT
  // -------------------------------------------------------------

  exportDatabaseBinary(): Uint8Array {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.export();
  }

  downloadDatabaseFile(filename = 'tyvora-racing.sqlite') {
    const data = this.exportDatabaseBinary();
    const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async importDatabaseBinary(bytes: Uint8Array): Promise<void> {
    if (!this.SQL) {
      await this.init();
    }
    if (!this.SQL) throw new Error('Failed to initialize SQLite WASM');
    this.db = new this.SQL.Database(bytes);
    this.initSchema();
    await this.persistImmediately();
  }

  exportDataJson(): string {
    if (!this.db) return '{}';
    const users = this.db.exec('SELECT * FROM users');
    const unlocked = this.db.exec('SELECT * FROM unlocked_cars');
    const races = this.db.exec('SELECT * FROM race_history');
    const lb = this.db.exec('SELECT * FROM leaderboard');

    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      game: 'TYVORA-RACING',
      tables: {
        users: users[0] || null,
        unlocked_cars: unlocked[0] || null,
        race_history: races[0] || null,
        leaderboard: lb[0] || null,
      },
    };

    return JSON.stringify(payload, null, 2);
  }

  downloadJsonBackup(filename = 'tyvora-racing-backup.json') {
    const jsonStr = this.exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async importDataJson(jsonStr: string): Promise<void> {
    const data = JSON.parse(jsonStr);
    if (!data || !data.tables) throw new Error('Invalid Tyvora backup JSON format');

    if (!this.db) {
      await this.init();
    }
    if (!this.db) return;

    this.db.run('BEGIN TRANSACTION;');
    try {
      if (data.tables.users?.values) {
        this.db.run('DELETE FROM users');
        for (const row of data.tables.users.values) {
          this.db.run('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)', row);
        }
      }
      if (data.tables.unlocked_cars?.values) {
        this.db.run('DELETE FROM unlocked_cars');
        for (const row of data.tables.unlocked_cars.values) {
          this.db.run('INSERT INTO unlocked_cars VALUES (?, ?, ?)', row);
        }
      }
      if (data.tables.race_history?.values) {
        this.db.run('DELETE FROM race_history');
        for (const row of data.tables.race_history.values) {
          this.db.run('INSERT INTO race_history VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', row);
        }
      }
      if (data.tables.leaderboard?.values) {
        this.db.run('DELETE FROM leaderboard');
        for (const row of data.tables.leaderboard.values) {
          this.db.run('INSERT INTO leaderboard VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', row);
        }
      }
      this.db.run('COMMIT;');
      await this.persistImmediately();
    } catch (err) {
      this.db.run('ROLLBACK;');
      throw err;
    }
  }

  async resetDatabase(): Promise<void> {
    if (!this.SQL) return;
    this.db = new this.SQL.Database();
    this.initSchema();
    this.seedDefaults();
    await this.persistImmediately();
  }
}

export const sqliteService = new SQLiteService();
