import React from 'react';
import { useFrame } from '@react-three/fiber';
import { gameEngine } from '../../../engine/GameEngine.js';

/**
 * EngineDriver ticks the GameEngine at priority -1000,
 * ensuring the fixed simulation step and interpolation run
 * before any R3F components update their transforms.
 */
export const EngineDriver: React.FC = () => {
  useFrame(() => {
    gameEngine.frame(performance.now());
  }, -1000);

  return null;
};
