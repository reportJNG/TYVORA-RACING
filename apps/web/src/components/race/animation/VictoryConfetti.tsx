// apps/web/src/components/race/animation/VictoryConfetti.tsx
import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export interface VictoryConfettiProps {
  active: boolean;
}

export const VictoryConfetti: React.FC<VictoryConfettiProps> = ({ active }) => {
  useEffect(() => {
    if (!active) return;

    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#FF4B26', '#FF8F3D', '#FFD700'],
    });

    fire(0.2, {
      spread: 60,
      colors: ['#00E5FF', '#76FF03', '#FFFFFF'],
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, [active]);

  return null;
};
