import React from 'react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import './ValorantCard.scss';

const RANK_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2256%22 height=%2256%22 viewBox=%220 0 56 56%22%3E%3Crect width=%2256%22 height=%2256%22 rx=%2214%22 fill=%22%2321212b%22/%3E%3Cpath d=%22M28 10l15 9v18l-15 9-15-9V19l15-9z%22 fill=%22%23ff4655%22 opacity=%22.22%22/%3E%3Cpath d=%22M28 17l9 6v10l-9 6-9-6V23l9-6z%22 fill=%22%23ff4655%22 opacity=%22.62%22/%3E%3C/svg%3E';

const formatStat = (value: unknown, suffix = '') => {
  if (value === null || value === undefined || value === '' || value === 'N/A') return '—';
  return `${value}${suffix}`;
};

interface ValorantCardProps {
  data: any; 
  onMatchClick?: (matchId: string) => void;
}

export const ValorantCard: React.FC<ValorantCardProps> = ({ data, onMatchClick }) => {
  const hasMatches = Boolean(data.stats.hasMatches ?? data.matches?.length);
  const matchLimit = data.stats.matchLimit || 10;
  const warnings = data.stats.warnings || [];
  const recentResults = data.stats.recent || [];
  const topAgents = data.stats.topAgents || [];
  const mapStats = data.stats.mapStats || [];
  const totalGames = data.stats.totalGames || data.matches?.length || 0;
  const recentMatches = (data.matches || []).slice(0, matchLimit);
  const bestMap = mapStats[0];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'rgba(9,9,11,0.9)', padding: '12px', border: '1px solid var(--glass-border)', borderRadius: '12px', backdropFilter: 'blur(8px)', fontFamily: "'Outfit', sans-serif" }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>{label}</p>
          <p style={{ color: 'var(--color-val)', fontWeight: '800', fontSize: '16px' }}>ACS: {payload[0].value}</p>
          <p style={{ color: '#fff', fontSize: '14px' }}>Kills: {payload[1].value}</p>
          {onMatchClick && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginTop: '8px', textTransform: 'uppercase' }}>Click to view match</p>}
        </div>
      );
    }
    return null;
  };

  const winRateValue = parseFloat(data.stats.totalWinRate);
  const winRateColor = Number.isFinite(winRateValue) && winRateValue >= 50 ? '#2ecc71' : '#ff4655';
  const kdrValue = parseFloat(data.stats.kdr);
  const summaryTitle = !hasMatches
    ? 'No public match sample'
    : winRateValue >= 50
      ? 'Positive recent form'
      : kdrValue >= 1
        ? 'Impact is stable'
        : 'Needs cleaner rounds';
  const summaryText = !hasMatches
    ? 'Riot/HenrikDev did not return recent matches for this profile.'
    : `${totalGames} matches analyzed${bestMap ? ` · best map ${bestMap.name} (${formatStat(bestMap.winRate, '%')} WR)` : ''}.`;

  return (
    <div className="val-card fade-in-up">
      {/* --- ЛІВА ПАНЕЛЬ --- */}
      <div className="val-card__profile">
        <div className="val-card__avatar-box">
          <img className="val-card__avatar" src={data.profile.avatar} alt="Avatar" />
          <div className="val-card__lvl">{data.profile.level}</div>
        </div>
        <h2 className="val-card__name">{data.profile.nickname} <span className="val-card__tag">#{data.profile.tag}</span></h2>
        
        {/* Поточний Ранг */}
        <div className="val-card__rank-box">
          <img src={data.stats.rank_img || RANK_PLACEHOLDER} alt="Rank" className="val-card__rank-img" onError={(e) => { e.currentTarget.src = RANK_PLACEHOLDER; }} />
          <div className="val-card__rank-text">
            <p className="val-card__rank-name">{data.stats.rank}</p>
            <p className="val-card__rank-sub">{data.stats.elo} RR</p>
          </div>
        </div>

        {/* Останні матчі (W/L квадратики) */}
        {recentResults.length > 0 && (
          <div className="val-card__matches-row">
            {recentResults.map((r: string, i: number) => (
              <div key={i} className={`val-box val-box--${r === '1' ? 'w' : 'l'}`} title={r === '1' ? 'Win' : 'Loss'}>{r === '1' ? 'W' : 'L'}</div>
            ))}
          </div>
        )}

        <div className="val-card__quick-read">
          <span className="val-card__quick-label">Profile Snapshot</span>
          <strong>{summaryTitle}</strong>
          <span>{summaryText}</span>
        </div>

        {/* 🔥 Прокачаний Частий Напарник */}
        {data.stats.frequentDuo && (
          <div className="val-card__duo">
            <span className="val-card__duo-label">Best Teammate</span>
            <div className="val-card__duo-player">
              <div className="duo-avatar">👤</div>
              <div className="val-card__duo-info">
                <p className="name">{data.stats.frequentDuo.name} <span className="tag">#{data.stats.frequentDuo.tag}</span></p>
                <p className="stats">{data.stats.frequentDuo.winRate}% WR ({data.stats.frequentDuo.count} games)</p>
              </div>
            </div>
          </div>
        )}

        {/* 🔥 Кнопка піднята вище */}
        <div className="val-card__links">
          <a href={data.profile.trackerUrl} target="_blank" rel="noreferrer" className="val-link val-link--tracker">View on Tracker.gg</a>
        </div>
      </div>

      {/* --- ПРАВА ПАНЕЛЬ (Bento Grid) --- */}
      <div className="val-card__bento">
        {warnings.length > 0 && (
          <div className="val-card__warning">
            <strong>Limited Valorant data</strong>
            <span>{warnings.join(' ')}</span>
          </div>
        )}
        
        {/* ROW 1 */}
        <div className="val-stat val-stat--main">
          <span className="val-stat__label">Recent Form</span>
          <span className="val-stat__val" style={{ color: winRateColor }}>{formatStat(data.stats.totalWinRate, Number.isFinite(winRateValue) ? '%' : '')}</span>
          <span className="val-stat__subtext">{hasMatches ? `Win Rate across last ${totalGames} matches` : 'No recent public match data'}</span>
        </div>

        <div className="val-stat val-stat--wide">
          <span className="val-stat__label">Combat (Avg K/D/A)</span>
          <span className="val-stat__val">{formatStat(data.stats.avgKda)}</span>
          <span className="val-stat__subtext">Overall K/D Ratio: {formatStat(data.stats.kdr)}</span>
        </div>

        {/* ROW 2 */}
        <div className="val-stat"><span className="val-stat__label">ACS</span><span className="val-stat__val">{formatStat(data.stats.acs)}</span><span className="val-stat__subtext">Average Combat Score</span></div>
        <div className="val-stat"><span className="val-stat__label">ADR</span><span className="val-stat__val">{formatStat(data.stats.adr)}</span><span className="val-stat__subtext">Average Damage/Round</span></div>
        
        {/* ROW 3 */}
        <div className="val-stat"><span className="val-stat__label">Headshot</span><span className="val-stat__val">{formatStat(data.stats.hs, data.stats.hs === 'N/A' ? '' : '%')}</span><span className="val-stat__subtext">Overall Accuracy</span></div>

        <div className="val-stat" style={{ background: 'rgba(255, 70, 85, 0.05)' }}>
          <span className="val-stat__label">Main Role</span>
          <span className="val-stat__val" style={{ color: 'var(--color-val)' }}>{data.stats.role}</span>
          <span className="val-stat__subtext">Most played recently</span>
        </div>

        {/* 🔥 Тепер займає 1 клітинку, ідеально вписуючись у 3-й ряд */}
        <div className="val-stat">
          <span className="val-stat__label">Highest Kills</span>
          <span className="val-stat__val">{formatStat(data.stats.maxKills)} {hasMatches ? '🔥' : ''}</span>
          <span className="val-stat__subtext">Best in last {totalGames || matchLimit} games</span>
        </div>

        {/* ГРАФІК ACS */}
        {data.stats.chartData && data.stats.chartData.length > 0 && (
          <div className="val-card__chart-bento">
            <div className="val-card__chart-header">
              <span className="val-stat__label">ACS Performance Trend</span>
	              <span className="val-stat__subtext" style={{ marginTop: 0 }}>Last {totalGames || matchLimit} Matches (Click dot for details)</span>
            </div>
            <div className="val-card__chart-wrapper" style={{ height: '160px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={data.stats.chartData} 
                  margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                  style={{ cursor: onMatchClick ? 'pointer' : 'default' }}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload[0]?.payload?.matchId && onMatchClick) {
                        onMatchClick(e.activePayload[0].payload.matchId);
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="colorAcs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ff4655" stopOpacity={0.6}/><stop offset="95%" stopColor="#ff4655" stopOpacity={0}/></linearGradient>
                  </defs>
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--glass-border)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Area type="monotone" dataKey="acs" stroke="#ff4655" strokeWidth={3} fillOpacity={1} fill="url(#colorAcs)" activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }} />
                  <Area type="monotone" dataKey="kills" stroke="#fff" strokeWidth={2} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ТОП-3 АГЕНТИ */}
        <div className="val-card__heroes-bento">
	          <h3 className="val-stat__label" style={{ marginBottom: '16px' }}>Top Agents (Last {totalGames || matchLimit} Matches)</h3>
	          <div className="val-card__heroes">
	            {topAgents.length > 0 ? topAgents.map((a: any) => (
	              <div key={a.name} className="val-hero">
	                {a.img ? <img src={a.img} alt={a.name} /> : <div className="val-hero__placeholder">?</div>}
	                <div className="val-hero__info">
	                  <span className="val-hero__name">{a.name}</span>
	                  <span className="val-hero__games">{a.count} matches</span>
	                </div>
	              </div>
	            )) : (
                <div className="val-card__empty">
                  <strong>No agent data yet</strong>
                  <span>{warnings[0] || 'Play public matches or try again later.'}</span>
                </div>
              )}
	          </div>
	        </div>

        {mapStats.length > 0 && (
          <div className="val-card__maps-bento">
            <div className="val-card__section-head">
              <h3 className="val-stat__label">Map Pool</h3>
              <span>{mapStats.length} maps from recent sample</span>
            </div>
            <div className="val-card__maps-grid">
              {mapStats.map((map: any) => (
                <div key={map.name} className="val-map">
                  <span className="val-map__name">{map.name}</span>
                  <strong className={Number(map.winRate) >= 50 ? 'is-good' : 'is-bad'}>{formatStat(map.winRate, '%')} WR</strong>
                  <span className="val-map__meta">{map.wins}/{map.matches} wins</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ІСТОРІЯ МАТЧІВ */}
        {recentMatches.length > 0 && (
          <div className="val-card__matches-list-bento">
            <div className="val-card__section-head">
              <h3 className="val-stat__label">Recent Matches</h3>
              <span>Click for scoreboard</span>
            </div>
            <div className="val-card__matches-list">
              {recentMatches.map((m: any, idx: number) => (
                <button 
                  key={idx} 
                  type="button"
                  onClick={() => onMatchClick && m.id && onMatchClick(m.id)}
                  className="val-match"
                >
                  <div className="val-match__main">
                    <span className={`val-match__result ${m.win ? 'is-win' : 'is-loss'}`}>{m.win ? 'VICTORY' : 'DEFEAT'}</span>
                    <span className="val-match__map">{m.map}</span>
                    <span className="val-match__agent">{m.agent}</span>
                  </div>
                  <div className="val-match__kda">
                    <span>{m.kda} KDA</span>
                    <span>→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
