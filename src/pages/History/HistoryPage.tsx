import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameApi } from '../../api/client';
import './HistoryPage.scss';

interface HistoryEntry {
    id: number;
    game: string;
    query: string;
    createdAt: string;
}

export const HistoryPage: React.FC = () => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        const fetchHistory = async () => {
            try {
                const data = await gameApi.getHistory();
                setHistory(data);
            } catch (err) {
                setError('Failed to load history');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [token]);

    // 🔥 ФУНКЦІЯ ОЧИЩЕННЯ
    const handleClearHistory = async () => {
        if (!window.confirm('Are you sure you want to clear your entire search history?')) return;
        try {
            await gameApi.clearHistory();
            setHistory([]); // Миттєво очищаємо екран
        } catch (err) {
            alert('Failed to clear history');
        }
    };

    const handleCardClick = (entry: HistoryEntry) => {
        const game = entry.game.toLowerCase();
        if (game === 'valorant') {
            const [name, tag] = entry.query.split('#');
            if (name && tag) navigate('/valorant', { state: { autoSearch: true, name, tag } });
        } 
        else if (game === 'dota 2') navigate('/dota', { state: { autoSearch: true, id: entry.query } });
        else if (game === 'cs2') navigate('/cs2', { state: { autoSearch: true, nickname: entry.query } });
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString));
    };

    // 🔥 ЕКРАН ДЛЯ ГОСТЯ
    if (!token && !loading) {
        return (
            <div className="history-page fade-in-up">
                <div className="history-page__empty">
                    <p>Login Required</p>
                    <span>Please log in to track your personal search history across all games.</span>
                </div>
            </div>
        );
    }

    if (loading) return <div className="history-page__loading">Loading...</div>;

    return (
        <div className="history-page fade-in-up">
            <div className="history-page__header">
                <div className="history-page__title-group">
                    <h1 className="history-page__title">Search History</h1>
                    <p className="history-page__subtitle">Your personal recent player lookups</p>
                </div>
                
                {/* 🔥 КНОПКА ОЧИЩЕННЯ */}
                {history.length > 0 && (
                    <button className="history-page__clear-btn" onClick={handleClearHistory}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Clear History
                    </button>
                )}
            </div>

            {error && <div className="history-page__error">{error}</div>}

            {history.length === 0 && !error ? (
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
                                <h3 className="history-card__query">{entry.query}</h3>
                                <div className="history-card__action">
                                    <span>Click to view stats</span>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
