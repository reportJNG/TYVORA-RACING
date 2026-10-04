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
      title={tab === 'signin' ? 'Sign In to TypeRace' : 'Create TypeRace Account'}
      maxWidth="md"
    >
      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => {
            setTab('signin');
            setError(null);
          }}
          className={`flex-1 py-3 text-xs font-display font-bold tracking-wider uppercase transition-colors border-b-2 ${
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
          className={`flex-1 py-3 text-xs font-display font-bold tracking-wider uppercase transition-colors border-b-2 ${
            tab === 'signup'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          Create Account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 font-sans">
        {error && (
          <div className="p-2.5 bg-danger/10 border border-danger/40 rounded-[4px] text-danger text-xs font-semibold">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs uppercase tracking-wider text-text-muted font-display font-bold mb-1">
            Racer Call-sign / Username
          </label>
          <input
            type="text"
            required
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ApexRacer"
            className="w-full bg-surface-2 border border-border rounded px-4 py-2.5 text-text placeholder-text-muted/60 focus:outline-none focus:border-accent transition-colors text-sm"
          />
        </div>

        {tab === 'signup' && (
          <div>
            <label className="block text-xs uppercase tracking-wider text-text-muted font-display font-bold mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="racer@example.com"
              className="w-full bg-surface-2 border border-border rounded px-4 py-2.5 text-text placeholder-text-muted/60 focus:outline-none focus:border-accent transition-colors text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-xs uppercase tracking-wider text-text-muted font-display font-bold mb-1">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-surface-2 border border-border rounded px-4 py-2.5 text-text placeholder-text-muted/60 focus:outline-none focus:border-accent transition-colors text-sm"
          />
        </div>

        {tab === 'signup' && (
          <div>
            <label className="block text-xs uppercase tracking-wider text-text-muted font-display font-bold mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface-2 border border-border rounded px-4 py-2.5 text-text placeholder-text-muted/60 focus:outline-none focus:border-accent transition-colors text-sm"
            />
          </div>
        )}

        <div className="pt-2">
          <Button type="submit" variant="primary" size="lg" className="w-full">
            {tab === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>
        </div>

        <p className="text-center text-xs text-text-muted pt-2">
          By signing in, your career stats and achievements sync across your sessions.
        </p>
      </form>
    </Modal>
  );
};
