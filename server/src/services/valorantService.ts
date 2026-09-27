import { http } from "../utils/http";
import { HttpError, toUpstreamError } from "../utils/httpError";

const HENRIKDEV_API_KEY = process.env.HENRIKDEV_API_KEY;
const VALORANT_MATCH_LIMIT = 10;

const getAgentRole = (agentName: string) => {
  const duelists = ["Jett", "Reyna", "Raze", "Phoenix", "Yoru", "Neon", "Iso"];
  const initiators = ["Sova", "Breach", "Skye", "KAY/O", "Fade", "Gekko"];
  const controllers = [
    "Omen",
    "Brimstone",
    "Viper",
    "Astra",
    "Harbor",
    "Clove",
  ];
  const sentinels = [
    "Killjoy",
    "Cypher",
    "Sage",
    "Chamber",
    "Deadlock",
    "Vyse",
  ];

  if (duelists.includes(agentName)) return "Duelist";
  if (initiators.includes(agentName)) return "Initiator";
  if (controllers.includes(agentName)) return "Controller";
  if (sentinels.includes(agentName)) return "Sentinel";
  return "Flex";
};

const normalizeTeamKey = (team?: string) => String(team || "").toLowerCase();

const getTeamData = (teams: any, team?: string) => {
  const teamKey = normalizeTeamKey(team);
  if (!teams || !teamKey) return null;

  if (Array.isArray(teams)) {
    return (
      teams.find((teamData: any) => {
        const currentKey = normalizeTeamKey(
          teamData?.team_id || teamData?.teamId || teamData?.team || teamData?.name,
        );
        return currentKey === teamKey;
      }) || null
    );
  }

  return teams[teamKey] || (team ? teams[String(team)] : null) || null;
};

const getTeamRoundsWon = (teams: any, team?: string) => {
  const teamData = getTeamData(teams, team);
  return Number(
    teamData?.rounds_won ??
      teamData?.roundsWon ??
      teamData?.rounds?.won ??
      teamData?.score ??
      0,
  );
};

const getOpponentTeamKey = (team?: string) => {
  const teamKey = normalizeTeamKey(team);
  if (teamKey === "red") return "blue";
  if (teamKey === "blue") return "red";
  return "";
};

const getRoundsPlayed = (match: any, playerDeaths = 0) => {
  const metadataRounds = Number(
    match.metadata?.rounds_played ?? match.metadata?.roundsPlayed ?? 0,
  );
  if (metadataRounds > 1) return metadataRounds;

  const teamRounds =
    getTeamRoundsWon(match.teams, "red") + getTeamRoundsWon(match.teams, "blue");
  if (teamRounds > 1) return teamRounds;

  if (Array.isArray(match.rounds) && match.rounds.length > 1) {
    return match.rounds.length;
  }

  return Math.max(Number(playerDeaths || 0), 0);
};

const didPlayerWin = (match: any, team?: string) => {
  const teams = match.teams || {};
  const myTeam = getTeamData(teams, team);

  if (typeof myTeam?.has_won === "boolean") return myTeam.has_won;
  if (typeof myTeam?.won === "boolean") return myTeam.won;

  const myTeamScore = getTeamRoundsWon(teams, team);
  const enemyTeamScore = getTeamRoundsWon(teams, getOpponentTeamKey(team));

  return myTeamScore > enemyTeamScore;
};

export const getValorantStats = async (
  name: string,
  tag: string,
): Promise<any> => {
  try {
    if (!HENRIKDEV_API_KEY) {
      console.error("HENRIKDEV_API_KEY is missing in environment! Get one at https://docs.henrikdev.xyz/");
      throw new HttpError(503, "Valorant stats are temporarily unavailable");
    }

    if (!name || !tag || name.length > 32 || tag.length > 10) {
      throw new HttpError(400, "Invalid Riot ID");
    }

    const headers = { Authorization: HENRIKDEV_API_KEY };

    // 1. Акаунт
    const accountRes = await http.get(
      `https://api.henrikdev.xyz/valorant/v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
      { headers },
    );
    const account = accountRes.data.data;
    const region = encodeURIComponent(account.region || "eu");

    // 2. MMR та Матчі
    const [mmrResult, matchesResult] = await Promise.allSettled([
      http.get(
        `https://api.henrikdev.xyz/valorant/v1/mmr/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
        { headers },
      ),
      http.get(
        `https://api.henrikdev.xyz/valorant/v3/matches/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?size=${VALORANT_MATCH_LIMIT}`,
        { headers },
      ),
    ]);

    const mmr =
      mmrResult.status === "fulfilled" ? mmrResult.value.data.data : null;
    const matchesPayload =
      matchesResult.status === "fulfilled" ? matchesResult.value.data.data : [];
    const matches = Array.isArray(matchesPayload) ? matchesPayload : [];
    const warnings: string[] = [];

    if (mmrResult.status === "rejected") {
      console.warn(
        "⚠️ Valorant MMR API unavailable:",
        mmrResult.reason.response?.data || mmrResult.reason.message,
      );
      warnings.push("Rank data is temporarily unavailable from Riot/HenrikDev.");
    }

    if (matchesResult.status === "rejected") {
      console.warn(
        "⚠️ Valorant Matches API unavailable:",
        matchesResult.reason.response?.data || matchesResult.reason.message,
      );
      warnings.push(
        "Match history is temporarily unavailable from Riot/HenrikDev.",
      );
    }
    let totalKills = 0,
      totalDeaths = 0,
      totalAssists = 0,
      totalScore = 0,
      totalDamage = 0,
      totalHeadshots = 0,
      totalShots = 0;
    let wins = 0;
    let maxKills = 0;
    let totalRounds = 0;

    const agentCounts: Record<string, { count: number; img: string }> = {};
    const mapCounts: Record<string, { matches: number; wins: number }> = {};
    const allyCounts: Record<
      string,
      { name: string; tag: string; count: number; wins: number }
    > = {};
    const recentResults: string[] = [];
    const chartData: any[] = [];

    // 🔥 НОВИЙ МАСИВ ДЛЯ ФРОНТЕНДУ (Для списку матчів і модалки)
    const formattedMatches: any[] = [];

    matches.forEach((match: any) => {
      const allPlayers = match.players?.all_players || [];
      const player = allPlayers.find(
        (p: any) => p.puuid === account.puuid,
      );
      if (!player) return;

      const k = Number(player.stats?.kills || 0);
      const d = Number(player.stats?.deaths || 0);
      const a = Number(player.stats?.assists || 0);
      const score = Number(player.stats?.score || 0);
      const damage = Number(player.damage_made || 0);
      const rounds = getRoundsPlayed(match, d);
      const acs = rounds > 0 ? Math.round(score / rounds) : 0;
      const mapName = match.metadata?.map || "Unknown Map";

      totalKills += k;
      totalDeaths += d;
      totalAssists += a;
      totalScore += score;
      totalDamage += damage;
      totalRounds += rounds;

      if (k > maxKills) maxKills = k;

      if (player.stats?.headshots) {
        totalHeadshots += Number(player.stats.headshots || 0);
        totalShots +=
          Number(player.stats.headshots || 0) +
          Number(player.stats.bodyshots || 0) +
          Number(player.stats.legshots || 0);
      }

      const agent = player.character || "Unknown";
      if (!agentCounts[agent])
        agentCounts[agent] = { count: 0, img: player.assets?.agent?.small || "" };
      agentCounts[agent].count++;

      const myTeam = player.team;
      const isWin = didPlayerWin(match, myTeam);

      if (isWin) wins++;

      if (!mapCounts[mapName]) {
        mapCounts[mapName] = { matches: 0, wins: 0 };
      }
      mapCounts[mapName].matches++;
      if (isWin) mapCounts[mapName].wins++;

      // 🔥 Додаємо матч у список для фронтенду
      formattedMatches.push({
        id: match.metadata?.matchid,
        win: isWin,
        map: mapName,
        agent: agent,
        kda: `${k}/${d}/${a}`,
      });

      allPlayers.forEach((p: any) => {
        if (p.puuid !== account.puuid && p.team === myTeam) {
          if (!allyCounts[p.puuid])
            allyCounts[p.puuid] = {
              name: p.name,
              tag: p.tag,
              count: 0,
              wins: 0,
            };
          allyCounts[p.puuid].count++;
          if (isWin) allyCounts[p.puuid].wins++;
        }
      });

      if (formattedMatches.length <= VALORANT_MATCH_LIMIT) {
        recentResults.push(isWin ? "1" : "0");
        chartData.unshift({
          name: mapName,
          acs,
          kills: k,
          matchId: match.metadata?.matchid,
        });
      }
    });

    let frequentDuo = null;
    const bestAlly = Object.values(allyCounts).sort(
      (a, b) => b.count - a.count,
    )[0];
    if (bestAlly && bestAlly.count >= 3) {
      frequentDuo = {
        name: bestAlly.name,
        tag: bestAlly.tag,
        count: bestAlly.count,
        winRate: ((bestAlly.wins / bestAlly.count) * 100).toFixed(0),
      };
    }

    const topAgents = Object.entries(agentCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([name, data]) => ({ name, img: data.img, count: data.count }));

    const safeAvg = (value: number, divider: number) => {
      return divider > 0 ? value / divider : 0;
    };

    const safePercent = (value: number, divider: number) => {
      return divider > 0 ? ((value / divider) * 100).toFixed(1) : "N/A";
    };

    const mainRole =
      topAgents.length > 0 ? getAgentRole(topAgents[0].name) : "Unknown";
    const totalMatches = formattedMatches.length;
    const mapStats = Object.entries(mapCounts)
      .sort((a, b) => b[1].matches - a[1].matches || b[1].wins - a[1].wins)
      .slice(0, 4)
      .map(([name, data]) => ({
        name,
        matches: data.matches,
        wins: data.wins,
        winRate: safePercent(data.wins, data.matches),
      }));

    return {
      profile: {
        nickname: account.name,
        tag: account.tag,
        level: account.account_level,
        avatar: account.card?.small || "",
        trackerUrl: `https://tracker.gg/valorant/profile/riot/${encodeURIComponent(name)}%23${encodeURIComponent(tag)}/overview`,
      },
      stats: {
        rank: mmr?.currenttierpatched || "Unranked",
        rank_img: mmr?.images?.small || "",
        elo: mmr?.ranking_in_tier || 0,
        mmr: typeof mmr?.elo === "number" ? mmr.elo : null,
        peakRank: mmr?.highest_tier_patched || "Unknown",
        totalGames: totalMatches,
        totalWinRate: safePercent(wins, totalMatches),
        kdr: totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : "N/A",
        avgKda:
          totalMatches > 0
            ? `${safeAvg(totalKills, totalMatches).toFixed(1)} / ${safeAvg(totalDeaths, totalMatches).toFixed(1)} / ${safeAvg(totalAssists, totalMatches).toFixed(1)}`
            : "N/A",
        acs: totalRounds > 0 ? Math.round(totalScore / totalRounds) : "N/A",
        adr: totalRounds > 0 ? Math.round(totalDamage / totalRounds) : "N/A",
        hs:
          totalShots > 0
            ? ((totalHeadshots / totalShots) * 100).toFixed(1)
            : "N/A",
        role: mainRole,
        maxKills: totalMatches > 0 ? maxKills : "N/A",
        frequentDuo,
        recent: recentResults,
        topAgents,
        mapStats,
        chartData,
        hasMatches: totalMatches > 0,
        matchLimit: VALORANT_MATCH_LIMIT,
        warnings,
      },
      matches: formattedMatches,
    };
  } catch (error: any) {
    console.error(
      "🔥 Valorant API Error:",
      error.response?.data || error.message,
    );
    // HenrikDev повертає коди помилок — перетворюємо їх на зрозумілі користувачу повідомлення
    const henrikCode = error.response?.data?.errors?.[0]?.code;
    if (henrikCode === 22) {
      throw new HttpError(404, "Riot account not found. Check the name and tag.");
    }
    if (henrikCode === 24) {
      throw new HttpError(404, "This account has no recent matches, so Riot does not share its stats. Try again after the player plays a game.");
    }
    throw toUpstreamError(error, "Player not found or API limits exceeded.");
  }
};

const VALORANT_MATCH_ID_REGEX = /^[0-9a-fA-F-]{1,64}$/;

export const getMatchDetails = async (matchId: string): Promise<any> => {
  if (!VALORANT_MATCH_ID_REGEX.test(matchId)) {
    throw new HttpError(400, "Invalid match ID");
  }

  try {
    const headers = HENRIKDEV_API_KEY
      ? { Authorization: HENRIKDEV_API_KEY }
      : {};

    const response = await http.get(
      `https://api.henrikdev.xyz/valorant/v2/match/${matchId}`,
      { headers },
    );
    return response.data.data;
  } catch (error: any) {
    console.error("🔥 Match API Error:", error.response?.data || error.message);
    throw toUpstreamError(error, "Failed to fetch match details");
  }
};
