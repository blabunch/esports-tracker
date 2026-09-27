import axios from 'axios';
import toast from 'react-hot-toast';
import {
    ValorantData, DotaData, Cs2Data, SearchHistoryItem, FavoriteProfileItem,
    ProgressGame, ProgressPoint, Overview,
} from './types';

declare module 'axios' {
    interface AxiosRequestConfig {
        // Не показувати toast при помилці — сторінка обробляє її сама
        silent?: boolean;
    }
}

export const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
    // Із запасом на "пробудження" бекенду на безкоштовному хостингу (до ~1 хв)
    timeout: 60000,
});

API.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        const silent = Boolean(error.config?.silent);

        if (!error.response) {
            if (!silent) toast.error('Network error. Check your connection or try again later.');
            return Promise.reject(new Error('Network error'));
        }

        const errorMessage = error.response.data?.error || error.response.data?.message || 'Unknown error';
        if (!silent) toast.error(errorMessage);

        return Promise.reject(new Error(errorMessage));
    }
);

const enc = encodeURIComponent;

export const gameApi = {
    // Пошук гравця показує помилку прямо на сторінці, тому без toast
    getValorant: async (name: string, tag: string): Promise<ValorantData> => {
        const { data } = await API.get<ValorantData>(`/valorant/${enc(name)}/${enc(tag)}`, { silent: true });
        return data;
    },
    getDota: async (id: string): Promise<DotaData> => {
        const { data } = await API.get<DotaData>(`/dota/${enc(id)}`, { silent: true });
        return data;
    },
    getCs2: async (nickname: string): Promise<Cs2Data> => {
        const { data } = await API.get<Cs2Data>(`/cs2/${enc(nickname)}`, { silent: true });
        return data;
    },
    getValorantMatch: async (matchId: string): Promise<any> => {
        const { data } = await API.get(`/valorant/match/${enc(matchId)}`);
        return data;
    },
    getDotaMatch: async (matchId: string): Promise<any> => {
        const { data } = await API.get(`/dota/match/${enc(matchId)}`);
        return data;
    },
    getCs2Match: async (matchId: string): Promise<any> => {
        const { data } = await API.get(`/cs2/match/${enc(matchId)}`);
        return data;
    },
    getProgress: async (game: ProgressGame, playerKey: string): Promise<ProgressPoint[]> => {
        const { data } = await API.get<ProgressPoint[]>(`/progress/${game}/${enc(playerKey)}`, { silent: true });
        return data;
    },
    getOverview: async (): Promise<Overview> => {
        const { data } = await API.get<Overview>('/overview', { silent: true });
        return data;
    },
    getHistory: async (): Promise<SearchHistoryItem[]> => {
        const { data } = await API.get<SearchHistoryItem[]>('/history', { silent: true });
        return data;
    },
    saveHistory: async (game: string, query: string, label?: string): Promise<void> => {
        await API.post('/history', { game, query, label }, { silent: true });
    },
    clearHistory: async (): Promise<void> => {
        await API.delete('/history');
    },
    getFavorites: async (game: string): Promise<FavoriteProfileItem[]> => {
        const { data } = await API.get<FavoriteProfileItem[]>('/favorites', { params: { game }, silent: true });
        return data;
    },
    saveFavorite: async (favorite: {
        shortcutId: string;
        game: string;
        label: string;
        subtitle?: string;
        payload: Record<string, string>;
    }): Promise<FavoriteProfileItem> => {
        const { data } = await API.post<FavoriteProfileItem>('/favorites', favorite);
        return data;
    },
    deleteFavorite: async (shortcutId: string): Promise<void> => {
        await API.delete(`/favorites/${enc(shortcutId)}`);
    }
};
