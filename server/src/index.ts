import 'dotenv/config';
import express from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import { prisma } from './db';

import { register, login, linkAccounts, getMe, updateProfile } from './controllers/authController';
import { verifyToken } from './middlewares/authMiddleware';
import { errorHandler } from './middlewares/errorHandler';
import { apiCache } from './utils/cache';
import { HttpError } from './utils/httpError';
import rateLimit from 'express-rate-limit';

import { getValorantStats, getMatchDetails } from './services/valorantService';
import { getDotaStats, getDotaMatchDetails } from './services/dotaService';
import { getFaceitStats, getFaceitMatchDetails } from './services/csService';

const app = express();
const PORT = process.env.PORT || 5001;
// Кількість проксі перед сервером (Render/Railway/Heroku — 1). Від цього залежить коректний IP для rate limit
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 1));

['FACEIT_API_KEY', 'HENRIKDEV_API_KEY', 'DATABASE_URL'].forEach(name => {
    if (!process.env[name]) console.warn(`⚠️ ${name} is not set — related features will not work`);
});

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 хвилин
    limit: 300, // ліміт 300 запитів з однієї IP
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Забагато запитів, спробуйте пізніше.' }
});

// Окремий суворий ліміт на логін/реєстрацію — захист від перебору паролів
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Забагато спроб входу, спробуйте пізніше.' }
});

const MAX_TEXT_LENGTH = 128;
const MAX_FAVORITE_PAYLOAD_LENGTH = 2000;

const readText = (value: unknown, maxLength = MAX_TEXT_LENGTH): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed && trimmed.length <= maxLength ? trimmed : null;
};

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
// 🎮 STATS ROUTES (ПОРЯДОК ВИПРАВЛЕНО!)
// ==========================================

// 🔥 VALORANT
app.get('/api/valorant/match/:matchId', async (req, res, next) => {
    try {
        const data = await getMatchDetails(req.params.matchId);
        res.json(data);
    } catch (error) { next(error); }
});

app.get('/api/valorant/:name/:tag', async (req, res, next) => {
    try {
        const { name, tag } = req.params;
        const cacheKey = `val_${name.toLowerCase()}_${tag.toLowerCase()}`;

        const cachedData = apiCache.get(cacheKey);
        if (cachedData) return res.json(cachedData);

        const data = await getValorantStats(name, tag);
        apiCache.set(cacheKey, data, 5);
        res.json(data);
    } catch (error) { next(error); }
});

// 🔥 CS2
app.get('/api/cs2/match/:matchId', async (req, res, next) => {
    try {
        const data = await getFaceitMatchDetails(req.params.matchId);
        res.json(data);
    } catch (error) { next(error); }
});

app.get('/api/cs2/:nickname', async (req, res, next) => {
    try {
        const { nickname } = req.params;
        const cacheKey = `cs2_${nickname.toLowerCase()}`;

        const cachedData = apiCache.get(cacheKey);
        if (cachedData) return res.json(cachedData);

        const data = await getFaceitStats(nickname);
        apiCache.set(cacheKey, data, 5); 
        res.json(data);
    } catch (error) { next(error); }
});

// 🔥 DOTA 2
app.get('/api/dota/match/:matchId', async (req, res, next) => {
    try {
        const data = await getDotaMatchDetails(req.params.matchId);
        res.json(data);
    } catch (error) { next(error); }
});

app.get('/api/dota/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const cacheKey = `dota_${id.toLowerCase()}`;

        const cachedData = apiCache.get(cacheKey);
        if (cachedData) return res.json(cachedData);

        const data = await getDotaStats(id);
        apiCache.set(cacheKey, data, 5);
        res.json(data);
    } catch (error) { next(error); }
});

// ==========================================
// 🕒 HISTORY ROUTES
// ==========================================
app.get('/api/history', verifyToken, async (req: any, res, next) => {
    try {
        const history = await prisma.searchHistory.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(history);
    } catch (error) { next(error); }
});

app.post('/api/history', verifyToken, async (req: any, res, next) => {
    try {
        const userId = req.user.userId;
        const game = readText(req.body?.game);
        const query = readText(req.body?.query);
        const mode = req.body?.mode === undefined ? null : readText(req.body.mode);

        if (!game || !query) {
            return res.status(400).json({ message: 'Game and query are required' });
        }

        const existing = await prisma.searchHistory.findFirst({
            where: { userId, game, query }
        });

        if (existing) {
            const updated = await prisma.searchHistory.update({
                where: { id: existing.id },
                data: { createdAt: new Date() }
            });
            return res.status(200).json(updated);
        }

        const newHistory = await prisma.searchHistory.create({
            data: { game, query, mode, userId }
        });
        res.status(201).json(newHistory);
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

// 🛡️ ГЛОБАЛЬНИЙ ОБРОБНИК ПОМИЛОК
app.use(errorHandler);

const server = app.listen(PORT, () => console.log(`⚡ Server running on port ${PORT}`));

// Коректне завершення при рестарті/редеплої: дочікуємось активних запитів і закриваємо з'єднання з БД
const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
