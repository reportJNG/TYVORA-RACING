// apps/web/src/stores/useSettingsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { audioEngine } from '../audio/AudioEngine.js';

export interface UserSettingsState {
  theme: 'dark' | 'light' | 'system';
  typingSound: boolean;
  engineSound: boolean;
  raceEffects: boolean;
  screenShake: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  hasAcknowledgedTouch: boolean;

  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  setTypingSound: (val: boolean) => void;
  setEngineSound: (val: boolean) => void;
  setRaceEffects: (val: boolean) => void;
  setScreenShake: (val: boolean) => void;
  setReducedMotion: (val: boolean) => void;
  setLargeText: (val: boolean) => void;
  setHasAcknowledgedTouch: (val: boolean) => void;
}

export const useSettingsStore = create<UserSettingsState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      typingSound: true,
      engineSound: true,
      raceEffects: true,
      screenShake: true,
      reducedMotion: false,
      largeText: false,
      hasAcknowledgedTouch: false,

      setTheme: (theme) => {
        set({ theme });
        const isDark =
          theme === 'dark' ||
          (theme === 'system' && typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches);
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        }
      },

      setTypingSound: (typingSound) => {
        set({ typingSound });
        audioEngine.updateSettings(get().engineSound, typingSound, get().raceEffects);
      },

      setEngineSound: (engineSound) => {
        set({ engineSound });
        audioEngine.updateSettings(engineSound, get().typingSound, get().raceEffects);
      },

      setRaceEffects: (raceEffects) => {
        set({ raceEffects });
        audioEngine.updateSettings(get().engineSound, get().typingSound, raceEffects);
      },

      setScreenShake: (screenShake) => set({ screenShake }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setLargeText: (largeText) => set({ largeText }),
      setHasAcknowledgedTouch: (hasAcknowledgedTouch) => set({ hasAcknowledgedTouch }),
    }),
    {
      name: 'typerace_settings',
    }
  )
);
