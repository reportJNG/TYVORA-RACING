// apps/web/src/components/layout/Header.tsx
import React, { useState } from 'react';
import { User, Settings, LogOut, ChevronDown, Volume2, VolumeX } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { useSettingsStore } from '../../stores/useSettingsStore.js';
import { Avatar } from '../common/Avatar.js';
import { audioEngine } from '../../audio/AudioEngine.js';

export interface HeaderProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onOpenOnlineModal: () => void;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  onOpenAuthModal,
}) => {
  const { currentUser, isAuthenticated, logout } = useAuthStore();
  const {
    typingSound,
    engineSound,
    raceEffects,
    setTypingSound,
    setEngineSound,
    setRaceEffects,
  } = useSettingsStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Hidden during active race
  if (currentScreen === 'race') return null;

  const isMuted = !typingSound && !engineSound && !raceEffects;

  const toggleSound = () => {
    audioEngine.playUiClick();
    if (isMuted) {
      setTypingSound(true);
      setEngineSound(true);
      setRaceEffects(true);
    } else {
      setTypingSound(false);
      setEngineSound(false);
      setRaceEffects(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full h-14 bg-bg/90 backdrop-blur-md border-b border-border transition-colors">
      <div className="max-w-7xl h-full mx-auto px-4 md:px-8 flex items-center justify-between">
        {/* Brand / Logo */}
        <div
          onClick={() => {
            audioEngine.playUiClick();
            onNavigate('home');
          }}
          className="flex items-center gap-2 cursor-pointer group select-none"
        >
          <div className="h-6 w-1 bg-accent rounded-full transition-transform group-hover:scale-y-125" />
          <div className="font-display font-bold tracking-widest text-xl text-text group-hover:text-accent transition-colors flex items-center gap-1.5">
            <span>TYPE</span>
            <span className="text-accent">//</span>
            <span>RACE</span>
          </div>
        </div>

        {/* Center Nav */}
        <nav className="flex items-center gap-1 font-display uppercase tracking-widest text-xs">
          <button
            onClick={() => {
              audioEngine.playUiClick();
              onNavigate('home');
            }}
            className={`px-3 py-1.5 rounded transition-all ${
              currentScreen === 'home'
                ? 'text-accent bg-accent/10 font-bold'
                : 'text-text-muted hover:text-text hover:bg-surface-2'
            }`}
          >
            Race
          </button>
          <button
            onClick={() => {
              audioEngine.playUiClick();
              onNavigate('car-select');
            }}
            className={`px-3 py-1.5 rounded transition-all ${
              currentScreen === 'car-select'
                ? 'text-accent bg-accent/10 font-bold'
                : 'text-text-muted hover:text-text hover:bg-surface-2'
            }`}
          >
            Garage
          </button>
          <button
            onClick={() => {
              audioEngine.playUiClick();
              onNavigate('leaderboard');
            }}
            className={`px-3 py-1.5 rounded transition-all ${
              currentScreen === 'leaderboard'
                ? 'text-accent bg-accent/10 font-bold'
                : 'text-text-muted hover:text-text hover:bg-surface-2'
            }`}
          >
            Records
          </button>
        </nav>

        {/* Right side: Audio Toggle & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Audio Quick Mute */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2 rounded text-text-muted hover:text-text hover:bg-surface-2 border border-transparent hover:border-border transition-all"
            aria-label="Toggle Sound"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-text-faint" />
            ) : (
              <Volume2 className="w-4 h-4 text-accent" />
            )}
          </button>

          {/* User Profile / Auth */}
          {isAuthenticated && currentUser ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 py-1 px-2.5 rounded bg-surface-2 hover:bg-surface border border-border text-text transition-colors"
              >
                <Avatar seed={currentUser.username} size="sm" />
                <span className="font-display uppercase tracking-wider text-xs font-semibold max-w-[100px] truncate hidden sm:inline-block">
                  {currentUser.username}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
              </button>

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-44 bg-surface border border-border-strong rounded-m shadow-2xl py-1 z-50 font-display uppercase tracking-wider text-xs">
                    <button
                      onClick={() => {
                        audioEngine.playUiClick();
                        setIsDropdownOpen(false);
                        onNavigate('profile');
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-text hover:bg-surface-2 transition-colors text-left"
                    >
                      <User className="w-3.5 h-3.5 text-accent" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        audioEngine.playUiClick();
                        setIsDropdownOpen(false);
                        onNavigate('settings');
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-text hover:bg-surface-2 transition-colors text-left"
                    >
                      <Settings className="w-3.5 h-3.5 text-text-muted" />
                      <span>Settings</span>
                    </button>
                    <div className="my-1 border-t border-border" />
                    <button
                      onClick={() => {
                        audioEngine.playUiClick();
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-danger hover:bg-surface-2 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                audioEngine.playUiClick();
                onOpenAuthModal();
              }}
              className="px-3.5 py-1.5 rounded bg-surface-2 hover:bg-accent hover:text-accent-contrast border border-border text-text font-display uppercase tracking-wider text-xs font-bold transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
