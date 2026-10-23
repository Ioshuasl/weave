import type { DesignerState } from '../designerState';
import type { FlashSlice } from '../state/flashSlice.types';
import type { StateCreator } from 'zustand';

const FLASH_DURATION_MS = 1700;
const NO_FLASH = { components: [], bands: [], nonce: 0 } as FlashSlice['flash'];

export const createFlashSlice: StateCreator<DesignerState, [], [], FlashSlice> = (set, get) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    flash: NO_FLASH,

    flashChanges: (changes, durationMs = FLASH_DURATION_MS) => {
      if (timer) clearTimeout(timer);
      const nonce = get().flash.nonce + 1;
      set({ flash: { ...changes, nonce } });
      timer = setTimeout(() => set((state) => (state.flash.nonce === nonce ? { flash: { ...NO_FLASH, nonce } } : state)), durationMs);
    },
  };
};
