import React from 'react';
import { Link } from 'react-router-dom';
import './PlayerSuggestions.scss';

export interface PlayerSuggestion {
    label: string;
    hint?: string;
    path: string;
}

interface PlayerSuggestionsProps {
    accent: 'valorant' | 'dota' | 'cs2';
    title?: string;
    items: PlayerSuggestion[];
}

// Приклади гравців для відвідувачів, які не знають жодного ID: одним кліком видно, як виглядає профіль
export const PlayerSuggestions: React.FC<PlayerSuggestionsProps> = ({ accent, title = 'Not sure who to look up? Try:', items }) => (
    <div className={`player-suggestions player-suggestions--${accent}`}>
        <span className="player-suggestions__title">{title}</span>
        <div className="player-suggestions__list">
            {items.map(item => (
                <Link key={item.path} to={item.path} className="player-suggestions__chip">
                    <span className="player-suggestions__label">{item.label}</span>
                    {item.hint && <span className="player-suggestions__hint">{item.hint}</span>}
                </Link>
            ))}
        </div>
    </div>
);
