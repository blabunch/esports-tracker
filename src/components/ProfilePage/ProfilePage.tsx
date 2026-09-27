import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { linkUserAccounts, updateUserProfile } from '../../api/auth'; // 🔥 ДОДАЛИ ІМПОРТ
import './ProfilePage.scss';

export const ProfilePage: React.FC<{ user: any; setUser: (user: any) => void }> = ({ user, setUser }) => {
    // 1. ВСІ ХУКИ ОГОЛОШУЮТЬСЯ НА САМОМУ ВЕРХУ
    const [displayName, setDisplayName] = useState('');
    const [nameSaved, setNameSaved] = useState(false);

    const [dotaId, setDotaId] = useState('');
    const [valName, setValName] = useState('');
    const [valTag, setValTag] = useState('');
    const [faceitNickname, setFaceitNickname] = useState('');
    
    const [editMode, setEditMode] = useState({ dota: false, valorant: false, cs2: false });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // 2. СИНХРОНІЗАЦІЯ ДАНИХ (Коли user приходить з бекенду після рефрешу)
    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || user.email?.split('@')[0] || '');
            setDotaId(user.dotaId || '');
            setValName(user.valName || '');
            setValTag(user.valTag || '');
            setFaceitNickname(user.faceitNickname || '');
        }
    }, [user]);

    // 3. РАННІЙ ПОВЕРНЕННЯ (ТІЛЬКИ ПІСЛЯ ВСІХ ХУКІВ!)
    if (!user) return <div className="profile-page__guest">Please log in to view your profile.</div>;

    const handleSaveName = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const response = await updateUserProfile(token!, { displayName });
            setUser(response.user); // Оновлюємо глобальний стейт
            setNameSaved(true);
            setTimeout(() => setNameSaved(false), 2000);
        } catch (error) {
            alert('Failed to save name.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGame = async (game: string) => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            let updateData = {};
            if (game === 'dota') updateData = { dotaId };
            if (game === 'valorant') updateData = { valName, valTag };
            if (game === 'cs2') updateData = { faceitNickname };

            const response = await linkUserAccounts(token!, updateData);
            setUser(response.user); 
            setEditMode({ ...editMode, [game]: false });
        } catch (error) {
            alert('Failed to link account.');
        } finally {
            setLoading(false);
        }
    };

    const handleUnlink = async (game: string) => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            let updateData = {};
            if (game === 'dota') updateData = { dotaId: '' };
            if (game === 'valorant') updateData = { valName: '', valTag: '' };
            if (game === 'cs2') updateData = { faceitNickname: '' };

            const response = await linkUserAccounts(token!, updateData);
            setUser(response.user);
            setEditMode({ ...editMode, [game]: false });
        } catch (error) {
            alert('Failed to unlink account.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-page fade-in-up">
            <div className="profile-page__header">
                <div className="profile-page__avatar">{displayName.charAt(0).toUpperCase()}</div>
                <div className="profile-page__info">
                    <div className="profile-page__name-group">
                        <input 
                            type="text" 
                            className="profile-page__name-input" 
                            value={displayName} 
                            onChange={(e) => setDisplayName(e.target.value)} 
                            placeholder="Your Nickname"
                        />
                        {displayName !== (user.displayName || user.email.split('@')[0]) && (
                            <button className={`profile-page__save-btn ${nameSaved ? 'saved' : ''}`} onClick={handleSaveName} disabled={loading}>
                                {nameSaved ? 'Saved!' : 'Save Name'}
                            </button>
                        )}
                    </div>
                    <p className="profile-page__email">
                        {user.email}
                    </p>
                </div>
            </div>

            <div className="profile-page__grid">
                {/* DOTA 2 */}
                {user?.dotaId && !editMode.dota ? (
                    <div className="passport passport--linked is-dota">
                        <span className="passport__status">Connected</span>
                        <h3 className="passport__game">Dota 2</h3>
                        <div className="passport__player">
                            <span className="label">Steam ID</span>
                            <p className="name">{user.dotaId}</p>
                        </div>
                        <div className="passport__actions">
                            <button className="btn-view btn-view--dota" onClick={() => navigate('/dota', { state: { autoSearch: true, id: user.dotaId } })}>View Stats</button>
                            <button className="btn-edit" onClick={() => setEditMode({...editMode, dota: true})} title="Settings">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="passport passport--unlinked">
                        <h3 className="passport__game">Dota 2</h3>
                        <div className="passport__form">
                            <label>Steam Account ID</label>
                            <input type="text" placeholder="e.g. 1048212948" value={dotaId} onChange={(e) => setDotaId(e.target.value)} />
                            <button disabled={loading || !dotaId} onClick={() => handleSaveGame('dota')}>Connect Account</button>
                            {editMode.dota && (
                                <div className="edit-actions">
                                    <button className="btn-cancel" onClick={() => setEditMode({...editMode, dota: false})}>Cancel</button>
                                    <button className="btn-unlink" onClick={() => handleUnlink('dota')}>Unlink Profile</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* VALORANT */}
                {user?.valName && user?.valTag && !editMode.valorant ? (
                    <div className="passport passport--linked is-val">
                        <span className="passport__status">Connected</span>
                        <h3 className="passport__game">Valorant</h3>
                        <div className="passport__player">
                            <span className="label">Riot ID</span>
                            <p className="name">{user.valName} <span className="tag">#{user.valTag}</span></p>
                        </div>
                        <div className="passport__actions">
                            <button className="btn-view btn-view--val" onClick={() => navigate('/valorant', { state: { autoSearch: true, name: user.valName, tag: user.valTag } })}>View Stats</button>
                            <button className="btn-edit" onClick={() => setEditMode({...editMode, valorant: true})} title="Settings">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="passport passport--unlinked">
                        <h3 className="passport__game">Valorant</h3>
                        <div className="passport__form">
                            <label>Riot ID & Tag</label>
                            <div className="row">
                                <input type="text" placeholder="Nickname" value={valName} onChange={(e) => setValName(e.target.value)} style={{flex: 1}}/>
                                <input type="text" placeholder="#TAG" className="short" value={valTag} onChange={(e) => setValTag(e.target.value)} />
                            </div>
                            <button disabled={loading || !valName || !valTag} onClick={() => handleSaveGame('valorant')}>Connect Account</button>
                            {editMode.valorant && (
                                <div className="edit-actions">
                                    <button className="btn-cancel" onClick={() => setEditMode({...editMode, valorant: false})}>Cancel</button>
                                    <button className="btn-unlink" onClick={() => handleUnlink('valorant')}>Unlink Profile</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* CS2 */}
                {user?.faceitNickname && !editMode.cs2 ? (
                    <div className="passport passport--linked is-cs2">
                        <span className="passport__status">Connected</span>
                        <h3 className="passport__game">CS2 (Faceit)</h3>
                        <div className="passport__player">
                            <span className="label">Faceit Nickname</span>
                            <p className="name">{user.faceitNickname}</p>
                        </div>
                        <div className="passport__actions">
                            <button className="btn-view btn-view--cs2" onClick={() => navigate('/cs2', { state: { autoSearch: true, nickname: user.faceitNickname } })}>View Stats</button>
                            <button className="btn-edit" onClick={() => setEditMode({...editMode, cs2: true})} title="Settings">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="passport passport--unlinked">
                        <h3 className="passport__game">CS2 (Faceit)</h3>
                        <div className="passport__form">
                            <label>Faceit Nickname</label>
                            <input type="text" placeholder="e.g. s1mple" value={faceitNickname} onChange={(e) => setFaceitNickname(e.target.value)} />
                            <button disabled={loading || !faceitNickname} onClick={() => handleSaveGame('cs2')}>Connect Account</button>
                            {editMode.cs2 && (
                                <div className="edit-actions">
                                    <button className="btn-cancel" onClick={() => setEditMode({...editMode, cs2: false})}>Cancel</button>
                                    <button className="btn-unlink" onClick={() => handleUnlink('cs2')}>Unlink Profile</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};