import React from 'react';
import './Footer.scss';

const REPO_URL = 'https://github.com/blabunch/esports-tracker';

export const Footer: React.FC = () => (
    <footer className="footer">
        <div className="footer__inner">
            <span className="footer__brand">Esports Tracker</span>
            <span className="footer__sources">
                Data from{' '}
                <a href="https://docs.henrikdev.xyz/" target="_blank" rel="noreferrer">HenrikDev</a>,{' '}
                <a href="https://www.opendota.com/" target="_blank" rel="noreferrer">OpenDota</a> and{' '}
                <a href="https://developers.faceit.com/" target="_blank" rel="noreferrer">FACEIT</a>.
                Not affiliated with Riot Games, Valve or FACEIT.
            </span>
            <a className="footer__repo" href={REPO_URL} target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                    <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.2-3.1-.1-.4-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.2.8.8 1.2 1.9 1.2 3.1 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" />
                </svg>
                Source on GitHub
            </a>
        </div>
    </footer>
);
