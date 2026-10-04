import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';

export type LegalTab = 'terms' | 'privacy' | 'about';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'about',
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        activeTab === 'terms'
          ? 'Terms of Service'
          : activeTab === 'privacy'
          ? 'Privacy Policy'
          : 'About TypeRace'
      }
      maxWidth="lg"
    >
      <div className="flex border-b border-border mb-4">
        <button
          onClick={() => setActiveTab('about')}
          className={`px-3 py-2 text-xs font-display font-bold tracking-wider uppercase transition-colors border-b-2 ${
            activeTab === 'about'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          About
        </button>
        <button
          onClick={() => setActiveTab('terms')}
          className={`px-3 py-2 text-xs font-display font-bold tracking-wider uppercase transition-colors border-b-2 ${
            activeTab === 'terms'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          Terms
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-3 py-2 text-xs font-display font-bold tracking-wider uppercase transition-colors border-b-2 ${
            activeTab === 'privacy'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          Privacy
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto pr-2 text-xs text-text-muted space-y-3 font-sans leading-relaxed">
        {activeTab === 'about' && (
          <div>
            <h3 className="text-text font-bold text-sm mb-1 font-display uppercase tracking-wider">
              TypeRace Engine // Release 1.0
            </h3>
            <p className="mb-2">
              TypeRace is a 3D browser racing game designed around clean velocity:
              <strong className="text-text"> Type fast, maintain focus, accelerate directly.</strong>
            </p>
            <p className="mb-2">
              There is no manual steering or braking. Keystrokes directly throttle the vehicle physics in real-time WebGL.
            </p>

            <h4 className="text-text font-bold text-xs mt-3 mb-1 font-display uppercase tracking-wider">
              Engine Specifications
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-text-muted">
              <li>Independent position evaluation with zero cascading penalties.</li>
              <li>Instant Backspace support for momentum recovery.</li>
              <li>Procedural Web Audio engine sound synthesizer with dynamic RPM pitch tracking.</li>
              <li>High-fidelity Three.js WebGL procedural asphalt highway & nighttime city skyline.</li>
              <li>Deterministic simulation verification for all racing telemetry.</li>
            </ul>
          </div>
        )}

        {activeTab === 'terms' && (
          <div>
            <h3 className="text-text font-bold text-sm mb-1 font-display uppercase tracking-wider">
              Terms of Service
            </h3>
            <p className="mb-2">
              By accessing and playing TypeRace, you agree to uphold fair play across all race sessions.
            </p>

            <h4 className="text-text font-bold text-xs mt-3 mb-1 font-display uppercase tracking-wider">
              1. Fair Competition & Verification
            </h4>
            <p className="mb-2">
              Automated macros and script injectors are strictly prohibited. Telemetry is verified against deterministic simulation timings.
            </p>

            <h4 className="text-text font-bold text-xs mt-3 mb-1 font-display uppercase tracking-wider">
              2. Racer Handles
            </h4>
            <p>
              Players are responsible for safeguarding their driver call-sign and telemetry logs.
            </p>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div>
            <h3 className="text-text font-bold text-sm mb-1 font-display uppercase tracking-wider">
              Privacy Policy
            </h3>
            <p className="mb-2">
              TypeRace adheres to strict data minimization.
            </p>

            <h4 className="text-text font-bold text-xs mt-3 mb-1 font-display uppercase tracking-wider">
              1. Local-First Storage
            </h4>
            <p className="mb-2">
              Driver settings, custom paint choices, and career logs are stored directly in your browser. No tracking cookies or advertising scripts are ever used.
            </p>

            <h4 className="text-text font-bold text-xs mt-3 mb-1 font-display uppercase tracking-wider">
              2. Telemetry
            </h4>
            <p>
              Leaderboard records include your race time, average WPM, accuracy, and vehicle ID to verify high scores.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border flex justify-end">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};
