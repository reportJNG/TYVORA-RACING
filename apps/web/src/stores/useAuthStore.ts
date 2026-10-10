// apps/web/src/stores/useAuthStore.ts
import { create } from 'zustand';
import { sqliteService, DbLeaderboardEntry } from '../db/sqlite.js';
import { CarVisualConfig } from '../data/cars.js';
import { LeaderboardRacer } from '../data/mockLeaderboard.js';

export interface RaceHistoryItem {
  id: string;
  timestamp: string;
  isWin: boolean;
  timeSeconds: number;
  wpm: number;
  accuracy: number;
  mistakes: number;
  carId: string;
  difficulty: string;
  counted: boolean;
  pointsEarned?: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  points: number;
  createdAt: string;
  memberSince: string;
}

export interface CareerStats {
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
  recentAccuracy: number[];
  carUsage: Record<string, number>;
  history: RaceHistoryItem[];
  totalPoints: number;
}

export interface AuthState {
  currentUser: UserProfile | null;
  stats: CareerStats;
  leaderboard: LeaderboardRacer[];
  unlockedCars: string[];
  isAuthenticated: boolean;
  isDbReady: boolean;
  newlyUnlockedCar: CarVisualConfig | null;

  initDb: () => Promise<void>;
  refreshFromDb: () => void;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  deleteAccount: () => void;
  recordRaceResult: (race: {
    isWin: boolean;
    timeSeconds: number;
    wpm: number;
    accuracy: number;
    mistakes: number;
    carId: string;
    difficulty: string;
    counted: boolean;
  }) => { newBests: string[]; pointsEarned: number; newlyUnlockedCars: CarVisualConfig[] };
  clearUnlockNotification: () => void;
  buyCar: (carId: string) => Promise<{ success: boolean; error?: string }>;

  // Data persistence & backup actions
  downloadDatabaseFile: () => void;
  importDatabaseFile: (bytes: Uint8Array) => Promise<void>;
  downloadJsonBackup: () => void;
  importJsonBackup: (jsonStr: string) => Promise<void>;
  resetDatabase: () => Promise<void>;
}

const DEFAULT_STATS: CareerStats = {
  totalRaces: 0,
  wins: 0,
  losses: 0,
  winRate: 0.0,
  bestWpm: 0.0,
  avgWpm: 0.0,
  bestAccuracy: 0.0,
  avgAccuracy: 0.0,
  bestTimeSeconds: 0.0,
  currentStreak: 0,
  longestStreak: 0,
  favoriteCarId: 'scrapper-rust',
  recentWpm: [],
  recentAccuracy: [],
  carUsage: {},
  history: [],
  totalPoints: 0,
};

const DEFAULT_USER: UserProfile = {
  id: 'user-speedster',
  username: 'Speedster',
  email: 'speedster@tyvora.racing',
  points: 0,
  createdAt: new Date().toISOString(),
  memberSince: 'Oct 2026',
};

function mapDbLeaderboard(entries: DbLeaderboardEntry[]): LeaderboardRacer[] {
  return entries.map((e) => ({
    rank: e.rank,
    userId: e.user_id,
    username: e.username,
    avatarSeed: e.avatar_seed,
    wins: e.wins,
    losses: e.losses,
    winRate: e.win_rate,
    bestWpm: e.best_wpm,
    bestTimeSeconds: e.best_time_seconds,
    favoriteCarId: e.favorite_car_id,
    memberSince: 'Oct 2026',
    totalPoints: e.total_points,
  }));
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Trigger SQLite initialization in the background immediately
  sqliteService.init().then(() => {
    get().refreshFromDb();
    set({ isDbReady: true });
  }).catch((err) => {
    console.error('[AuthStore] SQLite init error:', err);
  });

  return {
    currentUser: DEFAULT_USER,
    stats: DEFAULT_STATS,
    leaderboard: [],
    unlockedCars: ['scrapper-rust'],
    isAuthenticated: true,
    isDbReady: false,
    newlyUnlockedCar: null,

    initDb: async () => {
      await sqliteService.init();
      get().refreshFromDb();
      set({ isDbReady: true });
    },

    refreshFromDb: () => {
      const current = get().currentUser;
      const lb = sqliteService.getLeaderboard();
      const mappedLb = mapDbLeaderboard(lb);

      if (current) {
        const dbUser = sqliteService.getUserById(current.id);
        const userStats = sqliteService.getUserStats(current.id);
        const unlocked = sqliteService.getUnlockedCarIds(current.id);
        const rawHistory = sqliteService.getUserRaceHistory(current.id, 20);

        const history: RaceHistoryItem[] = rawHistory.map((h) => ({
          id: h.id,
          timestamp: h.timestamp,
          isWin: h.is_win,
          timeSeconds: h.time_seconds,
          wpm: h.wpm,
          accuracy: h.accuracy,
          mistakes: h.mistakes,
          carId: h.car_id,
          difficulty: h.difficulty,
          counted: true,
          pointsEarned: h.points_earned,
        }));

        set({
          currentUser: dbUser
            ? {
                id: dbUser.id,
                username: dbUser.username,
                email: dbUser.email,
                points: dbUser.points,
                createdAt: dbUser.created_at,
                memberSince: dbUser.member_since,
              }
            : current,
          stats: {
            ...userStats,
            recentWpm: history.slice(0, 10).map((h) => h.wpm).reverse(),
            recentAccuracy: history.slice(0, 10).map((h) => h.accuracy).reverse(),
            carUsage: {},
            history,
          },
          leaderboard: mappedLb,
          unlockedCars: unlocked,
        });
      } else {
        set({ leaderboard: mappedLb });
      }
    },

    login: async (identifier, password) => {
      if (!identifier.trim() || !password.trim()) {
        return { success: false, error: 'Please enter your driver handle/email and password.' };
      }

      await sqliteService.init();
      const res = sqliteService.login(identifier, password);
      if (!res.success || !res.user) {
        return { success: false, error: res.error || 'Authentication failed' };
      }

      const userProfile: UserProfile = {
        id: res.user.id,
        username: res.user.username,
        email: res.user.email,
        points: res.user.points,
        createdAt: res.user.created_at,
        memberSince: res.user.member_since,
      };

      set({
        currentUser: userProfile,
        isAuthenticated: true,
      });

      get().refreshFromDb();
      return { success: true };
    },

    signup: async (username, email, password) => {
      if (!username.trim() || username.length < 3 || username.length > 16) {
        return { success: false, error: 'Driver handle must be 3 to 16 characters.' };
      }
      if (!email.trim() || !email.includes('@')) {
        return { success: false, error: 'Please enter a valid email address.' };
      }
      if (password.length < 4) {
        return { success: false, error: 'Password must be at least 4 characters.' };
      }

      await sqliteService.init();
      const res = sqliteService.signup(username, email, password);
      if (!res.success || !res.user) {
        return { success: false, error: res.error || 'Registration failed' };
      }

      const userProfile: UserProfile = {
        id: res.user.id,
        username: res.user.username,
        email: res.user.email,
        points: res.user.points,
        createdAt: res.user.created_at,
        memberSince: res.user.member_since,
      };

      set({
        currentUser: userProfile,
        isAuthenticated: true,
        stats: DEFAULT_STATS,
        unlockedCars: ['scrapper-rust'],
      });

      get().refreshFromDb();
      return { success: true };
    },

    logout: () => {
      set({
        currentUser: null,
        isAuthenticated: false,
        stats: DEFAULT_STATS,
        unlockedCars: ['scrapper-rust'],
      });
    },

    deleteAccount: () => {
      const user = get().currentUser;
      if (user) {
        sqliteService.deleteUser(user.id);
      }
      set({
        currentUser: null,
        isAuthenticated: false,
        stats: DEFAULT_STATS,
        unlockedCars: ['scrapper-rust'],
      });
      get().refreshFromDb();
    },

    recordRaceResult: (race) => {
      const user = get().currentUser || DEFAULT_USER;
      const result = sqliteService.recordRace({
        userId: user.id,
        isWin: race.isWin,
        timeSeconds: race.timeSeconds,
        wpm: race.wpm,
        accuracy: race.accuracy,
        mistakes: race.mistakes,
        carId: race.carId,
        difficulty: race.difficulty,
        counted: race.counted,
      });

      get().refreshFromDb();

      if (result.newlyUnlockedCars.length > 0) {
        set({ newlyUnlockedCar: result.newlyUnlockedCars[0] });
      }

      return {
        newBests: result.newBests,
        pointsEarned: result.pointsEarned,
        newlyUnlockedCars: result.newlyUnlockedCars,
      };
    },

    clearUnlockNotification: () => {
      set({ newlyUnlockedCar: null });
    },

    buyCar: async (carId: string) => {
      const user = get().currentUser || DEFAULT_USER;
      await sqliteService.init();
      const res = sqliteService.buyCar(user.id, carId);
      if (!res.success) {
        return { success: false, error: res.error || 'Failed to purchase vehicle' };
      }
      get().refreshFromDb();
      return { success: true };
    },

    downloadDatabaseFile: () => {
      sqliteService.downloadDatabaseFile('tyvora-racing.sqlite');
    },

    importDatabaseFile: async (bytes: Uint8Array) => {
      await sqliteService.importDatabaseBinary(bytes);
      get().refreshFromDb();
    },

    downloadJsonBackup: () => {
      sqliteService.downloadJsonBackup('tyvora-racing-backup.json');
    },

    importJsonBackup: async (jsonStr: string) => {
      await sqliteService.importDataJson(jsonStr);
      get().refreshFromDb();
    },

    resetDatabase: async () => {
      await sqliteService.resetDatabase();
      set({
        currentUser: DEFAULT_USER,
        stats: DEFAULT_STATS,
        unlockedCars: ['scrapper-rust'],
        isAuthenticated: true,
      });
      get().refreshFromDb();
    },
  };
});
