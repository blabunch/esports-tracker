import { prisma } from '../db';
import { HttpError } from '../utils/httpError';

export const PROGRESS_GAMES = ['valorant', 'cs2', 'dota'] as const;
export type ProgressGame = typeof PROGRESS_GAMES[number];

const MAX_PROGRESS_POINTS = 90;

type Metrics = Record<string, number | string | null>;

interface SnapshotInput {
    playerKey: string;
    displayName: string;
    metrics: Metrics;
}

const toNumber = (value: unknown): number | null => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

// Ключ гравця має бути стабільним: з нього фронтенд потім запитує історію прогресу
export const valorantPlayerKey = (name: string, tag: string) => `${name}#${tag}`.toLowerCase();

const extractSnapshot = (game: ProgressGame, data: any): SnapshotInput | null => {
    if (game === 'valorant') {
        if (!data?.profile?.nickname || !data?.profile?.tag) return null;
        return {
            playerKey: valorantPlayerKey(data.profile.nickname, data.profile.tag),
            displayName: `${data.profile.nickname}#${data.profile.tag}`,
            metrics: {
                elo: toNumber(data.stats?.mmr),
                rank: data.stats?.rank ?? null,
                kd: toNumber(data.stats?.kdr),
                winRate: toNumber(data.stats?.totalWinRate),
            },
        };
    }

    if (game === 'cs2') {
        if (!data?.profile?.playerId) return null;
        return {
            playerKey: String(data.profile.playerId),
            displayName: data.profile.nickname,
            metrics: {
                elo: toNumber(data.profile.elo),
                level: toNumber(data.profile.level),
                kd: toNumber(data.stats?.kdr),
                winRate: toNumber(data.stats?.winRate),
            },
        };
    }

    if (!data?.profile?.accountId) return null;
    return {
        playerKey: String(data.profile.accountId),
        displayName: data.profile.nickname,
        metrics: {
            rankTier: toNumber(data.profile.rank_tier),
            winRate: toNumber(data.stats?.winRate),
            matches: toNumber(data.stats?.matches),
        },
    };
};

const startOfToday = () => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

// Знімок — побічна функція: якщо БД недоступна, пошук гравця все одно має працювати
export const recordSnapshot = async (game: ProgressGame, data: unknown) => {
    try {
        const snapshot = extractSnapshot(game, data);
        if (!snapshot) return;

        const day = startOfToday();
        await prisma.playerSnapshot.upsert({
            where: { game_playerKey_day: { game, playerKey: snapshot.playerKey, day } },
            update: { displayName: snapshot.displayName, metrics: snapshot.metrics },
            create: { game, day, ...snapshot },
        });
    } catch (error: any) {
        console.error('⚠️ Failed to record player snapshot:', error?.message || error);
    }
};

export const getProgress = async (game: string, playerKey: string) => {
    if (!PROGRESS_GAMES.includes(game as ProgressGame)) {
        throw new HttpError(400, 'Unknown game');
    }
    if (!playerKey || playerKey.length > 64) {
        throw new HttpError(400, 'Invalid player key');
    }

    const snapshots = await prisma.playerSnapshot.findMany({
        where: { game, playerKey: playerKey.toLowerCase() },
        orderBy: { day: 'desc' },
        take: MAX_PROGRESS_POINTS,
        select: { day: true, metrics: true },
    });

    return snapshots.reverse().map(snapshot => ({
        date: snapshot.day.toISOString().slice(0, 10),
        ...(snapshot.metrics as Metrics),
    }));
};

const RECENT_PLAYERS_LIMIT = 6;

export const getOverview = async () => {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [players, checkedToday, latest] = await Promise.all([
        prisma.playerSnapshot.groupBy({ by: ['game', 'playerKey'] }),
        prisma.playerSnapshot.count({ where: { updatedAt: { gte: dayAgo } } }),
        prisma.playerSnapshot.findMany({
            orderBy: { updatedAt: 'desc' },
            take: RECENT_PLAYERS_LIMIT * 5,
            select: { game: true, playerKey: true, displayName: true, metrics: true, updatedAt: true },
        }),
    ]);

    // Один запис на гравця: знімки зберігаються щодня, тож той самий гравець може трапитись кілька разів
    const seen = new Set<string>();
    const recentPlayers = latest
        .filter(snapshot => {
            const key = `${snapshot.game}:${snapshot.playerKey}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, RECENT_PLAYERS_LIMIT)
        .map(snapshot => ({ ...snapshot, updatedAt: snapshot.updatedAt.toISOString() }));

    return {
        playersTracked: players.length,
        profilesChecked24h: checkedToday,
        recentPlayers,
    };
};
