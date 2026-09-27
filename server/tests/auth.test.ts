import { describe, expect, it } from 'vitest';
import { api, registerUser } from './helpers';

describe('auth', () => {
    it('registers a user and never returns the password hash', async () => {
        const { res } = await registerUser();

        expect(res.status).toBe(201);
        expect(res.body.token).toEqual(expect.any(String));
        expect(res.body.user).toMatchObject({ email: 'player@example.com' });
        expect(res.body.user).not.toHaveProperty('password');
    });

    it('normalizes email case and rejects duplicates', async () => {
        await registerUser('Player@Example.com');
        const { res } = await registerUser('player@example.com');

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('User already exists');
    });

    it.each([
        [{ email: 'not-an-email', password: 'strongpass123' }, 'Invalid email format'],
        [{ email: 'a@b.co', password: 'short' }, 'Password must be at least 8 characters'],
        [{ email: 'a@b.co', password: 'x'.repeat(73) }, 'Password is too long'],
        [{ email: ['a@b.co'], password: 'strongpass123' }, 'Invalid email format'],
    ])('rejects invalid registration %#', async (body, message) => {
        const res = await api().post('/api/auth/register').send(body);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(message);
    });

    it('logs in with correct credentials only', async () => {
        await registerUser();

        const ok = await api().post('/api/auth/login').send({ email: 'PLAYER@example.com', password: 'strongpass123' });
        const wrong = await api().post('/api/auth/login').send({ email: 'player@example.com', password: 'wrongpass123' });
        const unknown = await api().post('/api/auth/login').send({ email: 'nobody@example.com', password: 'strongpass123' });

        expect(ok.status).toBe(200);
        expect(ok.body.token).toEqual(expect.any(String));
        expect(wrong.status).toBe(400);
        expect(unknown.status).toBe(400);
        expect(wrong.body.message).toBe(unknown.body.message);
    });

    it('returns the current user for a valid token and 401 otherwise', async () => {
        const { token } = await registerUser();

        const me = await api().get('/api/auth/me').set('Authorization', `Bearer ${token}`);
        const noToken = await api().get('/api/auth/me');
        const badToken = await api().get('/api/auth/me').set('Authorization', 'Bearer not-a-jwt');
        const wrongScheme = await api().get('/api/auth/me').set('Authorization', `Basic ${token}`);

        expect(me.status).toBe(200);
        expect(me.body.user.email).toBe('player@example.com');
        expect(noToken.status).toBe(401);
        expect(badToken.status).toBe(401);
        expect(wrongScheme.status).toBe(401);
    });

    it('links and unlinks game accounts with validation', async () => {
        const { token } = await registerUser();
        const auth = { Authorization: `Bearer ${token}` };

        const linked = await api().put('/api/auth/link').set(auth).send({ valName: ' TenZ ', valTag: '0505' });
        expect(linked.status).toBe(200);
        expect(linked.body.user).toMatchObject({ valName: 'TenZ', valTag: '0505' });

        const unlinked = await api().put('/api/auth/link').set(auth).send({ valName: '', valTag: '' });
        expect(unlinked.body.user).toMatchObject({ valName: null, valTag: null });

        const invalid = await api().put('/api/auth/link').set(auth).send({ dotaId: { $gt: '' } });
        expect(invalid.status).toBe(400);

        const tooLong = await api().put('/api/auth/link').set(auth).send({ valTag: 'x'.repeat(11) });
        expect(tooLong.status).toBe(400);
    });

    it('updates display name with a length limit', async () => {
        const { token } = await registerUser();
        const auth = { Authorization: `Bearer ${token}` };

        const ok = await api().put('/api/auth/profile').set(auth).send({ displayName: 'Ace' });
        const tooLong = await api().put('/api/auth/profile').set(auth).send({ displayName: 'x'.repeat(33) });

        expect(ok.body.user.displayName).toBe('Ace');
        expect(tooLong.status).toBe(400);
    });
});
