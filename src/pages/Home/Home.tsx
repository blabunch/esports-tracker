import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { gameApi } from '../../api/client';
import { User } from '../../api/types';
import { cs2Path, dotaPath, valorantPath } from '../../routes';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useCountUp } from '../../hooks/useCountUp';
import './Home.scss';

const formatCount = (value?: number) => (value === undefined ? '—' : new Intl.NumberFormat('en-US').format(value));

export const Home: React.FC<{ user?: User | null }> = ({ user }) => {
    const navigate = useNavigate();
    useDocumentTitle();

    // Нікнейм Dota береться з профілю Steam, бо в акаунті зберігається лише числовий ID
    const { data: dotaData, isFetching: isDotaFetching } = useQuery({
        queryKey: ['dota-name', user?.dotaId || ''],
        queryFn: () => gameApi.getDota(user!.dotaId!),
        enabled: Boolean(user?.dotaId),
    });
    const dotaName = dotaData?.profile?.nickname;

    // Реальна статистика з БД замість вигаданих цифр
    const { data: overview } = useQuery({
        queryKey: ['overview'],
        queryFn: gameApi.getOverview,
    });
    const playersTracked = useCountUp(overview?.playersTracked);
    const profilesChecked = useCountUp(overview?.profilesChecked24h);

    const hasLinkedAccounts = user && (user.valName || user.dotaId || user.faceitNickname);

    // 🔥 БЕРЕМО НОВИЙ НІКНЕЙМ АБО ПОШТУ (якщо ніку ще немає)
    const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
    const displayLetter = displayName.charAt(0).toUpperCase();

    return (
        <div className="home fade-in-up">
            <div className="home__layout">
                
                {/* 👈 ЛІВА КОЛОНКА */}
                <div className="home__left">
                    <h1 className="home__title">
                        INSIGHT TO<br/>
                        <span className="text-accent">EVOLVE YOUR GAME</span><br/>
                        AND SO MUCH MORE.
                    </h1>
                    <p className="home__subtitle">
                        Look up any player in Valorant, Dota 2 and CS2, study their recent form and follow how their rating changes over time.
                    </p>

                    <div className="home__stats">
                        <div className="stat-box">
                            <h4>{formatCount(playersTracked)}</h4>
                            <p>Players Tracked</p>
                        </div>
                        <div className="stat-box">
                            <h4>{formatCount(profilesChecked)}</h4>
                            <p>Profiles Checked (24h)</p>
                        </div>
                    </div>
                </div>

                {/* 👉 ПРАВА КОЛОНКА */}
                <div className="home__right">
                    
                    {/* ВІДЖЕТ АКАУНТІВ */}
                    {hasLinkedAccounts && (
                        <div className="home__section fade-in-up">
                            <h3 className="section-title">MY LINKED ACCOUNTS</h3>
                            <div className="widget-panel">
                                <div className="widget-header">
                                    {/* 🔥 ТЕПЕР ТУТ НОВА БУКВА І НОВИЙ НІК */}
                                    <div className="avatar">{displayLetter}</div>
                                    <div className="info">
                                        <h4>{displayName}</h4>
                                        <p>Ready to track.</p>
                                    </div>
                                </div>
                                <div className="widget-badges">
                                    {user.valName && (
                                        <button className="widget-badge widget-badge--val" onClick={() => navigate(valorantPath(user.valName!, user.valTag!))}>
                                            <span className="game-icon">V</span> 
                                            <span className="game-id">{user.valName}#{user.valTag}</span>
                                        </button>
                                    )}
                                    
                                    {/* 🔥 ОНОВЛЕНИЙ ВІДЖЕТ DOTA 2 */}
                                    {user.dotaId && (
                                        <button className="widget-badge widget-badge--dota" onClick={() => navigate(dotaPath(user.dotaId!))}>
                                            <span className="game-icon">D</span> 
                                            <span className="game-id">
                                                {isDotaFetching ? 'Fetching...' : (dotaName ? dotaName : user.dotaId)}
                                            </span>
                                        </button>
                                    )}

                                    {user.faceitNickname && (
                                        <button className="widget-badge widget-badge--cs2" onClick={() => navigate(cs2Path(user.faceitNickname!))}>
                                            <span className="game-icon">C</span> 
                                            <span className="game-id">{user.faceitNickname}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* СІТКА ІГОР */}
                    <div className="home__section">
                        <h3 className="section-title">SUPPORTED GAMES</h3>
                        <div className="games-grid">
                            
                            <button type="button" className="game-card game-card--featured" onClick={() => navigate('/valorant')}>
                                <div className="game-card__bg game-card__bg--val"></div>
                                <div className="game-card__overlay">
                                    <h2 className="game-card__name">Valorant</h2>
                                    <p className="game-card__desc">Track Riot ID & Tags</p>
                                </div>
                            </button>

                            <button type="button" className="game-card" onClick={() => navigate('/dota')}>
                                <div className="game-card__bg game-card__bg--dota"></div>
                                <div className="game-card__overlay">
                                    <h2 className="game-card__name">Dota 2</h2>
                                    <p className="game-card__desc">Steam 32-bit ID</p>
                                </div>
                            </button>

                            <button type="button" className="game-card" onClick={() => navigate('/cs2')}>
                                <div className="game-card__bg game-card__bg--cs2"></div>
                                <div className="game-card__overlay">
                                    <h2 className="game-card__name">CS2</h2>
                                    <p className="game-card__desc">Faceit Nicknames</p>
                                </div>
                            </button>

                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};
