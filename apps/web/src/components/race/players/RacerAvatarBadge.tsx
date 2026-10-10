// apps/web/src/components/race/players/RacerAvatarBadge.tsx
import React from 'react';
import { Trophy, Bot } from 'lucide-react';
import { Avatar } from '../../common/Avatar.js';

export interface RacerAvatarBadgeProps {
  name: string;
  isPlayer?: boolean;
  position?: number;
  wpm?: number;
  avatarSeed?: string;
}

export const RacerAvatarBadge: React.FC<RacerAvatarBadgeProps> = ({
  name,
  isPlayer = false,
  position,
  wpm,
  avatarSeed,
}) => {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono ${
      isPlayer
        ? 'bg-accent/15 border-accent text-white shadow-[0_0_12px_rgba(255,75,38,0.25)]'
        : 'bg-surface/70 border-white/10 text-white/80'
    }`}>
      {avatarSeed ? (
        <Avatar seed={avatarSeed} size="sm" />
      ) : isPlayer ? (
        <div className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center font-bold text-[10px]">
          U
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full bg-white/10 text-white/60 flex items-center justify-center">
          <Bot className="w-3 h-3" />
        </div>
      )}

      <span className="font-bold truncate max-w-[100px]">{name}</span>

      {position && (
        <span className="flex items-center gap-0.5 text-[10px] text-amber-300 font-bold">
          {position === 1 && <Trophy className="w-2.5 h-2.5" />}
          P{position}
        </span>
      )}

      {wpm !== undefined && (
        <span className="text-[10px] text-white/50">{wpm} WPM</span>
      )}
    </div>
  );
};
