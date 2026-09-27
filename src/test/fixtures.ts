import { ValorantData } from '../api/types';

export const valorantData: ValorantData = {
    profile: { nickname: 'TenZ', tag: '0505', level: 400, avatar: '', trackerUrl: 'https://tracker.gg' },
    stats: {
        rank: 'Radiant', rank_img: '', elo: 450, mmr: 2850, peakRank: 'Radiant', totalGames: 1, totalWinRate: '100.0',
        kdr: '1.50', avgKda: '21.0 / 14.0 / 5.0', acs: 280, adr: 170, hs: '30.0', role: 'Duelist', maxKills: 21,
        frequentDuo: null, recent: ['1'], topAgents: [{ name: 'Jett', img: '', count: 1 }],
        mapStats: [{ name: 'Ascent', matches: 1, wins: 1, winRate: '100.0' }],
        chartData: [{ name: 'Ascent', acs: 280, kills: 21, matchId: 'abc' }],
        hasMatches: true, matchLimit: 10, warnings: [],
    },
    matches: [{ id: 'abc', win: true, map: 'Ascent', agent: 'Jett', kda: '21/14/5' }],
};
