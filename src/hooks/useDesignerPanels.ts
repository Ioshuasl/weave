import { useCallback, useEffect, useRef, useState } from 'react';
import { COMPACT_LAYOUT_MEDIA_QUERY } from '../components/designer/designerLayout';
import {
  loadDesignerPanelState,
  saveDesignerPanelState,
} from '../utils/designerPanelPersist';
import { useMediaQuery } from './useMediaQuery';

export type DesignerPanelLayoutPreset = 'full' | 'compact' | 'canvas-first';

export interface UseDesignerPanelsOptions {
  reportId?: string;
  /** Estado inicial dos painéis no layout compacto (<1280px). Padrão: `canvas-first` */
  defaultPanelLayout?: DesignerPanelLayoutPreset;
  /** Salvar abertura dos painéis em `localStorage` por `reportId`. Padrão: `true` se houver `reportId` */
  persistPanelState?: boolean;
}

function getDefaultPanelState(preset: DesignerPanelLayoutPreset): {
  leftOpen: boolean;
  rightOpen: boolean;
} {
  switch (preset) {
    case 'full':
      return { leftOpen: false, rightOpen: true };
    case 'compact':
    case 'canvas-first':
    default:
      return { leftOpen: false, rightOpen: false };
  }
}

export function useDesignerPanels(options: UseDesignerPanelsOptions = {}) {
  const {
    reportId,
    defaultPanelLayout = 'canvas-first',
    persistPanelState = Boolean(reportId),
  } = options;

  const isCompact = useMediaQuery(COMPACT_LAYOUT_MEDIA_QUERY);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [layoutRevision, setLayoutRevision] = useState(0);
  const hydratedRef = useRef(false);
  const lastReportIdRef = useRef(reportId);

  const bumpLayout = useCallback(() => {
    setLayoutRevision((n) => n + 1);
  }, []);

  useEffect(() => {
    if (reportId !== lastReportIdRef.current) {
      lastReportIdRef.current = reportId;
      hydratedRef.current = false;
    }
  }, [reportId]);

  useEffect(() => {
    if (!isCompact) {
      hydratedRef.current = false;
      bumpLayout();
      return;
    }

    if (hydratedRef.current) return;

    const persisted =
      persistPanelState && reportId ? loadDesignerPanelState(reportId) : null;
    const defaults = getDefaultPanelState(defaultPanelLayout);

    setLeftOpen(persisted?.leftOpen ?? defaults.leftOpen);
    setRightOpen(persisted?.rightOpen ?? defaults.rightOpen);
    hydratedRef.current = true;
    bumpLayout();
  }, [
    isCompact,
    reportId,
    persistPanelState,
    defaultPanelLayout,
    bumpLayout,
  ]);

  useEffect(() => {
    if (!isCompact || !hydratedRef.current || !persistPanelState || !reportId) return;
    saveDesignerPanelState(reportId, { leftOpen, rightOpen });
  }, [leftOpen, rightOpen, isCompact, persistPanelState, reportId]);

  const toggleLeft = useCallback(() => {
    setLeftOpen((open) => !open);
    bumpLayout();
  }, [bumpLayout]);

  const toggleRight = useCallback(() => {
    setRightOpen((open) => !open);
    bumpLayout();
  }, [bumpLayout]);

  const openLeft = useCallback(() => {
    setLeftOpen(true);
    bumpLayout();
  }, [bumpLayout]);

  const closeLeft = useCallback(() => {
    setLeftOpen(false);
    bumpLayout();
  }, [bumpLayout]);

  const openRight = useCallback(() => {
    setRightOpen(true);
    bumpLayout();
  }, [bumpLayout]);

  const closeRight = useCallback(() => {
    setRightOpen(false);
    bumpLayout();
  }, [bumpLayout]);

  return {
    isCompact,
    leftOpen,
    rightOpen,
    layoutRevision,
    toggleLeft,
    toggleRight,
    openLeft,
    closeLeft,
    openRight,
    closeRight,
  };
}
