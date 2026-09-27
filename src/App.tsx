import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { ErrorBoundary } from './components/ErrorFallback/ErrorBoundary'; 
import { Header } from './components/Header/Header';
import { Home } from './pages/Home/Home';
import { ValorantPage } from './pages/Valorant/ValorantPage';
import { DotaPage } from './pages/Dota/DotaPage';
import { Cs2Page } from './pages/Cs2/Cs2Page';
import { HistoryPage } from './pages/History/HistoryPage';
import { ProfilePage } from './components/ProfilePage/ProfilePage';
import { getMe } from './api/auth';
import './App.scss'; 

export const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
        getMe(token)
            .then(data => { setUser(data.user); })
            .catch(() => {
                console.log("Token expired or invalid");
                localStorage.removeItem('token');
            })
            .finally(() => { setIsAuthLoading(false); });
    } else {
        setIsAuthLoading(false);
    }
  }, []);

  if (isAuthLoading) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#09090b', color: '#fff', fontFamily: 'Outfit, sans-serif' }}>
            <h2>Loading Tracker...</h2>
        </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="app-wrapper">
          <Toaster 
            position="bottom-right" 
            toastOptions={{
              style: { background: '#1a1a24', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontFamily: "'Outfit', sans-serif" }
            }} 
          />
          <Header user={user} setUser={setUser} />
          
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home user={user} />} />
              
              {/* 🔥 ОСЬ ТУТ БУВ БАГ: Тепер user={user} передається ВСІМ іграм! */}
              <Route path="/valorant" element={<ValorantPage user={user} />} />
              <Route path="/dota" element={<DotaPage user={user} />} />
              <Route path="/cs2" element={<Cs2Page user={user} />} />
              
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/profile" element={<ProfilePage user={user} setUser={setUser} />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;