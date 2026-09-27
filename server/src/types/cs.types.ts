export interface BestMap {
    name: string;
    winRate: string;
    image: string;
}

export interface Cs2Data {
    profile: {
        nickname: string;
        avatar: string;
        country: string;
        level: number;
        elo: number | string;
        faceitUrl: string;
    };
    stats: {
        matches: string | number;
        winRate: string | number;
        kdr: string | number;
        hs: string | number;
        adr: string | number;
        avgKills: string | number;
        currentStreak: string | number;
        longStreak: string | number;
        recentResults: string[];
        bestMap: BestMap | null;
        gameMode: string;
    };
}