import React, { useCallback, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { DotaCard } from '../../components/DotaCard/DotaCard';
import { DotaMatchModal } from '../../components/MatchModal/DotaMatchModal';
import { SkeletonCard } from '../../components/Skeleton/Skeleton';
import { SearchMemoryPanel } from '../../components/SearchMemoryPanel/SearchMemoryPanel';
import { gameApi } from '../../api/client';
import { DotaData } from '../../api/types';
import { saveToHistory } from '../../api/history';
import { ProfileShortcut, useProfileShortcuts } from '../../hooks/useProfileShortcuts';
import './DotaPage.scss';

const createDotaShortcut = (id: string, data?: DotaData): ProfileShortcut => {
    const accountId = String(data?.profile?.accountId || id.trim());
    const label = data?.profile?.nickname || accountId;

    return {
        id: `dota:${accountId}`,
        label,
        subtitle: data ? `${data.stats.winRate}% WR • ${data.stats.matches} matches` : 'Steam 32-bit ID',
        payload: { id: accountId },
    };
};

export const DotaPage: React.FC<{ user?: any }> = ({ user }) => {
    const [id, setId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState<DotaData | null>(null);
    
    const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
    const location = useLocation();
    const { recent, favorites, canSync, addRecent, refreshRecent, toggleFavorite, removeFavorite, isFavorite } = useProfileShortcuts('dota', user);

    const fetchStats = useCallback(async (searchId: string) => {
        const cleanId = searchId.trim();
        if (!cleanId) return;

        setLoading(true);
        setError('');
        setData(null);
        try {
            const result = await gameApi.getDota(cleanId);
            setData(result);
            if (user?.id) {
                addRecent(createDotaShortcut(cleanId, result));
                await saveToHistory('Dota 2', cleanId);
                refreshRecent().catch(() => undefined);
            }
        } catch (err: any) {
            setError(err.message || 'Player not found');
        } finally {
            setLoading(false);
        }
    }, [addRecent, refreshRecent, user?.id]);

    useEffect(() => {
        if (location.state?.autoSearch && location.state?.id) {
            setId(location.state.id);
            fetchStats(location.state.id);
        }
    }, [location.state, fetchStats]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchStats(id);
    };

    const handleShortcutSelect = (shortcut: ProfileShortcut) => {
        const shortcutId = shortcut.payload.id || '';
        setId(shortcutId);
        fetchStats(shortcutId);
    };

    const currentShortcut = data ? createDotaShortcut(String(data.profile.accountId), data) : null;
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
    const isReady = id.length >= 8;

    return (
        <div className="dota-page fade-in-up">
            <div className="search-hero">
                <h1 className="search-hero__title">
                    <span className="search-hero__highlight search-hero__highlight--dota" style={{color: '#d94b38', textShadow: '0 0 20px rgba(217, 75, 56, 0.4)'}}>Dota 2</span> Tracker
                </h1>
                <p className="search-hero__subtitle">Find any player by Steam 32-bit ID</p>

                <form className="search-hero__form" onSubmit={handleSubmit}>
                    <div className={`search-hero__input-wrapper search-hero__input-wrapper--dota ${isReady ? 'is-ready' : ''}`}>
                        <div className="search-hero__icon">
                            <svg viewBox="0 0 100 100" fill="currentColor">
                                <path d="M72 10 L15 35 L40 85 L85 65 Z" />
                            </svg>
                        </div>

                        <input 
                            className="search-hero__input" 
                            type="text" 
                            placeholder="Steam Account ID" 
                            value={id} 
                            onChange={e => setId(e.target.value)} 
                            required 
                        />
                    </div>
                    <button className="search-hero__btn search-hero__btn--dota" style={{background: '#d94b38'}} type="submit" disabled={loading}>
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>

                {hasLinkedAccount && !data && !loading && (
                    <div className="search-hero__quick-action">
                        <button 
                            className="search-hero__quick-btn search-hero__quick-btn--dota"
                            onClick={() => {
                                setId(user.dotaId);
                                fetchStats(user.dotaId);
                            }}
                        >
                            ⚡ Load My Linked Profile ({user.dotaId})
                        </button>
                    </div>
                )}

                {error && <div className="search-hero__error search-hero__error--dota">{error}</div>}
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
                <DotaCard 
                    data={data} 
                    onMatchClick={(matchId) => setSelectedMatchId(matchId)} 
                />
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
