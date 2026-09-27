import { afterEach, describe, expect, it, vi } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { http } from '../src/utils/http';
import { apiCache } from '../src/utils/cache';
import { api } from './helpers';

const faceitPlayer = {
    player_id: 'b2a5c1a0-1111-2222-3333-444455556666',
    nickname: 'ZywOo',
    avatar: '',
    country: 'fr',
    faceit_url: 'https://www.faceit.com/{lang}/players/ZywOo',
    memberships: ['premium'],
    games: { cs2: { skill_level: 10, faceit_elo: 3500 } },
};

const faceitStats = {
    lifetime: {
        Matches: '100', Wins: '60', 'Win Rate %': '60', 'Average K/D Ratio': '1.35',
        'Average Headshots %': '45', Headshots: '900', 'Longest Win Streak': '8', 'Current Win Streak': '2',
    },
    segments: [
        { mode: '5v5', label: 'Mirage', image_url: '', stats: { Matches: '40', 'Win Rate %': '65', 'Average K/D Ratio': '1.4' } },
        { mode: '5v5', label: 'Inferno', image_url: '', stats: { Matches: '30', 'Win Rate %': '55', 'Average K/D Ratio': '1.2' } },
    ],
};

const faceitHistory = {
    items: [
        {
            match_id: '1-abc',
            started_at: 1_700_000_000,
            teams: { faction1: { roster: [{ player_id: faceitPlayer.player_id }] } },
            results: { winner: 'faction1', score: { faction1: 13, faction2: 9 } },
        },
        {
            match_id: '1-def',
            started_at: 1_700_000_100,
            teams: { faction1: { roster: [] } },
            results: { winner: 'faction1', score: { faction1: 13, faction2: 5 } },
        },
    ],
};

const mockFaceit = () => vi.spyOn(http, 'get').mockImplementation(async (url: string) => {
    if (url.endsWith('/players')) return { data: faceitPlayer };
    if (url.includes('/stats/')) return { data: faceitStats };
    if (url.includes('/history')) return { data: faceitHistory };
    throw new Error(`Unexpected URL ${url}`);
});

const upstreamError = (status: number) => new AxiosError(
    'Request failed', 'ERR_BAD_REQUEST', undefined, undefined,
    { status, statusText: '', headers: {}, config: { headers: new AxiosHeaders() }, data: { secret: 'internal upstream details' } },
);

afterEach(() => {
    vi.restoreAllMocks();
    apiCache.clear();
});

describe('CS2 stats', () => {
    it('normalizes Faceit data', async () => {
        mockFaceit();

        const res = await api().get('/api/cs2/ZywOo');

        expect(res.status).toBe(200);
        expect(res.body.profile).toMatchObject({
            playerId: faceitPlayer.player_id,
            nickname: 'ZywOo',
            level: 10,
            elo: 3500,
            faceitUrl: 'https://www.faceit.com/en/players/ZywOo',
            membership: 'Premium',
        });
        expect(res.body.stats.topMaps.map((map: { name: string }) => map.name)).toEqual(['Mirage', 'Inferno']);
        expect(res.body.stats.recentResults).toEqual(['1', '0']);
        expect(res.body.stats.recentWinRate).toBe('50.0');
    });

    it('sends the nickname as an encoded query parameter', async () => {
        const spy = mockFaceit();

        await api().get('/api/cs2/' + encodeURIComponent('Zyw&limit=1'));

        expect(spy.mock.calls[0][1]).toMatchObject({ params: { nickname: 'Zyw&limit=1' } });
    });

    it('caches results and records a progress snapshot', async () => {
        const spy = mockFaceit();

        await api().get('/api/cs2/ZywOo');
        await api().get('/api/cs2/zywoo');

        expect(spy).toHaveBeenCalledTimes(3);

        const progress = await api().get(`/api/progress/cs2/${faceitPlayer.player_id}`);
        expect(progress.status).toBe(200);
        expect(progress.body).toHaveLength(1);
        expect(progress.body[0]).toMatchObject({ elo: 3500, level: 10, kd: 1.35, winRate: 60 });

        const overview = await api().get('/api/overview');
        expect(overview.body).toMatchObject({ playersTracked: 1, profilesChecked24h: 1 });
        expect(overview.body.recentPlayers).toEqual([
            expect.objectContaining({ game: 'cs2', playerKey: faceitPlayer.player_id, displayName: 'ZywOo' }),
        ]);
    });

    it('maps upstream errors without leaking details', async () => {
        vi.spyOn(http, 'get').mockRejectedValue(upstreamError(404));

        const res = await api().get('/api/cs2/nobody');

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Player or match not found');
        expect(JSON.stringify(res.body)).not.toContain('internal upstream details');
    });

    it('turns unexpected upstream failures into 502', async () => {
        vi.spyOn(http, 'get').mockRejectedValue(upstreamError(500));

        const res = await api().get('/api/cs2/someone');

        expect(res.status).toBe(502);
    });
});

describe('progress', () => {
    it('validates game and player key', async () => {
        expect((await api().get('/api/progress/minecraft/steve')).status).toBe(400);
        expect((await api().get(`/api/progress/cs2/${'x'.repeat(65)}`)).status).toBe(400);
    });

    it('returns an empty series for unknown players', async () => {
        const res = await api().get('/api/progress/dota/123');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });
});

describe('Dota stats', () => {
    it('still returns the profile when optional OpenDota sections fail', async () => {
        vi.spyOn(http, 'get').mockImplementation(async (url: string) => {
            if (url.endsWith('/players/86745912')) {
                return { data: { profile: { account_id: 86745912, personaname: 'Tester', avatarfull: '', profileurl: '' }, rank_tier: 80 } };
            }
            if (url.endsWith('/wl')) return { data: { win: 60, lose: 40 } };
            throw upstreamError(500);
        });

        const res = await api().get('/api/dota/86745912');

        expect(res.status).toBe(200);
        expect(res.body.profile).toMatchObject({ accountId: 86745912, nickname: 'Tester' });
        expect(res.body.stats.winRate).toBe('60.0');
        expect(res.body.stats.warnings).toHaveLength(4);
    });

    it('fails when the required profile request fails', async () => {
        vi.spyOn(http, 'get').mockRejectedValue(upstreamError(500));

        const res = await api().get('/api/dota/86745912');

        expect(res.status).toBe(502);
    });
});

describe('Valorant stats', () => {
    const henrikError = (code: number) => new AxiosError(
        'Request failed', 'ERR_BAD_REQUEST', undefined, undefined,
        { status: 404, statusText: '', headers: {}, config: { headers: new AxiosHeaders() }, data: { errors: [{ code, message: 'upstream' }] } },
    );

    it.each([
        [22, 'Riot account not found. Check the name and tag.'],
        [24, 'This account has no recent matches'],
    ])('explains HenrikDev error code %i', async (code, message) => {
        vi.spyOn(http, 'get').mockRejectedValue(henrikError(code));

        const res = await api().get('/api/valorant/Someone/TAG');

        expect(res.status).toBe(404);
        expect(res.body.message).toContain(message);
    });
});
