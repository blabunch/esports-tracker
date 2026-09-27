export interface AgentStat {
    name: string;
    count: number;
    img: string;
}

export interface MapStat {
    name: string;
    winRate: string;
    matches: number;
    wins: number;
}

export interface ValorantProfile {
    nickname: string;
    tag: string;
    avatar: string;
    level: number;
    region: string;
}

export interface ValorantStats {
    rank: string;
    rank_img: string;
    elo: number;
    kdr: string | number;
    hs: string | number;
    adr: string;
    acs: string;
    recentWinRate: string | number;
    totalGames: number;
    totalWins: number;
    totalLosses: number;
    totalWinRate: string | number;
    recent: string[];
    topAgents: AgentStat[];
    mapStats?: MapStat[];
    bestMap?: MapStat | null;
    hasMatches?: boolean;
    matchLimit?: number;
    warnings?: string[];
}

// Головний інтерфейс, який буде повертати наш сервіс
export interface ValorantData {
    profile: ValorantProfile;
    stats: ValorantStats;
}
