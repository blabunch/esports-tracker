import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { gameApi } from '../../api/client';
import { useModal } from '../../hooks/useModal';
import { valorantPath } from '../../routes';
import './MatchModal.scss';

interface MatchModalProps { matchId: string; onClose: () => void; }

export const MatchModal: React.FC<MatchModalProps> = ({ matchId, onClose }) => {
    const [matchData, setMatchData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useModal(onClose);

    useEffect(() => {
        gameApi.getValorantMatch(matchId)
            .then(data => setMatchData(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [matchId]);

    const handlePlayerClick = (name: string, tag: string) => {
        onClose(); // Закриваємо модалку
        navigate(valorantPath(name, tag));
    };

    const renderTeam = (teamName: string, players: any[], color: string) => (
        <div className="team-section">
            <div className="team-header" style={{ color }}>
                <span>{teamName} Team</span>
            </div>
            <div className="scoreboard">
                <div className="scoreboard-header"><span>Agent</span><span>Player</span><span>K / D / A</span><span>Score</span></div>
                {[...players].sort((a, b) => b.stats.score - a.stats.score).map((p, idx) => (
                    <button key={`${teamName}-${p.puuid || p.name || idx}`} type="button" className={`scoreboard-row is-clickable team-${teamName.toLowerCase()}`} onClick={() => handlePlayerClick(p.name, p.tag)}>
                        <img src={p.assets.agent.small} alt={p.character} className="agent-icon" />
                        <div className="player-info">
                            <strong>{p.name}</strong><span className="tag">#{p.tag}</span>
                        </div>
                        <div className="kda">{p.stats.kills} / {p.stats.deaths} / {p.stats.assists}</div>
                        <div className="score" style={{color: '#ffeb3b'}}>{p.stats.score}</div>
                    </button>
                ))}
            </div>
        </div>
    );

    const modalContent = (
        <div className="match-modal-overlay" onClick={onClose}>
            <div role="dialog" aria-modal="true" className="match-modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
                {loading ? <h2 style={{color: '#fff'}}>Loading match data...</h2> : matchData ? (
                    <>
                        <h2 className="match-modal-title" style={{color: '#ff4655'}}>
                            {matchData.metadata.map} <span>• {matchData.metadata.mode}</span>
                        </h2>
                        {renderTeam('Red', matchData.players.red, '#ff4655')}
                        {renderTeam('Blue', matchData.players.blue, '#3498db')}
                    </>
                ) : <div className="error-msg">Failed to load match details.</div>}
            </div>
        </div>
    );
    return createPortal(modalContent, document.body);
};
