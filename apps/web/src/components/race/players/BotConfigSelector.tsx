// apps/web/src/components/race/players/BotConfigSelector.tsx
import React from 'react';
import { Users, Zap } from 'lucide-react';
import { Difficulty } from '@typerace/sim';
import { audioEngine } from '../../../audio/AudioEngine.js';

export interface BotConfigSelectorProps {
  difficulty: Difficulty;
  botCount: number;
  onSelectDifficulty: (difficulty: Difficulty) => void;
  onSelectBotCount: (count: number) => void;
}

export const BotConfigSelector: React.FC<BotConfigSelectorProps> = ({
  difficulty,
  botCount,
  onSelectDifficulty,
  onSelectBotCount,
}) => {
  const difficulties: { id: Difficulty; label: string; wpm: string; color: string }[] = [
    { id: 'easy', label: 'EASY', wpm: '~30 WPM', color: 'hover:border-emerald-500' },
    { id: 'normal', label: 'MID', wpm: '~48 WPM', color: 'hover:border-amber-500' },
    { id: 'hard', label: 'HARD', wpm: '~68 WPM', color: 'hover:border-accent' },
  ];

  return (
    <div className="space-y-4 font-sans">
      {/* 1. DIFFICULTY SELECTION */}
      <div className="space-y-2">
        <label className="text-xs font-mono font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-accent" />
          <span>DIFFICULTY MODE</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {difficulties.map((m) => {
            const isSelected = difficulty === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  audioEngine.playUiClick();
                  onSelectDifficulty(m.id);
                }}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-accent/20 border-accent text-white shadow-[0_0_15px_rgba(255,75,38,0.3)]'
                    : `bg-surface/60 border-white/10 text-white/70 ${m.color}`
                }`}
              >
                <div className="text-sm font-black uppercase tracking-wider">{m.label}</div>
                <div className="text-[10px] font-mono text-white/50 mt-0.5">{m.wpm}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. BOT COUNT SELECTION */}
      <div className="space-y-2">
        <label className="text-xs font-mono font-bold text-white/70 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-accent" />
            <span>AI COMPETITORS</span>
          </span>
          <span className="text-accent font-mono">{botCount} BOTS</span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((num) => {
            const isSelected = botCount === num;
            return (
              <button
                key={num}
                type="button"
                onClick={() => {
                  audioEngine.playUiClick();
                  onSelectBotCount(num);
                }}
                className={`py-2.5 rounded-xl border text-center font-mono font-bold text-sm transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-accent border-accent text-white shadow-[0_0_15px_rgba(255,75,38,0.35)]'
                    : 'bg-surface/60 border-white/10 text-white/70 hover:border-white/30'
                }`}
              >
                {num} {num === 1 ? 'BOT' : 'BOTS'}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
