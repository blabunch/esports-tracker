import React from 'react';
import './MatchList.scss';

export interface MatchListItem {
    id?: string;
    win: boolean;
    primary: React.ReactNode;
    secondary?: React.ReactNode;
    trailing?: React.ReactNode;
}

interface MatchListProps {
    accent: 'valorant' | 'dota' | 'cs2';
    items: MatchListItem[];
    onMatchClick?: (matchId: string) => void;
    className?: string;
}

// Спільний список останніх матчів для всіх трьох ігор: одна розмітка, адаптивність і hover через CSS
export const MatchList: React.FC<MatchListProps> = ({ accent, items, onMatchClick, className = '' }) => (
    <section className={`match-list match-list--${accent} ${className}`}>
        <div className="match-list__head">
            <h3 className="match-list__title">Recent Matches</h3>
            {onMatchClick && <span className="match-list__hint">Click for scoreboard</span>}
        </div>
        <div className="match-list__rows">
            {items.map((match, idx) => (
                <button
                    key={match.id || idx}
                    type="button"
                    className="match-row"
                    onClick={() => onMatchClick && match.id && onMatchClick(match.id)}
                    disabled={!onMatchClick || !match.id}
                >
                    <span className={`match-row__result ${match.win ? 'is-win' : 'is-loss'}`}>
                        {match.win ? 'Victory' : 'Defeat'}
                    </span>
                    <span className="match-row__primary">{match.primary}</span>
                    {match.secondary && <span className="match-row__secondary">{match.secondary}</span>}
                    {match.trailing && <span className="match-row__trailing">{match.trailing}</span>}
                    <span className="match-row__arrow" aria-hidden="true">→</span>
                </button>
            ))}
        </div>
    </section>
);
