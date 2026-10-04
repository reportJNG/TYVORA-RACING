// apps/web/src/stores/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SEED_LEADERBOARD, LeaderboardRacer } from '../data/mockLeaderboard.js';

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
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
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
}

export interface AuthState {
  currentUser: UserProfile | null;
  stats: CareerStats;
  leaderboard: LeaderboardRacer[];
  isAuthenticated: boolean;

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
  }) => { newBests: string[] };
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
  favoriteCarId: 'meridian-gt',
  recentWpm: [],
  recentAccuracy: [],
  carUsage: {},
  history: [],
};

// Default starter user so players can race immediately
const DEFAULT_USER: UserProfile = {
  id: 'guest-001',
  username: 'Speedster',
  email: 'racer@typerace.io',
  createdAt: new Date().toISOString(),
  memberSince: 'Oct 2026',
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: DEFAULT_USER,
      stats: DEFAULT_STATS,
      leaderboard: SEED_LEADERBOARD,
      isAuthenticated: true,

      login: async (identifier, password) => {
        if (!identifier.trim() || !password.trim()) {
          return { success: false, error: 'Please enter your username/email and password.' };
        }
        if (password.length < 4) {
          return { success: false, error: 'Incorrect username/email or password.' };
        }

        const username = identifier.includes('@') ? identifier.split('@')[0] : identifier;
        const user: UserProfile = {
          id: 'user-' + Math.random().toString(36).substring(2, 9),
          username: username.charAt(0).toUpperCase() + username.slice(1),
          email: identifier.includes('@') ? identifier : `${username.toLowerCase()}@typerace.io`,
          createdAt: new Date().toISOString(),
          memberSince: 'Oct 2026',
        };

        set({
          currentUser: user,
          isAuthenticated: true,
        });

        return { success: true };
      },

      signup: async (username, email, password) => {
        if (!username.trim() || username.length < 3 || username.length > 16) {
          return { success: false, error: 'Username must be 3 to 16 characters.' };
        }
        if (!email.trim() || !email.includes('@')) {
          return { success: false, error: 'Please enter a valid email address.' };
        }
        if (password.length < 8) {
          return { success: false, error: 'Password must be at least 8 characters.' };
        }

        const user: UserProfile = {
          id: 'user-' + Math.random().toString(36).substring(2, 9),
          username: username.trim(),
          email: email.trim().toLowerCase(),
          createdAt: new Date().toISOString(),
          memberSince: 'Oct 2026',
        };

        set({
          currentUser: user,
          isAuthenticated: true,
          stats: DEFAULT_STATS,
        });

        return { success: true };
      },

      logout: () => {
        set({
          currentUser: null,
          isAuthenticated: false,
        });
      },

      deleteAccount: () => {
        set({
          currentUser: null,
          isAuthenticated: false,
          stats: DEFAULT_STATS,
        });
      },

      recordRaceResult: (race) => {
        const current = get().stats;
        const newBests: string[] = [];

        const totalRaces = current.totalRaces + 1;
        let wins = current.wins;
        let losses = current.losses;
        let currentStreak = current.currentStreak;
        let longestStreak = current.longestStreak;
        let bestTimeSeconds = current.bestTimeSeconds;

        if (race.counted) {
          if (race.isWin) {
            wins += 1;
            currentStreak += 1;
            if (currentStreak > longestStreak) {
              longestStreak = currentStreak;
            }
            if (bestTimeSeconds === 0 || race.timeSeconds < bestTimeSeconds) {
              bestTimeSeconds = race.timeSeconds;
              newBests.push('time');
            }
          } else {
            losses += 1;
            currentStreak = 0;
          }
        }

        const totalCounted = wins + losses;
        const winRate = totalCounted > 0 ? Number(((wins / totalCounted) * 100).toFixed(1)) : 0;

        let bestWpm = current.bestWpm;
        if (race.wpm > bestWpm) {
          bestWpm = race.wpm;
          newBests.push('wpm');
        }

        let bestAccuracy = current.bestAccuracy;
        if (race.accuracy > bestAccuracy) {
          bestAccuracy = race.accuracy;
          newBests.push('accuracy');
        }

        // Rolling averages
        const recentWpm = [...current.recentWpm, race.wpm].slice(-50);
        const avgWpm = Number(
          (recentWpm.reduce((acc, v) => acc + v, 0) / recentWpm.length).toFixed(1)
        );

        const recentAccuracy = [...current.recentAccuracy, race.accuracy].slice(-50);
        const avgAccuracy = Number(
          (recentAccuracy.reduce((acc, v) => acc + v, 0) / recentAccuracy.length).toFixed(1)
        );

        // Car usage count
        const carUsage = { ...current.carUsage };
        carUsage[race.carId] = (carUsage[race.carId] || 0) + 1;
        let favoriteCarId = current.favoriteCarId;
        let maxUsage = 0;
        for (const [cId, count] of Object.entries(carUsage)) {
          if (count > maxUsage) {
            maxUsage = count;
            favoriteCarId = cId;
          }
        }

        const newHistoryItem: RaceHistoryItem = {
          id: 'race-' + Date.now(),
          timestamp: new Date().toISOString(),
          isWin: race.isWin,
          timeSeconds: race.timeSeconds,
          wpm: race.wpm,
          accuracy: race.accuracy,
          mistakes: race.mistakes,
          carId: race.carId,
          difficulty: race.difficulty,
          counted: race.counted,
        };

        const updatedStats: CareerStats = {
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
          recentWpm,
          recentAccuracy,
          carUsage,
          history: [newHistoryItem, ...current.history].slice(0, 20),
        };

        // Update leaderboard with user's new standings
        const user = get().currentUser;
        let updatedLeaderboard = [...get().leaderboard];
        if (user && race.counted) {
          const existingIdx = updatedLeaderboard.findIndex((r) => r.userId === user.id);
          const racerEntry: LeaderboardRacer = {
            rank: 0,
            userId: user.id,
            username: user.username,
            avatarSeed: user.username.toLowerCase(),
            wins,
            losses,
            winRate,
            bestWpm,
            bestTimeSeconds: bestTimeSeconds || race.timeSeconds,
            favoriteCarId,
            memberSince: user.memberSince,
          };

          if (existingIdx >= 0) {
            updatedLeaderboard[existingIdx] = racerEntry;
          } else {
            updatedLeaderboard.push(racerEntry);
          }

          // Sort by wins DESC, winRate DESC, bestWpm DESC
          updatedLeaderboard.sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            if (b.winRate !== a.winRate) return b.winRate - a.winRate;
            return b.bestWpm - a.bestWpm;
          });

          // Reassign ranks
          updatedLeaderboard = updatedLeaderboard.map((r, i) => ({ ...r, rank: i + 1 }));
        }

        set({
          stats: updatedStats,
          leaderboard: updatedLeaderboard,
        });

        return { newBests };
      },
    }),
    {
      name: 'typerace_auth_session',
    }
  )
);
