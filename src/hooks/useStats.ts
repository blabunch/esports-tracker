// src/hooks/useStats.ts

import { useState, useCallback } from 'react';
import { gameApi } from '../api/client';
import { ValorantData, DotaData, Cs2Data } from '../api/types';

// 🔫 Хук для Valorant
export const useValorant = () => {
    const [data, setData] = useState<ValorantData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async (name: string, tag: string) => {
        setLoading(true);
        setError(null);
        setData(null); // Очищаємо старі дані перед новим пошуком
        try {
            const result = await gameApi.getValorant(name, tag);
            setData(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const clear = () => setData(null);

    return { data, loading, error, fetchStats, clear };
};

// ⚔️ Хук для Dota 2
export const useDota = () => {
    const [data, setData] = useState<DotaData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async (id: string, mode?: string) => {
        setLoading(true);
        setError(null);
        setData(null);
        try {
            const result = await gameApi.getDota(id, mode);
            setData(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const clear = () => setData(null);

    return { data, loading, error, fetchStats, clear };
};

// 💣 Хук для CS2 / Faceit
export const useCs2 = () => {
    const [data, setData] = useState<Cs2Data | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async (nickname: string) => {
        setLoading(true);
        setError(null);
        setData(null);
        try {
            const result = await gameApi.getCs2(nickname);
            setData(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const clear = () => setData(null);

    return { data, loading, error, fetchStats, clear };
};