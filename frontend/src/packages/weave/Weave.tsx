/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Componente embutível do designer de relatórios.
 * No produto final, o software hospedeiro monta este componente
 * (via npm) passando o template e os dados do contexto.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DesignerStoreProvider,
  useDesignerStore,
  useDesignerStoreApi,
  useReportAutoSave,
  useReportHistoryPersist,
  type ReportHistoryPersistIntervalMs,
  REPORT_HISTORY_PERSIST_INTERVAL_MS,
  type ReportAutoSaveIntervalMs,
  REPORT_AUTO_SAVE_INTERVAL_MS,
} from './modules/designer/application';
import {
  AssistantPanel,
  Sidebar,
  SidebarRail,
  DesignerHeader,
  LayersPanel,
  DesignerNarrowViewportBanner,
  DesignerLayoutProvider,
  PropertiesPanelDrawer,
  PROPERTIES_PANEL_COLUMN_CLASS,
  useDesignerPanels,
  type DesignerPanelLayoutPreset,
  Canvas,
  PropertiesPanel,
  DesignerReportPreview,
  useDesignerKeyboardShortcuts,
  HistoryTimelineModal,
  TextComponentEditorModal,
  type CanvasSelectionClasses,
  useUnsavedChangesGuard,
  UnsavedChangesModal,
} from './modules/designer/ui';
import { type HistoryEntry, getHistoryEntriesToPersist } from './modules/history/domain';
import { type ReportDefinition, createReportSaveSnapshot } from './modules/report/domain';
import { cn } from './shared/ui/cn';
import { DesignerHostProvider } from './WeaveHostProvider';
import { WeaveServicesProvider } from './WeaveServicesProvider';
import type { AssistantSender } from './modules/assistant/domain';
import type { ReportImageResolver } from './modules/components/image/application';
import { flattenNestedData, type DataSourceCatalog } from './modules/data-source/domain';
import type { PageVariablesResolver } from './modules/expression/domain';
import type { PagePresetDefinition } from './modules/page/domain';
import type { WeavePrintPayload } from './modules/rendering/domain';

export type WeaveMode = 'design' | 'preview';

/** Payload entregue ao host em `onSave` (Ctrl+S, botão Salvar ou auto-save) */
export interface WeaveSavePayload {
  reportId?: string;
  report: ReportDefinition;
  data: Record<string, unknown[]>;
  /** Origem do save — útil para o host ignorar toast em saves automáticos */
  source?: 'manual' | 'auto';
}

/** Versões do layout enviadas ao host para recuperação futura */
export interface WeaveHistoryPersistPayload {
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

export interface WeaveProps {
  /** ID do relatório no sistema hospedeiro (metadado de integração) */
  reportId?: string;
  /** Nome exibido no contexto do host — futuro: título da janela / breadcrumb */
  reportName?: string;
  /**
   * design = editor (sidebar + canvas + propriedades)
   * preview = somente renderização do relatório (sem edição)
   */
  mode?: WeaveMode;
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
  onSave?: (payload: WeaveSavePayload) => void | Promise<void>;
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
    payload: WeaveHistoryPersistPayload
  ) => void | Promise<void>;
  /**
   * Impressão delegada ao host — acionado pelo botão Imprimir no preview.
   * Recebe o relatório paginado (`printJob.sheets`) pronto para PDF, API ou agente local.
   * Sem este callback, o preview usa impressão do navegador (`window.print`).
   */
  onPrint?: (payload: WeavePrintPayload) => void | Promise<void>;
  /**
   * Converte URLs de imagem autenticadas ou bloqueadas por CORS em `blob:` / `data:`
   * que o navegador consegue exibir. Não é chamado para `data:` nem `blob:` já resolvidos.
   *
   * @example
   * imageResolver={async (url) => {
   *   const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
   *   return URL.createObjectURL(await res.blob());
   * }}
   */
  imageResolver?: ReportImageResolver;
  /**
   * Variáveis calculadas por folha pelo host, usadas no layout como `{page.<chave>}`.
   * Recebe as variáveis de sistema da folha (ex.: `pageNumber`) e devolve `{ chave: valor }`.
   *
   * @example
   * resolvePageVariables={(sys) => ({ lado: sys.pageNumber % 2 === 1 ? 'F' : 'V' })}
   */
  resolvePageVariables?: PageVariablesResolver;
  /**
   * Presets de folha adicionais do host (Fase 3.5).
   * Mesclados aos built-in; IDs iguais substituem o preset interno.
   */
  pagePresets?: PagePresetDefinition[];
  /**
   * Assistente de IA do editor — OPCIONAL e desligado por padrão.
   *
   * Sem esta prop o Weave não mostra o botão nem o painel do assistente e não faz nenhuma chamada de IA;
   * o editor funciona exatamente igual. Para ligar, o host passa uma função que recebe o pedido do usuário
   * junto com o resumo do relatório (sem dados de preview) e devolve a resposta do SEU backend/modelo:
   * `{ mensagem, acoes, passos?, pergunta?, opcoes?, confirmacao? }` (ver `AssistantRequest`/`AssistantResponse`).
   * O Weave só aplica as ações do catálogo fechado (`STYLE_PROPERTIES`/`ELEMENT_PROPERTIES`), como UM passo de
   * histórico (Desfazer reverte tudo), e ignora ação inválida ou de tipo errado. Credenciais, modelo e limites
   * de uso ficam no host — nada disso passa pelo navegador.
   *
   * @example
   * // site com suporte/treinamento: liga a IA só para quem tem permissão
   * <Weave report={report} onAssistantRequest={canUseAi ? (req) => api.post('/weave/assistente', req) : undefined} />
   */
  onAssistantRequest?: AssistantSender;
  /**
   * Habilita o anexo de imagem no assistente (colar, arrastar ou escolher arquivo; até 3 imagens reduzidas no navegador).
   * Só tem efeito junto com `onAssistantRequest`, e o backend do host precisa aceitar `imagens` no pedido.
   * Padrão: desligado. Avise o usuário sobre dados pessoais nas imagens — elas vão ao provedor de IA do host.
   */
  assistantImages?: boolean;
  /**
   * Mostra, no cabeçalho do assistente, o consumo de tokens (último pedido e sessão).
   * Só tem efeito junto com `onAssistantRequest`, e o backend do host precisa devolver `uso` na resposta.
   */
  assistantUsage?: boolean;
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

function WeaveWorkspace({
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
  imageResolver,
  resolvePageVariables,
  pagePresets,
  onAssistantRequest,
  assistantImages = false,
  assistantUsage = false,
  className,
  canvasSelectionClasses,
  defaultPanelLayout = 'canvas-first',
  persistPanelState,
  compactMode,
}: WeaveProps) {
  const designerStore = useDesignerStoreApi();
  const loadReport = useDesignerStore((state) => state.loadReport);
  const setHostPagePresets = useDesignerStore((state) => state.setHostPagePresets);
  const isTextEditorOpen = useDesignerStore((state) => state.textEditorModal !== null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPersistingHistory, setIsPersistingHistory] = useState(false);
  const isSavingRef = useRef(false);
  const isPersistingHistoryRef = useRef(false);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const persistedHistoryEntryIdsRef = useRef<Set<string>>(new Set());

  const markSnapshotSaved = useCallback(() => {
    const { report: currentReport, data: currentData } = designerStore.getState();
    lastSavedSnapshotRef.current = createReportSaveSnapshot(currentReport, currentData);
  }, []);

  const handleSave = useCallback(
    async (source: 'manual' | 'auto' = 'manual') => {
      if (!onSave || isSavingRef.current) return;

      const { report: currentReport, data: currentData } = designerStore.getState();
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

      const state = designerStore.getState();
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

  // listas dentro do registro (ex.: devedores do instrumento) viram datasets filhos ligados ao pai
  const flattened = useMemo(() => flattenNestedData(data, dataSources), [data, dataSources]);

  useEffect(() => {
    if (!report) return;
    loadReport(report, flattened ? { data: flattened.data, replaceData: true } : undefined);
    markSnapshotSaved();
    persistedHistoryEntryIdsRef.current = new Set();
  }, [report, flattened, loadReport, markSnapshotSaved]);

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

  const propertiesColumn = <PropertiesPanel />;

  const assistantPanel = onAssistantRequest ? (
    <AssistantPanel isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} onSend={onAssistantRequest} allowImages={assistantImages} showUsage={assistantUsage} />
  ) : null;

  const designerBody =
    mode === 'preview' ? (
      <div
        className={cn(
          'h-full w-full flex bg-neutral-50 overflow-hidden text-neutral-900 font-sans',
          className
        )}
        data-weave-root
        data-report-id={reportId}
        data-report-name={reportName}
        data-report-mode="preview"
      >
        <DesignerReportPreview
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
        data-weave-root
        data-report-id={reportId}
        data-report-name={reportName}
        data-report-mode="design"
      >
        <DesignerNarrowViewportBanner />

        <DesignerHeader
          reportName={reportName}
          onClose={onClose ? requestClose : undefined}
          isLayersOpen={isLayersOpen}
          onToggleLayers={() => setIsLayersOpen((open) => !open)}
          isAssistantOpen={isAssistantOpen}
          onToggleAssistant={onAssistantRequest ? () => setIsAssistantOpen((open) => !open) : undefined}
          lastSavedSnapshotRef={lastSavedSnapshotRef}
          onSave={onSave ? () => handleSave('manual') : undefined}
          isSaving={isSaving}
          autoSaveIntervalMs={autoSaveEnabled ? autoSaveIntervalMs : undefined}
          onPreview={() => setIsPreviewOpen(true)}
          onHistory={() => setIsHistoryOpen(true)}
          onPersistHistory={onPersistHistory ? () => handlePersistHistory('manual') : undefined}
          isPersistingHistory={isPersistingHistory}
          historyPersistIntervalMs={historyPersistEnabled ? historyPersistIntervalMs : undefined}
        />

        <div className="flex-1 flex min-h-0 overflow-hidden">
          {panels.isCompact ? (
            <>
              <SidebarRail
                flyoutOpen={panels.leftOpen}
                onFlyoutOpenChange={(open) =>
                  open ? panels.openLeft() : panels.closeLeft()
                }
              />
              <div className="flex-1 flex min-w-0 overflow-hidden relative">
                <LayersPanel isOpen={isLayersOpen} onClose={() => setIsLayersOpen(false)} />
                <Canvas
                  canvasSelectionClasses={canvasSelectionClasses}
                  fitLayoutKey={panels.layoutRevision}
                />
                {assistantPanel}
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
              <Sidebar />
              <div className="flex-1 flex min-w-0 overflow-hidden relative">
                <LayersPanel isOpen={isLayersOpen} onClose={() => setIsLayersOpen(false)} />
                <Canvas
                  canvasSelectionClasses={canvasSelectionClasses}
                  fitLayoutKey={panels.layoutRevision}
                />
                {assistantPanel}
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
          <DesignerReportPreview
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
    <DesignerHostProvider
      pagePresets={pagePresets}
      dataSources={flattened?.catalog ?? dataSources}
      imageResolver={imageResolver}
      resolvePageVariables={resolvePageVariables}
    >
      {designerBody}
    </DesignerHostProvider>
  );
}

export function Weave(props: WeaveProps) {
  return (
    <DesignerStoreProvider>
      <WeaveServicesProvider>
        <WeaveWorkspace {...props} />
      </WeaveServicesProvider>
    </DesignerStoreProvider>
  );
}
