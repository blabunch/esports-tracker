import { http } from '../utils/http';
import { HttpError, toUpstreamError } from '../utils/httpError';

const FACEIT_API_KEY = process.env.FACEIT_API_KEY;
const FACEIT_MATCH_ID_REGEX = /^[\w-]{1,64}$/;

const resolveFaceitNickname = (input: string): string => {
    const str = input.trim();
    const urlMatch = str.match(/players\/([^/?]+)/);
    if (urlMatch) {
        return urlMatch[1];
    }
    return str;
};

export const getFaceitStats = async (rawNickname: string, game: string = 'cs2'): Promise<any> => {
    try {
        if (!FACEIT_API_KEY) {
            console.error("FACEIT_API_KEY is missing in environment!");
            throw new HttpError(503, "CS2 stats are temporarily unavailable");
        }

        const nickname = resolveFaceitNickname(rawNickname);
        if (!nickname || nickname.length > 64) {
            throw new HttpError(400, "Invalid Faceit nickname");
        }

        const headers = { Authorization: `Bearer ${FACEIT_API_KEY}` };

        const playerRes = await http.get('https://open.faceit.com/data/v4/players', { headers, params: { nickname } });
        const playerId = encodeURIComponent(playerRes.data.player_id);

        const [statsRes, historyRes] = await Promise.all([
            http.get(`https://open.faceit.com/data/v4/players/${playerId}/stats/${game}`, { headers }),
            http.get(`https://open.faceit.com/data/v4/players/${playerId}/history`, { headers, params: { game, offset: 0, limit: 20 } })
        ]);

        const lifetime = statsRes.data.lifetime;
        const segments = statsRes.data.segments || [];
        const matches = historyRes.data.items || [];

        const mapsData = segments
            .filter((seg: any) => seg.mode === '5v5')
            .map((seg: any) => ({
                name: seg.label,
                img: seg.image_url || '',
                matches: Number(seg.stats.Matches),
                winRate: seg.stats['Win Rate %'],
                kd: Number(seg.stats['Average K/D Ratio'])
            }))
            .sort((a: any, b: any) => b.matches - a.matches);

        const topMaps = mapsData.slice(0, 3); 

        const chartData = mapsData.slice(0, 5).map((m: any) => ({
            name: m.name,
            kd: m.kd
        })).reverse();

        const recentResults: string[] = [];
      let recentWins = 0;
      
      const formattedMatches: any[] = [];
        
        matches.forEach((m: any) => {
            const faction1Match = m.teams?.faction1?.roster?.find((p: any) => p.player_id === playerId);
            const playerFaction = faction1Match ? 'faction1' : 'faction2';
          const isWin = m.results.winner === playerFaction;
          
          formattedMatches.push({
                id: m.match_id,
                win: isWin,
                score: m.results?.score ? `${m.results.score.faction1} - ${m.results.score.faction2}` : 'Match Finished',
                date: new Date(m.started_at * 1000).toLocaleDateString()
            });

            recentResults.push(isWin ? '1' : '0');
            if (isWin) recentWins++;

        });

        const recentWinRate = matches.length > 0 ? ((recentWins / matches.length) * 100).toFixed(1) : '0';

        const memberships = playerRes.data.memberships || [];
        const isPremium = memberships.includes('csgo_premium') || memberships.includes('premium');

        return {
            profile: {
                playerId: playerRes.data.player_id,
                nickname: playerRes.data.nickname,
                avatar: playerRes.data.avatar || 'https://corporate.faceit.com/wp-content/uploads/2021/02/FACEIT-Logo-white.png',
                country: playerRes.data.country,
                level: playerRes.data.games[game]?.skill_level || 1,
                elo: playerRes.data.games[game]?.faceit_elo || 0,
                faceitUrl: playerRes.data.faceit_url.replace('{lang}', 'en'),
                membership: isPremium ? 'Premium' : 'Free'
            },
            stats: {
                matches: lifetime.Matches,
                wins: lifetime.Wins,
                winRate: lifetime['Win Rate %'],
                recentWinRate: recentWinRate,
                kdr: lifetime['Average K/D Ratio'],
                hs: lifetime['Average Headshots %'],
                totalHeadshots: lifetime.Headshots,
                longestStreak: lifetime['Longest Win Streak'],
                currentStreak: lifetime['Current Win Streak'],
                recentResults: recentResults,
                topMaps: topMaps,
                chartData: chartData
          },
            matches: formattedMatches
        };
    } catch (error: any) {
        console.error("🔥 Faceit API Error:", error.response?.data || error.message);
        throw toUpstreamError(error, "Failed to fetch Faceit stats.");
    }
};

export const getFaceitMatchDetails = async (matchId: string): Promise<any> => {
    if (!FACEIT_MATCH_ID_REGEX.test(matchId)) {
        throw new HttpError(400, "Invalid match ID");
    }

    try {
        const headers = { Authorization: `Bearer ${FACEIT_API_KEY}` };
        const res = await http.get(`https://open.faceit.com/data/v4/matches/${matchId}/stats`, { headers });
        return res.data;
    } catch (error) {
        throw toUpstreamError(error, "Failed to fetch Faceit match details");
    }
};