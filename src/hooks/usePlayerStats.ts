import { useQuery, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/client';

interface PlayerStatsOptions<T> {
    queryKey: readonly unknown[];
    enabled: boolean;
    fetcher: () => Promise<T>;
    // Що записати в історію пошуку, якщо користувач залогінений. Запис будується з відповіді API,
    // а не з введеного тексту: так "huilan#zxc" і "HuiLan#zxc" або посилання на Steam не дублюються
    history?: { game: string; isLoggedIn: boolean; entry: (data: T) => { query: string; label?: string } };
}

export const usePlayerStats = <T,>({ queryKey, enabled, fetcher, history }: PlayerStatsOptions<T>) => {
    const queryClient = useQueryClient();

    return useQuery({
        queryKey,
        enabled,
        queryFn: async () => {
            const data = await fetcher();

            if (history?.isLoggedIn) {
                const { query, label } = history.entry(data);
                gameApi.saveHistory(history.game, query, label)
                    .then(() => queryClient.invalidateQueries({ queryKey: ['history'] }))
                    .catch(() => undefined);
            }
            // Сервер щойно записав новий знімок — графік прогресу треба оновити
            queryClient.invalidateQueries({ queryKey: ['progress'] });

            return data;
        },
    });
};
