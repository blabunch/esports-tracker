import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { ErrorBoundary } from './components/ErrorFallback/ErrorBoundary';
import { Header } from './components/Header/Header';
import { Footer } from './components/Footer/Footer';
import { Home } from './pages/Home/Home';
import { getMe } from './api/auth';
import { User } from './api/types';
import { queryClient } from './queryClient';
import './App.scss';

// Сторінки ігор вантажаться окремими чанками — головна відкривається швидше
const ValorantPage = lazy(() => import('./pages/Valorant/ValorantPage').then(m => ({ default: m.ValorantPage })));
const DotaPage = lazy(() => import('./pages/Dota/DotaPage').then(m => ({ default: m.DotaPage })));
const Cs2Page = lazy(() => import('./pages/Cs2/Cs2Page').then(m => ({ default: m.Cs2Page })));
const HistoryPage = lazy(() => import('./pages/History/HistoryPage').then(m => ({ default: m.HistoryPage })));
const ProfilePage = lazy(() => import('./components/ProfilePage/ProfilePage').then(m => ({ default: m.ProfilePage })));
const NotFoundPage = lazy(() => import('./pages/NotFound/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

const PageFallback = () => <div className="page-loading" role="status">Loading...</div>;

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(() => Boolean(localStorage.getItem('token')));

  useEffect(() => {
    if (!localStorage.getItem('token')) return;

    getMe()
      .then(data => setUser(data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setIsAuthLoading(false));
  }, []);

  const handleUserChange = (nextUser: User | null) => {
    setUser(nextUser);
    // Історія та обране належать конкретному користувачу
    queryClient.removeQueries({ queryKey: ['history'] });
    queryClient.removeQueries({ queryKey: ['favorites'] });
  };

  if (isAuthLoading) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#09090b', color: '#fff', fontFamily: 'Outfit, sans-serif' }}>
            <h2>Loading Tracker...</h2>
        </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="app-wrapper">
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: { background: '#1a1a24', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontFamily: "'Outfit', sans-serif" }
              }}
            />
            <Header user={user} setUser={handleUserChange} />

            <main className="main-content">
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/" element={<Home user={user} />} />

                  <Route path="/valorant" element={<ValorantPage user={user} />} />
                  <Route path="/valorant/:name/:tag" element={<ValorantPage user={user} />} />
                  <Route path="/dota" element={<DotaPage user={user} />} />
                  <Route path="/dota/:id" element={<DotaPage user={user} />} />
                  <Route path="/cs2" element={<Cs2Page user={user} />} />
                  <Route path="/cs2/:nickname" element={<Cs2Page user={user} />} />

                  <Route path="/history" element={<HistoryPage user={user} />} />
                  <Route path="/profile" element={<ProfilePage key={user?.id ?? 'guest'} user={user} setUser={setUser} />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
