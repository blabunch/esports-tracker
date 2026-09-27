import request from 'supertest';
import { createApp } from '../src/app';

export const app = createApp();
export const api = () => request(app);

export const registerUser = async (email = 'player@example.com', password = 'strongpass123') => {
    const res = await api().post('/api/auth/register').send({ email, password });
    return { token: res.body.token as string, user: res.body.user, res };
};
