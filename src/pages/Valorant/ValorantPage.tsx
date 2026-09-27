import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ValorantCard } from '../../components/ValorantCard/ValorantCard';
import { MatchModal } from '../../components/MatchModal/MatchModal';
import { SkeletonCard } from '../../components/Skeleton/Skeleton';
import { SearchMemoryPanel } from '../../components/SearchMemoryPanel/SearchMemoryPanel';
import { ProgressChart } from '../../components/ProgressChart/ProgressChart';
import { PageBackground } from '../../components/PageBackground/PageBackground';
import { gameApi } from '../../api/client';
import { User, ValorantData } from '../../api/types';
import { ProfileShortcut, useProfileShortcuts } from '../../hooks/useProfileShortcuts';
import { usePlayerStats } from '../../hooks/usePlayerStats';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { HISTORY_GAME, valorantPath } from '../../routes';
import './ValorantPage.scss';

const createValorantShortcut = (data: ValorantData): ProfileShortcut => ({
    id: `valorant:${data.profile.nickname.toLowerCase()}#${data.profile.tag.toLowerCase()}`,
    label: `${data.profile.nickname}#${data.profile.tag}`,
    subtitle: `${data.stats.rank} • ${data.stats.totalWinRate}% WR`,
    payload: { name: data.profile.nickname, tag: data.profile.tag },
});

const ValorantSearchForm: React.FC<{ initialName: string; initialTag: string; loading: boolean }> = ({ initialName, initialTag, loading }) => {
    const [name, setName] = useState(initialName);
    const [tag, setTag] = useState(initialTag);
    const navigate = useNavigate();

    const isReady = name.trim().length >= 3 && tag.trim().length >= 3 && tag.trim().length <= 5;
    const isError = tag.trim().length > 5; // Тег у Valorant не може бути довшим за 5 символів

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && tag.trim()) navigate(valorantPath(name, tag));
    };

    return (
        <form className="search-hero__form" onSubmit={handleSubmit}>
            <div className={`search-hero__input-wrapper search-hero__input-wrapper--val ${isReady ? 'is-ready' : ''} ${isError ? 'is-error' : ''}`}>
                <div className="search-hero__icon" aria-hidden="true">
                    <svg viewBox="0 0 100 100" fill="currentColor">
                        <path d="M99 22L72 73 50 22h49zm-58 8L20 68l-9-17L32 30h9z"/>
                    </svg>
                </div>

                <input
                    className="search-hero__input"
                    type="text"
                    placeholder="Nickname"
                    aria-label="Riot ID nickname"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    maxLength={32}
                    required
                />
                <span className="search-hero__separator" aria-hidden="true">#</span>
                <input
                    className="search-hero__input search-hero__input--tag"
                    type="text"
                    placeholder="TAG"
                    aria-label="Riot ID tag"
                    value={tag}
                    onChange={e => setTag(e.target.value)}
                    maxLength={10}
                    required
                />
            </div>
            <button className="search-hero__btn search-hero__btn--val" type="submit" disabled={loading || isError}>
                {loading ? 'Searching...' : 'Search'}
            </button>
        </form>
    );
};

export const ValorantPage: React.FC<{ user?: User | null }> = ({ user }) => {
    const { name = '', tag = '' } = useParams();
    const navigate = useNavigate();
    const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
    const { recent, favorites, canSync, toggleFavorite, removeFavorite, isFavorite } = useProfileShortcuts('valorant', user);

    const { data, isFetching: loading, error } = usePlayerStats({
        queryKey: ['valorant', name.toLowerCase(), tag.toLowerCase()],
        enabled: Boolean(name && tag),
        fetcher: () => gameApi.getValorant(name, tag),
        history: {
            game: HISTORY_GAME.valorant,
            isLoggedIn: canSync,
            entry: result => ({ query: `${result.profile.nickname}#${result.profile.tag}` }),
        },
    });

    useDocumentTitle(data ? `${data.profile.nickname}#${data.profile.tag} · Valorant` : 'Valorant Tracker');

    const handleShortcutSelect = (shortcut: ProfileShortcut) => {
        if (shortcut.payload.name && shortcut.payload.tag) navigate(valorantPath(shortcut.payload.name, shortcut.payload.tag));
    };

    const currentShortcut = data ? createValorantShortcut(data) : null;
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

    const handleRemoveFavorite = async (id: string) => {
        try {
            await removeFavorite(id);
            toast.success('Removed from favorites');
        } catch {
            // API interceptor already shows a user-facing error toast.
        }
    };

    const hasLinkedAccount = user?.valName && user?.valTag;

    return (
        <>
            <PageBackground accent="valorant" />
            <div className="valorant-page fade-in-up">
                <div className="search-hero">
                    <h1 className="search-hero__title">
                        <span className="search-hero__highlight search-hero__highlight--val">Valorant</span> Tracker
                    </h1>
                    <p className="search-hero__subtitle">Find any player by Riot ID and Tag</p>

                    <ValorantSearchForm key={`${name}#${tag}`} initialName={name} initialTag={tag} loading={loading} />

                    {hasLinkedAccount && !data && !loading && (
                        <div className="search-hero__quick-action">
                            <button
                                className="search-hero__quick-btn search-hero__quick-btn--val"
                                onClick={() => navigate(valorantPath(user.valName!, user.valTag!))}
                            >
                                ⚡ Load My Linked Profile ({user.valName}#{user.valTag})
                            </button>
                        </div>
                    )}

                    {error && !loading && <div className="search-hero__error search-hero__error--val" role="alert">{error.message}</div>}
                    {!data && !loading && (
                        <p className="search-hero__hint">
                            Your Riot ID looks like <strong>Name#TAG</strong> — find it in the Valorant client next to your profile picture.
                        </p>
                    )}
                </div>

                {!loading && (
                    <SearchMemoryPanel
                        accent="valorant"
                        gameLabel="Valorant"
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
                        <ValorantCard
                            data={data}
                            onMatchClick={(matchId) => setSelectedMatchId(matchId)}
                        />
                        <ProgressChart game="valorant" playerKey={`${data.profile.nickname}#${data.profile.tag}`} />
                    </>
                )}

                {selectedMatchId && (
                    <MatchModal
                        matchId={selectedMatchId}
                        onClose={() => setSelectedMatchId(null)}
                    />
                )}
            </div>
        </>
    );
};
