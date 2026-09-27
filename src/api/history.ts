import { gameApi } from './client';

export const saveToHistory = async (game: string, query: string) => {
    const token = localStorage.getItem('token');

    if (!token) return; 

    try {
        await gameApi.saveHistory(game, query);
    } catch (error) {
        console.error('Failed to save history', error);
    }
};
