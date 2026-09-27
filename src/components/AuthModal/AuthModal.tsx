import React, { useState } from 'react';
import { loginUser, registerUser } from '../../api/auth';
import './AuthModal.scss';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let data;
            if (isLogin) {
                data = await loginUser(email, password);
            } else {
                data = await registerUser(email, password);
            }
            
            // Зберігаємо токен-перепустку в браузері
            localStorage.setItem('token', data.token);
            onSuccess(data.user);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-overlay">
            <div className="auth-modal fade-in-up">
                <button className="auth-modal__close" onClick={onClose}>×</button>
                
                <h2 className="auth-modal__title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p className="auth-modal__subtitle">
                    {isLogin ? 'Log in to track your stats' : 'Join the ultimate esports tracker'}
                </p>

                {error && <div className="auth-modal__error">{error}</div>}

                <form className="auth-modal__form" onSubmit={handleSubmit}>
                    <div className="auth-modal__input-group">
                        <label>Email</label>
                        <input 
                            type="email" 
                            placeholder="player@esports.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                        />
                    </div>
                    <div className="auth-modal__input-group">
                        <label>Password</label>
                        <input 
                            type="password" 
                            placeholder="••••••••" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={isLogin ? undefined : 8}
                            maxLength={72}
                            required
                        />
                    </div>

                    <button type="submit" className="auth-modal__btn" disabled={loading}>
                        {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
                    </button>
                </form>

                <p className="auth-modal__switch">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button type="button" onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? 'Sign up' : 'Log in'}
                    </button>
                </p>
            </div>
        </div>
    );
};
