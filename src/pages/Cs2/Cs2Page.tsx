import React, { useCallback, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Cs2Card } from '../../components/Cs2Card/Cs2Card';
import { Cs2MatchModal } from '../../components/MatchModal/Cs2MatchModal';
import { SkeletonCard } from '../../components/Skeleton/Skeleton';
import { SearchMemoryPanel } from '../../components/SearchMemoryPanel/SearchMemoryPanel';
import { gameApi } from '../../api/client';
import { Cs2Data } from '../../api/types';
import { saveToHistory } from '../../api/history';
import { ProfileShortcut, useProfileShortcuts } from '../../hooks/useProfileShortcuts';
import './Cs2Page.scss';

const createCs2Shortcut = (nickname: string, data?: Cs2Data): ProfileShortcut => {
    const playerName = data?.profile?.nickname || nickname.trim();

    return {
        id: `cs2:${playerName.toLowerCase()}`,
        label: playerName,
        subtitle: data ? `${data.profile.elo} ELO • ${data.stats.winRate}% WR` : 'Faceit nickname',
        payload: { nickname: playerName },
    };
};

export const Cs2Page: React.FC<{ user?: any }> = ({ user }) => {
    const [nickname, setNickname] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState<Cs2Data | null>(null);
    
    const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
    const location = useLocation();
    const { recent, favorites, canSync, addRecent, refreshRecent, toggleFavorite, removeFavorite, isFavorite } = useProfileShortcuts('cs2', user);

    const fetchStats = useCallback(async (searchName: string) => {
        const cleanName = searchName.trim();
        if (!cleanName) return;

        setLoading(true);
        setError('');
        setData(null);
        try {
            const result = await gameApi.getCs2(cleanName);
            setData(result);
            if (user?.id) {
                addRecent(createCs2Shortcut(cleanName, result));
                await saveToHistory('CS2', cleanName);
                refreshRecent().catch(() => undefined);
            }
        } catch (err: any) {
            setError(err.message || 'Player not found');
        } finally {
            setLoading(false);
        }
    }, [addRecent, refreshRecent, user?.id]);

    useEffect(() => {
        if (location.state?.autoSearch && location.state?.nickname) {
            setNickname(location.state.nickname);
            fetchStats(location.state.nickname);
        }
    }, [location.state, fetchStats]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchStats(nickname);
    };

    const handleShortcutSelect = (shortcut: ProfileShortcut) => {
        const shortcutNickname = shortcut.payload.nickname || '';
        setNickname(shortcutNickname);
        fetchStats(shortcutNickname);
    };

    const currentShortcut = data ? createCs2Shortcut(data.profile.nickname, data) : null;
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
    const isReady = nickname.length >= 3;

    return (
        <div className="cs2-page fade-in-up">
            <div className="search-hero">
                <h1 className="search-hero__title">
                    <span className="search-hero__highlight search-hero__highlight--cs2" style={{color: '#ffa500', textShadow: '0 0 20px rgba(255, 165, 0, 0.4)'}}>CS2</span> Tracker
                </h1>
                <p className="search-hero__subtitle">Find any player by Faceit Nickname</p>

                <form className="search-hero__form" onSubmit={handleSubmit}>
                    <div className={`search-hero__input-wrapper search-hero__input-wrapper--cs2 ${isReady ? 'is-ready' : ''}`}>
                        <div className="search-hero__icon">
                            <svg viewBox="0 0 100 100" fill="currentColor">
                                <rect x="20" y="20" width="60" height="60" rx="10" />
                            </svg>
                        </div>

                        <input 
                            className="search-hero__input" 
                            type="text" 
                            placeholder="Faceit Nickname" 
                            value={nickname} 
                            onChange={e => setNickname(e.target.value)} 
                            required 
                        />
                    </div>
                    <button className="search-hero__btn search-hero__btn--cs2" style={{background: '#ffa500'}} type="submit" disabled={loading}>
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>

                {hasLinkedAccount && !data && !loading && (
                    <div className="search-hero__quick-action">
                        <button 
                            className="search-hero__quick-btn search-hero__quick-btn--cs2"
                            onClick={() => {
                                setNickname(user.faceitNickname);
                                fetchStats(user.faceitNickname);
                            }}
                        >
                            ⚡ Load My Linked Profile ({user.faceitNickname})
                        </button>
                    </div>
                )}

                {error && <div className="search-hero__error search-hero__error--cs2">{error}</div>}
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
                <Cs2Card 
                    data={data} 
                    onMatchClick={(matchId) => setSelectedMatchId(matchId)} 
                />
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
