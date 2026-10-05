import React from 'react';
import { useFrame } from '@react-three/fiber';
import { gameEngine } from '../../../engine/GameEngine.js';

/**
 * RenderDriver runs at priority +1000 (after all renders),
 * extracting draw calls and triangle counts from WebGLRenderer info.
 */
export const RenderDriver: React.FC = () => {
  useFrame(({ gl }) => {
    gameEngine.perf.recordRender(gl.info.render.calls, gl.info.render.triangles);
  }, 1000);

  return null;
};
