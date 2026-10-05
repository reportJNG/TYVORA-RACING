// apps/web/src/components/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore.js';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { Button } from '../common/Button.js';
import { Modal } from '../common/Modal.js';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { audioEngine } from '../../audio/AudioEngine.js';

export interface SettingsScreenProps {
  onOpenLegal: (tab: 'terms' | 'privacy' | 'about') => void;
  onLoggedOut: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onOpenLegal,
  onLoggedOut,
}) => {
  const {
    theme,
    setTheme,
    typingSound,
    setTypingSound,
    engineSound,
    setEngineSound,
    raceEffects,
    setRaceEffects,
    screenShake,
    setScreenShake,
    reducedMotion,
    setReducedMotion,
    largeText,
    setLargeText,
  } = useSettingsStore();

  const { currentUser, logout, deleteAccount } = useAuthStore();
  const [showEmail, setShowEmail] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const maskEmail = (email: string) => {
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    return `${parts[0].charAt(0)}•••••@${parts[1]}`;
  };

  const handleToggle = (fn: () => void) => {
    audioEngine.playUiClick();
    fn();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 font-sans select-none">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-text">
          Settings
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Customize audio, appearance, and accessibility preferences.
        </p>
      </div>

      {/* 1. APPEARANCE */}
      <section className="mb-6 p-5 rounded-2xl glass-panel border border-border">
        <h2 className="text-xs font-semibold text-text mb-3">
          Appearance & Theme
        </h2>
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">Color Theme</span>
          <div className="flex items-center bg-surface-2 rounded-full p-1 border border-border text-xs">
            {(['dark', 'light', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  audioEngine.playUiClick();
                  setTheme(t);
                }}
                className={`px-3 py-1 rounded-full transition-all text-xs capitalize ${
                  theme === t
                    ? 'bg-accent text-white font-semibold shadow-sm'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. AUDIO & FEEDBACK */}
      <section className="mb-6 p-5 rounded-2xl glass-panel border border-border space-y-4">
        <h2 className="text-xs font-semibold text-text">
          Audio Engine
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-text block">
              Mechanical Keystroke Sound
            </span>
            <span className="text-[11px] text-text-muted">
              Tactile switch click on every key input
            </span>
          </div>
          <button
            onClick={() => handleToggle(() => setTypingSound(!typingSound))}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              typingSound ? 'bg-accent' : 'bg-surface-2 border border-border'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                typingSound ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-text block">
              Engine Sound Synthesizer
            </span>
            <span className="text-[11px] text-text-muted">
              Dynamic pitch shifting with acceleration
            </span>
          </div>
          <button
            onClick={() => handleToggle(() => setEngineSound(!engineSound))}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              engineSound ? 'bg-accent' : 'bg-surface-2 border border-border'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                engineSound ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-text block">
              Race Sound Effects
            </span>
            <span className="text-[11px] text-text-muted">
              Countdown beeps, mistake thuds, and finish fanfare
            </span>
          </div>
          <button
            onClick={() => handleToggle(() => setRaceEffects(!raceEffects))}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              raceEffects ? 'bg-accent' : 'bg-surface-2 border border-border'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                raceEffects ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>
      </section>

      {/* 3. SIMULATION & ACCESSIBILITY */}
      <section className="mb-6 p-5 rounded-2xl glass-panel border border-border space-y-4">
        <h2 className="text-xs font-semibold text-text">
          Motion & Accessibility
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-text block">
              Screen Shake & Velocity Lurch
            </span>
            <span className="text-[11px] text-text-muted">
              Subtle camera vibration at high velocity
            </span>
          </div>
          <button
            onClick={() => handleToggle(() => setScreenShake(!screenShake))}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              screenShake ? 'bg-accent' : 'bg-surface-2 border border-border'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                screenShake ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-text block">
              Reduced Motion
            </span>
            <span className="text-[11px] text-text-muted">
              Suppresses rapid camera transitions
            </span>
          </div>
          <button
            onClick={() => handleToggle(() => setReducedMotion(!reducedMotion))}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              reducedMotion ? 'bg-accent' : 'bg-surface-2 border border-border'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                reducedMotion ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-text block">
              Large HUD Passage Font
            </span>
            <span className="text-[11px] text-text-muted">
              Increases typing passage size
            </span>
          </div>
          <button
            onClick={() => handleToggle(() => setLargeText(!largeText))}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              largeText ? 'bg-accent' : 'bg-surface-2 border border-border'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                largeText ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>
      </section>

      {/* 4. DRIVER ACCOUNT */}
      {currentUser && (
        <section className="mb-6 p-5 rounded-2xl glass-panel border border-border space-y-3">
          <h2 className="text-xs font-semibold text-text">
            Driver Account
          </h2>

          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Username</span>
            <span className="font-semibold text-text">{currentUser.username}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Email</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-text">
                {showEmail ? currentUser.email : maskEmail(currentUser.email)}
              </span>
              <button
                onClick={() => setShowEmail(!showEmail)}
                className="text-text-muted hover:text-text p-0.5"
                aria-label="Toggle email visibility"
              >
                {showEmail ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                logout();
                onLoggedOut();
              }}
              className="w-full sm:w-auto"
            >
              Log Out
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              className="w-full sm:w-auto sm:ml-auto"
            >
              Delete Account
            </Button>
          </div>
        </section>
      )}

      {/* 5. DATA BACKUP & EXPORT */}
      <section className="mb-6 p-5 rounded-2xl glass-panel border border-border">
        <h2 className="text-xs font-semibold text-text mb-2">
          Database & Export
        </h2>
        <p className="text-xs text-text-muted mb-4">
          All records and stats are saved locally via SQLite WASM. You can export the database at any time.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => useAuthStore.getState().downloadDatabaseFile()}
          >
            Export SQLite Database (.sqlite)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => useAuthStore.getState().downloadJsonBackup()}
          >
            Export JSON Backup
          </Button>
        </div>
      </section>

      {/* 6. INFORMATION & LEGAL */}
      <section className="p-5 rounded-2xl glass-panel border border-border">
        <h2 className="text-xs font-semibold text-text mb-3">
          Information & Legal
        </h2>
        <div className="flex flex-col space-y-2 text-xs text-text-muted">
          <button
            onClick={() => onOpenLegal('terms')}
            className="text-left hover:text-text transition-colors"
          >
            Terms of Service →
          </button>
          <button
            onClick={() => onOpenLegal('privacy')}
            className="text-left hover:text-text transition-colors"
          >
            Privacy Policy →
          </button>
          <button
            onClick={() => onOpenLegal('about')}
            className="text-left hover:text-text transition-colors"
          >
            About TYVORA Racing →
          </button>
        </div>
      </section>

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Account"
        maxWidth="sm"
      >
        <div className="text-center py-2 select-none">
          <ShieldAlert className="w-10 h-10 text-danger mx-auto mb-3" />
          <p className="text-xs text-text-muted mb-5 leading-relaxed">
            This will permanently remove your driver handle, career statistics, and telemetry records. This action cannot be undone.
          </p>

          <div className="flex gap-2.5">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsDeleteModalOpen(false)}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="md"
              onClick={() => {
                deleteAccount();
                setIsDeleteModalOpen(false);
                onLoggedOut();
              }}
              fullWidth
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
