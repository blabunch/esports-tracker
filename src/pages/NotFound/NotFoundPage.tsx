import React from 'react';
import { Link } from 'react-router-dom';
import '../History/HistoryPage.scss';

export const NotFoundPage: React.FC = () => (
    <div className="history-page fade-in-up">
        <div className="history-page__empty">
            <p>Page not found</p>
            <span>The page you are looking for does not exist. <Link to="/" style={{ color: '#ff4655' }}>Go to the homepage</Link></span>
        </div>
    </div>
);
