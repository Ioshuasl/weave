import { AnimatePresence, motion } from 'framer-motion';
import {
  Archive,
  CircleHelp,
  ChevronRight,
  Download,
  Eye,
  History,
  Layers,
  Loader2,
  MoreHorizontal,
  Plus,
  Save,
  Sparkles,
  Upload,
} from 'lucide-react';
import React, { useEffect, useRef, useState, type RefObject } from 'react';
import { cn } from '../../../../shared/ui/cn';
import { parseReportImportFile, ReportImportError, isReportStateDirty } from '../../../report/domain';
import { formatAutoSaveInterval } from '../../application/persistence/persistIntervals';
import { useDesignerStore, useDesignerStoreApi } from '../../application/store/DesignerStoreContext';
import { useDesignerCompactMode } from '../layout/designerLayoutContext';
import { useDesignerServices } from '../services/DesignerServicesContext';
import { WeaveLogo } from '../sidebar/WeaveLogo';
import { UndoRedoButtons } from './UndoRedoButtons';

interface DesignerHeaderProps {
  reportName?: string;
  onClose?: () => void;
  isLayersOpen?: boolean;
  onToggleLayers?: () => void;
  isAssistantOpen?: boolean;
  onToggleAssistant?: () => void;
  lastSavedSnapshotRef: RefObject<string | null>;
  onSave?: () => void;
  isSaving?: boolean;
  autoSaveIntervalMs?: number;
  onPreview: () => void;
  onHistory?: () => void;
  onPersistHistory?: () => void;
  isPersistingHistory?: boolean;
  historyPersistIntervalMs?: number;
}

function ToolbarIconButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  active,
  emphasis,
  className,
  compact = false,
  tourId,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  emphasis?: boolean;
  className?: string;
  compact?: boolean;
  tourId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      data-tour={tourId}
      className={cn(
        'flex items-center justify-center rounded-lg transition-colors shrink-0',
        compact ? 'w-7 h-7' : 'w-8 h-8',
        disabled && 'opacity-40 cursor-not-allowed',
        !disabled && emphasis && 'text-neutral-800 hover:bg-neutral-100',
        !disabled &&
          active &&
          'text-neutral-900 bg-amber-50 ring-1 ring-amber-400/70 hover:bg-amber-100/80',
        !disabled &&
          !emphasis &&
          !active &&
          'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100',
        className
      )}
    >
      <Icon className="w-4 h-4" strokeWidth={emphasis || active ? 2.25 : 2} />
    </button>
  );
}

export const DesignerHeader: React.FC<DesignerHeaderProps> = ({
  reportName,
  onClose,
  isLayersOpen = false,
  onToggleLayers,
  isAssistantOpen = false,
  onToggleAssistant,
  lastSavedSnapshotRef,
  onSave,
  isSaving = false,
  autoSaveIntervalMs,
  onPreview,
  onHistory,
  onPersistHistory,
  isPersistingHistory = false,
  historyPersistIntervalMs,
}) => {
  const designerStore = useDesignerStoreApi();
  const report = useDesignerStore((state) => state.report);
  const data = useDesignerStore((state) => state.data);
  const loadReport = useDesignerStore((state) => state.loadReport);
  const addReportPage = useDesignerStore((state) => state.addReportPage);
  const displayName = report.name || reportName;
  const historyPointer = useDesignerStore((state) => state.historyPointer);
  const historyCount = useDesignerStore((state) => state.historyPast.length);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);
  const compactMode = useDesignerCompactMode();
  const { reportFiles, tour } = useDesignerServices();
  const toolbarRef = useRef<HTMLDivElement>(null);

  const isDirty = isReportStateDirty(report, data, lastSavedSnapshotRef.current);

  const saveState = isSaving
    ? { icon: Loader2, text: 'Salvando…', className: '[&_svg]:animate-spin' }
    : { icon: Save, text: 'Salvar', className: '' };
  const statusText = isSaving ? 'Salvando…' : isDirty ? 'Alterações não salvas' : 'Salvo';

  const saveLabel = (() => {
    if (isSaving) return 'Salvando…';
    const base = isDirty
      ? 'Alterações não salvas · Salvar (Ctrl+S)'
      : 'Tudo salvo · Salvar alterações (Ctrl+S)';
    if (autoSaveIntervalMs != null && autoSaveIntervalMs > 0) {
      return `${base} · Auto-save a cada ${formatAutoSaveInterval(autoSaveIntervalMs)}`;
    }
    return base;
  })();

  const historyBackupLabel = (() => {
    if (isPersistingHistory) return 'Salvando backup do histórico…';
    const base = 'Salvar backup do histórico';
    if (historyPersistIntervalMs != null && historyPersistIntervalMs > 0) {
      return `${base} · Automático a cada ${formatAutoSaveInterval(historyPersistIntervalMs)}`;
    }
    return base;
  })();

  const handleExportReport = () => {
    const { report: currentReport, data: previewData } = designerStore.getState();
    reportFiles.download(currentReport, previewData, currentReport.name || reportName);
    setOverflowOpen(false);
  };

  const handleImportReport = async () => {
    const file = await reportFiles.pick();
    if (!file) return;

    try {
      const raw = await reportFiles.read(file);
      const { report: importedReport, data: importedData } = parseReportImportFile(raw);
      const replace = window.confirm(
        'Importar este relatório? O layout atual será substituído.' +
          (importedData ? ' Os datasets do arquivo também serão carregados.' : '')
      );
      if (!replace) return;
      loadReport(
        importedReport,
        importedData ? { data: importedData, replaceData: true } : undefined
      );
    } catch (err) {
      const message =
        err instanceof ReportImportError
          ? err.message
          : 'Não foi possível importar o arquivo.';
      window.alert(message);
    } finally {
      setOverflowOpen(false);
    }
  };

  useEffect(() => {
    if (!overflowOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!overflowRef.current?.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [overflowOpen]);

  const menuItemClassName =
    'w-full flex items-center gap-2 px-3 py-2 text-left text-[12px] text-neutral-700 hover:bg-neutral-50 disabled:opacity-40';
  const runMenuAction = (action: () => void) => {
    action();
    setOverflowOpen(false);
  };

  return (
    <header
      ref={toolbarRef}
      data-tour="toolbar"
      className={cn(
        'w-full shrink-0 bg-weave-surface flex items-center gap-3 z-30 border-b border-neutral-200',
        compactMode ? 'px-3 py-1.5' : 'px-4 py-2'
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <WeaveLogo variant={compactMode ? 'icon' : 'full'} />
        <span className="h-5 w-px shrink-0 bg-neutral-200" aria-hidden />
        <nav aria-label="Navegação" className="flex min-w-0 items-center gap-1.5 text-[13px]">
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              title="Voltar ao sistema"
              className="shrink-0 rounded-md px-1 text-neutral-500 transition-colors hover:text-neutral-900"
            >
              Relatórios
            </button>
          ) : (
            <span className="shrink-0 px-1 text-neutral-500">Relatórios</span>
          )}
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
          <span className="truncate font-semibold text-neutral-900" title={displayName}>
            {displayName ?? 'Sem título'}
          </span>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {onSave && (
          <span
            className={cn(
              'mr-1 hidden items-center gap-1.5 text-[12px] md:inline-flex',
              isDirty && !isSaving ? 'text-amber-600' : 'text-emerald-600'
            )}
            aria-live="polite"
          >
            <span className={cn('size-1.5 rounded-full', isDirty && !isSaving ? 'bg-amber-500' : 'bg-emerald-500')} />
            {statusText}
          </span>
        )}

        {onToggleLayers && (
          <ToolbarIconButton
            icon={Layers}
            label={isLayersOpen ? 'Ocultar camadas' : 'Mostrar camadas'}
            onClick={onToggleLayers}
            compact={compactMode}
            tourId="layers-toggle"
            className={cn(isLayersOpen && 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700')}
          />
        )}
        {onToggleAssistant && (
          <ToolbarIconButton
            icon={Sparkles}
            label={isAssistantOpen ? 'Fechar assistente' : 'Abrir assistente'}
            onClick={onToggleAssistant}
            compact={compactMode}
            tourId="assistant-toggle"
            className={cn(isAssistantOpen && 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700')}
          />
        )}
        <UndoRedoButtons />
        <ToolbarIconButton
          icon={Plus}
          label="Nova página"
          onClick={addReportPage}
          compact={compactMode}
          tourId="add-page"
        />

        <span className="mx-1.5 h-5 w-px bg-neutral-200" aria-hidden />

        <button
          type="button"
          data-tour="preview"
          onClick={onPreview}
          title="Pré-visualização"
          aria-label="Pré-visualização"
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 bg-weave-surface px-3 text-[12px] font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
        >
          <Eye className="h-4 w-4" strokeWidth={2} />
          {!compactMode && 'Visualizar'}
        </button>

        {onSave && (
          <button
            type="button"
            data-tour="save"
            onClick={onSave}
            disabled={isSaving}
            title={saveLabel}
            aria-label={saveLabel}
            className={cn(
              'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700',
              'disabled:pointer-events-none disabled:opacity-60',
              saveState.className
            )}
          >
            <saveState.icon className="h-4 w-4" strokeWidth={2.25} />
            {!compactMode && saveState.text}
          </button>
        )}

        <div className="relative" ref={overflowRef}>
          <ToolbarIconButton
            icon={MoreHorizontal}
            label="Mais ações"
            onClick={() => setOverflowOpen((open) => !open)}
            emphasis={overflowOpen}
            compact={compactMode}
          />
          <AnimatePresence>
            {overflowOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.14 }}
                style={{ transformOrigin: 'top right' }}
                className="absolute right-0 top-full z-20 mt-1 min-w-[13rem] rounded-lg border border-neutral-200 bg-weave-surface py-1 shadow-lg"
              >
              <button
                type="button"
                onClick={() =>
                  runMenuAction(() => tour.start(toolbarRef.current?.closest('[data-weave-root]')))
                }
                className={menuItemClassName}
              >
                <CircleHelp className="w-3.5 h-3.5 shrink-0" />
                Manual do designer
              </button>
              {onHistory && (
                <button
                  type="button"
                  onClick={() => runMenuAction(onHistory)}
                  className={menuItemClassName}
                >
                  <History className="w-3.5 h-3.5 shrink-0" />
                  {`Histórico de alterações (${historyPointer + 1}/${historyCount})`}
                </button>
              )}
              {onPersistHistory && (
                <button
                  type="button"
                  disabled={isPersistingHistory}
                  title={historyBackupLabel}
                  onClick={() => runMenuAction(onPersistHistory)}
                  className={menuItemClassName}
                >
                  <Archive className="w-3.5 h-3.5 shrink-0" />
                  Backup do histórico
                </button>
              )}
              <div className="my-1 h-px bg-neutral-100" aria-hidden />
              <button
                type="button"
                data-tour="export"
                onClick={handleExportReport}
                className={menuItemClassName}
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                Exportar relatório (JSON)
              </button>
              <button type="button" onClick={handleImportReport} className={menuItemClassName}>
                <Upload className="w-3.5 h-3.5 shrink-0" />
                Importar relatório (JSON)
              </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
