// apps/web/src/components/common/Button.tsx
import React from 'react';
import { clsx } from 'clsx';
import { Lock } from 'lucide-react';
import { audioEngine } from '../../audio/AudioEngine.js';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'locked' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  onClick,
  disabled,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    audioEngine.playUiClick();
    if (onClick) onClick(e);
  };

  const baseStyles =
    'relative inline-flex items-center justify-center font-sans font-semibold text-sm transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring select-none active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none rounded-xl cursor-pointer';

  const sizeStyles = {
    sm: 'h-8 px-3.5 text-xs',
    md: 'h-10 px-5 text-sm',
    lg: 'h-12 px-7 text-base',
  };

  const variantStyles = {
    primary:
      'bg-accent hover:bg-accent-hover text-white shadow-md shadow-accent/25 hover:shadow-accent/40 hover:scale-[1.01]',
    secondary:
      'bg-surface-2/90 hover:bg-surface-2 border border-border text-text hover:border-accent/40',
    outline:
      'bg-transparent hover:bg-surface-2 border border-border text-text hover:border-border-strong',
    ghost:
      'bg-transparent hover:bg-surface-2 text-text-muted hover:text-text',
    locked:
      'bg-surface-2/40 border border-border text-text-muted/70 hover:text-text-muted cursor-not-allowed',
    destructive:
      'bg-danger/10 border border-danger/40 text-danger hover:bg-danger hover:text-white',
  };

  return (
    <button
      className={clsx(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && 'w-full',
        className
      )}
      onClick={handleClick}
      disabled={disabled || variant === 'locked'}
      {...props}
    >
      {variant === 'locked' && <Lock className="w-3.5 h-3.5 mr-1.5 opacity-60" />}
      {children}
    </button>
  );
};
