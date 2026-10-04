// apps/web/src/components/common/Modal.tsx
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { audioEngine } from '../../audio/AudioEngine.js';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          audioEngine.playUiClick();
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className={clsx(
          'relative w-full bg-surface border border-border-strong rounded-m p-6 md:p-8 shadow-[0_24px_64px_rgba(0,0,0,0.6)] animate-scaleUp',
          maxWidthStyles[maxWidth]
        )}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
          {title ? (
            <h2 className="text-xl font-display uppercase tracking-wider font-bold text-text">
              {title}
            </h2>
          ) : (
            <div />
          )}
          <button
            onClick={() => {
              audioEngine.playUiClick();
              onClose();
            }}
            className="p-1 text-text-muted hover:text-text hover:bg-surface-2 rounded transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
};
