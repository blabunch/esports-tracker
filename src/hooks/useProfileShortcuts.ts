import { useCallback, useEffect, useState } from 'react';
import { gameApi } from '../api/client';
import { FavoriteProfileItem, SearchHistoryItem } from '../api/types';

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

const historyGameName: Record<GameShortcutKey, string> = {
    valorant: 'Valorant',
    dota: 'Dota 2',
    cs2: 'CS2',
};

const normalizePayload = (payload: unknown): Record<string, string> => {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};

    return Object.entries(payload).reduce<Record<string, string>>((acc, [key, value]) => {
        if (value !== undefined && value !== null) acc[key] = String(value);
        return acc;
    }, {});
};

const normalizeShortcut = (shortcut: ProfileShortcut): ProfileShortcut => ({
    ...shortcut,
    label: shortcut.label.trim(),
    subtitle: shortcut.subtitle?.trim(),
    payload: normalizePayload(shortcut.payload),
    updatedAt: shortcut.updatedAt || Date.now(),
});

const upsertShortcut = (items: ProfileShortcut[], shortcut: ProfileShortcut, limit: number) => {
    const normalized = normalizeShortcut(shortcut);
    return [normalized, ...items.filter(item => item.id !== normalized.id)].slice(0, limit);
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

    if (game === 'valorant') {
        const [name, tag] = query.split('#');
        if (!name || !tag) return null;

        return {
            id: `valorant:${name.toLowerCase()}#${tag.toLowerCase()}`,
            label: `${name}#${tag}`,
            subtitle: 'Search history',
            payload: { name, tag },
            updatedAt: new Date(item.createdAt).getTime(),
        };
    }

    if (game === 'dota') {
        return {
            id: `dota:${query}`,
            label: query,
            subtitle: 'Steam 32-bit ID',
            payload: { id: query },
            updatedAt: new Date(item.createdAt).getTime(),
        };
    }

    return {
        id: `cs2:${query.toLowerCase()}`,
        label: query,
        subtitle: 'Faceit nickname',
        payload: { nickname: query },
        updatedAt: new Date(item.createdAt).getTime(),
    };
};

export const useProfileShortcuts = (game: GameShortcutKey, user?: any) => {
    const userId = user?.id ? String(user.id) : '';
    const canSync = Boolean(userId);
    const [recent, setRecent] = useState<ProfileShortcut[]>([]);
    const [favorites, setFavorites] = useState<ProfileShortcut[]>([]);
    const [isLoadingShortcuts, setIsLoadingShortcuts] = useState(false);

    const refreshRecent = useCallback(async () => {
        if (!canSync) {
            setRecent([]);
            return;
        }

        const history = await gameApi.getHistory();
        const shortcuts = history
            .filter(item => item.game === historyGameName[game])
            .map(item => historyToShortcut(game, item))
            .filter((item): item is ProfileShortcut => Boolean(item))
            .slice(0, MAX_RECENT);

        setRecent(shortcuts);
    }, [canSync, game]);

    const refreshFavorites = useCallback(async () => {
        if (!canSync) {
            setFavorites([]);
            return;
        }

        const items = await gameApi.getFavorites(game);
        setFavorites(items.map(favoriteToShortcut).slice(0, MAX_FAVORITES));
    }, [canSync, game]);

    const refreshShortcuts = useCallback(async () => {
        setIsLoadingShortcuts(true);
        try {
            await Promise.all([refreshRecent(), refreshFavorites()]);
        } finally {
            setIsLoadingShortcuts(false);
        }
    }, [refreshRecent, refreshFavorites]);

    useEffect(() => {
        refreshShortcuts().catch(() => {
            setRecent([]);
            setFavorites([]);
            setIsLoadingShortcuts(false);
        });
    }, [refreshShortcuts, userId]);

    const addRecent = useCallback((shortcut: ProfileShortcut) => {
        if (!canSync) return;
        setRecent(previous => upsertShortcut(previous, shortcut, MAX_RECENT));
    }, [canSync]);

    const toggleFavorite = useCallback(async (shortcut: ProfileShortcut) => {
        if (!canSync) return false;

        const normalized = normalizeShortcut(shortcut);
        const exists = favorites.some(item => item.id === normalized.id);

        if (exists) {
            await gameApi.deleteFavorite(normalized.id);
            setFavorites(previous => previous.filter(item => item.id !== normalized.id));
            return false;
        }

        const saved = await gameApi.saveFavorite({
            shortcutId: normalized.id,
            game,
            label: normalized.label,
            subtitle: normalized.subtitle,
            payload: normalized.payload,
        });
        setFavorites(previous => upsertShortcut(previous, favoriteToShortcut(saved), MAX_FAVORITES));
        return true;
    }, [canSync, favorites, game]);

    const removeFavorite = useCallback(async (id: string) => {
        if (!canSync) return;

        await gameApi.deleteFavorite(id);
        setFavorites(previous => previous.filter(item => item.id !== id));
    }, [canSync]);

    const isFavorite = useCallback((id: string) => favorites.some(item => item.id === id), [favorites]);

    return {
        recent,
        favorites,
        canSync,
        isLoadingShortcuts,
        addRecent,
        refreshRecent,
        refreshFavorites,
        toggleFavorite,
        removeFavorite,
        isFavorite,
    };
};
