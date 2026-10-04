// apps/web/src/components/screens/OnlineModal.tsx
import React from 'react';
import { Radio, Users, Trophy } from 'lucide-react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';

export interface OnlineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnlineModal: React.FC<OnlineModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="text-center py-2 select-none">
        <div className="w-12 h-12 mx-auto rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent mb-3">
          <Radio className="w-6 h-6 animate-pulse" />
        </div>

        <h2 className="text-2xl font-display font-bold uppercase tracking-wider text-text mb-1">
          ONLINE RACING
        </h2>
        <div className="text-xs font-display uppercase tracking-widest text-accent font-bold mb-3">
          COMING SOON 🔒
        </div>

        <p className="text-sm text-text-muted mb-5 max-w-xs mx-auto leading-relaxed">
          Compete against real players in live typing races across multi-stage circuits.
        </p>

        <div className="space-y-2 mb-6 text-left bg-surface-2/60 p-3 rounded-[4px] border border-border text-xs">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-accent shrink-0" />
            <span className="text-text font-semibold uppercase tracking-wider">
              Matchmaking Lobbies
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <Trophy className="w-4 h-4 text-accent shrink-0" />
            <span className="text-text font-semibold uppercase tracking-wider">
              Seasonal Global Ladder
            </span>
          </div>
        </div>

        <Button variant="primary" size="md" onClick={onClose} fullWidth>
          Acknowledge
        </Button>
      </div>
    </Modal>
  );
};
