// apps/web/src/App.tsx
import React, { useState, useEffect } from 'react';
import { useSettingsStore } from './stores/useSettingsStore.js';
import { useAuthStore } from './stores/useAuthStore.js';
import { audioEngine } from './audio/AudioEngine.js';

import { Header } from './components/layout/Header.js';
import { Footer } from './components/layout/Footer.js';

import { HomeScreen } from './components/screens/HomeScreen.js';
import { LandingScreen } from './components/screens/LandingScreen.js';
import { RaceScreen } from './components/screens/RaceScreen.js';
import { LeaderboardScreen } from './components/screens/LeaderboardScreen.js';
import { ProfileScreen } from './components/screens/ProfileScreen.js';
import { SettingsScreen } from './components/screens/SettingsScreen.js';

import { AuthModal } from './components/screens/AuthModal.js';
import { OnlineModal } from './components/screens/OnlineModal.js';
import { LegalModal, LegalTab } from './components/screens/LegalModal.js';

export type ScreenType =
  | 'home'
  | 'landing'
  | 'race'
  | 'leaderboard'
  | 'profile'
  | 'settings';

export const App: React.FC = () => {
  const { theme, reducedMotion, largeText } = useSettingsStore();
  const { currentUser } = useAuthStore();

  const [currentScreen, setCurrentScreen] = useState<ScreenType>(() => {
    if (typeof window !== 'undefined' && window.location?.search) {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('screen');
      if (
        s === 'race' ||
        s === 'leaderboard' ||
        s === 'profile' ||
        s === 'settings' ||
        s === 'landing'
      ) {
        return s as ScreenType;
      }
    }
    return 'home';
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');
  const [onlineModalOpen, setOnlineModalOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab>('about');

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

  const openAuth = (tab: 'signin' | 'signup' = 'signin') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const openLegal = (tab: LegalTab = 'about') => {
    setLegalModalTab(tab);
    setLegalModalOpen(true);
  };

  const isRaceActive = currentScreen === 'race';

  return (
    <div
      className={`min-h-screen bg-bg text-text flex flex-col font-sans selection:bg-accent selection:text-accent-contrast ${
        largeText ? 'text-lg' : 'text-base'
      } ${reducedMotion ? 'motion-reduce' : ''}`}
    >
      {/* Top Header - hidden during active race view */}
      {!isRaceActive && (
        <Header
          currentScreen={currentScreen}
          onNavigate={(screen) => setCurrentScreen(screen as ScreenType)}
          onOpenOnlineModal={() => setOnlineModalOpen(true)}
          onOpenAuthModal={() => openAuth('signin')}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {currentScreen === 'home' && (
          <HomeScreen
            onStartRace={() => setCurrentScreen('race')}
            onNavigateLeaderboard={() => setCurrentScreen('leaderboard')}
            onNavigateProfile={() => {
              if (currentUser) {
                setCurrentScreen('profile');
              } else {
                openAuth('signin');
              }
            }}
            onOpenAuthModal={() => openAuth('signin')}
          />
        )}

        {currentScreen === 'landing' && (
          <LandingScreen
            onPlay={() => setCurrentScreen('race')}
            onLogin={() => openAuth('signin')}
          />
        )}

        {currentScreen === 'race' && (
          <RaceScreen
            onHome={() => setCurrentScreen('home')}
            onLeaderboard={() => setCurrentScreen('leaderboard')}
            onOpenOnlineModal={() => setOnlineModalOpen(true)}
          />
        )}

        {currentScreen === 'leaderboard' && <LeaderboardScreen />}

        {currentScreen === 'profile' && <ProfileScreen />}

        {currentScreen === 'settings' && (
          <SettingsScreen
            onOpenLegal={(tab) => openLegal(tab)}
            onLoggedOut={() => setCurrentScreen('home')}
          />
        )}
      </main>

      {/* Bottom Footer - hidden during race */}
      {!isRaceActive && (
        <Footer
          currentScreen={currentScreen}
          onOpenLegal={(tab) => openLegal(tab)}
        />
      )}

      {/* Global Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
      />

      <OnlineModal
        isOpen={onlineModalOpen}
        onClose={() => setOnlineModalOpen(false)}
      />

      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalModalTab}
      />
    </div>
  );
};
export default App;
