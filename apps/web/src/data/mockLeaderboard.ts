// apps/web/src/data/mockLeaderboard.ts

export interface LeaderboardRacer {
  rank: number;
  userId: string;
  username: string;
  avatarSeed: string;
  wins: number;
  losses: number;
  winRate: number;
  bestWpm: number;
  bestTimeSeconds: number;
  favoriteCarId: string;
  memberSince: string;
  totalPoints?: number;
}

export const SEED_LEADERBOARD: LeaderboardRacer[] = [
  {
    rank: 1,
    userId: 'user-001',
    username: 'SpeedDemon',
    avatarSeed: 'speeddemon',
    wins: 142,
    losses: 36,
    winRate: 79.8,
    bestWpm: 121,
    bestTimeSeconds: 17.82,
    favoriteCarId: 'strada-r',
    memberSince: 'Mar 2026',
  },
  {
    rank: 2,
    userId: 'user-002',
    username: 'TypeMaster',
    avatarSeed: 'typemaster',
    wins: 127,
    losses: 44,
    winRate: 74.1,
    bestWpm: 114,
    bestTimeSeconds: 18.94,
    favoriteCarId: 'meridian-gt',
    memberSince: 'Mar 2026',
  },
  {
    rank: 3,
    userId: 'user-003',
    username: 'Nitro',
    avatarSeed: 'nitro',
    wins: 111,
    losses: 47,
    winRate: 70.3,
    bestWpm: 108,
    bestTimeSeconds: 19.45,
    favoriteCarId: 'volta-e',
    memberSince: 'Feb 2026',
  },
  {
    rank: 4,
    userId: 'user-004',
    username: 'Mounir',
    avatarSeed: 'mounir',
    wins: 98,
    losses: 48,
    winRate: 67.1,
    bestWpm: 99,
    bestTimeSeconds: 20.12,
    favoriteCarId: 'strada-r',
    memberSince: 'Jan 2026',
  },
  {
    rank: 5,
    userId: 'user-005',
    username: 'RacerX',
    avatarSeed: 'racerx',
    wins: 94,
    losses: 55,
    winRate: 63.1,
    bestWpm: 95,
    bestTimeSeconds: 21.05,
    favoriteCarId: 'meridian-gt',
    memberSince: 'Jan 2026',
  },
  {
    rank: 6,
    userId: 'user-006',
    username: 'ApexDriver',
    avatarSeed: 'apexdriver',
    wins: 86,
    losses: 51,
    winRate: 62.7,
    bestWpm: 92,
    bestTimeSeconds: 21.84,
    favoriteCarId: 'volta-e',
    memberSince: 'Feb 2026',
  },
  {
    rank: 7,
    userId: 'user-007',
    username: 'VelocityQueen',
    avatarSeed: 'velocityqueen',
    wins: 79,
    losses: 52,
    winRate: 60.3,
    bestWpm: 89,
    bestTimeSeconds: 22.31,
    favoriteCarId: 'strada-r',
    memberSince: 'Feb 2026',
  },
  {
    rank: 8,
    userId: 'user-008',
    username: 'NightRider',
    avatarSeed: 'nightrider',
    wins: 64,
    losses: 48,
    winRate: 57.1,
    bestWpm: 86,
    bestTimeSeconds: 23.40,
    favoriteCarId: 'meridian-gt',
    memberSince: 'Mar 2026',
  },
];
