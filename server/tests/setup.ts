import { config } from 'dotenv';
import { afterAll, beforeEach } from 'vitest';

// Локально береться .env.test (окрема тестова БД), у CI — DATABASE_URL із середовища
config({ path: '.env.test', quiet: true });

process.env.JWT_SECRET ??= 'test-secret-that-is-at-least-32-characters-long';
process.env.FRONTEND_URL ??= 'http://localhost:3000';
process.env.FACEIT_API_KEY ??= 'test-faceit-key';
process.env.HENRIKDEV_API_KEY ??= 'test-henrik-key';
process.env.AUTH_RATE_LIMIT_MAX ??= '1000';
process.env.RATE_LIMIT_MAX ??= '1000';

if (!process.env.DATABASE_URL?.includes('test')) {
    throw new Error('Tests must run against a dedicated test database (DATABASE_URL must contain "test")');
}

const { prisma } = await import('../src/db');

beforeEach(async () => {
    await prisma.$executeRawUnsafe(
        'TRUNCATE "SearchHistory", "FavoriteProfile", "PlayerSnapshot", "User" RESTART IDENTITY CASCADE',
    );
});

afterAll(async () => {
    await prisma.$disconnect();
});
