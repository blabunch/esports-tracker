import { API } from './client';
import { User } from './types';

// Токен додає interceptor у client.ts
export const loginUser = async (email: string, password: string): Promise<{ token: string; user: User }> => {
    const response = await API.post('/auth/login', { email, password }, { silent: true });
    return response.data;
};

export const registerUser = async (email: string, password: string): Promise<{ token: string; user: User }> => {
    const response = await API.post('/auth/register', { email, password }, { silent: true });
    return response.data;
};

export const linkUserAccounts = async (data: { dotaId?: string, valName?: string, valTag?: string, faceitNickname?: string }): Promise<{ user: User }> => {
    const response = await API.put('/auth/link', data);
    return response.data;
};

export const getMe = async (): Promise<{ user: User }> => {
    const response = await API.get('/auth/me', { silent: true });
    return response.data;
};

export const updateUserProfile = async (data: { displayName: string }): Promise<{ user: User }> => {
    const response = await API.put('/auth/profile', data);
    return response.data;
};
