import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { gameApi } from '../../api/client';
import './MatchModal.scss';

const formatMapName = (name?: string) => (name || 'Match').replace(/^de_/i, '').replace(/_/g, ' ').toUpperCase();
const formatTeamName = (name?: string) => (name || 'Team').replace(/^team_/i, '').replace(/_+$/g, '').replace(/_/g, ' ');

export const Cs2MatchModal: React.FC<{ matchId: string; onClose: () => void }> = ({ matchId, onClose }) => {
    const [matchData, setMatchData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    useEffect(() => {
        gameApi.getCs2Match(matchId)
            .then(data => {
                if(data?.rounds?.length > 0) setMatchData(data.rounds[0]);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [matchId]);

    const handlePlayerClick = (nickname: string) => {
        onClose();
        navigate('/cs2', { state: { autoSearch: true, nickname } });
    };

    const renderTeam = (team: any) => {
        const sortedPlayers = [...(team.players || [])]
            .sort((a: any, b: any) => Number(b.player_stats?.Kills || 0) - Number(a.player_stats?.Kills || 0));

        return (
            <div className="team-section" key={team.team_id}>
                <div className="team-header" style={{ color: '#ffa500' }}>
                    <span>{formatTeamName(team.team_stats?.Team)}</span>
                    <span>{team.team_stats?.['Final Score'] || 0} rounds</span>
                </div>
                <div className="scoreboard">
                    <div className="scoreboard-header scoreboard-header--cs2"><span>Kills</span><span>Player</span><span>K / D / A</span><span>HS %</span></div>
                    {sortedPlayers.map((p: any, idx: number) => (
                        <button
                            key={`${team.team_id}-${p.player_id || p.nickname || idx}`}
                            type="button"
                            className="scoreboard-row scoreboard-row--cs2 is-clickable"
                            onClick={() => handlePlayerClick(p.nickname)}
                        >
                            <div className="kill-pill">
                                {p.player_stats?.Kills || 0}
                            </div>
                            <div className="player-info">
                                <strong>{p.nickname || 'Unknown'}</strong>
                            </div>
                            <div className="kda">{p.player_stats?.Kills || 0} / {p.player_stats?.Deaths || 0} / {p.player_stats?.Assists || 0}</div>
                            <div className="score score--positive">{p.player_stats?.['Headshots %'] || 0}%</div>
                        </button>
                    ))}
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
                        <h2 className="match-modal-title" style={{color: '#ffa500'}}>
                            {formatMapName(matchData.round_stats?.Map)} <span>• {matchData.round_stats?.Score}</span>
                        </h2>
                        {(matchData.teams || []).map((team: any) => renderTeam(team))}
                    </>
                ) : <div className="error-msg">Failed to load.</div>}
            </div>
        </div>
    );
    return createPortal(modalContent, document.body);
};
