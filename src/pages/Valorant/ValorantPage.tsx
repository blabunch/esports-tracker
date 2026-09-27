import React, { useCallback, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ValorantCard } from '../../components/ValorantCard/ValorantCard';
import { MatchModal } from '../../components/MatchModal/MatchModal';
import { SkeletonCard } from '../../components/Skeleton/Skeleton';
import { SearchMemoryPanel } from '../../components/SearchMemoryPanel/SearchMemoryPanel';
import { gameApi } from '../../api/client';
import { ValorantData } from '../../api/types';
import { saveToHistory } from '../../api/history';
import { ProfileShortcut, useProfileShortcuts } from '../../hooks/useProfileShortcuts';
import './ValorantPage.scss';

const createValorantShortcut = (name: string, tag: string, data?: ValorantData): ProfileShortcut => {
    const playerName = data?.profile?.nickname || name.trim();
    const playerTag = data?.profile?.tag || tag.trim();

    return {
        id: `valorant:${playerName.toLowerCase()}#${playerTag.toLowerCase()}`,
        label: `${playerName}#${playerTag}`,
        subtitle: data ? `${data.stats.rank} • ${data.stats.totalWinRate}% WR` : 'Riot ID',
        payload: { name: playerName, tag: playerTag },
    };
};

export const ValorantPage: React.FC<{ user?: any }> = ({ user }) => {
    const [name, setName] = useState('');
    const [tag, setTag] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState<ValorantData | null>(null);
    
    const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
    const location = useLocation();
    const { recent, favorites, canSync, addRecent, refreshRecent, toggleFavorite, removeFavorite, isFavorite } = useProfileShortcuts('valorant', user);

    const fetchStats = useCallback(async (searchName: string, searchTag: string) => {
        const cleanName = searchName.trim();
        const cleanTag = searchTag.trim();
        if (!cleanName || !cleanTag) return;

        setLoading(true);
        setError('');
        setData(null);
        try {
            const result = await gameApi.getValorant(cleanName, cleanTag);
            setData(result);
            if (user?.id) {
                addRecent(createValorantShortcut(cleanName, cleanTag, result));
                await saveToHistory('Valorant', `${cleanName}#${cleanTag}`);
                refreshRecent().catch(() => undefined);
            }
        } catch (err: any) {
            setError(err.message || 'Player not found');
        } finally {
            setLoading(false);
        }
    }, [addRecent, refreshRecent, user?.id]);

    useEffect(() => {
        if (location.state?.autoSearch && location.state?.name) {
            setName(location.state.name);
            setTag(location.state.tag);
            fetchStats(location.state.name, location.state.tag);
        }
    }, [location.state, fetchStats]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchStats(name, tag);
    };

    const handleShortcutSelect = (shortcut: ProfileShortcut) => {
        const shortcutName = shortcut.payload.name || '';
        const shortcutTag = shortcut.payload.tag || '';
        setName(shortcutName);
        setTag(shortcutTag);
        fetchStats(shortcutName, shortcutTag);
    };

    const currentShortcut = data ? createValorantShortcut(data.profile.nickname, data.profile.tag, data) : null;
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

    // 🔥 СМАРТ-ВАЛІДАЦІЯ
    const isReady = name.length >= 3 && tag.length >= 3 && tag.length <= 5;
    const isError = tag.length > 5; // Тег у Valorant не може бути довшим за 5 символів

    return (
        <div className="valorant-page fade-in-up">
            <div className="search-hero">
                <h1 className="search-hero__title">
                    <span className="search-hero__highlight search-hero__highlight--val">Valorant</span> Tracker
                </h1>
                <p className="search-hero__subtitle">Find any player by Riot ID and Tag</p>

                <form className="search-hero__form" onSubmit={handleSubmit}>
                    {/* 🔥 Динамічні класи для обгортки (glow-ефекти) */}
                    <div className={`search-hero__input-wrapper search-hero__input-wrapper--val ${isReady ? 'is-ready' : ''} ${isError ? 'is-error' : ''}`}>
                        
                        {/* 🔥 SVG Логотип Valorant */}
                        <div className="search-hero__icon">
                            <svg viewBox="0 0 100 100" fill="currentColor">
                                <path d="M99 22L72 73 50 22h49zm-58 8L20 68l-9-17L32 30h9z"/>
                            </svg>
                        </div>

                        <input 
                            className="search-hero__input" 
                            type="text" 
                            placeholder="Nickname" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            required 
                        />
                        {/* Знак решітки теж реагує на введення */}
                        <span className="search-hero__separator">#</span>
                        <input 
                            className="search-hero__input search-hero__input--tag" 
                            type="text" 
                            placeholder="TAG" 
                            value={tag} 
                            onChange={e => setTag(e.target.value)} 
                            required 
                        />
                    </div>
                    <button className="search-hero__btn search-hero__btn--val" type="submit" disabled={loading || isError}>
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>

                {hasLinkedAccount && !data && !loading && (
                    <div className="search-hero__quick-action">
                        <button 
                            className="search-hero__quick-btn search-hero__quick-btn--val"
                            onClick={() => {
                                setName(user.valName);
                                setTag(user.valTag);
                                fetchStats(user.valName, user.valTag);
                            }}
                        >
                            ⚡ Load My Linked Profile ({user.valName}#{user.valTag})
                        </button>
                    </div>
                )}

                {error && <div className="search-hero__error search-hero__error--val">{error}</div>}
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
                <ValorantCard 
                    data={data} 
                    onMatchClick={(matchId) => setSelectedMatchId(matchId)} 
                />
            )}

            {selectedMatchId && (
                <MatchModal 
                    matchId={selectedMatchId} 
                    onClose={() => setSelectedMatchId(null)} 
                />
            )}
        </div>
    );
};
