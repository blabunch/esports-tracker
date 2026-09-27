import { http } from '../utils/http';
import { HttpError, toUpstreamError } from '../utils/httpError';

const resolveSteamId = (input: string): string => {
    const str = input.trim();

    const id64Match = str.match(/7656119\d{10}/);
    if (id64Match) {
        const steam64 = BigInt(id64Match[0]);
        const offset = BigInt('76561197960265728');
        return (steam64 - offset).toString(); 
    }

    const dotaUrlMatch = str.match(/players\/(\d+)/);
    if (dotaUrlMatch) {
        return dotaUrlMatch[1];
    }

    const pureNumbers = str.replace(/\D/g, '');
    if (pureNumbers.length > 0 && pureNumbers.length <= 20) {
        return pureNumbers;
    }

    throw new HttpError(400, "Invalid Steam ID");
};

const DOTA_MATCH_ID_REGEX = /^\d{1,20}$/;

let heroesCache: { data: any[]; fetchedAt: number } | null = null;
const HERO_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 години

export const getDotaStats = async (steamId: string, mode: string = 'all'): Promise<any> => {
    try {
        // 🛡️ ПЕРЕВІРКА TTL ДЛЯ ГЕРОЇВ
        if (!heroesCache || Date.now() - heroesCache.fetchedAt > HERO_CACHE_TTL) {
            const heroesRes = await http.get('https://api.opendota.com/api/heroStats');
            heroesCache = { data: heroesRes.data, fetchedAt: Date.now() };
        }

        const accountId = resolveSteamId(steamId);

        // 🔥 РОБИМО 6 ЗАПИТІВ ОДНОЧАСНО ДЛЯ МАКСИМАЛЬНОЇ ІНФИ
        const [playerRes, wlRes, recentRes, heroesResData, totalsRes, peersRes] = await Promise.all([
            http.get(`https://api.opendota.com/api/players/${accountId}`),
            http.get(`https://api.opendota.com/api/players/${accountId}/wl`),
            http.get(`https://api.opendota.com/api/players/${accountId}/recentMatches`),
            http.get(`https://api.opendota.com/api/players/${accountId}/heroes`),
            http.get(`https://api.opendota.com/api/players/${accountId}/totals`),
            http.get(`https://api.opendota.com/api/players/${accountId}/peers`)
        ]);

        if (!playerRes.data || !playerRes.data.profile) {
            throw new HttpError(404, "Private Profile or Invalid ID");
        }

        const matches: any[] = recentRes.data || [];
        const allHeroes: any[] = heroesResData.data || [];
        const totalsData: any[] = totalsRes.data || [];
        const peersData: any[] = peersRes.data || [];
        
        // --- 1. Обробка останніх 20 матчів ---
        let totalGpm = 0, totalXpm = 0, totalHd = 0, totalLh = 0;
        let totalKills = 0, totalDeaths = 0, totalAssists = 0;
        let totalHealing = 0, totalTowerDamage = 0, totalDuration = 0;
        let maxKills = 0, maxDamage = 0;

        const heroCounts: Record<number, number> = {};
        const chartData: Array<{ name: string; kda: number; gpm: number; matchId?: string | number }> = [];
        const recentResults: string[] = [];
        const formattedMatches: any[] = [];

        matches.forEach((m, index) => {
            const gpm = m.gold_per_min || 0;
            const xpm = m.xp_per_min || 0;
            const deaths = m.deaths === 0 ? 1 : m.deaths;
            const kda = parseFloat(((m.kills + m.assists) / deaths).toFixed(2));
            const heroDamage = m.hero_damage || 0;
            const kills = m.kills || 0;
            
            totalGpm += gpm; totalXpm += xpm; totalKills += kills;
            totalDeaths += m.deaths; totalAssists += m.assists;
            totalHd += heroDamage; totalLh += m.last_hits || 0;
            totalHealing += m.hero_healing || 0; totalTowerDamage += m.tower_damage || 0;
            totalDuration += m.duration || 0;

            if (kills > maxKills) maxKills = kills;
            if (heroDamage > maxDamage) maxDamage = heroDamage;

            heroCounts[m.hero_id] = (heroCounts[m.hero_id] || 0) + 1;

            const isRadiant = m.player_slot < 128;
            const isWin = isRadiant === m.radiant_win;
            
            // 🔥 ФІКС ТУТ: Використовуємо heroesCache?.data?.find
            const heroInfo = heroesCache?.data?.find((h: any) => h.id === Number(m.hero_id));
            
            formattedMatches.push({
                id: m.match_id,
                win: isWin,
                hero: heroInfo ? heroInfo.localized_name : "Unknown",
                kda: `${kills}/${m.deaths === 0 ? 1 : m.deaths}/${m.assists}`,
                duration: Math.floor(m.duration / 60) + ' min'
            });

            if (index < 10) {
                recentResults.push(isWin ? '1' : '0');
                chartData.unshift({ name: `Match ${10 - index}`, kda, gpm, matchId: m.match_id }); 
            }
        });

        // --- 2. Сигнатурний герой ---
        let bestHeroId: string | number | null = null;
        let highestWinrate = -1;
        let bestHeroGames = 0;
        let bestHeroWins = 0;

        allHeroes.forEach(h => {
            if (h.games >= 5) {
                const wr = h.win / h.games;
                if (wr > highestWinrate) {
                    highestWinrate = wr; bestHeroId = h.hero_id; bestHeroGames = h.games; bestHeroWins = h.win;
                } else if (wr === highestWinrate && h.games > bestHeroGames) {
                    bestHeroId = h.hero_id; bestHeroGames = h.games; bestHeroWins = h.win;
                }
            }
        });

        let signatureHero = null;
        if (bestHeroId !== null) {
            // 🔥 ФІКС ТУТ: Використовуємо heroesCache?.data?.find
            const hInfo = heroesCache?.data?.find((h: any) => h.id === Number(bestHeroId));
            signatureHero = {
                name: hInfo ? hInfo.localized_name : "Unknown",
                img: hInfo ? `https://cdn.cloudflare.steamstatic.com${hInfo.img}` : null,
                winRate: ((bestHeroWins / bestHeroGames) * 100).toFixed(1),
                games: bestHeroGames
            };
        }

        // --- 3. ТОП-5 Героїв (останні матчі) ---
        const topHeroes = Object.entries(heroCounts)
            .sort((a, b) => b[1] - a[1]).slice(0, 5)
            .map(([id, games]) => {
                // 🔥 ФІКС ТУТ: Використовуємо heroesCache?.data?.find
                const heroInfo = heroesCache?.data?.find((h: any) => h.id === Number(id));
                return {
                    name: heroInfo ? heroInfo.localized_name : "Unknown",
                    img: heroInfo ? `https://cdn.cloudflare.steamstatic.com${heroInfo.img}` : null,
                    games: games
                };
            });

        // --- 4. All-Time Totals ---
        const formatNum = (n: number) => n > 1000 ? (n / 1000).toFixed(1) + 'k' : n.toString();
        const getField = (field: string) => totalsData.find(t => t.field === field)?.sum || 0;
        const allTimeTotals = {
            kills: formatNum(getField('kills')),
            deaths: formatNum(getField('deaths')),
            assists: formatNum(getField('assists'))
        };

        // --- 5. Top Teammate ---
        const topTeammates = peersData
            .filter(p => p.games >= 5)
            .sort((a, b) => b.games - a.games)
            .slice(0, 3) 
            .map(p => ({
                name: p.personaname || "Unknown",
                avatar: p.avatar,
                games: p.games,
                winRate: ((p.win / p.games) * 100).toFixed(1)
            }));

        const count = matches.length || 1;
        const totalMatches = wlRes.data.win + wlRes.data.lose;
        const avgDurationMins = Math.floor((totalDuration / count) / 60);

        return {
            profile: {
                accountId: playerRes.data.profile.account_id, 
                nickname: playerRes.data.profile.personaname,
                avatar: playerRes.data.profile.avatarfull,
                country: playerRes.data.profile.loccountrycode,
                steamUrl: playerRes.data.profile.profileurl,
                rank_tier: playerRes.data.rank_tier,
                leaderboard_rank: playerRes.data.leaderboard_rank
            },
            stats: {
                matches: totalMatches,
                winRate: totalMatches > 0 ? ((wlRes.data.win / totalMatches) * 100).toFixed(1) : 0,
                avgGpm: matches.length ? (totalGpm / count).toFixed(0) : 0,
                avgXpm: matches.length ? (totalXpm / count).toFixed(0) : 0,
                avgKda: `${(totalKills / count).toFixed(1)} / ${(totalDeaths / count).toFixed(1)} / ${(totalAssists / count).toFixed(1)}`,
                kdaRatio: matches.length ? ((totalKills + totalAssists) / (totalDeaths === 0 ? 1 : totalDeaths)).toFixed(2) : 0,
                avgHd: matches.length ? formatNum(totalHd / count) : 0,
                avgLh: matches.length ? (totalLh / count).toFixed(0) : 0,
                avgHealing: matches.length ? formatNum(totalHealing / count) : 0,
                avgTowerDamage: matches.length ? formatNum(totalTowerDamage / count) : 0,
                maxKills, maxDamage: formatNum(maxDamage), avgDuration: `${avgDurationMins} min`,
                recentResults, topHeroes, chartData, signatureHero, 
                allTimeTotals, 
                topTeammates 
            },
            matches: formattedMatches
        };
    } catch (error: any) {
        console.error("Dota Error:", error.message);
        throw toUpstreamError(error, "Failed to fetch Dota stats");
    }
};

export const getDotaMatchDetails = async (matchId: string): Promise<any> => {
    if (!DOTA_MATCH_ID_REGEX.test(matchId)) {
        throw new HttpError(400, "Invalid match ID");
    }

    try {
        // 1. Оновлюємо кеш героїв, якщо він порожній або прострочений
        if (!heroesCache || Date.now() - heroesCache.fetchedAt > HERO_CACHE_TTL) {
            const heroesRes = await http.get('https://api.opendota.com/api/heroStats');
            heroesCache = { data: heroesRes.data, fetchedAt: Date.now() };
        }

        // 2. Отримуємо сирі деталі матчу
        const res = await http.get(`https://api.opendota.com/api/matches/${matchId}`);
        const matchData = res.data;

        // 3. Додаємо кожному гравцю нормальне посилання на картинку
        if (matchData.players && matchData.players.length > 0) {
            matchData.players = matchData.players.map((p: any) => {
                const heroInfo = heroesCache?.data?.find((h: any) => h.id === Number(p.hero_id));
                return {
                    ...p,
                    hero_image: heroInfo ? `https://cdn.cloudflare.steamstatic.com${heroInfo.icon}` : '',
                    hero_name: heroInfo ? heroInfo.localized_name : 'Unknown'
                };
            });
        }

        return matchData;
    } catch (error) {
        throw toUpstreamError(error, "Failed to fetch Dota match details");
    }
};