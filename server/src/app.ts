import express, { RequestHandler } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { prisma } from './db';

import { register, login, linkAccounts, getMe, updateProfile } from './controllers/authController';
import { verifyToken } from './middlewares/authMiddleware';
import { errorHandler } from './middlewares/errorHandler';
import { apiCache } from './utils/cache';
import { HttpError } from './utils/httpError';

import { getValorantStats, getMatchDetails } from './services/valorantService';
import { getDotaStats, getDotaMatchDetails } from './services/dotaService';
import { getFaceitStats, getFaceitMatchDetails } from './services/csService';
import { ProgressGame, getOverview, getProgress, recordSnapshot } from './services/progressService';

const MAX_TEXT_LENGTH = 128;
const MAX_FAVORITE_PAYLOAD_LENGTH = 2000;
const STATS_CACHE_MINUTES = 5;

const readText = (value: unknown, maxLength = MAX_TEXT_LENGTH): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed && trimmed.length <= maxLength ? trimmed : null;
};

// Спільна логіка для статистики гравця: кеш → зовнішній API → знімок прогресу
const statsRoute = (
    game: ProgressGame,
    getCacheKey: (params: Record<string, string>) => string,
    fetchStats: (params: Record<string, string>) => Promise<unknown>,
): RequestHandler => async (req, res, next) => {
    try {
        const params = req.params as Record<string, string>;
        const cacheKey = `${game}_${getCacheKey(params).toLowerCase()}`;

        const cachedData = apiCache.get(cacheKey);
        if (cachedData) return res.json(cachedData);

        const data = await fetchStats(params);
        apiCache.set(cacheKey, data, STATS_CACHE_MINUTES);
        await recordSnapshot(game, data);
        res.json(data);
    } catch (error) { next(error); }
};

const jsonRoute = (handler: (params: Record<string, string>) => Promise<unknown>): RequestHandler =>
    async (req, res, next) => {
        try {
            res.json(await handler(req.params as Record<string, string>));
        } catch (error) { next(error); }
    };

export const createApp = () => {
    const app = express();
    // Кількість проксі перед сервером (Render/Railway/Heroku — 1). Від цього залежить коректний IP для rate limit
    app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 1));

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 хвилин
        limit: Number(process.env.RATE_LIMIT_MAX ?? 300), // ліміт запитів з однієї IP
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: { error: 'Too many requests, please try again later.' }
    });

    // Окремий суворий ліміт на логін/реєстрацію — захист від перебору паролів
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 20),
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: { error: 'Too many login attempts, please try again later.' }
    });

    const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);

    const corsOptions: CorsOptions = {
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }

            callback(new HttpError(403, 'Not allowed by CORS'));
        },
        optionsSuccessStatus: 200
    };

    app.use(helmet());
    app.use(cors(corsOptions));
    app.use(express.json({ limit: '10kb' }));

    // Healthcheck для платформи деплою (без rate limit і без БД)
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok' });
    });

    app.use('/api/', limiter);

    // ==========================================
    // 🛡️ AUTH ROUTES
    // ==========================================
    app.post('/api/auth/register', authLimiter, register);
    app.post('/api/auth/login', authLimiter, login);
    app.get('/api/auth/me', verifyToken, getMe);
    app.put('/api/auth/link', verifyToken, linkAccounts);
    app.put('/api/auth/profile', verifyToken, updateProfile);

    // ==========================================
    // 🎮 STATS ROUTES (маршрути матчів мають йти перед маршрутами гравців)
    // ==========================================
    app.get('/api/valorant/match/:matchId', jsonRoute(({ matchId }) => getMatchDetails(matchId)));
    app.get('/api/valorant/:name/:tag', statsRoute(
        'valorant',
        ({ name, tag }) => `${name}_${tag}`,
        ({ name, tag }) => getValorantStats(name, tag),
    ));

    app.get('/api/cs2/match/:matchId', jsonRoute(({ matchId }) => getFaceitMatchDetails(matchId)));
    app.get('/api/cs2/:nickname', statsRoute(
        'cs2',
        ({ nickname }) => nickname,
        ({ nickname }) => getFaceitStats(nickname),
    ));

    app.get('/api/dota/match/:matchId', jsonRoute(({ matchId }) => getDotaMatchDetails(matchId)));
    app.get('/api/dota/:id', statsRoute(
        'dota',
        ({ id }) => id,
        ({ id }) => getDotaStats(id),
    ));

    // ==========================================
    // 📈 PROGRESS & OVERVIEW
    // ==========================================
    app.get('/api/progress/:game/:playerKey', jsonRoute(({ game, playerKey }) => getProgress(game, playerKey)));
    app.get('/api/overview', jsonRoute(() => getOverview()));

    // ==========================================
    // 🕒 HISTORY ROUTES
    // ==========================================
    app.get('/api/history', verifyToken, async (req: any, res, next) => {
        try {
            const history = await prisma.searchHistory.findMany({
                where: { userId: req.user.userId },
                orderBy: { createdAt: 'desc' }
            });

            // Старі записи Dota зберігали лише числовий ID — підставляємо нікнейм зі знімків прогресу
            const unlabeledDotaIds = history
                .filter(entry => entry.game === 'Dota 2' && !entry.label && /^\d+$/.test(entry.query))
                .map(entry => entry.query);
            if (unlabeledDotaIds.length > 0) {
                const snapshots = await prisma.playerSnapshot.findMany({
                    where: { game: 'dota', playerKey: { in: unlabeledDotaIds } },
                    orderBy: { updatedAt: 'desc' },
                    select: { playerKey: true, displayName: true },
                });
                const names = new Map<string, string>();
                snapshots.forEach(snapshot => { if (!names.has(snapshot.playerKey)) names.set(snapshot.playerKey, snapshot.displayName); });
                history.forEach(entry => { if (!entry.label && names.has(entry.query)) entry.label = names.get(entry.query)!; });
            }

            res.json(history);
        } catch (error) { next(error); }
    });

    app.post('/api/history', verifyToken, async (req: any, res, next) => {
        try {
            const userId = req.user.userId;
            const game = readText(req.body?.game);
            const query = readText(req.body?.query);
            const mode = req.body?.mode === undefined ? null : readText(req.body.mode);
            const label = req.body?.label === undefined ? null : readText(req.body.label);

            if (!game || !query) {
                return res.status(400).json({ message: 'Game and query are required' });
            }

            const entry = await prisma.searchHistory.upsert({
                where: { userId_game_query: { userId, game, query } },
                update: { createdAt: new Date(), mode, ...(label ? { label } : {}) },
                create: { game, query, label, mode, userId }
            });
            res.json(entry);
        } catch (error) { next(error); }
    });

    app.delete('/api/history', verifyToken, async (req: any, res, next) => {
        try {
            await prisma.searchHistory.deleteMany({
                where: { userId: req.user.userId }
            });
            res.json({ message: 'History cleared successfully' });
        } catch (error) { next(error); }
    });

    // ==========================================
    // ⭐ FAVORITE PROFILE ROUTES
    // ==========================================
    app.get('/api/favorites', verifyToken, async (req: any, res, next) => {
        try {
            const game = typeof req.query.game === 'string' ? req.query.game.trim() : '';

            const favorites = await prisma.favoriteProfile.findMany({
                where: {
                    userId: req.user.userId,
                    ...(game ? { game } : {})
                },
                orderBy: { updatedAt: 'desc' }
            });

            res.json(favorites);
        } catch (error) { next(error); }
    });

    app.post('/api/favorites', verifyToken, async (req: any, res, next) => {
        try {
            const userId = req.user.userId;
            const shortcutId = readText(req.body?.shortcutId, 256);
            const game = readText(req.body?.game);
            const label = readText(req.body?.label);
            const subtitle = req.body?.subtitle ? readText(req.body.subtitle) : null;
            const payload = req.body?.payload;

            if (
                !shortcutId || !game || !label || (req.body?.subtitle && !subtitle) ||
                !payload || typeof payload !== 'object' || Array.isArray(payload) ||
                JSON.stringify(payload).length > MAX_FAVORITE_PAYLOAD_LENGTH
            ) {
                return res.status(400).json({ message: 'Invalid favorite profile payload' });
            }

            const favorite = await prisma.favoriteProfile.upsert({
                where: { userId_shortcutId: { userId, shortcutId } },
                update: { game, label, subtitle, payload },
                create: { userId, shortcutId, game, label, subtitle, payload }
            });

            res.json(favorite);
        } catch (error) { next(error); }
    });

    app.delete('/api/favorites/:shortcutId', verifyToken, async (req: any, res, next) => {
        try {
            await prisma.favoriteProfile.deleteMany({
                where: {
                    userId: req.user.userId,
                    shortcutId: req.params.shortcutId
                }
            });

            res.json({ message: 'Favorite removed successfully' });
        } catch (error) { next(error); }
    });

    app.use('/api', (req, res) => {
        res.status(404).json({ success: false, message: 'Not found', error: 'Not found' });
    });

    // 🛡️ ГЛОБАЛЬНИЙ ОБРОБНИК ПОМИЛОК
    app.use(errorHandler);

    return app;
};
