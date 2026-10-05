// apps/web/src/components/screens/AuthModal.tsx
import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { useAuthStore } from '../../stores/useAuthStore.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'signin',
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>(initialTab);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { login, signup } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError('Username cannot be empty');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    if (tab === 'signup') {
      const cleanEmail = email.trim();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      const res = await signup(cleanUsername, cleanEmail, password);
      if (!res.success) {
        setError(res.error || 'Failed to create account');
        return;
      }
    } else {
      const res = await login(cleanUsername, password);
      if (!res.success) {
        setError(res.error || 'Invalid credentials');
        return;
      }
    }

    // Reset and close
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tab === 'signin' ? 'Sign In to Tyvora' : 'Create Driver Profile'}
      maxWidth="md"
    >
      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => {
            setTab('signin');
            setError(null);
          }}
          className={`flex-1 py-3 text-xs font-semibold tracking-wide transition-colors border-b-2 ${
            tab === 'signin'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => {
            setTab('signup');
            setError(null);
          }}
          className={`flex-1 py-3 text-xs font-semibold tracking-wide transition-colors border-b-2 ${
            tab === 'signup'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          Create Profile
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 font-sans">
        {error && (
          <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-xs font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">
            Driver Handle / Username
          </label>
          <input
            type="text"
            required
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ApexRacer"
            className="w-full bg-surface-2/80 border border-border rounded-xl px-4 py-2.5 text-text placeholder-text-muted/50 focus:outline-none focus:border-accent transition-colors text-sm"
          />
        </div>

        {tab === 'signup' && (
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="racer@tyvora.racing"
              className="w-full bg-surface-2/80 border border-border rounded-xl px-4 py-2.5 text-text placeholder-text-muted/50 focus:outline-none focus:border-accent transition-colors text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-surface-2/80 border border-border rounded-xl px-4 py-2.5 text-text placeholder-text-muted/50 focus:outline-none focus:border-accent transition-colors text-sm"
          />
        </div>

        {tab === 'signup' && (
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface-2/80 border border-border rounded-xl px-4 py-2.5 text-text placeholder-text-muted/50 focus:outline-none focus:border-accent transition-colors text-sm"
            />
          </div>
        )}

        <div className="pt-2">
          <Button type="submit" variant="primary" size="lg" fullWidth>
            {tab === 'signin' ? 'Sign In' : 'Create Profile'}
          </Button>
        </div>

        <p className="text-center text-xs text-text-faint pt-2">
          Your credentials and career progression are securely stored locally via SQLite WASM.
        </p>
      </form>
    </Modal>
  );
};
