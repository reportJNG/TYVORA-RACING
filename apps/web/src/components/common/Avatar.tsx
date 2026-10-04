// apps/web/src/components/common/Avatar.tsx
import React from 'react';

export interface AvatarProps {
  seed: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const PALETTE = [
  '#2B3A55',
  '#3B2F4A',
  '#2F4A3E',
  '#4A3B2F',
  '#2F3F4A',
  '#4A2F3A',
  '#3A4A2F',
  '#3A3A3A',
];

function fnv1a(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export const Avatar: React.FC<AvatarProps> = ({ seed, size = 'md', className = '' }) => {
  const hash = fnv1a(seed.toLowerCase());
  const bgColor = PALETTE[hash % PALETTE.length];
  const initial = seed.trim().charAt(0).toUpperCase() || 'R';
  const angle = (hash % 4) * 45;

  const sizePixels = {
    sm: 28,
    md: 40,
    lg: 64,
    xl: 96,
  }[size];

  const fontSize = {
    sm: 14,
    md: 20,
    lg: 32,
    xl: 48,
  }[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 border border-white/10 ${className}`}
      style={{
        width: sizePixels,
        height: sizePixels,
        backgroundColor: bgColor,
      }}
    >
      {/* Racing stripe */}
      <div
        className="absolute w-[200%] h-1.5 bg-accent/30 pointer-events-none"
        style={{
          transform: `rotate(${angle}deg)`,
        }}
      />
      {/* Initial */}
      <span
        className="relative z-10 font-display font-bold text-text uppercase leading-none"
        style={{ fontSize }}
      >
        {initial}
      </span>
    </div>
  );
};
