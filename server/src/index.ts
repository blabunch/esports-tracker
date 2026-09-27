import 'dotenv/config';
import { createApp } from './app';
import { prisma } from './db';

const PORT = process.env.PORT || 5001;

['FACEIT_API_KEY', 'HENRIKDEV_API_KEY', 'DATABASE_URL'].forEach(name => {
    if (!process.env[name]) console.warn(`⚠️ ${name} is not set — related features will not work`);
});

const server = createApp().listen(PORT, () => console.log(`⚡ Server running on port ${PORT}`));

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
