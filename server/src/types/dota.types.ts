export interface TopHero {
    name: string;
    img: string | null;
    games: number;
}

export interface DotaData {
    profile: {
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
        wins: number;
        losses: number;
        avgGpm: string | number;
        avgXpm: string | number;
        avgKda: string | number;
        avgHd: string | number;
        avgTd: string | number;
        avgLh: string | number;
        analyzedMatches: number;
        mode: string;
        topHeroes: TopHero[];
    };
}