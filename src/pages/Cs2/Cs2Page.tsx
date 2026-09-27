import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Cs2Card } from '../../components/Cs2Card/Cs2Card';
import { Cs2MatchModal } from '../../components/MatchModal/Cs2MatchModal';
import { SkeletonCard } from '../../components/Skeleton/Skeleton';
import { SearchMemoryPanel } from '../../components/SearchMemoryPanel/SearchMemoryPanel';
import { ProgressChart } from '../../components/ProgressChart/ProgressChart';
import { PlayerSuggestions } from '../../components/PlayerSuggestions/PlayerSuggestions';
import { gameApi } from '../../api/client';
import { Cs2Data, User } from '../../api/types';
import { ProfileShortcut, useProfileShortcuts } from '../../hooks/useProfileShortcuts';
import { usePlayerStats } from '../../hooks/usePlayerStats';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { HISTORY_GAME, cs2Path } from '../../routes';
import './Cs2Page.scss';

const createCs2Shortcut = (data: Cs2Data): ProfileShortcut => ({
    id: `cs2:${data.profile.nickname.toLowerCase()}`,
    label: data.profile.nickname,
    subtitle: `${data.profile.elo} ELO • ${data.stats.winRate}% WR`,
    payload: { nickname: data.profile.nickname },
});

const Cs2SearchForm: React.FC<{ initialNickname: string; loading: boolean }> = ({ initialNickname, loading }) => {
    const [nickname, setNickname] = useState(initialNickname);
    const navigate = useNavigate();
    const isReady = nickname.trim().length >= 3;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (nickname.trim()) navigate(cs2Path(nickname));
    };

    return (
        <form className="search-hero__form" onSubmit={handleSubmit}>
            <div className={`search-hero__input-wrapper search-hero__input-wrapper--cs2 ${isReady ? 'is-ready' : ''}`}>
                <div className="search-hero__icon" aria-hidden="true">
                    <svg viewBox="0 0 100 100" fill="currentColor">
                        <rect x="20" y="20" width="60" height="60" rx="10" />
                    </svg>
                </div>

                <input
                    className="search-hero__input"
                    type="text"
                    placeholder="Faceit Nickname"
                    aria-label="Faceit nickname or profile URL"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    maxLength={128}
                    required
                />
            </div>
            <button className="search-hero__btn search-hero__btn--cs2" style={{ background: '#ffa500' }} type="submit" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
            </button>
        </form>
    );
};

export const Cs2Page: React.FC<{ user?: User | null }> = ({ user }) => {
    const { nickname = '' } = useParams();
    const navigate = useNavigate();
    const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
    const { recent, favorites, canSync, toggleFavorite, removeFavorite, isFavorite } = useProfileShortcuts('cs2', user);

    const { data, isFetching: loading, error } = usePlayerStats({
        queryKey: ['cs2', nickname.toLowerCase()],
        enabled: Boolean(nickname),
        fetcher: () => gameApi.getCs2(nickname),
        history: { game: HISTORY_GAME.cs2, query: nickname, isLoggedIn: canSync },
    });

    useDocumentTitle(data ? `${data.profile.nickname} · CS2` : 'CS2 Tracker');

    const handleShortcutSelect = (shortcut: ProfileShortcut) => {
        if (shortcut.payload.nickname) navigate(cs2Path(shortcut.payload.nickname));
    };

    const currentShortcut = data ? createCs2Shortcut(data) : null;
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

    const hasLinkedAccount = !!user?.faceitNickname;

    return (
        <div className="cs2-page fade-in-up">
            <div className="search-hero">
                <h1 className="search-hero__title">
                    <span className="search-hero__highlight search-hero__highlight--cs2" style={{ color: '#ffa500', textShadow: '0 0 20px rgba(255, 165, 0, 0.4)' }}>CS2</span> Tracker
                </h1>
                <p className="search-hero__subtitle">Find any player by Faceit Nickname</p>

                <Cs2SearchForm key={nickname} initialNickname={nickname} loading={loading} />

                {hasLinkedAccount && !data && !loading && (
                    <div className="search-hero__quick-action">
                        <button
                            className="search-hero__quick-btn search-hero__quick-btn--cs2"
                            onClick={() => navigate(cs2Path(user.faceitNickname!))}
                        >
                            ⚡ Load My Linked Profile ({user.faceitNickname})
                        </button>
                    </div>
                )}

                {error && !loading && <div className="search-hero__error search-hero__error--cs2" role="alert">{error.message}</div>}
                {!data && !loading && (
                    <PlayerSuggestions
                        accent="cs2"
                        items={[
                            { label: 'ZywOo', hint: 'Vitality', path: cs2Path('ZywOo') },
                            { label: 'donk666', hint: 'Team Spirit', path: cs2Path('donk666') },
                            { label: 'm0NESY', hint: 'Falcons', path: cs2Path('m0NESY') },
                        ]}
                    />
                )}
            </div>

            {!loading && (
                <SearchMemoryPanel
                    accent="cs2"
                    gameLabel="CS2"
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
                    <Cs2Card
                        data={data}
                        onMatchClick={(matchId) => setSelectedMatchId(matchId)}
                    />
                    <ProgressChart game="cs2" playerKey={data.profile.playerId} />
                </>
            )}

            {selectedMatchId && (
                <Cs2MatchModal
                    matchId={selectedMatchId}
                    onClose={() => setSelectedMatchId(null)}
                />
            )}
        </div>
    );
};
