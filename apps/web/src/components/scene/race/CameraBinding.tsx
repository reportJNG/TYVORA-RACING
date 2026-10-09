import React from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { gameEngine } from '../../../engine/GameEngine.js';

/**
 * CameraBinding sets camera position, orientation, and FOV directly
 * from the engine's interpolated CameraView on every frame.
 */
export const CameraBinding: React.FC = () => {
  const { camera } = useThree();

  useFrame(() => {
    const c = gameEngine.view.camera;
    camera.position.set(c.posX, c.posY, c.posZ);
    camera.lookAt(c.targetX, c.targetY, c.targetZ);

    const persp = camera as THREE.PerspectiveCamera;
    if (persp.isPerspectiveCamera && Math.abs(persp.fov - c.fov) > 0.01) {
      persp.fov = c.fov;
      persp.updateProjectionMatrix();
    }
  });

  return null;
};
