import React from 'react';
import { ProfileShortcut } from '../../hooks/useProfileShortcuts';
import './SearchMemoryPanel.scss';

type SearchAccent = 'valorant' | 'dota' | 'cs2';

interface SearchMemoryPanelProps {
    accent: SearchAccent;
    gameLabel: string;
    recent: ProfileShortcut[];
    favorites: ProfileShortcut[];
    current?: ProfileShortcut | null;
    currentIsFavorite?: boolean;
    canSync?: boolean;
    onSelect: (shortcut: ProfileShortcut) => void;
    onToggleFavorite?: () => void;
    onRemoveFavorite?: (id: string) => void;
}

const ShortcutChip: React.FC<{
    shortcut: ProfileShortcut;
    onSelect: (shortcut: ProfileShortcut) => void;
    onRemove?: (id: string) => void;
}> = ({ shortcut, onSelect, onRemove }) => (
    <div className="memory-chip">
        <button type="button" className="memory-chip__main" onClick={() => onSelect(shortcut)}>
            <span className="memory-chip__label">{shortcut.label}</span>
            {shortcut.subtitle && <span className="memory-chip__subtitle">{shortcut.subtitle}</span>}
        </button>
        {onRemove && (
            <button
                type="button"
                className="memory-chip__remove"
                aria-label={`Remove ${shortcut.label} from favorites`}
                onClick={() => onRemove(shortcut.id)}
            >
                ×
            </button>
        )}
    </div>
);

export const SearchMemoryPanel: React.FC<SearchMemoryPanelProps> = ({
    accent,
    gameLabel,
    recent,
    favorites,
    current,
    currentIsFavorite = false,
    canSync = false,
    onSelect,
    onToggleFavorite,
    onRemoveFavorite,
}) => {
    const favoriteIds = new Set(favorites.map(shortcut => shortcut.id));
    const visibleRecent = recent.filter(shortcut => !favoriteIds.has(shortcut.id));
    const hasShortcuts = favorites.length > 0 || visibleRecent.length > 0;

    return (
        <section className={`memory-panel memory-panel--${accent} fade-in-up`} aria-label={`${gameLabel} quick search shortcuts`}>
            {!canSync && (
                <div className="memory-panel__empty">
                    <span className="memory-panel__eyebrow">Account sync</span>
                    <h2>Log in to keep {gameLabel} favorites and recent searches tied to your account.</h2>
                </div>
            )}

            {current && (
                <div className="memory-panel__current">
                    <div>
                        <span className="memory-panel__eyebrow">Current profile</span>
                        <h2>{current.label}</h2>
                        {current.subtitle && <p>{current.subtitle}</p>}
                    </div>

                    {onToggleFavorite && (
                        <button
                            type="button"
                            className={`memory-panel__favorite ${currentIsFavorite ? 'is-active' : ''}`}
                            onClick={onToggleFavorite}
                        >
                            {currentIsFavorite ? '★ Saved' : '☆ Save favorite'}
                        </button>
                    )}
                </div>
            )}

            {canSync && !current && !hasShortcuts && (
                <div className="memory-panel__empty">
                    <span className="memory-panel__eyebrow">Quick start</span>
                    <h2>Search a {gameLabel} profile to build your shortcuts.</h2>
                </div>
            )}

            {canSync && hasShortcuts && (
                <div className="memory-panel__lists">
                    {favorites.length > 0 && (
                        <div className="memory-panel__section">
                            <div className="memory-panel__section-head">
                                <h3>Favorites</h3>
                                <span>{favorites.length}</span>
                            </div>
                            <div className="memory-panel__chips">
                                {favorites.map(shortcut => (
                                    <ShortcutChip
                                        key={shortcut.id}
                                        shortcut={shortcut}
                                        onSelect={onSelect}
                                        onRemove={onRemoveFavorite}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {visibleRecent.length > 0 && (
                        <div className="memory-panel__section">
                            <div className="memory-panel__section-head">
                                <h3>Recent</h3>
                                <span>History</span>
                            </div>
                            <div className="memory-panel__chips">
                                {visibleRecent.map(shortcut => (
                                    <ShortcutChip key={shortcut.id} shortcut={shortcut} onSelect={onSelect} />
                                ))}
                            </div>
                        </div>
                    )}

                    {favorites.length === 0 && (
                        <div className="memory-panel__hint">
                            Save profiles with the star button after a successful search.
                        </div>
                    )}

                    {visibleRecent.length === 0 && recent.length > 0 && (
                        <div className="memory-panel__hint">
                            Recent searches that are already in favorites are hidden here to reduce clutter.
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};
