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
    <div className="max-w-2xl mx-auto px-4 py-8 font-display select-none">
      <h1 className="text-3xl font-bold uppercase tracking-wider text-text mb-6">
        SYSTEM SETTINGS
      </h1>

      {/* 1. APPEARANCE */}
      <section className="mb-6 p-4 rounded-[6px] glass-panel border border-border">
        <h2 className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-3">
          APPEARANCE & THEME
        </h2>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-text">Color Mode</span>
          <div className="flex items-center bg-surface-2 rounded-[4px] p-0.5 border border-border text-xs uppercase tracking-wider">
            {(['dark', 'light', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  audioEngine.playUiClick();
                  setTheme(t);
                }}
                className={`px-3 py-1 rounded-[3px] transition-all text-xs font-display ${
                  theme === t
                    ? 'bg-accent text-accent-contrast font-bold shadow-sm'
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
      <section className="mb-6 p-4 rounded-[6px] glass-panel border border-border space-y-3.5">
        <h2 className="text-[10px] uppercase tracking-widest text-text-muted font-bold">
          AUDIO ENGINE
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-text block">
              Mechanical Keystroke Sound
            </span>
            <span className="text-[11px] text-text-muted">
              Tactile switch click on every key input
            </span>
          </div>
          <button
            onClick={() => handleToggle(() => setTypingSound(!typingSound))}
            className={`w-10 h-5 rounded-full transition-colors relative ${
              typingSound ? 'bg-accent' : 'bg-surface-2 border border-border'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                typingSound ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-text block">
              Engine RPM Sound Synthesizer
            </span>
            <span className="text-[11px] text-text-muted">
              Dynamic pitch shifting with acceleration
            </span>
          </div>
          <button
            onClick={() => handleToggle(() => setEngineSound(!engineSound))}
            className={`w-10 h-5 rounded-full transition-colors relative ${
              engineSound ? 'bg-accent' : 'bg-surface-2 border border-border'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                engineSound ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-text block">
              Race Sound Effects
            </span>
            <span className="text-[11px] text-text-muted">
              Countdown beeps, mistake thuds, and finish fanfare
            </span>
          </div>
          <button
            onClick={() => handleToggle(() => setRaceEffects(!raceEffects))}
            className={`w-10 h-5 rounded-full transition-colors relative ${
              raceEffects ? 'bg-accent' : 'bg-surface-2 border border-border'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                raceEffects ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </section>

      {/* 3. SIMULATION & ACCESSIBILITY */}
      <section className="mb-6 p-4 rounded-[6px] glass-panel border border-border space-y-3.5">
        <h2 className="text-[10px] uppercase tracking-widest text-text-muted font-bold">
          MOTION & SIMULATION
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-text block">
              Screen Shake & Velocity Lurch
            </span>
            <span className="text-[11px] text-text-muted">
              Subtle camera vibration at high velocity
            </span>
          </div>
          <button
            onClick={() => handleToggle(() => setScreenShake(!screenShake))}
            className={`w-10 h-5 rounded-full transition-colors relative ${
              screenShake ? 'bg-accent' : 'bg-surface-2 border border-border'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                screenShake ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-text block">
              Reduced Motion
            </span>
            <span className="text-[11px] text-text-muted">
              Suppresses rapid camera transitions
            </span>
          </div>
          <button
            onClick={() => handleToggle(() => setReducedMotion(!reducedMotion))}
            className={`w-10 h-5 rounded-full transition-colors relative ${
              reducedMotion ? 'bg-accent' : 'bg-surface-2 border border-border'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                reducedMotion ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-text block">
              Large HUD Passage Font
            </span>
            <span className="text-[11px] text-text-muted">
              Increases typing passage size
            </span>
          </div>
          <button
            onClick={() => handleToggle(() => setLargeText(!largeText))}
            className={`w-10 h-5 rounded-full transition-colors relative ${
              largeText ? 'bg-accent' : 'bg-surface-2 border border-border'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                largeText ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </section>

      {/* 4. DRIVER ACCOUNT */}
      {currentUser && (
        <section className="mb-6 p-4 rounded-[6px] glass-panel border border-border space-y-3">
          <h2 className="text-[10px] uppercase tracking-widest text-text-muted font-bold">
            DRIVER ACCOUNT
          </h2>

          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted uppercase">Handle</span>
            <span className="font-semibold text-text">{currentUser.username}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted uppercase">Email</span>
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
              className="w-full sm:w-auto ml-auto"
            >
              Delete Account
            </Button>
          </div>
        </section>
      )}

      {/* 5. INFORMATION & LEGAL */}
      <section className="p-4 rounded-[6px] glass-panel border border-border">
        <h2 className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-2">
          SYSTEM INFORMATION
        </h2>
        <div className="flex flex-col space-y-1.5 text-xs text-text-muted">
          <button
            onClick={() => onOpenLegal('terms')}
            className="text-left hover:text-accent transition-colors uppercase tracking-wider"
          >
            Terms of Service →
          </button>
          <button
            onClick={() => onOpenLegal('privacy')}
            className="text-left hover:text-accent transition-colors uppercase tracking-wider"
          >
            Privacy Policy →
          </button>
          <button
            onClick={() => onOpenLegal('about')}
            className="text-left hover:text-accent transition-colors uppercase tracking-wider"
          >
            About TypeRace Engine →
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
