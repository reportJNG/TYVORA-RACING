// apps/web/src/components/race/cars/BuyCarButton.tsx
import React, { useState } from 'react';
import { Lock, Unlock, Check, Zap, Loader2 } from 'lucide-react';
import { CarVisualConfig } from '../../../data/cars.js';
import { useAuthStore } from '../../../stores/useAuthStore.js';
import { audioEngine } from '../../../audio/AudioEngine.js';

export interface BuyCarButtonProps {
  car: CarVisualConfig;
  isUnlocked: boolean;
  isEquipped: boolean;
  userPoints: number;
  onEquip: (carId: string) => void;
  onBought?: (carId: string) => void;
}

export const BuyCarButton: React.FC<BuyCarButtonProps> = ({
  car,
  isUnlocked,
  isEquipped,
  userPoints,
  onEquip,
  onBought,
}) => {
  const { buyCar } = useAuthStore();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pointsCost = car.unlockPoints || 0;
  const canAfford = userPoints >= pointsCost;
  const pointsRemaining = Math.max(0, pointsCost - userPoints);

  const handleBuy = async () => {
    if (!canAfford || isPurchasing) {
      audioEngine.playMistakeSound();
      return;
    }

    try {
      setIsPurchasing(true);
      setErrorMsg(null);
      audioEngine.playUiClick();

      const res = await buyCar(car.id);
      if (res.success) {
        audioEngine.playStreakMilestone(10);
        onEquip(car.id);
        if (onBought) onBought(car.id);
      } else {
        audioEngine.playMistakeSound();
        setErrorMsg(res.error || 'Purchase failed');
      }
    } catch (e: any) {
      audioEngine.playMistakeSound();
      setErrorMsg(e?.message || 'Error executing purchase');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleEquip = () => {
    audioEngine.playUiClick();
    onEquip(car.id);
  };

  // State 1: Car is already unlocked
  if (isUnlocked) {
    if (isEquipped) {
      return (
        <div className="w-full py-4 px-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-extrabold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <Check className="w-5 h-5 stroke-[3]" />
          <span>EQUIPPED & READY TO RACE</span>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={handleEquip}
        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-accent via-[#ff5b28] to-amber-500 text-white font-extrabold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 shadow-[0_0_35px_rgba(255,75,38,0.45)] hover:shadow-[0_0_55px_rgba(255,75,38,0.7)] hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
      >
        <Unlock className="w-5 h-5" />
        <span>EQUIP {car.name.toUpperCase()}</span>
      </button>
    );
  }

  // State 2: Car is locked but user has enough points -> BUY BUTTON
  if (canAfford) {
    return (
      <div className="w-full space-y-1.5">
        <button
          type="button"
          onClick={handleBuy}
          disabled={isPurchasing}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-black text-sm sm:text-base tracking-wider flex items-center justify-center gap-2.5 shadow-[0_0_35px_rgba(16,185,129,0.45)] hover:shadow-[0_0_55px_rgba(16,185,129,0.7)] hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer border-t border-white/30"
        >
          {isPurchasing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Zap className="w-5 h-5 fill-white text-white" />
          )}
          <span>BUY VEHICLE FOR {pointsCost} PTS</span>
        </button>
        {errorMsg && (
          <p className="text-[11px] font-mono text-danger text-center">{errorMsg}</p>
        )}
      </div>
    );
  }

  // State 3: Car is locked and user cannot afford yet
  return (
    <div className="w-full py-4 px-6 rounded-2xl bg-surface-2/60 border border-white/10 text-white/50 font-bold text-sm tracking-wide flex items-center justify-between shadow-inner">
      <div className="flex items-center gap-2 text-danger">
        <Lock className="w-4 h-4 text-danger" />
        <span>LOCKED ({pointsCost} PTS)</span>
      </div>
      <div className="text-xs font-mono text-white/40">
        NEED {pointsRemaining} MORE PTS
      </div>
    </div>
  );
};
