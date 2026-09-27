import React from 'react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import './DotaCard.scss';

// Хелпер для назв рангів
const getRankInfo = (rankTier: number | null) => {
  if (!rankTier) return { name: 'Unranked', img: 'https://www.opendota.com/assets/images/dota2/rank_icons/rank_icon_0.png' };
  const base = Math.floor(rankTier / 10);
  const ranks = ['Unranked', 'Herald', 'Guardian', 'Crusader', 'Archon', 'Legend', 'Ancient', 'Divine', 'Immortal'];
  return {
    name: ranks[base] || 'Unknown',
    img: `https://www.opendota.com/assets/images/dota2/rank_icons/rank_icon_${base}.png`
  };
};

interface DotaCardProps { 
  data: any; 
  onMatchClick?: (matchId: string) => void; 
}

// Оголошено поза компонентом картки, щоб не створювати новий компонент на кожен рендер
const CustomTooltip = ({ active, payload, label, showHint }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'rgba(9,9,11,0.9)', padding: '12px', border: '1px solid var(--glass-border)', borderRadius: '12px', backdropFilter: 'blur(8px)', fontFamily: "'Outfit', sans-serif" }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>{label}</p>
        <p style={{ color: 'var(--color-dota)', fontWeight: '800', fontSize: '16px' }}>KDA Ratio: {payload[0].value}</p>
        {showHint && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginTop: '8px', textTransform: 'uppercase' }}>Click to view details</p>}
      </div>
    );
  }
  return null;
};

export const DotaCard: React.FC<DotaCardProps> = ({ data, onMatchClick }) => {
  const rankInfo = getRankInfo(data.profile.rank_tier);

  return (
    <div className="dota-card fade-in-up">
      {/* --- ЛІВА ПАНЕЛЬ --- */}
      <div className="dota-card__profile">
        <div className="dota-card__avatar-box">
          <img className="dota-card__avatar" src={data.profile.avatar} alt="Avatar" />
        </div>
        <h2 className="dota-card__name">{data.profile.nickname}</h2>
        
        <div className="dota-card__rank-box">
          <img src={rankInfo.img} alt="Rank" className="dota-card__rank-img" />
          <div className="dota-card__rank-text">
            <p className="dota-card__rank-name">{rankInfo.name}</p>
            {data.profile.leaderboard_rank ? (
              <p className="dota-card__rank-sub">Rank #{data.profile.leaderboard_rank}</p>
            ) : (
              <p className="dota-card__rank-sub">Tier: {data.profile.rank_tier || 'N/A'}</p>
            )}
          </div>
        </div>

        <div className="dota-card__matches-row">
          {data.stats.recentResults.map((r: string, i: number) => (
            <div key={i} className={`dota-box dota-box--${r === '1' ? 'w' : 'l'}`} title={r === '1' ? 'Win' : 'Loss'}>
              {r === '1' ? 'W' : 'L'}
            </div>
          ))}
        </div>

        {data.stats.topTeammates && data.stats.topTeammates.length > 0 && (
          <div className="dota-card__allies">
            <p className="dota-card__allies-title">Frequent Allies</p>
            <div className="dota-card__allies-list">
              {data.stats.topTeammates.map((ally: any, idx: number) => (
                <div key={idx} className="dota-card__ally">
                  <img src={ally.avatar} alt={ally.name} />
                  <div className="dota-card__ally-info">
                    <p className="dota-card__ally-name">{ally.name}</p>
                    <p className="dota-card__ally-stat">{ally.winRate}% WR ({ally.games}G)</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="dota-card__links">
          <a href={data.profile.steamUrl} target="_blank" rel="noreferrer" className="dota-link dota-link--steam">Steam</a>
          <a href={`https://www.dotabuff.com/players/${data.profile.accountId}`} target="_blank" rel="noreferrer" className="dota-link dota-link--buff">Dotabuff</a>
          <a href={`https://www.opendota.com/players/${data.profile.accountId}`} target="_blank" rel="noreferrer" className="dota-link dota-link--open">OpenDota</a>
        </div>
      </div>

      {/* --- ПРАВА ПАНЕЛЬ (Bento Grid) --- */}
      <div className="dota-card__bento">
        <div className="dota-stat dota-stat--main">
          <span className="dota-stat__label">Win Rate</span>
          <span className="dota-stat__val">{data.stats.winRate}%</span>
          <span className="dota-stat__subtext">Across {data.stats.matches} Matches</span>
        </div>

        {data.stats.signatureHero ? (
           <div className="dota-stat dota-stat--wide dota-stat--signature">
             <div className="dota-stat__sig-info">
               <span className="dota-stat__label">Signature Hero</span>
               <span className="dota-stat__val">{data.stats.signatureHero.name}</span>
               <span className="dota-stat__subtext">{data.stats.signatureHero.winRate}% WR in {data.stats.signatureHero.games} matches</span>
             </div>
             {data.stats.signatureHero.img && (
               <img src={data.stats.signatureHero.img} alt="Hero" className="dota-stat__sig-img" />
             )}
           </div>
        ) : (
           <div className="dota-stat dota-stat--wide"><span className="dota-stat__label">Signature Hero</span><span className="dota-stat__subtext">Not enough data.</span></div>
        )}

        <div className="dota-stat dota-stat--wide">
          <span className="dota-stat__label">All-Time Totals (K / D / A)</span>
          <span className="dota-stat__val">{data.stats.allTimeTotals.kills} / {data.stats.allTimeTotals.deaths} / {data.stats.allTimeTotals.assists}</span>
          <span className="dota-stat__subtext">Total lifetime performance</span>
        </div>

        <div className="dota-stat"><span className="dota-stat__label">Economy</span><span className="dota-stat__val">{data.stats.avgGpm} <span style={{fontSize:'20px', color:'var(--text-muted)'}}>/</span> {data.stats.avgXpm}</span><span className="dota-stat__subtext">Avg GPM / XPM</span></div>
        <div className="dota-stat"><span className="dota-stat__label">Impact</span><span className="dota-stat__val">{data.stats.avgHd}</span><span className="dota-stat__subtext">Avg Hero Damage</span></div>
        <div className="dota-stat"><span className="dota-stat__label" style={{color: '#2ecc71'}}>Support</span><span className="dota-stat__val">{data.stats.avgHealing}</span><span className="dota-stat__subtext">Avg Hero Healing</span></div>
        <div className="dota-stat"><span className="dota-stat__label" style={{color: '#f39c12'}}>Pusher</span><span className="dota-stat__val">{data.stats.avgTowerDamage}</span><span className="dota-stat__subtext">Avg Tower Damage</span></div>
        
        {/* 🔥 ФІКС ДІРКИ: Pace тепер на дві колонки (--wide) */}
        <div className="dota-stat dota-stat--wide"><span className="dota-stat__label">Pace</span><span className="dota-stat__val">{data.stats.avgDuration}</span><span className="dota-stat__subtext">Avg Match Duration</span></div>

        {/* 🔥 КЛІКАБЕЛЬНИЙ ГРАФІК */}
        {data.stats.chartData && data.stats.chartData.length > 0 && (
          <div className="dota-card__chart-bento">
            <div className="dota-card__chart-header">
              <span className="dota-stat__label">KDA Performance Trend</span>
              <span className="dota-stat__subtext" style={{ marginTop: 0 }}>Last 10 Matches (Click dot for match)</span>
            </div>
            <div className="dota-card__chart-wrapper" style={{ height: '160px', width: '100%' }}>
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
                    <linearGradient id="colorKda" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d94b38" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#d94b38" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip content={<CustomTooltip showHint={Boolean(onMatchClick)} />} cursor={{ stroke: 'var(--glass-border)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Area type="monotone" dataKey="kda" stroke="#d94b38" strokeWidth={3} fillOpacity={1} fill="url(#colorKda)" activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="dota-card__heroes-bento">
          <h3 className="dota-stat__label" style={{ marginBottom: '16px' }}>Top 5 Heroes (Recent Matches)</h3>
          <div className="dota-card__heroes">
            {data.stats.topHeroes.map((h: any) => (
              <div key={h.name} className="dota-hero">
                {h.img ? <img src={h.img} alt={h.name} /> : <div className="dota-hero__placeholder">?</div>}
                <span className="dota-hero__name" title={h.name}>{h.name}</span>
                <span className="dota-hero__games">{h.games} matches</span>
              </div>
            ))}
          </div>
        </div>

        {/* 🔥 ІСТОРІЯ МАТЧІВ */}
        {data.matches && data.matches.length > 0 && (
          <div className="dota-card__matches-list-bento" style={{ gridColumn: '1 / -1', background: 'rgba(26, 26, 36, 0.4)', padding: '24px', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
            <h3 className="dota-stat__label" style={{ marginBottom: '16px', fontSize: '16px', color: '#fff' }}>Recent Matches (Click for scoreboard)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.matches.slice(0, 5).map((m: any, idx: number) => (
                <button 
                  key={idx} 
                  type="button"
                  onClick={() => onMatchClick && m.id && onMatchClick(m.id)}
                  style={{ 
                      display: 'flex', justifyContent: 'space-between', padding: '16px 20px', 
                      color: 'inherit', font: 'inherit', textAlign: 'left',
                      background: 'rgba(0,0,0,0.3)', borderRadius: '16px', cursor: 'pointer', 
                      border: '1px solid transparent', transition: '0.2s' 
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.3)'; e.currentTarget.style.borderColor = 'transparent'; }}
                >
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 900, color: m.win ? '#2ecc71' : '#d94b38', width: '80px' }}>{m.win ? 'VICTORY' : 'DEFEAT'}</span>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: '16px', width: '150px' }}>{m.hero}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{m.duration}</span>
                  </div>
                  <div style={{ color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>{m.kda} KDA</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '18px' }}>→</span>
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
