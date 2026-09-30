import type { StateCreator } from 'zustand';
import { liveChartPreviewEqual, type LiveChartPreview } from '../../../../components/chart/domain';
import { stylePreviewDebug } from '../../../../../shared/diagnostics/stylePreviewDebug';

import type { DesignerState } from '../designerState';
import type { LivePreviewSlice } from '../state/livePreviewSlice.types';

export const createLivePreviewSlice: StateCreator<DesignerState, [], [], LivePreviewSlice> = (set) => ({
  liveStylePreview: null,
  liveChartPreview: null,

  setLiveStylePreview: (preview) =>
    set((state) => {
      if (!preview) {
        if (state.liveStylePreview === null) return state;
        stylePreviewDebug.countAction('clearLiveStylePreview (via null)');
        return { liveStylePreview: null };
      }
      const prev = state.liveStylePreview;
      if (
        prev?.componentId === preview.componentId &&
        prev.style.color === preview.style.color &&
        prev.style.backgroundColor === preview.style.backgroundColor
      ) {
        return state;
      }
      stylePreviewDebug.time('setLiveStylePreview');
      stylePreviewDebug.countAction('setLiveStylePreview', preview.style);
      const next = { liveStylePreview: preview };
      stylePreviewDebug.timeEnd('setLiveStylePreview');
      return next;
    }),

  clearLiveStylePreview: () =>
    set((state) => {
      if (state.liveStylePreview === null) return state;
      stylePreviewDebug.countAction('clearLiveStylePreview');
      return { liveStylePreview: null };
    }),

  setLiveChartPreview: (preview) =>
    set((state) => {
      if (!preview) {
        if (state.liveChartPreview === null) return state;
        stylePreviewDebug.countAction('clearLiveChartPreview (via null)');
        return { liveChartPreview: null };
      }

      const prev = state.liveChartPreview;
      const merged: LiveChartPreview =
        prev?.componentId === preview.componentId
          ? {
              componentId: preview.componentId,
              chartProps: { ...prev.chartProps, ...preview.chartProps },
            }
          : preview;

      if (liveChartPreviewEqual(prev, merged)) return state;

      stylePreviewDebug.countAction('setLiveChartPreview', merged.chartProps);
      return { liveChartPreview: merged };
    }),

  clearLiveChartPreview: () =>
    set((state) => {
      if (state.liveChartPreview === null) return state;
      stylePreviewDebug.countAction('clearLiveChartPreview');
      return { liveChartPreview: null };
    }),
});
