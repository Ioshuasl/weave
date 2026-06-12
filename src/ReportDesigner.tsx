/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Componente embutível do designer de relatórios.
 * No produto final, o software hospedeiro monta este componente
 * (via npm) passando o template e os dados do contexto.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ReportDefinition } from './types/report';
import { useDesignerStore } from './store/designerStore';
import { Sidebar } from './components/designer/Sidebar';
import { SidebarRail } from './components/designer/SidebarRail';
import { DesignerActionToolbar } from './components/designer/DesignerActionToolbar';
import { DesignerNarrowViewportBanner } from './components/designer/DesignerNarrowViewportBanner';
import { DesignerLayoutProvider } from './components/designer/designerLayoutContext';
import { DesignerHostProvider } from './components/designer/designerHostContext';
import { PropertiesPanelDrawer } from './components/designer/PropertiesPanelDrawer';
import { PROPERTIES_PANEL_COLUMN_CLASS } from './components/designer/designerLayout';
import {
  useDesignerPanels,
  type DesignerPanelLayoutPreset,
} from './hooks/useDesignerPanels';
import { Canvas } from './components/designer/Canvas';
import { PropertiesPanel } from './components/designer/PropertiesPanel';
import { ReportPreview } from './components/renderer/ReportPreview';
import { useDesignerKeyboardShortcuts } from './hooks/useDesignerKeyboard';
import { HistoryTimelineModal } from './components/designer/HistoryTimelineModal';
import { TextComponentEditorModal } from './components/designer/TextComponentEditorModal';
import { cn } from './utils/cn';
import type { CanvasSelectionClasses } from './components/designer/canvasSelectionClasses';
import { useReportAutoSave } from './hooks/useReportAutoSave';
import { useReportHistoryPersist } from './hooks/useReportHistoryPersist';
import { useUnsavedChangesGuard } from './hooks/useUnsavedChangesGuard';
import { UnsavedChangesModal } from './components/designer/UnsavedChangesModal';
import type { HistoryEntry } from './utils/designerHistory';
import {
  getHistoryEntriesToPersist,
  type ReportHistoryPersistIntervalMs,
  REPORT_HISTORY_PERSIST_INTERVAL_MS,
} from './utils/reportHistoryPersist';
import {
  createReportSaveSnapshot,
  type ReportAutoSaveIntervalMs,
  REPORT_AUTO_SAVE_INTERVAL_MS,
} from './utils/reportSaveSnapshot';
import type { ReportDesignerPrintPayload } from './utils/reportPrintJob';
import type { DataSourceCatalog } from './utils/dataSourceUtils';
import type { PagePresetDefinition } from './utils/pagePresets';

export type { HistoryEntry } from './utils/designerHistory';

export type ReportDesignerMode = 'design' | 'preview';
export type { DesignerPanelLayoutPreset } from './hooks/useDesignerPanels';
export type { CanvasSelectionClasses } from './components/designer/canvasSelectionClasses';
export { DEFAULT_CANVAS_SELECTION_CLASSES } from './components/designer/canvasSelectionClasses';
export {
  REPORT_AUTO_SAVE_INTERVAL_MS,
  type ReportAutoSaveIntervalMs,
} from './utils/reportSaveSnapshot';
export {
  REPORT_HISTORY_PERSIST_INTERVAL_MS,
  type ReportHistoryPersistIntervalMs,
} from './utils/reportHistoryPersist';

export type {
  ReportDesignerPrintPayload,
  ReportPrintJob,
  ReportPrintSheet,
  ReportPrintSheetSize,
} from './utils/reportPrintJob';
export {
  buildPrintPageCss,
  buildReportDesignerPrintPayload,
  buildReportPrintJob,
  REPORT_PRINT_JOB_VERSION,
} from './utils/reportPrintJob';
export type { DataSourceCatalog, DataSourceDefinition, DataSourceKind } from './utils/dataSourceUtils';
export type { SystemVariables } from './utils/systemVariables';
export {
  buildSystemVariables,
  DESIGN_MODE_SYSTEM_VARIABLES,
  SYSTEM_VARIABLE_FIELD_OPTIONS,
} from './utils/systemVariables';
export type {
  PagePresetCatalog,
  PagePresetDefinition,
} from './utils/pagePresets';
export {
  BUILTIN_PAGE_PRESETS,
  buildPagePresetCatalog,
  formatPrintPageSize,
} from './utils/pagePresets';

/** Payload entregue ao host em `onSave` (Ctrl+S, botão Salvar ou auto-save) */
export interface ReportDesignerSavePayload {
  reportId?: string;
  report: ReportDefinition;
  data: Record<string, unknown[]>;
  /** Origem do save — útil para o host ignorar toast em saves automáticos */
  source?: 'manual' | 'auto';
}

/** Versões do layout enviadas ao host para recuperação futura */
export interface ReportDesignerHistoryPersistPayload {
  reportId?: string;
  /** Entradas novas do timeline desde o último envio */
  entries: HistoryEntry[];
  /** Timeline completo no designer (até 80 entradas em memória) */
  historyPast: HistoryEntry[];
  historyPointer: number;
  /** Layout e dados ativos no momento do envio */
  report: ReportDefinition;
  data: Record<string, unknown[]>;
  source?: 'auto' | 'manual';
}

export interface ReportDesignerProps {
  /** ID do relatório no sistema hospedeiro (metadado de integração) */
  reportId?: string;
  /** Nome exibido no contexto do host — futuro: título da janela / breadcrumb */
  reportName?: string;
  /**
   * design = editor (sidebar + canvas + propriedades)
   * preview = somente renderização do relatório (sem edição)
   */
  mode?: ReportDesignerMode;
  /** Template do relatório injetado pelo host */
  report?: ReportDefinition;
  /** Datasets de preview injetados pelo host */
  data?: Record<string, unknown[]>;
  /**
   * Metadados das fontes (`singleton` = configuração, `list` = listas repetíveis).
   * Sem catálogo, o engine infere pelo tamanho do array (≤1 linha = singleton).
   */
  dataSources?: DataSourceCatalog;
  /** Callback quando o usuário fecha o designer (volta ao sistema hospedeiro) */
  onClose?: () => void;
  /**
   * Persistência no sistema hospedeiro — acionado por Ctrl+S / Cmd+S ou botão Salvar.
   * Sem este callback, o atalho e o botão não são exibidos.
   */
  onSave?: (payload: ReportDesignerSavePayload) => void | Promise<void>;
  /**
   * Intervalo de auto-save em milissegundos. Requer `onSave`.
   * Use `REPORT_AUTO_SAVE_INTERVAL_MS` ou omita / `0` para desligar.
   */
  autoSaveIntervalMs?: ReportAutoSaveIntervalMs;
  /**
   * Persistência do histórico de alterações (versões do layout) no host.
   * Requer `onPersistHistory`. Intervalo em ms — use `REPORT_HISTORY_PERSIST_INTERVAL_MS`.
   */
  historyPersistIntervalMs?: ReportHistoryPersistIntervalMs;
  /**
   * Recebe snapshots do timeline (undo/redo) para o host armazenar como backup/versionamento.
   * Cada entrada em `entries` contém `report` + `data` recuperáveis.
   */
  onPersistHistory?: (
    payload: ReportDesignerHistoryPersistPayload
  ) => void | Promise<void>;
  /**
   * Impressão delegada ao host — acionado pelo botão Imprimir no preview.
   * Recebe o relatório paginado (`printJob.sheets`) pronto para PDF, API ou agente local.
   * Sem este callback, o preview usa impressão do navegador (`window.print`).
   */
  onPrint?: (payload: ReportDesignerPrintPayload) => void | Promise<void>;
  /**
   * Presets de folha adicionais do host (Fase 3.5).
   * Mesclados aos built-in; IDs iguais substituem o preset interno.
   */
  pagePresets?: PagePresetDefinition[];
  className?: string;
  /**
   * Classes Tailwind para hover/seleção no canvas (componentes e bandas).
   * Passe apenas as chaves que deseja sobrescrever — o restante usa o padrão índigo.
   */
  canvasSelectionClasses?: Partial<CanvasSelectionClasses>;
  /**
   * Estado inicial dos painéis no layout compacto (&lt;1280px).
   * `canvas-first` (padrão) = ambos fechados; `full` = propriedades abertas; `compact` = canvas-first + densidade reduzida.
   */
  defaultPanelLayout?: DesignerPanelLayoutPreset;
  /** Persistir abertura dos painéis em `localStorage` por `reportId`. Padrão: `true` quando `reportId` está definido */
  persistPanelState?: boolean;
  /**
   * Densidade reduzida (padding e tipografia menores nos painéis).
   * Padrão: `true` se `defaultPanelLayout === 'compact'` ou viewport &lt;1280px.
   */
  compactMode?: boolean;
}

export function ReportDesigner({
  reportId,
  reportName,
  mode = 'design',
  report,
  data,
  dataSources,
  onClose,
  onSave,
  autoSaveIntervalMs = REPORT_AUTO_SAVE_INTERVAL_MS.OFF,
  historyPersistIntervalMs = REPORT_HISTORY_PERSIST_INTERVAL_MS.OFF,
  onPersistHistory,
  onPrint,
  pagePresets,
  className,
  canvasSelectionClasses,
  defaultPanelLayout = 'canvas-first',
  persistPanelState,
  compactMode,
}: ReportDesignerProps) {
  const loadReport = useDesignerStore((state) => state.loadReport);
  const setHostPagePresets = useDesignerStore((state) => state.setHostPagePresets);
  const isTextEditorOpen = useDesignerStore((state) => state.textEditorModal !== null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPersistingHistory, setIsPersistingHistory] = useState(false);
  const isSavingRef = useRef(false);
  const isPersistingHistoryRef = useRef(false);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const persistedHistoryEntryIdsRef = useRef<Set<string>>(new Set());

  const markSnapshotSaved = useCallback(() => {
    const { report: currentReport, data: currentData } = useDesignerStore.getState();
    lastSavedSnapshotRef.current = createReportSaveSnapshot(currentReport, currentData);
  }, []);

  const handleSave = useCallback(
    async (source: 'manual' | 'auto' = 'manual') => {
      if (!onSave || isSavingRef.current) return;

      const { report: currentReport, data: currentData } = useDesignerStore.getState();
      isSavingRef.current = true;
      setIsSaving(true);
      try {
        await onSave({
          reportId,
          report: currentReport,
          data: currentData,
          source,
        });
        lastSavedSnapshotRef.current = createReportSaveSnapshot(currentReport, currentData);
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    },
    [onSave, reportId]
  );

  const handlePersistHistory = useCallback(
    async (source: 'manual' | 'auto' = 'auto') => {
      if (!onPersistHistory || isPersistingHistoryRef.current) return;

      const state = useDesignerStore.getState();
      const entries = getHistoryEntriesToPersist(
        state.historyPast,
        persistedHistoryEntryIdsRef.current
      );
      if (entries.length === 0) return;

      isPersistingHistoryRef.current = true;
      setIsPersistingHistory(true);
      try {
        await onPersistHistory({
          reportId,
          entries,
          historyPast: state.historyPast,
          historyPointer: state.historyPointer,
          report: state.report,
          data: state.data,
          source,
        });
        for (const entry of entries) {
          persistedHistoryEntryIdsRef.current.add(entry.id);
        }
      } finally {
        isPersistingHistoryRef.current = false;
        setIsPersistingHistory(false);
      }
    },
    [onPersistHistory, reportId]
  );

  useEffect(() => {
    setHostPagePresets(pagePresets);
  }, [pagePresets, setHostPagePresets]);

  useEffect(() => {
    if (!report) return;
    loadReport(report, data ? { data, replaceData: true } : undefined);
    markSnapshotSaved();
    persistedHistoryEntryIdsRef.current = new Set();
  }, [report, data, loadReport, markSnapshotSaved]);

  const shortcutsBlocked = isPreviewOpen || isHistoryOpen || isTextEditorOpen;
  const autoSaveEnabled =
    Boolean(onSave) && autoSaveIntervalMs > 0 && mode === 'design';
  const historyPersistEnabled =
    Boolean(onPersistHistory) &&
    historyPersistIntervalMs > 0 &&
    mode === 'design';

  useReportAutoSave({
    enabled: autoSaveEnabled,
    intervalMs: autoSaveIntervalMs,
    isBlocked: shortcutsBlocked,
    lastSavedSnapshotRef,
    isSavingRef,
    onAutoSave: () => handleSave('auto'),
  });

  useReportHistoryPersist({
    enabled: historyPersistEnabled,
    intervalMs: historyPersistIntervalMs,
    isBlocked: shortcutsBlocked,
    persistedEntryIdsRef: persistedHistoryEntryIdsRef,
    isPersistingRef: isPersistingHistoryRef,
    onPersist: () => handlePersistHistory('auto'),
  });

  const unsavedGuardEnabled = mode === 'design' && Boolean(onClose);

  const {
    isModalOpen: isUnsavedModalOpen,
    isExitSaving,
    requestClose,
    handleCancel: handleUnsavedCancel,
    handleDiscard: handleUnsavedDiscard,
    handleSaveAndExit: handleUnsavedSaveAndExit,
  } = useUnsavedChangesGuard({
    enabled: unsavedGuardEnabled,
    lastSavedSnapshotRef,
    onClose,
    onSave: onSave ? () => handleSave('manual') : undefined,
  });

  const panels = useDesignerPanels({
    reportId,
    defaultPanelLayout,
    persistPanelState,
  });

  const effectiveCompactMode =
    compactMode ?? (defaultPanelLayout === 'compact' || panels.isCompact);

  useDesignerKeyboardShortcuts(mode === 'design' ? shortcutsBlocked || isUnsavedModalOpen : true, {
    onOpenHistory: () => setIsHistoryOpen(true),
    onSave: onSave ? () => handleSave('manual') : undefined,
    onToggleLeftPanel: panels.isCompact ? panels.toggleLeft : undefined,
    onToggleRightPanel: panels.isCompact ? panels.toggleRight : undefined,
  });

  const propertiesColumn = (
    <>
      <DesignerActionToolbar
        reportName={reportName}
        lastSavedSnapshotRef={lastSavedSnapshotRef}
        onSave={onSave ? () => handleSave('manual') : undefined}
        isSaving={isSaving}
        autoSaveIntervalMs={autoSaveEnabled ? autoSaveIntervalMs : undefined}
        onPreview={() => setIsPreviewOpen(true)}
        onHistory={() => setIsHistoryOpen(true)}
        onPersistHistory={
          onPersistHistory ? () => handlePersistHistory('manual') : undefined
        }
        isPersistingHistory={isPersistingHistory}
        historyPersistIntervalMs={
          historyPersistEnabled ? historyPersistIntervalMs : undefined
        }
      />
      <PropertiesPanel />
    </>
  );

  const designerBody =
    mode === 'preview' ? (
      <div
        className={cn(
          'h-full w-full flex bg-neutral-50 overflow-hidden text-neutral-900 font-sans',
          className
        )}
        data-report-id={reportId}
        data-report-name={reportName}
        data-report-mode="preview"
      >
        <ReportPreview
          variant="embedded"
          onClose={onClose}
          onPrint={onPrint}
          reportId={reportId}
        />
      </div>
    ) : (
    <DesignerLayoutProvider compactMode={effectiveCompactMode}>
      <div
        className={cn(
          'h-full w-full flex flex-col bg-neutral-50 overflow-hidden text-neutral-900 font-sans',
          className
        )}
        data-report-id={reportId}
        data-report-name={reportName}
        data-report-mode="design"
      >
        <DesignerNarrowViewportBanner />

        <div className="flex-1 flex min-h-0 overflow-hidden">
          {panels.isCompact ? (
            <>
              <SidebarRail
                onClose={onClose ? requestClose : undefined}
                flyoutOpen={panels.leftOpen}
                onFlyoutOpenChange={(open) =>
                  open ? panels.openLeft() : panels.closeLeft()
                }
              />
              <div className="flex-1 flex min-w-0 overflow-hidden relative">
                <Canvas
                  canvasSelectionClasses={canvasSelectionClasses}
                  fitLayoutKey={panels.layoutRevision}
                />
                <PropertiesPanelDrawer
                  isOpen={panels.rightOpen}
                  onClose={panels.closeRight}
                  onOpen={panels.openRight}
                  showToggle
                >
                  <div className="flex flex-col h-full min-h-0">{propertiesColumn}</div>
                </PropertiesPanelDrawer>
              </div>
            </>
          ) : (
            <>
              <Sidebar
                reportName={reportName}
                onClose={onClose ? requestClose : undefined}
              />
              <div className="flex-1 flex min-w-0 overflow-hidden">
                <Canvas
                  canvasSelectionClasses={canvasSelectionClasses}
                  fitLayoutKey={panels.layoutRevision}
                />
                <div
                  className={cn(
                    'flex flex-col h-full min-h-0 border-l border-neutral-200',
                    PROPERTIES_PANEL_COLUMN_CLASS
                  )}
                >
                  {propertiesColumn}
                </div>
              </div>
            </>
          )}
        </div>

        {isPreviewOpen && (
          <ReportPreview
            onClose={() => setIsPreviewOpen(false)}
            onPrint={onPrint}
            reportId={reportId}
          />
        )}

        {isHistoryOpen && <HistoryTimelineModal onClose={() => setIsHistoryOpen(false)} />}

        <TextComponentEditorModal />

        <UnsavedChangesModal
          isOpen={isUnsavedModalOpen}
          isSaving={isExitSaving}
          canSave={Boolean(onSave)}
          onSaveAndExit={handleUnsavedSaveAndExit}
          onDiscard={handleUnsavedDiscard}
          onCancel={handleUnsavedCancel}
        />
      </div>
    </DesignerLayoutProvider>
    );

  return (
    <DesignerHostProvider pagePresets={pagePresets} dataSources={dataSources}>
      {designerBody}
    </DesignerHostProvider>
  );
}
