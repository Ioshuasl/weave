import { createId } from '../../../shared/domain/id';
import { type ReportBand, getBandDisplayLabel } from '../../band/domain';
import { type ReportComponent, getComponentDisplayLabel } from '../../components/common/domain';
import type { ReportDefinition } from '../../report/domain';

export const MAX_HISTORY_ENTRIES = 80;
export const HISTORY_COALESCE_MS = 900;

export type HistoryActionKind =
  | 'init'
  | 'import'
  | 'addBand'
  | 'removeBand'
  | 'updateBand'
  | 'addComponent'
  | 'removeComponent'
  | 'duplicateBand'
  | 'duplicateComponent'
  | 'pasteComponent'
  | 'updateComponent'
  | 'editData'
  | 'editPage';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  label: string;
  kind: HistoryActionKind;
  targetId?: string;
  report: ReportDefinition;
  data: Record<string, unknown[]>;
}

export interface HistoryMeta {
  kind: HistoryActionKind;
  label: string;
  targetId?: string;
}

export function cloneReport(report: ReportDefinition): ReportDefinition {
  return JSON.parse(JSON.stringify(report)) as ReportDefinition;
}

export function cloneData(data: Record<string, unknown[]>): Record<string, unknown[]> {
  return JSON.parse(JSON.stringify(data)) as Record<string, unknown[]>;
}

export function createHistoryEntry(
  report: ReportDefinition,
  data: Record<string, unknown[]>,
  meta: HistoryMeta,
  id = createId()
): HistoryEntry {
  return {
    id,
    timestamp: Date.now(),
    label: meta.label,
    kind: meta.kind,
    targetId: meta.targetId,
    report: cloneReport(report),
    data: cloneData(data),
  };
}

export function shouldCoalesceHistory(prev: HistoryEntry, next: HistoryEntry): boolean {
  if (next.kind === 'init' || next.kind === 'import') return false;
  if (prev.kind !== next.kind) return false;
  if (prev.targetId !== next.targetId) return false;
  if (next.timestamp - prev.timestamp > HISTORY_COALESCE_MS) return false;

  const coalesceKinds: HistoryActionKind[] = [
    'updateBand',
    'updateComponent',
    'editData',
  ];
  return coalesceKinds.includes(next.kind);
}

export function appendHistoryEntry(
  past: HistoryEntry[],
  pointer: number,
  report: ReportDefinition,
  data: Record<string, unknown[]>,
  meta: HistoryMeta
): { past: HistoryEntry[]; pointer: number } {
  const entry = createHistoryEntry(report, data, meta);
  let nextPast = past.slice(0, pointer + 1);
  const last = nextPast[nextPast.length - 1];

  if (last && shouldCoalesceHistory(last, entry)) {
    nextPast[nextPast.length - 1] = entry;
  } else {
    nextPast.push(entry);
    if (nextPast.length > MAX_HISTORY_ENTRIES) {
      const trim = nextPast.length - MAX_HISTORY_ENTRIES;
      nextPast = nextPast.slice(trim);
    }
  }

  return { past: nextPast, pointer: nextPast.length - 1 };
}

function bandLabel(band?: ReportBand): string {
  if (!band) return 'Banda';
  return getBandDisplayLabel(band.type);
}

function componentLabel(comp?: ReportComponent): string {
  if (!comp) return 'Componente';
  return getComponentDisplayLabel(comp.type);
}

export function describeBandUpdate(
  bandId: string,
  updates: Partial<ReportBand>,
  band?: ReportBand
): HistoryMeta {
  const name = bandLabel(band);
  const keys = Object.keys(updates);

  if (updates.dividerLine !== undefined) {
    return { kind: 'updateBand', targetId: bandId, label: `Editar linha divisória` };
  }
  if (updates.dividerAngle !== undefined) {
    return { kind: 'updateBand', targetId: bandId, label: `Rotacionar linha divisória` };
  }
  if (updates.dividerThickness !== undefined || updates.dividerColor !== undefined) {
    return { kind: 'updateBand', targetId: bandId, label: `Estilo da linha divisória` };
  }
  if (
    updates.dataSource !== undefined ||
    updates.dataTable !== undefined ||
    updates.numberedList !== undefined ||
    updates.bulletList !== undefined
  ) {
    return { kind: 'updateBand', targetId: bandId, label: `Dados da banda: ${name}` };
  }

  const rect = updates.bandRect ?? updates.dividerRect;
  if (rect) {
    const moved = rect.x !== undefined || rect.y !== undefined;
    const resized = rect.width !== undefined || rect.height !== undefined;
    if (resized && !moved) {
      return { kind: 'updateBand', targetId: bandId, label: `Redimensionar banda: ${name}` };
    }
    if (moved && !resized) {
      return { kind: 'updateBand', targetId: bandId, label: `Mover banda: ${name}` };
    }
    return { kind: 'updateBand', targetId: bandId, label: `Layout da banda: ${name}` };
  }

  if (keys.length === 0) {
    return { kind: 'updateBand', targetId: bandId, label: `Alterar banda: ${name}` };
  }

  return { kind: 'updateBand', targetId: bandId, label: `Propriedades da banda: ${name}` };
}

export function describeComponentUpdate(
  componentId: string,
  updates: Partial<ReportComponent>,
  component?: ReportComponent
): HistoryMeta {
  const name = componentLabel(component);

  if (updates.content !== undefined) {
    return { kind: 'updateComponent', targetId: componentId, label: `Editar conteúdo: ${name}` };
  }
  if (updates.tableProps !== undefined) {
    return { kind: 'updateComponent', targetId: componentId, label: `Editar tabela` };
  }
  if (updates.chartProps !== undefined) {
    return { kind: 'updateComponent', targetId: componentId, label: `Configurar gráfico` };
  }
  if (updates.style !== undefined) {
    return { kind: 'updateComponent', targetId: componentId, label: `Estilo: ${name}` };
  }
  if (updates.rect !== undefined) {
    const rect = updates.rect;
    const moved = rect.x !== undefined || rect.y !== undefined;
    const resized = rect.width !== undefined || rect.height !== undefined;
    if (resized && moved) {
      return { kind: 'updateComponent', targetId: componentId, label: `Mover e redimensionar: ${name}` };
    }
    if (resized) {
      return { kind: 'updateComponent', targetId: componentId, label: `Redimensionar: ${name}` };
    }
    return { kind: 'updateComponent', targetId: componentId, label: `Mover: ${name}` };
  }

  return { kind: 'updateComponent', targetId: componentId, label: `Alterar: ${name}` };
}

export function formatHistoryTime(timestamp: number): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp));
}

export function formatHistoryRelative(timestamp: number, now = Date.now()): string {
  const diff = Math.max(0, now - timestamp);
  if (diff < 5000) return 'agora';
  if (diff < 60_000) return `há ${Math.round(diff / 1000)}s`;
  if (diff < 3600_000) return `há ${Math.round(diff / 60_000)} min`;
  return formatHistoryTime(timestamp);
}
