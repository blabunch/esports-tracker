import { describe, expect, it } from 'vitest';
import { api } from './helpers';

describe('security', () => {
    it('serves a healthcheck with security headers and no x-powered-by', async () => {
        const res = await api().get('/api/health');

        expect(res.status).toBe(200);
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['content-security-policy']).toBeDefined();
        expect(res.headers['x-powered-by']).toBeUndefined();
    });

    it('rejects requests from origins that are not allowed', async () => {
        const allowed = await api().get('/api/health').set('Origin', 'http://localhost:3000');
        const blocked = await api().get('/api/health').set('Origin', 'https://evil.example');

        expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:3000');
        expect(blocked.status).toBe(403);
    });

    it('returns 400 for malformed JSON and 413 for huge bodies', async () => {
        const malformed = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{bad');
        const huge = await api().post('/api/auth/login').send({ email: 'a@b.co', password: 'x'.repeat(20_000) });

        expect(malformed.status).toBe(400);
        expect(huge.status).toBe(413);
    });

    it('returns JSON 404 for unknown API routes', async () => {
        const res = await api().get('/api/does-not-exist');

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Not found');
    });

    it.each([
        '/api/cs2/match/..%2F..%2Fplayers',
        '/api/dota/match/..%2Fplayers',
        '/api/valorant/match/..%2F..%2Fv1%2Faccount',
        '/api/dota/not-a-steam-id',
    ])('rejects path traversal and invalid ids: %s', async path => {
        const res = await api().get(path);

        expect(res.status).toBe(400);
    });
});
