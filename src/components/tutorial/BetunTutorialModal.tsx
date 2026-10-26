import React from 'react';
import {
  BetunInGameTutorial,
  hasSeenTutorial,
  markTutorialAsSeen,
  TUTORIAL_STORAGE_KEY,
} from './BetunInGameTutorial';

export { hasSeenTutorial, markTutorialAsSeen, TUTORIAL_STORAGE_KEY };

interface BetunTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Componente de compatibilidad que redirige al nuevo Tutorial In-Game con Betún
 */
export const BetunTutorialModal: React.FC<BetunTutorialModalProps> = (props) => {
  return <BetunInGameTutorial {...props} />;
};
