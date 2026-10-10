// apps/web/src/components/screens/RaceScreen.tsx
import React from 'react';
import { RaceModeSelectScreen } from './RaceModeSelectScreen.js';

export interface RaceScreenProps {
  onHome?: () => void;
  onLeaderboard?: () => void;
  onOpenOnlineModal?: (autoSearch?: boolean) => void;
}

export const RaceScreen: React.FC<RaceScreenProps> = () => {
  return <RaceModeSelectScreen />;
};

export default RaceScreen;
