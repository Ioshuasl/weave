import { hasSeenDesignerHint, markDesignerHintSeen } from './designerHints';
import { loadDesignerPanelState, saveDesignerPanelState } from './designerPanelPersist';
import { startDesignerTour } from './designerTour';
import { pushRecentFieldToken, readRecentFieldTokens } from './fieldRecentStorage';

export const browserPanelStorage = {
  load: loadDesignerPanelState,
  save: saveDesignerPanelState,
};

export const browserRecentFieldStorage = {
  read: readRecentFieldTokens,
  push: pushRecentFieldToken,
};

export const browserHintStorage = {
  hasSeen: hasSeenDesignerHint,
  markSeen: markDesignerHintSeen,
};

export const driverTourLauncher = {
  start: startDesignerTour,
};
