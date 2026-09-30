import { loadDesignerPanelState, saveDesignerPanelState } from './designerPanelPersist';
import { pushRecentFieldToken, readRecentFieldTokens } from './fieldRecentStorage';
import { startDesignerTour } from './designerTour';

export const browserPanelStorage = {
  load: loadDesignerPanelState,
  save: saveDesignerPanelState,
};

export const browserRecentFieldStorage = {
  read: readRecentFieldTokens,
  push: pushRecentFieldToken,
};

export const driverTourLauncher = {
  start: startDesignerTour,
};
