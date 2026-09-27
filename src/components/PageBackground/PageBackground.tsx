import React from 'react';
import './PageBackground.scss';

// Фон сторінок ігор: фіксований шар, що з'являється з короткою анімацією (transform/opacity)
// і далі не перемальовується — прокрутка лишається плавною, а процесор не гріється у спокої.
export const PageBackground: React.FC<{ accent: 'valorant' | 'dota' | 'cs2' }> = ({ accent }) => (
    <div className={`page-bg page-bg--${accent}`} aria-hidden="true">
        <div className="page-bg__dots page-bg__dots--a" />
        <div className="page-bg__dots page-bg__dots--b" />
        <div className="page-bg__glow" />
    </div>
);
