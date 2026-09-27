import { describe, expect, it } from 'vitest';
import { api, registerUser } from './helpers';

describe('search history', () => {
    it('requires authentication', async () => {
        expect((await api().get('/api/history')).status).toBe(401);
        expect((await api().post('/api/history').send({ game: 'CS2', query: 'x' })).status).toBe(401);
    });

    it('stores entries per user without duplicates', async () => {
        const alice = await registerUser('alice@example.com');
        const bob = await registerUser('bob@example.com');

        await api().post('/api/history').set('Authorization', `Bearer ${alice.token}`).send({ game: 'CS2', query: 'ZywOo' });
        await api().post('/api/history').set('Authorization', `Bearer ${alice.token}`).send({ game: 'CS2', query: 'ZywOo' });
        await api().post('/api/history').set('Authorization', `Bearer ${alice.token}`).send({ game: 'Dota 2', query: '86745912' });

        const aliceHistory = await api().get('/api/history').set('Authorization', `Bearer ${alice.token}`);
        const bobHistory = await api().get('/api/history').set('Authorization', `Bearer ${bob.token}`);

        expect(aliceHistory.body).toHaveLength(2);
        expect(aliceHistory.body[0].query).toBe('86745912');
        expect(bobHistory.body).toHaveLength(0);
    });

    it('rejects invalid entries', async () => {
        const { token } = await registerUser();
        const auth = { Authorization: `Bearer ${token}` };

        expect((await api().post('/api/history').set(auth).send({ game: 'CS2' })).status).toBe(400);
        expect((await api().post('/api/history').set(auth).send({ game: 'CS2', query: { a: 1 } })).status).toBe(400);
        expect((await api().post('/api/history').set(auth).send({ game: 'CS2', query: 'x'.repeat(200) })).status).toBe(400);
    });

    it('clears only the current user history', async () => {
        const alice = await registerUser('alice@example.com');
        const bob = await registerUser('bob@example.com');
        await api().post('/api/history').set('Authorization', `Bearer ${alice.token}`).send({ game: 'CS2', query: 'a' });
        await api().post('/api/history').set('Authorization', `Bearer ${bob.token}`).send({ game: 'CS2', query: 'b' });

        await api().delete('/api/history').set('Authorization', `Bearer ${alice.token}`);

        expect((await api().get('/api/history').set('Authorization', `Bearer ${alice.token}`)).body).toHaveLength(0);
        expect((await api().get('/api/history').set('Authorization', `Bearer ${bob.token}`)).body).toHaveLength(1);
    });
});

describe('favorites', () => {
    const favorite = {
        shortcutId: 'cs2:zywoo',
        game: 'cs2',
        label: 'ZywOo',
        subtitle: '3000 ELO',
        payload: { nickname: 'ZywOo' },
    };

    it('saves, filters by game and removes favorites', async () => {
        const { token } = await registerUser();
        const auth = { Authorization: `Bearer ${token}` };

        const saved = await api().post('/api/favorites').set(auth).send(favorite);
        expect(saved.status).toBe(200);

        expect((await api().get('/api/favorites?game=cs2').set(auth)).body).toHaveLength(1);
        expect((await api().get('/api/favorites?game=dota').set(auth)).body).toHaveLength(0);

        await api().delete(`/api/favorites/${encodeURIComponent(favorite.shortcutId)}`).set(auth);
        expect((await api().get('/api/favorites').set(auth)).body).toHaveLength(0);
    });

    it('does not let one user delete another user favorite', async () => {
        const alice = await registerUser('alice@example.com');
        const bob = await registerUser('bob@example.com');
        await api().post('/api/favorites').set('Authorization', `Bearer ${alice.token}`).send(favorite);

        await api().delete(`/api/favorites/${encodeURIComponent(favorite.shortcutId)}`).set('Authorization', `Bearer ${bob.token}`);

        expect((await api().get('/api/favorites').set('Authorization', `Bearer ${alice.token}`)).body).toHaveLength(1);
    });

    it('rejects invalid or oversized payloads', async () => {
        const { token } = await registerUser();
        const auth = { Authorization: `Bearer ${token}` };

        expect((await api().post('/api/favorites').set(auth).send({ ...favorite, payload: ['x'] })).status).toBe(400);
        expect((await api().post('/api/favorites').set(auth).send({ ...favorite, label: 42 })).status).toBe(400);
        expect((await api().post('/api/favorites').set(auth).send({ ...favorite, payload: { a: 'x'.repeat(2500) } })).status).toBe(400);
    });
});
