import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/client';
import { FavoriteProfileItem, SearchHistoryItem } from '../api/types';
import { HISTORY_GAME } from '../routes';

export type GameShortcutKey = 'valorant' | 'dota' | 'cs2';

export interface ProfileShortcut {
    id: string;
    label: string;
    subtitle?: string;
    payload: Record<string, string>;
    updatedAt?: number;
}

const MAX_RECENT = 6;
const MAX_FAVORITES = 9;

const normalizePayload = (payload: unknown): Record<string, string> => {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};

    return Object.entries(payload).reduce<Record<string, string>>((acc, [key, value]) => {
        if (value !== undefined && value !== null) acc[key] = String(value);
        return acc;
    }, {});
};

const favoriteToShortcut = (favorite: FavoriteProfileItem): ProfileShortcut => ({
    id: favorite.shortcutId,
    label: favorite.label,
    subtitle: favorite.subtitle || undefined,
    payload: normalizePayload(favorite.payload),
    updatedAt: new Date(favorite.updatedAt).getTime(),
});

const historyToShortcut = (game: GameShortcutKey, item: SearchHistoryItem): ProfileShortcut | null => {
    const query = item.query.trim();
    if (!query) return null;
    const updatedAt = new Date(item.createdAt).getTime();

    if (game === 'valorant') {
        const [name, tag] = query.split('#');
        if (!name || !tag) return null;

        return {
            id: `valorant:${name.toLowerCase()}#${tag.toLowerCase()}`,
            label: `${name}#${tag}`,
            subtitle: 'Search history',
            payload: { name, tag },
            updatedAt,
        };
    }

    if (game === 'dota') {
        return { id: `dota:${query}`, label: item.label || query, subtitle: item.label ? `Steam ID ${query}` : 'Steam 32-bit ID', payload: { id: query }, updatedAt };
    }

    return { id: `cs2:${query.toLowerCase()}`, label: item.label || query, subtitle: 'Faceit nickname', payload: { nickname: query }, updatedAt };
};

export const useProfileShortcuts = (game: GameShortcutKey, user?: { id?: number } | null) => {
    const canSync = Boolean(user?.id);
    const queryClient = useQueryClient();
    const favoritesKey = ['favorites', game];

    const historyQuery = useQuery({
        queryKey: ['history'],
        queryFn: gameApi.getHistory,
        enabled: canSync,
    });

    const favoritesQuery = useQuery({
        queryKey: favoritesKey,
        queryFn: () => gameApi.getFavorites(game),
        enabled: canSync,
    });

    const recent = useMemo(() => (historyQuery.data || [])
        .filter(item => item.game === HISTORY_GAME[game])
        .map(item => historyToShortcut(game, item))
        .filter((item): item is ProfileShortcut => Boolean(item))
        .slice(0, MAX_RECENT), [historyQuery.data, game]);

    const favorites = useMemo(
        () => (favoritesQuery.data || []).map(favoriteToShortcut).slice(0, MAX_FAVORITES),
        [favoritesQuery.data],
    );

    const invalidateFavorites = () => queryClient.invalidateQueries({ queryKey: favoritesKey });

    const saveMutation = useMutation({
        mutationFn: (shortcut: ProfileShortcut) => gameApi.saveFavorite({
            shortcutId: shortcut.id,
            game,
            label: shortcut.label.trim(),
            subtitle: shortcut.subtitle?.trim(),
            payload: normalizePayload(shortcut.payload),
        }),
        onSuccess: invalidateFavorites,
    });

    const removeMutation = useMutation({
        mutationFn: (id: string) => gameApi.deleteFavorite(id),
        onSuccess: invalidateFavorites,
    });

    const isFavorite = useCallback((id: string) => favorites.some(item => item.id === id), [favorites]);

    const toggleFavorite = async (shortcut: ProfileShortcut) => {
        if (!canSync) return false;

        if (isFavorite(shortcut.id)) {
            await removeMutation.mutateAsync(shortcut.id);
            return false;
        }

        await saveMutation.mutateAsync(shortcut);
        return true;
    };

    const removeFavorite = async (id: string) => {
        if (!canSync) return;
        await removeMutation.mutateAsync(id);
    };

    return {
        recent: canSync ? recent : [],
        favorites: canSync ? favorites : [],
        canSync,
        toggleFavorite,
        removeFavorite,
        isFavorite,
    };
};
