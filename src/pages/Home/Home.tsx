import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameApi } from '../../api/client';
import './Home.scss';

export const Home: React.FC<{ user?: any }> = ({ user }) => {
    const navigate = useNavigate();
    
    const [dotaName, setDotaName] = useState<string | null>(null);
    const [isDotaFetching, setIsDotaFetching] = useState(false);

    // 🔥 ІДЕАЛЬНИЙ ПОШУК НІКНЕЙМУ DOTA 2 (Завдяки логам!)
    useEffect(() => {
        if (user?.dotaId) {
            setIsDotaFetching(true);
            gameApi.getDota(user.dotaId)
                .then(data => {
                    const fetchedName = data?.profile?.nickname;
                    if (fetchedName) {
                        setDotaName(fetchedName);
                    }
                })
                .catch(err => console.error("Could not fetch Dota name", err))
                .finally(() => setIsDotaFetching(false));
        }
    }, [user?.dotaId]);

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
                        Analyze matches, study opponents, and improve in your favorite games with our cutting-edge tracking technology.
                    </p>

                    <div className="home__stats">
                        <div className="stat-box">
                            <h4>300M+</h4>
                            <p>Players Tracked</p>
                        </div>
                        <div className="stat-box">
                            <h4>25M+</h4>
                            <p>Matches Past 24 Hrs</p>
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
                                        <button className="widget-badge widget-badge--val" onClick={() => navigate('/valorant', { state: { autoSearch: true, name: user.valName, tag: user.valTag } })}>
                                            <span className="game-icon">V</span> 
                                            <span className="game-id">{user.valName}#{user.valTag}</span>
                                        </button>
                                    )}
                                    
                                    {/* 🔥 ОНОВЛЕНИЙ ВІДЖЕТ DOTA 2 */}
                                    {user.dotaId && (
                                        <button className="widget-badge widget-badge--dota" onClick={() => navigate('/dota', { state: { autoSearch: true, id: user.dotaId } })}>
                                            <span className="game-icon">D</span> 
                                            <span className="game-id">
                                                {isDotaFetching ? 'Fetching...' : (dotaName ? dotaName : user.dotaId)}
                                            </span>
                                        </button>
                                    )}

                                    {user.faceitNickname && (
                                        <button className="widget-badge widget-badge--cs2" onClick={() => navigate('/cs2', { state: { autoSearch: true, nickname: user.faceitNickname } })}>
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
