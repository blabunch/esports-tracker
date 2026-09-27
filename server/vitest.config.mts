import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        setupFiles: ['./tests/setup.ts'],
        // Тести ділять одну тестову БД, тому файли виконуються послідовно
        fileParallelism: false,
    },
});
