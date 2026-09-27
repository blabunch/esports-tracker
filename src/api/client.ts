import axios from 'axios';
import toast from 'react-hot-toast';
import { ValorantData, DotaData, Cs2Data, SearchHistoryItem, FavoriteProfileItem } from './types';

export const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
    timeout: 10000,
});

API.interceptors.request.use((config: any) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

API.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (!error.response) {
            toast.error('Помилка мережі. Перевірте з\'єднання або сервер не працює.');
            return Promise.reject(new Error('Network Error'));
        }

        const errorMessage = error.response.data?.error || error.response.data?.message || 'Невідома помилка';
        toast.error(`Помилка: ${errorMessage}`);

        return Promise.reject(new Error(errorMessage));
    }
);

export const gameApi = {
    getValorant: async (name: string, tag: string): Promise<ValorantData> => {
        const { data } = await API.get<ValorantData>(`/valorant/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
        return data;
    },
    getDota: async (id: string, mode: string = 'all'): Promise<DotaData> => {
        const { data } = await API.get<DotaData>(`/dota/${encodeURIComponent(id)}?mode=${mode}`);
        return data;
    },
    getCs2: async (nickname: string): Promise<Cs2Data> => {
        const { data } = await API.get<Cs2Data>(`/cs2/${encodeURIComponent(nickname)}`);
        return data;
    },
    getValorantMatch: async (matchId: string): Promise<any> => {
        const { data } = await API.get(`/valorant/match/${encodeURIComponent(matchId)}`);
        return data;
    },
    getDotaMatch: async (matchId: string): Promise<any> => {
        const { data } = await API.get(`/dota/match/${encodeURIComponent(matchId)}`);
        return data;
    },
    getCs2Match: async (matchId: string): Promise<any> => {
        const { data } = await API.get(`/cs2/match/${encodeURIComponent(matchId)}`);
        return data;
    },
    getHistory: async (): Promise<SearchHistoryItem[]> => {
        const { data } = await API.get<SearchHistoryItem[]>('/history');
        return data;
    },
    saveHistory: async (game: string, query: string, mode?: string): Promise<void> => {
        await API.post('/history', { game, query, mode });
    },
    clearHistory: async (): Promise<void> => {
        await API.delete('/history');
    },
    getFavorites: async (game: string): Promise<FavoriteProfileItem[]> => {
        const { data } = await API.get<FavoriteProfileItem[]>('/favorites', { params: { game } });
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
        await API.delete(`/favorites/${encodeURIComponent(shortcutId)}`);
    }
};
