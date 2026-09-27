import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Помилки на кшталт "гравця не знайдено" немає сенсу повторювати
            retry: false,
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
        },
    },
});
