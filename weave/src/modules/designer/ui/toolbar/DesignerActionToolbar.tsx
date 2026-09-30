import React, { useEffect, useRef, useState, type RefObject } from 'react';
import {
  Archive,
  CircleHelp,
  Download,
  History,
  MoreHorizontal,
  Play,
  Save,
  Upload,
} from 'lucide-react';
import { useDesignerStore, useDesignerStoreApi } from '../../application/store/DesignerStoreContext';
import { cn } from '../../../../shared/ui/cn';
import { parseReportImportFile, ReportImportError, isReportStateDirty } from '../../../report/domain';
import { formatAutoSaveInterval } from '../../application/persistence/persistIntervals';
import { useDesignerCompactMode } from '../layout/designerLayoutContext';
import { useDesignerServices } from '../services/DesignerServicesContext';

interface DesignerActionToolbarProps {
  reportName?: string;
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

function ToolbarDivider() {
  return <div className="w-px h-5 bg-neutral-200 mx-0.5 shrink-0" aria-hidden />;
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
  icon: React.ComponentType<{ className?: string }>;
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
        'flex items-center justify-center rounded-md transition-colors shrink-0',
        compact ? 'w-7 h-7' : 'w-8 h-8',
        disabled && 'opacity-40 cursor-not-allowed',
        !disabled && emphasis && 'text-neutral-800 hover:bg-neutral-200/80',
        !disabled &&
          active &&
          'text-neutral-900 bg-amber-50 ring-1 ring-amber-400/70 hover:bg-amber-100/80',
        !disabled &&
          !emphasis &&
          !active &&
          'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/60',
        className
      )}
    >
      <Icon className="w-4 h-4" strokeWidth={emphasis || active ? 2.25 : 2} />
    </button>
  );
}

export const DesignerActionToolbar: React.FC<DesignerActionToolbarProps> = ({
  reportName,
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
  const historyPointer = useDesignerStore((state) => state.historyPointer);
  const historyCount = useDesignerStore((state) => state.historyPast.length);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);
  const compactMode = useDesignerCompactMode();
  const { reportFiles, tour } = useDesignerServices();

  const isDirty = isReportStateDirty(report, data, lastSavedSnapshotRef.current);

  const saveLabel = (() => {
    if (isSaving) return 'Salvando…';
    const base = 'Salvar alterações (Ctrl+S)';
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

  const fileActions = (
    <>
      {onPersistHistory && (
        <ToolbarIconButton
          icon={Archive}
          label={historyBackupLabel}
          onClick={() => {
            onPersistHistory();
            setOverflowOpen(false);
          }}
          disabled={isPersistingHistory}
          compact={compactMode}
        />
      )}
      <ToolbarIconButton
        icon={Download}
        tourId="export"
        label="Exportar relatório (JSON)"
        onClick={handleExportReport}
        compact={compactMode}
      />
      <ToolbarIconButton
        icon={Upload}
        label="Importar relatório (JSON)"
        onClick={handleImportReport}
        compact={compactMode}
      />
    </>
  );

  return (
    <div
      data-tour="toolbar"
      className={cn(
        'w-full shrink-0 bg-[#fbfbfa] flex items-center justify-end gap-0.5 z-10 border-b border-neutral-200/80',
        compactMode ? 'px-1.5 py-1' : 'px-2 py-1.5'
      )}
    >
      <div className="flex items-center gap-0.5">
        <ToolbarIconButton
          icon={CircleHelp}
          label="Manual do designer"
          onClick={() => {
            void tour.start();
          }}
          compact={compactMode}
        />

        <ToolbarDivider />

        {onSave && (
          <ToolbarIconButton
            icon={Save}
            tourId="save"
            label={saveLabel}
            onClick={onSave}
            disabled={isSaving}
            active={isDirty && !isSaving}
            emphasis
            compact={compactMode}
          />
        )}

        <ToolbarIconButton
          icon={Play}
          tourId="preview"
          label="Pré-visualização"
          onClick={onPreview}
          compact={compactMode}
        />

        {onHistory && (
          <ToolbarIconButton
            icon={History}
            tourId="history"
            label={`Histórico de alterações (${historyPointer + 1}/${historyCount}) · Ctrl+H`}
            onClick={onHistory}
            compact={compactMode}
          />
        )}

        <ToolbarDivider />

        <div className="hidden min-[1280px]:contents">{fileActions}</div>

        <div className="relative min-[1280px]:hidden" ref={overflowRef}>
          <ToolbarIconButton
            icon={MoreHorizontal}
            label="Mais ações"
            onClick={() => setOverflowOpen((open) => !open)}
            emphasis={overflowOpen}
            compact={compactMode}
          />
          {overflowOpen && (
            <div className="absolute right-0 top-full mt-1 py-1 min-w-[11rem] rounded-lg border border-neutral-200 bg-white shadow-lg z-20">
              {onPersistHistory && (
                <button
                  type="button"
                  disabled={isPersistingHistory}
                  onClick={() => {
                    onPersistHistory();
                    setOverflowOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-[12px] text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
                >
                  <Archive className="w-3.5 h-3.5 shrink-0" />
                  Backup do histórico
                </button>
              )}
              <button
                type="button"
                onClick={handleExportReport}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-[12px] text-neutral-700 hover:bg-neutral-50"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                Exportar JSON
              </button>
              <button
                type="button"
                onClick={handleImportReport}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-[12px] text-neutral-700 hover:bg-neutral-50"
              >
                <Upload className="w-3.5 h-3.5 shrink-0" />
                Importar JSON
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
