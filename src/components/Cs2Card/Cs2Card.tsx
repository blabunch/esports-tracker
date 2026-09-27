import React from 'react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, XAxis } from 'recharts';
import './Cs2Card.scss';

const mapBackgrounds: Record<string, string> = {
  mirage: 'linear-gradient(135deg, rgba(202, 153, 89, 0.72), rgba(47, 56, 78, 0.92)), radial-gradient(circle at 24% 30%, rgba(255,255,255,0.26), transparent 26%)',
  inferno: 'linear-gradient(135deg, rgba(142, 57, 36, 0.82), rgba(46, 34, 29, 0.95)), radial-gradient(circle at 70% 20%, rgba(255, 165, 0, 0.28), transparent 24%)',
  dust2: 'linear-gradient(135deg, rgba(212, 164, 89, 0.78), rgba(80, 58, 34, 0.95)), radial-gradient(circle at 70% 72%, rgba(255,255,255,0.18), transparent 26%)',
  dust: 'linear-gradient(135deg, rgba(212, 164, 89, 0.78), rgba(80, 58, 34, 0.95)), radial-gradient(circle at 70% 72%, rgba(255,255,255,0.18), transparent 26%)',
  nuke: 'linear-gradient(135deg, rgba(52, 82, 97, 0.82), rgba(18, 25, 32, 0.96)), radial-gradient(circle at 20% 80%, rgba(46, 204, 113, 0.22), transparent 24%)',
  ancient: 'linear-gradient(135deg, rgba(52, 111, 70, 0.78), rgba(23, 38, 30, 0.96)), radial-gradient(circle at 78% 22%, rgba(255,255,255,0.18), transparent 24%)',
  anubis: 'linear-gradient(135deg, rgba(191, 134, 69, 0.78), rgba(39, 45, 70, 0.96)), radial-gradient(circle at 26% 25%, rgba(52, 152, 219, 0.24), transparent 24%)',
  vertigo: 'linear-gradient(135deg, rgba(86, 103, 125, 0.8), rgba(24, 27, 35, 0.96)), radial-gradient(circle at 75% 28%, rgba(255,255,255,0.22), transparent 22%)',
  overpass: 'linear-gradient(135deg, rgba(70, 100, 94, 0.8), rgba(31, 38, 46, 0.96)), radial-gradient(circle at 22% 70%, rgba(52, 152, 219, 0.18), transparent 24%)',
  train: 'linear-gradient(135deg, rgba(82, 91, 86, 0.82), rgba(30, 35, 33, 0.96)), radial-gradient(circle at 68% 65%, rgba(255, 165, 0, 0.18), transparent 24%)',
};

const normalizeMapName = (name: string) => name.toLowerCase().replace(/^de_/, '').replace(/[^a-z0-9]/g, '');

const getMapStyle = (name: string, image?: string): React.CSSProperties => {
  const normalizedName = normalizeMapName(name);
  const fallback = mapBackgrounds[normalizedName] || 'linear-gradient(135deg, rgba(255, 165, 0, 0.28), rgba(26, 26, 36, 0.96))';

  if (image) {
    return {
      backgroundImage: `linear-gradient(to top, rgba(9, 9, 11, 0.9), rgba(9, 9, 11, 0.12)), url(${image})`,
    };
  }

  return { backgroundImage: fallback };
};

interface Cs2CardProps { 
  data: any; 
  onMatchClick?: (matchId: string) => void; 
}

// Оголошено поза компонентом картки, щоб не створювати новий компонент на кожен рендер
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'rgba(9,9,11,0.9)', padding: '12px', border: '1px solid var(--glass-border)', borderRadius: '12px', backdropFilter: 'blur(8px)', fontFamily: "'Outfit', sans-serif" }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase' }}>{label}</p>
        <p style={{ color: 'var(--color-cs2)', fontWeight: '800', fontSize: '16px' }}>Avg K/D: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export const Cs2Card: React.FC<Cs2CardProps> = ({ data, onMatchClick }) => {
  return (
    <div className="cs2-card fade-in-up">
      {/* --- ЛІВА ПАНЕЛЬ --- */}
      <div className="cs2-card__profile">
        <div className="cs2-card__avatar-box">
          <img className="cs2-card__avatar" src={data.profile.avatar} alt="Avatar" />
          <div className="cs2-card__lvl">LVL {data.profile.level}</div>
        </div>
        
        <div className="cs2-card__name-wrapper">
          <h2 className="cs2-card__name">{data.profile.nickname}</h2>
          <span className={`cs2-badge ${data.profile.membership === 'Premium' ? 'cs2-badge--premium' : ''}`}>
            {data.profile.membership}
          </span>
        </div>
        
        <div className="cs2-card__rank-box">
          <div className="cs2-card__rank-text">
            <p className="cs2-card__rank-name">{data.profile.elo} ELO</p>
            <p className="cs2-card__rank-sub">Region: {data.profile.country.toUpperCase()}</p>
          </div>
        </div>

        <div className="cs2-card__streak">
          <span className="cs2-card__streak-label">Longest Win Streak</span>
          <span className="cs2-card__streak-val">{data.stats.longestStreak} 🔥</span>
        </div>

        <div className="cs2-card__matches-row">
          {data.stats.recentResults.map((r: string, i: number) => (
            <div key={i} className={`cs2-box cs2-box--${r === '1' || r === 'W' ? 'w' : 'l'}`} title={r === '1' || r === 'W' ? 'Win' : 'Loss'}>{r === '1' || r === 'W' ? 'W' : 'L'}</div>
          ))}
        </div>

        <div className="cs2-card__links">
          <a href={data.profile.faceitUrl} target="_blank" rel="noreferrer" className="cs2-link cs2-link--faceit">Faceit Profile</a>
        </div>
      </div>

      {/* --- ПРАВА ПАНЕЛЬ --- */}
      <div className="cs2-card__bento">
        
        <div className="cs2-stat cs2-stat--main">
          <span className="cs2-stat__label">Lifetime Win Rate</span>
          <span className="cs2-stat__val">{data.stats.winRate}%</span>
          <span className="cs2-stat__subtext">{data.stats.wins} Wins / {data.stats.matches} Matches</span>
        </div>

        <div className="cs2-stat cs2-stat--wide">
          <span className="cs2-stat__label">Combat (Lifetime)</span>
          <span className="cs2-stat__val">{data.stats.kdr} K/D</span>
          <span className="cs2-stat__subtext">Average Kill/Death Ratio</span>
        </div>

        <div className="cs2-stat"><span className="cs2-stat__label">Headshots</span><span className="cs2-stat__val">{data.stats.hs}%</span><span className="cs2-stat__subtext">{data.stats.totalHeadshots} Total HS</span></div>
        
        <div className="cs2-stat" style={{ background: 'rgba(255, 165, 0, 0.05)' }}>
          <span className="cs2-stat__label">Current Streak</span>
          <span className="cs2-stat__val" style={{ color: 'var(--color-cs2)' }}>{data.stats.currentStreak} W</span>
          <span className="cs2-stat__subtext">Active form</span>
        </div>

        {/* 🔥 ФІКС ДІРКИ: Recent Form на всю ширину (--full) */}
        <div className="cs2-stat cs2-stat--full">
          <span className="cs2-stat__label">Recent Form (Last 20)</span>
          <span className="cs2-stat__val" style={{color: '#ffa500'}}>{data.stats.recentWinRate}% WR</span>
          <span className="cs2-stat__subtext">Based on last 20 Faceit matches</span>
        </div>

        {/* ГРАФІК MAP PERFORMANCE */}
        {data.stats.chartData && data.stats.chartData.length > 0 && (
          <div className="cs2-card__chart-bento">
            <div className="cs2-card__chart-header">
              <span className="cs2-stat__label">Map Performance (K/D Ratio)</span>
              <span className="cs2-stat__subtext" style={{ marginTop: 0 }}>Top 5 Played Maps</span>
            </div>
            <div className="cs2-card__chart-wrapper" style={{ height: '160px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={data.stats.chartData} 
                  margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorKd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ffa500" stopOpacity={0.6}/><stop offset="95%" stopColor="#ffa500" stopOpacity={0}/></linearGradient>
                  </defs>
                  <XAxis dataKey="name" hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--glass-border)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Area type="monotone" dataKey="kd" stroke="#ffa500" strokeWidth={3} fillOpacity={1} fill="url(#colorKd)" activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="cs2-card__heroes-bento">
          <h3 className="cs2-stat__label" style={{ marginBottom: '16px' }}>Top Maps (Lifetime)</h3>
          <div className="cs2-card__maps">
            {data.stats.topMaps.map((m: any) => (
              <div key={m.name} className={`cs2-map cs2-map--${normalizeMapName(m.name)}`} style={getMapStyle(m.name, m.img)}>
                <div className="cs2-map__pattern" aria-hidden="true" />
                <div className="cs2-map__glass">
                  <span className="cs2-map__name">{m.name.replace('de_', '').toUpperCase()}</span>
                  <div className="cs2-map__stats">
                    <span>{m.winRate}% WR</span>
                    <span>{m.matches} matches</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 🔥 ІСТОРІЯ МАТЧІВ CS2 */}
        {data.matches && data.matches.length > 0 && (
          <div className="cs2-card__matches-list-bento" style={{ gridColumn: '1 / -1', background: 'rgba(26, 26, 36, 0.4)', padding: '24px', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
            <h3 className="cs2-stat__label" style={{ marginBottom: '16px', fontSize: '16px', color: '#fff' }}>Recent Matches (Click for scoreboard)</h3>
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
                    <span style={{ fontWeight: 900, color: m.win ? '#2ecc71' : '#ff4655', width: '80px' }}>{m.win ? 'VICTORY' : 'DEFEAT'}</span>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: '16px' }}>{m.score}</span>
                  </div>
                  <div style={{ color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{m.date}</span>
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
