import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { gameApi } from '../../api/client';
import { SearchHistoryItem, User } from '../../api/types';
import { historyEntryPath } from '../../routes';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import './HistoryPage.scss';

const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString));

export const HistoryPage: React.FC<{ user?: User | null }> = ({ user }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [confirmClear, setConfirmClear] = useState(false);
    useDocumentTitle('Search History');

    const { data: history = [], isLoading, isError } = useQuery({
        queryKey: ['history'],
        queryFn: gameApi.getHistory,
        enabled: Boolean(user),
    });

    const clearMutation = useMutation({
        mutationFn: gameApi.clearHistory,
        onSuccess: () => {
            queryClient.setQueryData(['history'], []);
            toast.success('History cleared');
        },
        onSettled: () => setConfirmClear(false),
    });

    const handleCardClick = (entry: SearchHistoryItem) => {
        const path = historyEntryPath(entry.game, entry.query);
        if (path) navigate(path);
    };

    if (!user) {
        return (
            <div className="history-page fade-in-up">
                <div className="history-page__empty">
                    <p>Login Required</p>
                    <span>Please log in to track your personal search history across all games.</span>
                </div>
            </div>
        );
    }

    if (isLoading) return <div className="history-page__loading" role="status">Loading...</div>;

    return (
        <div className="history-page fade-in-up">
            <div className="history-page__header">
                <div className="history-page__title-group">
                    <h1 className="history-page__title">Search History</h1>
                    <p className="history-page__subtitle">Your personal recent player lookups</p>
                </div>

                {history.length > 0 && (
                    confirmClear ? (
                        <div className="history-page__confirm">
                            <span>Clear all history?</span>
                            <button className="history-page__clear-btn" onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending}>
                                Yes, clear
                            </button>
                            <button className="history-page__cancel-btn" onClick={() => setConfirmClear(false)}>
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button className="history-page__clear-btn" onClick={() => setConfirmClear(true)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            Clear History
                        </button>
                    )
                )}
            </div>

            {isError && <div className="history-page__error" role="alert">Failed to load history</div>}

            {history.length === 0 && !isError ? (
                <div className="history-page__empty">
                    <p>Your history is empty.</p>
                    <span>Start searching for players to see them here!</span>
                </div>
            ) : (
                <div className="history-grid">
                    {history.map((entry) => {
                        const gameClass = entry.game.toLowerCase().replace(/\s+/g, '');
                        return (
                            <button key={entry.id} type="button" className={`history-card history-card--${gameClass}`} onClick={() => handleCardClick(entry)}>
                                <div className="history-card__top">
                                    <span className="history-card__game">{entry.game}</span>
                                    <span className="history-card__date">{formatDate(entry.createdAt)}</span>
                                </div>
                                <h3 className="history-card__query">{entry.label || entry.query}</h3>
                                {entry.label && entry.label !== entry.query && (
                                    <span className="history-card__id">{entry.game === 'Dota 2' ? `Steam ID ${entry.query}` : entry.query}</span>
                                )}
                                <div className="history-card__action">
                                    <span>Click to view stats</span>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
