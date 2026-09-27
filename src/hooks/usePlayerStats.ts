import { useQuery, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/client';

interface PlayerStatsOptions<T> {
    queryKey: readonly unknown[];
    enabled: boolean;
    fetcher: () => Promise<T>;
    // Що записати в історію пошуку, якщо користувач залогінений
    history?: { game: string; query: string; isLoggedIn: boolean };
}

export const usePlayerStats = <T,>({ queryKey, enabled, fetcher, history }: PlayerStatsOptions<T>) => {
    const queryClient = useQueryClient();

    return useQuery({
        queryKey,
        enabled,
        queryFn: async () => {
            const data = await fetcher();

            if (history?.isLoggedIn) {
                gameApi.saveHistory(history.game, history.query)
                    .then(() => queryClient.invalidateQueries({ queryKey: ['history'] }))
                    .catch(() => undefined);
            }
            // Сервер щойно записав новий знімок — графік прогресу треба оновити
            queryClient.invalidateQueries({ queryKey: ['progress'] });

            return data;
        },
    });
};
