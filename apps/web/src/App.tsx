// apps/web/src/App.tsx
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import { useSettingsStore } from './stores/useSettingsStore.js';
import { useAuthStore } from './stores/useAuthStore.js';
import { audioEngine } from './audio/AudioEngine.js';

import { Header } from './components/layout/Header.js';

// Screens
import { HomeScreen } from './components/screens/HomeScreen.js';
import { LandingScreen } from './components/screens/LandingScreen.js';
import { RaceModeSelectScreen } from './components/screens/RaceModeSelectScreen.js';
import { GarageScreen } from './components/screens/GarageScreen.js';
import { RacePlayingScreen } from './components/screens/RacePlayingScreen.js';
import { LeaderboardScreen } from './components/screens/LeaderboardScreen.js';
import { ProfileScreen } from './components/screens/ProfileScreen.js';
import { SettingsScreen } from './components/screens/SettingsScreen.js';

// Modals
import { AuthModal } from './components/screens/AuthModal.js';
import { OnlineModal } from './components/screens/OnlineModal.js';
import { LegalModal, LegalTab } from './components/screens/LegalModal.js';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const { theme, reducedMotion, largeText } = useSettingsStore();
  const { currentUser } = useAuthStore();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');
  const [onlineModalOpen, setOnlineModalOpen] = useState(false);
  const [onlineSearching, setOnlineSearching] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab>('about');

  const openOnlineModal = (searching: boolean = false) => {
    setOnlineSearching(searching);
    setOnlineModalOpen(true);
  };

  const openAuth = (tab: 'signin' | 'signup' = 'signin') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const openLegal = (tab: LegalTab = 'about') => {
    setLegalModalTab(tab);
    setLegalModalOpen(true);
  };

  // Sync theme
  useEffect(() => {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Audio unlock listener on first user interaction
  useEffect(() => {
    const unlockAudio = () => {
      audioEngine.init();
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('pointerdown', unlockAudio);
    };
    window.addEventListener('keydown', unlockAudio, { once: true });
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    return () => {
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('pointerdown', unlockAudio);
    };
  }, []);

  return (
    <div
      className={`min-h-screen bg-bg text-text flex flex-col font-sans selection:bg-accent selection:text-accent-contrast ${
        largeText ? 'text-lg' : 'text-base'
      } ${reducedMotion ? 'motion-reduce' : ''}`}
    >
      {/* Top Header - automatically hides during active /race/playing routes */}
      <Header
        onOpenAuthModal={() => openAuth('signin')}
        onOpenOnlineModal={() => openOnlineModal(false)}
      />

      {/* Main Content Area with React Router */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <Routes>
          {/* Home Landing Routes */}
          <Route
            path="/"
            element={
              <HomeScreen
                onStartRace={() => navigate('/race')}
                onNavigateLeaderboard={() => navigate('/leaderboard')}
                onNavigateProfile={() => {
                  if (currentUser) {
                    navigate('/profile');
                  } else {
                    openAuth('signin');
                  }
                }}
                onOpenAuthModal={() => openAuth('signin')}
              />
            }
          />
          <Route
            path="/home"
            element={
              <HomeScreen
                onStartRace={() => navigate('/race')}
                onNavigateLeaderboard={() => navigate('/leaderboard')}
                onNavigateProfile={() => {
                  if (currentUser) {
                    navigate('/profile');
                  } else {
                    openAuth('signin');
                  }
                }}
                onOpenAuthModal={() => openAuth('signin')}
              />
            }
          />

          <Route
            path="/landing"
            element={
              <LandingScreen
                onPlay={() => navigate('/race')}
                onLogin={() => openAuth('signin')}
              />
            }
          />

          {/* Race Hub Route */}
          <Route path="/race" element={<RaceModeSelectScreen />} />

          {/* Dedicated Showroom & Garage Route */}
          <Route path="/race/garage" element={<GarageScreen />} />

          {/* Dedicated Active Race Playing Routes */}
          <Route path="/race/playing" element={<RacePlayingScreen />} />
          <Route path="/race/playing/:id" element={<RacePlayingScreen />} />

          {/* Stats & Community Routes */}
          <Route path="/leaderboard" element={<LeaderboardScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />

          {/* Settings Route */}
          <Route
            path="/settings"
            element={
              <SettingsScreen
                onOpenLegal={(tab) => openLegal(tab)}
                onLoggedOut={() => navigate('/')}
              />
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
      />

      <OnlineModal
        isOpen={onlineModalOpen}
        onClose={() => setOnlineModalOpen(false)}
        initialSearching={onlineSearching}
        onMatchFound={(roomId) => navigate(`/race/playing/${roomId}`)}
      />

      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalModalTab}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
