import React from 'react';
import { Link } from 'react-router-dom';
import { RecentPlayer } from '../../api/types';
import { cs2Path, dotaPath, valorantPath } from '../../routes';
import './RecentPlayers.scss';

const GAME_LABEL = { valorant: 'Valorant', cs2: 'CS2', dota: 'Dota 2' } as const;

const playerPath = (player: RecentPlayer) => {
    if (player.game === 'valorant') {
        const [name, tag] = player.displayName.split('#');
        return valorantPath(name, tag || '');
    }
    return player.game === 'cs2' ? cs2Path(player.displayName) : dotaPath(player.playerKey);
};

// Головна метрика гравця: те саме, що показує графік прогресу
const playerMetric = ({ game, metrics }: RecentPlayer) => {
    if (game === 'cs2' && typeof metrics.elo === 'number') return `${metrics.elo} ELO`;
    if (game === 'valorant' && metrics.rank) return metrics.rank;
    if (typeof metrics.winRate === 'number') return `${metrics.winRate}% WR`;
    return null;
};

const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

const timeAgo = (iso: string) => {
    const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
    if (Math.abs(minutes) < 60) return relativeTime.format(minutes, 'minute');
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return relativeTime.format(hours, 'hour');
    return relativeTime.format(Math.round(hours / 24), 'day');
};

export const RecentPlayers: React.FC<{ players: RecentPlayer[] }> = ({ players }) => {
    if (players.length === 0) return null;

    return (
        <section className="recent-players" aria-labelledby="recent-players-title">
            <h3 className="recent-players__title" id="recent-players-title">
                <span className="recent-players__pulse" aria-hidden="true" />
                Recently tracked
            </h3>
            <div className="recent-players__grid">
                {players.map(player => {
                    const metric = playerMetric(player);
                    return (
                        <Link
                            key={`${player.game}:${player.playerKey}`}
                            to={playerPath(player)}
                            className={`recent-player recent-player--${player.game}`}
                        >
                            <span className="recent-player__game">{GAME_LABEL[player.game]}</span>
                            <span className="recent-player__name">{player.displayName}</span>
                            <span className="recent-player__meta">
                                {metric && <span className="recent-player__metric">{metric}</span>}
                                <span>{timeAgo(player.updatedAt)}</span>
                            </span>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
};
