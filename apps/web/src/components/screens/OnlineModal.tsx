// apps/web/src/components/screens/OnlineModal.tsx
import React, { useState, useEffect } from 'react';
import { Radio, Users, Trophy, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { audioEngine } from '../../audio/AudioEngine.js';

export interface OnlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSearching?: boolean;
}

export const OnlineModal: React.FC<OnlineModalProps> = ({
  isOpen,
  onClose,
  initialSearching = false,
}) => {
  const [isSearching, setIsSearching] = useState(initialSearching);
  const [searchTimer, setSearchTimer] = useState(0);

  useEffect(() => {
    if (isOpen && initialSearching) {
      setIsSearching(true);
    }
  }, [isOpen, initialSearching]);

  useEffect(() => {
    let interval: any;
    if (isSearching) {
      interval = setInterval(() => {
        setSearchTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setSearchTimer(0);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  const handleStartSearch = () => {
    audioEngine.playUiClick();
    setIsSearching(true);
  };

  const handleCancelSearch = () => {
    audioEngine.playUiClick();
    setIsSearching(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="text-center py-2 select-none font-sans">
        {/* Top animated badge */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-accent-subtle border border-accent/30 flex items-center justify-center text-accent mb-4 shadow-sm shadow-accent/20">
          <Radio className="w-7 h-7 animate-pulse" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-text mb-1">
          Online Matchmaking
        </h2>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-subtle border border-accent/30 text-accent text-xs font-semibold mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
          <span>GLOBAL MULTIPLAYER BETA</span>
        </div>

        <p className="text-xs text-text-muted mb-5 max-w-xs mx-auto leading-relaxed">
          Race head-to-head in real time against other drivers worldwide. Keystroke telemetry synced at 60 Hz.
        </p>

        {isSearching ? (
          <div className="p-4 rounded-xl bg-surface-2/80 border border-accent/40 mb-5 space-y-3">
            <div className="flex items-center justify-center gap-2 text-accent font-semibold text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Searching for opponents ({searchTimer}s)...</span>
            </div>
            <p className="text-[11px] text-text-muted">
              Scanning regional lobbies for racers matching your WPM tier.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelSearch}
              fullWidth
            >
              Cancel Matchmaking
            </Button>
          </div>
        ) : (
          <div className="space-y-2 mb-6 text-left bg-surface-2/60 p-3.5 rounded-xl border border-border text-xs">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-surface-2 flex items-center justify-center text-accent">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-text font-semibold block">Live 1v1 & 4-Player Lobbies</span>
                <span className="text-[10px] text-text-muted">Low-latency peer relay matchmaking</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-border/60">
              <div className="w-7 h-7 rounded-lg bg-surface-2 flex items-center justify-center text-accent">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <span className="text-text font-semibold block">Ranked Season Points</span>
                <span className="text-[10px] text-text-muted">Earn points towards hypercar unlocks</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {!isSearching && (
            <Button
              variant="primary"
              size="md"
              onClick={handleStartSearch}
              fullWidth
            >
              Find Online Match
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            fullWidth
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
