// apps/web/src/components/layout/Header.tsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, ChevronDown, Volume2, VolumeX, Download, Zap, Wrench } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { useSettingsStore } from '../../stores/useSettingsStore.js';
import { Avatar } from '../common/Avatar.js';
import { audioEngine } from '../../audio/AudioEngine.js';

export interface HeaderProps {
  onOpenAuthModal?: () => void;
  onOpenOnlineModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuthModal,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const { currentUser, isAuthenticated, logout, downloadDatabaseFile } = useAuthStore();
  const {
    typingSound,
    engineSound,
    raceEffects,
    setTypingSound,
    setEngineSound,
    setRaceEffects,
  } = useSettingsStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Hidden during active racing viewport
  if (pathname.startsWith('/race/playing')) return null;

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

  const isHome = pathname === '/' || pathname === '/home';

  return (
    <header
      className={`sticky top-0 z-40 w-full h-14 backdrop-blur-xl border-b transition-all ${
        isHome
          ? 'bg-[#0B0E14]/40 border-white/10 text-white'
          : 'bg-bg/85 border-border'
      }`}
    >
      <div className="max-w-6xl h-full mx-auto px-4 md:px-8 flex items-center justify-between">
        {/* Brand / Logo: TYVORA */}
        <div
          onClick={() => {
            audioEngine.playUiClick();
            navigate('/');
          }}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-accent to-accent-hover flex items-center justify-center text-white shadow-sm shadow-accent/30 group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <div className="font-display font-extrabold tracking-wider text-lg text-text group-hover:text-accent transition-colors flex items-center gap-1.5">
            <span>TYVORA</span>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-surface-2 border border-border text-text-muted">RACE</span>
          </div>
        </div>

        {/* Center Nav: Home, Race, Garage, Leaderboard */}
        <nav className="flex items-center gap-1 p-1 rounded-full bg-surface-2/60 border border-border/80 backdrop-blur-md text-xs">
          <button
            onClick={() => {
              audioEngine.playUiClick();
              navigate('/');
            }}
            className={`px-3.5 py-1 rounded-full font-medium transition-all cursor-pointer ${
              isHome
                ? 'bg-accent text-white font-semibold shadow-sm shadow-accent/20'
                : 'text-text-muted hover:text-text hover:bg-surface-2'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => {
              audioEngine.playUiClick();
              navigate('/race');
            }}
            className={`px-3.5 py-1 rounded-full font-medium transition-all cursor-pointer ${
              pathname === '/race'
                ? 'bg-accent text-white font-semibold shadow-sm shadow-accent/20'
                : 'text-text-muted hover:text-text hover:bg-surface-2'
            }`}
          >
            Race
          </button>
          <button
            onClick={() => {
              audioEngine.playUiClick();
              navigate('/race/garage');
            }}
            className={`px-3.5 py-1 rounded-full font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              pathname === '/race/garage'
                ? 'bg-accent text-white font-semibold shadow-sm shadow-accent/20'
                : 'text-text-muted hover:text-text hover:bg-surface-2'
            }`}
          >
            <Wrench className="w-3 h-3" />
            <span>Garage</span>
          </button>
          <button
            onClick={() => {
              audioEngine.playUiClick();
              navigate('/leaderboard');
            }}
            className={`px-3.5 py-1 rounded-full font-medium transition-all cursor-pointer ${
              pathname === '/leaderboard'
                ? 'bg-accent text-white font-semibold shadow-sm shadow-accent/20'
                : 'text-text-muted hover:text-text hover:bg-surface-2'
            }`}
          >
            Leaderboard
          </button>
        </nav>

        {/* Right side: Audio Toggle & Profile */}
        <div className="flex items-center gap-2">
          {/* Audio Quick Mute */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text bg-surface-2/60 hover:bg-surface-2 border border-border transition-all cursor-pointer"
            aria-label="Toggle Sound"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-text-faint" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-accent" />
            )}
          </button>

          {/* User Profile / Auth */}
          {isAuthenticated && currentUser ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-2 py-1 px-2.5 rounded-full border transition-all text-xs cursor-pointer ${
                  pathname === '/profile'
                    ? 'bg-accent/15 border-accent text-accent'
                    : 'bg-surface-2/80 hover:bg-surface border-border text-text'
                }`}
              >
                <Avatar seed={currentUser.username} size="sm" />
                <div className="flex items-center gap-1.5 text-left hidden sm:flex">
                  <span className="font-medium text-xs max-w-[100px] truncate">
                    {currentUser.username}
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] font-mono text-accent font-semibold px-1.5 py-0.5 rounded-full bg-accent/10">
                    <Zap className="w-2.5 h-2.5" />
                    {currentUser.points}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-text-muted" />
              </button>

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-surface/95 backdrop-blur-md border border-border-strong rounded-xl shadow-2xl py-1 z-50 text-xs">
                    <div className="px-3.5 py-2.5 border-b border-border">
                      <div className="font-semibold text-text truncate">{currentUser.username}</div>
                      <div className="text-[11px] text-accent font-mono flex items-center gap-1 mt-0.5">
                        <Zap className="w-3 h-3" />
                        <span>{currentUser.points} Points</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        audioEngine.playUiClick();
                        setIsDropdownOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-text hover:bg-surface-2 transition-colors text-left cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-accent" />
                      <span>Profile & Data</span>
                    </button>

                    <button
                      onClick={() => {
                        audioEngine.playUiClick();
                        setIsDropdownOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-text hover:bg-surface-2 transition-colors text-left cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-text-muted" />
                      <span>Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        audioEngine.playUiClick();
                        setIsDropdownOpen(false);
                        downloadDatabaseFile();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-text hover:bg-surface-2 transition-colors text-left cursor-pointer"
                      title="Download full SQLite database binary"
                    >
                      <Download className="w-3.5 h-3.5 text-accent" />
                      <span>Export Database</span>
                    </button>

                    <div className="my-1 border-t border-border" />

                    <button
                      onClick={() => {
                        audioEngine.playUiClick();
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-danger hover:bg-surface-2 transition-colors text-left cursor-pointer"
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
                if (onOpenAuthModal) onOpenAuthModal();
              }}
              className="px-4 py-1.5 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-sm shadow-accent/25 transition-all cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
export default Header;
