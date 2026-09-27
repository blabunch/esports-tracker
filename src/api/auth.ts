import { API } from './client';

export const loginUser = async (email: string, password: string) => {
    const response = await API.post('/auth/login', { email, password });
    return response.data;
};

export const registerUser = async (email: string, password: string) => {
    const response = await API.post('/auth/register', { email, password });
    return response.data;
};

export const linkUserAccounts = async (token: string, data: { dotaId?: string, valName?: string, valTag?: string, faceitNickname?: string }) => {
    const response = await API.put('/auth/link', data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const getMe = async (token: string) => {
    const response = await API.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateUserProfile = async (token: string, data: { displayName: string }) => {
    const response = await API.put('/auth/profile', data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};
