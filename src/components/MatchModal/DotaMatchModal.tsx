import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { gameApi } from '../../api/client';
import './MatchModal.scss';

const HERO_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2236%22 height=%2236%22 viewBox=%220 0 36 36%22%3E%3Crect width=%2236%22 height=%2236%22 rx=%228%22 fill=%22%232a2a35%22/%3E%3Ctext x=%2218%22 y=%2223%22 text-anchor=%22middle%22 font-size=%2216%22 font-family=%22Arial%22 fill=%22%23a1a1aa%22%3E%3F%3C/text%3E%3C/svg%3E';

export const DotaMatchModal: React.FC<{ matchId: string; onClose: () => void }> = ({ matchId, onClose }) => {
    const [matchData, setMatchData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    useEffect(() => {
        gameApi.getDotaMatch(matchId)
            .then(data => setMatchData(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [matchId]);

    const handlePlayerClick = (accountId: string | number) => {
        if (!accountId) return; // Якщо анонім - нічого не робимо
        onClose();
        navigate('/dota', { state: { autoSearch: true, id: accountId.toString() } });
    };

    const renderTeam = (teamName: string, isRadiant: boolean, players: any[], color: string) => {
        const teamPlayers = [...players]
            .filter(p => p.isRadiant === isRadiant)
            .sort((a, b) => Number(b.gold_per_min || 0) - Number(a.gold_per_min || 0));

        return (
            <div className="team-section">
                <div className="team-header" style={{ color }}><span>{teamName}</span></div>
                <div className="scoreboard">
                    <div className="scoreboard-header scoreboard-header--dota"><span>Hero</span><span>Player</span><span>K / D / A</span><span>GPM / XPM</span></div>
                    {teamPlayers.map((p, idx) => {
                        const isAnonymous = !p.account_id;
                        return (
                            <button
                                key={`${teamName}-${p.hero_id}-${idx}`}
                                type="button"
                                disabled={isAnonymous}
                                className={`scoreboard-row scoreboard-row--dota team-${teamName.toLowerCase()} ${!isAnonymous ? 'is-clickable' : ''}`} 
                                onClick={() => handlePlayerClick(p.account_id)}
                            >
                                <img 
                                    src={p.hero_image || HERO_PLACEHOLDER} 
                                    alt={p.hero_name || "Hero"} 
                                    className="agent-icon" 
                                    onError={(e) => { e.currentTarget.src = HERO_PLACEHOLDER; }} 
                                />
                                
                                <div className="player-info">
                                    <strong style={{ color: isAnonymous ? '#666' : '#fff' }}>
                                        {isAnonymous ? '[Anonymous]' : (p.personaname || 'Unknown Player')}
                                    </strong>
                                </div>
                                <div className="kda">{p.kills} / {p.deaths} / {p.assists}</div>
                                <div className="score" style={{color: '#f39c12'}}>{p.gold_per_min} / {p.xp_per_min}</div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    const modalContent = (
        <div className="match-modal-overlay" onClick={onClose}>
            <div className="match-modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>✕</button>
                {loading ? <h2 style={{color: '#fff'}}>Loading match data...</h2> : matchData ? (
                    <>
                        <h2 className="match-modal-title" style={{color: '#d94b38'}}>
                            Match {matchId} <span>• {Math.floor(matchData.duration / 60)} min</span>
                        </h2>
                        {renderTeam('Radiant', true, matchData.players, '#2ecc71')}
                        {renderTeam('Dire', false, matchData.players, '#e74c3c')}
                    </>
                ) : <div className="error-msg">Failed to load.</div>}
            </div>
        </div>
    );
    return createPortal(modalContent, document.body);
};
