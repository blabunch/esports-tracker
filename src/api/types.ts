export interface ChartPoint {
    name: string;
    kda?: number;
    gpm?: number;
    kd?: number;
    acs?: number;
    kills?: number;
    matchId?: string | number;
}

export interface MatchSummary {
    id: string;
    win: boolean;
    map?: string;
    agent?: string;
    hero?: string;
    score?: string;
    kda?: string;
    duration?: string;
    date?: string;
}

// 🎮 CS2
export interface Cs2Data {
    profile: {
        playerId: string;
        nickname: string;
        avatar: string;
        country: string;
        level: number;
        elo: number | string;
        faceitUrl: string;
        membership: string;
    };
    stats: {
        matches: number;
        wins: number;
        winRate: string | number;
        recentWinRate: string | number;
        kdr: string | number;
        hs: string | number;
        totalHeadshots: number;
        longestStreak: number;
        currentStreak: number;
        recentResults: string[];
        topMaps: Array<{ name: string; img: string; matches: number; winRate: string; kd: number }>;
        chartData: ChartPoint[];
    };
    matches: MatchSummary[];
}

// 🎮 DOTA 2
export interface DotaData {
    profile: {
        accountId: string | number;
        nickname: string;
        avatar: string;
        country: string;
        steamUrl: string;
        rank_tier: number | null;
        leaderboard_rank: number | null;
    };
    stats: {
        matches: number;
        winRate: string | number;
        avgGpm: string | number;
        avgXpm: string | number;
        avgKda: string;
        kdaRatio: string | number;
        avgHd: string | number;
        avgLh: string | number;
        avgHealing: string | number;
        avgTowerDamage: string | number;
        maxKills: number;
        maxDamage: string | number;
        avgDuration: string;
        recentResults: string[];
        topHeroes: Array<{ name: string; img: string | null; games: number }>;
        chartData: ChartPoint[];
        signatureHero: { name: string; img: string | null; winRate: string; games: number } | null;
        allTimeTotals: { kills: string; deaths: string; assists: string };
        topTeammates: Array<{ name: string; avatar: string; games: number; winRate: string }>;
        warnings?: string[];
    };
    matches: MatchSummary[];
}

// 🎮 VALORANT
export interface ValorantData {
    profile: {
        nickname: string;
        tag: string;
        level: number;
        avatar: string;
        trackerUrl: string;
    };
    stats: {
        rank: string;
        rank_img: string;
        elo: number;
        mmr?: number | null;
        peakRank: string;
        totalGames: number;
        totalWinRate: string | number;
        kdr: string | number;
        avgKda: string;
        acs: number | string;
        adr: number | string;
        hs: string | number;
        role: string;
        maxKills: number | string;
        frequentDuo: { name: string; tag: string; count: number; winRate: string } | null;
        recent: string[];
        topAgents: Array<{ name: string; img: string; count: number }>;
        mapStats?: Array<{ name: string; matches: number; wins: number; winRate: string | number }>;
        chartData: ChartPoint[];
        hasMatches?: boolean;
        matchLimit?: number;
        warnings?: string[];
    };
    matches: MatchSummary[];
}

export interface SearchHistoryItem {
    id: number;
    userId: number;
    game: string;
    query: string;
    mode?: string;
    createdAt: string;
}

export interface FavoriteProfileItem {
    id: number;
    shortcutId: string;
    game: string;
    label: string;
    subtitle?: string | null;
    payload: Record<string, string>;
    createdAt: string;
    updatedAt: string;
}

export type ProgressGame = 'valorant' | 'cs2' | 'dota';

export interface ProgressPoint {
    date: string;
    elo?: number | null;
    level?: number | null;
    rank?: string | null;
    rankTier?: number | null;
    kd?: number | null;
    winRate?: number | null;
    matches?: number | null;
}

export interface RecentPlayer {
    game: ProgressGame;
    playerKey: string;
    displayName: string;
    metrics: Omit<ProgressPoint, 'date'>;
    updatedAt: string;
}

export interface Overview {
    playersTracked: number;
    profilesChecked24h: number;
    recentPlayers: RecentPlayer[];
}

export interface User {
    id: number;
    email: string;
    displayName: string | null;
    valName: string | null;
    valTag: string | null;
    dotaId: string | null;
    faceitNickname: string | null;
}
