import React from 'react';
import './Skeleton.scss';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="skeleton-card fade-in-up">
      <div className="skeleton-card__profile">
        <div className="skeleton-box skeleton-avatar"></div>
        <div className="skeleton-box skeleton-text skeleton-text--lg"></div>
        <div className="skeleton-box skeleton-text skeleton-text--md"></div>
        <div className="skeleton-box skeleton-text skeleton-text--md"></div>
      </div>
      
      <div className="skeleton-card__stats">
        <div className="skeleton-grid">
          <div className="skeleton-box skeleton-stat skeleton-stat--large"></div>
          <div className="skeleton-box skeleton-stat"></div>
          <div className="skeleton-box skeleton-stat"></div>
          <div className="skeleton-box skeleton-stat skeleton-stat--wide"></div>
          <div className="skeleton-box skeleton-stat"></div>
        </div>
        <div className="skeleton-agents">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-box skeleton-agent"></div>
          ))}
        </div>
      </div>
    </div>
  );
};