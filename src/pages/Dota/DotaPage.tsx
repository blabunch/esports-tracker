import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { DotaCard } from '../../components/DotaCard/DotaCard';
import { DotaMatchModal } from '../../components/MatchModal/DotaMatchModal';
import { SkeletonCard } from '../../components/Skeleton/Skeleton';
import { SearchMemoryPanel } from '../../components/SearchMemoryPanel/SearchMemoryPanel';
import { ProgressChart } from '../../components/ProgressChart/ProgressChart';
import { PlayerSuggestions } from '../../components/PlayerSuggestions/PlayerSuggestions';
import { gameApi } from '../../api/client';
import { DotaData, User } from '../../api/types';
import { ProfileShortcut, useProfileShortcuts } from '../../hooks/useProfileShortcuts';
import { usePlayerStats } from '../../hooks/usePlayerStats';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { HISTORY_GAME, dotaPath } from '../../routes';
import './DotaPage.scss';

const createDotaShortcut = (data: DotaData): ProfileShortcut => {
    const accountId = String(data.profile.accountId);

    return {
        id: `dota:${accountId}`,
        label: data.profile.nickname || accountId,
        subtitle: `${data.stats.winRate}% WR • ${data.stats.matches} matches`,
        payload: { id: accountId },
    };
};

const DotaSearchForm: React.FC<{ initialId: string; loading: boolean }> = ({ initialId, loading }) => {
    const [id, setId] = useState(initialId);
    const navigate = useNavigate();
    const isReady = id.trim().length >= 8;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (id.trim()) navigate(dotaPath(id));
    };

    return (
        <form className="search-hero__form" onSubmit={handleSubmit}>
            <div className={`search-hero__input-wrapper search-hero__input-wrapper--dota ${isReady ? 'is-ready' : ''}`}>
                <div className="search-hero__icon" aria-hidden="true">
                    <svg viewBox="0 0 100 100" fill="currentColor">
                        <path d="M72 10 L15 35 L40 85 L85 65 Z" />
                    </svg>
                </div>

                <input
                    className="search-hero__input"
                    type="text"
                    placeholder="Steam ID or profile URL"
                    aria-label="Steam account ID or profile URL"
                    value={id}
                    onChange={e => setId(e.target.value)}
                    maxLength={128}
                    required
                />
            </div>
            <button className="search-hero__btn search-hero__btn--dota" style={{ background: '#d94b38' }} type="submit" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
            </button>
        </form>
    );
};

export const DotaPage: React.FC<{ user?: User | null }> = ({ user }) => {
    const { id = '' } = useParams();
    const navigate = useNavigate();
    const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
    const { recent, favorites, canSync, toggleFavorite, removeFavorite, isFavorite } = useProfileShortcuts('dota', user);

    const { data, isFetching: loading, error } = usePlayerStats({
        queryKey: ['dota', id],
        enabled: Boolean(id),
        fetcher: () => gameApi.getDota(id),
        history: { game: HISTORY_GAME.dota, query: id, isLoggedIn: canSync },
    });

    useDocumentTitle(data ? `${data.profile.nickname} · Dota 2` : 'Dota 2 Tracker');

    const handleShortcutSelect = (shortcut: ProfileShortcut) => {
        if (shortcut.payload.id) navigate(dotaPath(shortcut.payload.id));
    };

    const currentShortcut = data ? createDotaShortcut(data) : null;
    const currentIsFavorite = currentShortcut ? isFavorite(currentShortcut.id) : false;

    const handleToggleFavorite = async () => {
        if (!currentShortcut) return;
        if (!canSync) {
            toast.error('Log in to save favorites to your account');
            return;
        }

        try {
            const saved = await toggleFavorite(currentShortcut);
            toast.success(saved ? 'Saved to favorites' : 'Removed from favorites');
        } catch {
            // API interceptor already shows a user-facing error toast.
        }
    };

    const handleRemoveFavorite = async (favoriteId: string) => {
        try {
            await removeFavorite(favoriteId);
            toast.success('Removed from favorites');
        } catch {
            // API interceptor already shows a user-facing error toast.
        }
    };

    const hasLinkedAccount = !!user?.dotaId;

    return (
        <div className="dota-page fade-in-up">
            <div className="search-hero">
                <h1 className="search-hero__title">
                    <span className="search-hero__highlight search-hero__highlight--dota" style={{ color: '#d94b38', textShadow: '0 0 20px rgba(217, 75, 56, 0.4)' }}>Dota 2</span> Tracker
                </h1>
                <p className="search-hero__subtitle">Find any player by Steam ID or profile URL</p>

                <DotaSearchForm key={id} initialId={id} loading={loading} />

                {hasLinkedAccount && !data && !loading && (
                    <div className="search-hero__quick-action">
                        <button
                            className="search-hero__quick-btn search-hero__quick-btn--dota"
                            onClick={() => navigate(dotaPath(user.dotaId!))}
                        >
                            ⚡ Load My Linked Profile ({user.dotaId})
                        </button>
                    </div>
                )}

                {error && !loading && <div className="search-hero__error search-hero__error--dota" role="alert">{error.message}</div>}
                {!data && !loading && (
                    <PlayerSuggestions
                        accent="dota"
                        items={[
                            { label: 'TOPSON', hint: '94054712', path: dotaPath('94054712') },
                            { label: 'Immortal player', hint: '105248644', path: dotaPath('105248644') },
                            { label: 'Immortal player', hint: '86745912', path: dotaPath('86745912') },
                        ]}
                    />
                )}
            </div>

            {!loading && (
                <SearchMemoryPanel
                    accent="dota"
                    gameLabel="Dota 2"
                    recent={recent}
                    favorites={favorites}
                    current={currentShortcut}
                    currentIsFavorite={currentIsFavorite}
                    canSync={canSync}
                    onSelect={handleShortcutSelect}
                    onToggleFavorite={handleToggleFavorite}
                    onRemoveFavorite={handleRemoveFavorite}
                />
            )}

            {loading && <SkeletonCard />}

            {!loading && data && (
                <>
                    {data.stats.warnings && data.stats.warnings.length > 0 && (
                        <div className="data-warning" role="status">{data.stats.warnings.join(' ')}</div>
                    )}
                    <DotaCard
                        data={data}
                        onMatchClick={(matchId) => setSelectedMatchId(matchId)}
                    />
                    <ProgressChart game="dota" playerKey={String(data.profile.accountId)} />
                </>
            )}

            {selectedMatchId && (
                <DotaMatchModal
                    matchId={selectedMatchId}
                    onClose={() => setSelectedMatchId(null)}
                />
            )}
        </div>
    );
};
