import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthModal } from '../AuthModal/AuthModal';
import './Header.scss';

interface HeaderProps { user: any; setUser: (user: any) => void; }

export const Header: React.FC<HeaderProps> = ({ user, setUser }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => { 
        localStorage.removeItem('token'); 
        setUser(null); 
        navigate('/'); 
        setIsDropdownOpen(false); 
    };

    const isActive = (path: string) => location.pathname === path ? 'active' : '';

    // 🔥 МАГІЯ ТУТ: Пріоритет на displayName
    // displayName — це те, що ми бачимо в меню
    const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
    // displayLetter — буква на кружечку
    const displayLetter = displayName.charAt(0).toUpperCase();

    return (
        <header className="header">
            <div className="header__logo" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
                ESPORTS TRACKER
            </div>

            <nav className="header__nav">
                <button className={`header__nav-item ${isActive('/valorant')}`} onClick={() => navigate('/valorant')}>Valorant</button>
                <button className={`header__nav-item ${isActive('/dota')}`} onClick={() => navigate('/dota')}>Dota 2</button>
                <button className={`header__nav-item ${isActive('/cs2')}`} onClick={() => navigate('/cs2')}>CS2</button>
            </nav>

            <div className="header__right">
                <button className={`header__history-btn ${isActive('/history')}`} onClick={() => navigate('/history')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> History
                </button>

                <div className="header__profile" ref={dropdownRef}>
                    <button className="header__avatar-btn" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                        {user ? (
                            <div className="header__avatar-pic">{displayLetter}</div>
                        ) : (
                            <div className="header__avatar-placeholder">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2m8-10a4 4 0 100-8 4 4 0 000 8z"></path></svg>
                            </div>
                        )}
                    </button>

                    {isDropdownOpen && (
                        <div className="header__dropdown fade-in-down">
                            {user ? (
                                <>
                                    <div className="header__dropdown-info">
                                        {/* 🔥 Тут тепер теж відображається новий нікнейм */}
                                        <p className="name">{displayName}</p>
                                        <p className="email">{user.email}</p>
                                    </div>
                                    <div className="header__dropdown-divider"></div>
                                    <button className="header__dropdown-item" onClick={() => { navigate('/profile'); setIsDropdownOpen(false); }}>
                                        My Dashboard
                                    </button>
                                    <div className="header__dropdown-divider"></div>
                                    <button className="header__dropdown-item header__dropdown-item--danger" onClick={handleLogout}>
                                        Log Out
                                    </button>
                                </>
                            ) : (
                                <div className="header__dropdown-guest">
                                    <p>Create an account to save your match history and link your game accounts.</p>
                                    <button className="header__dropdown-btn" onClick={() => { setIsDropdownOpen(false); setIsAuthModalOpen(true); }}>
                                        Log In / Sign Up
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={(userData) => { setUser(userData); }} />
        </header>
    );
};