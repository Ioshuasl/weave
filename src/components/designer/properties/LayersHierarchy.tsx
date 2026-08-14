import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import {
  BarChart,
  ChevronRight,
  FileText,
  GripHorizontal,
  Heading1,
  Heading2,
  Image as ImageIcon,
  QrCode,
  Layers,
  List,
  ListOrdered,
  Minus,
  Square,
  Table2,
  Type,
} from 'lucide-react';
import type { BandType, ComponentType, ReportComponent, ReportDefinition } from '../../../types/report';
import { useDesignerStore } from '../../../store/designerStore';
import { getBandDisplayLabel } from '../../../utils/dataBandUtils';
import { getComponentDisplayLabel } from '../../../utils/uiLabels';
import {
  findPageIdForBand,
  findPageIdForComponent,
  getAllPlacedBandIds,
} from '../../../utils/reportPageUtils';
import {
  getPrimarySelectedId,
  isIdSelected,
  type SelectionMode,
} from '../../../utils/selectionUtils';
import { cn } from '../../../utils/cn';
import { PropertyAccordion } from './PropertyAccordion';

const BAND_ICONS: Partial<Record<BandType, typeof Type>> = {
  reportTitle: Heading1,
  pageHeader: Heading2,
  dataList: List,
  dataListNumbered: ListOrdered,
  dataTable: Table2,
  divider: Minus,
  pageFooter: GripHorizontal,
  reportSummary: FileText,
  masterData: List,
  detailData: List,
};

const COMPONENT_ICONS: Record<ComponentType, typeof Type> = {
  text: Type,
  image: ImageIcon,
  qr: QrCode,
  shape: Square,
  line: Minus,
  table: Table2,
  chart: BarChart,
};

function collapsedStorageKey(reportId: string) {
  return `designer.layers.collapsed.${reportId}`;
}

function readCollapsed(reportId: string): Set<string> | null {
  try {
    const raw = localStorage.getItem(collapsedStorageKey(reportId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return null;
  }
}

function writeCollapsed(reportId: string, collapsed: Set<string>) {
  try {
    localStorage.setItem(collapsedStorageKey(reportId), JSON.stringify([...collapsed]));
  } catch {
    /* ignore */
  }
}

function defaultCollapsed(report: ReportDefinition, activePageId: string | null): Set<string> {
  const collapsed = new Set<string>();
  for (const page of report.pages) {
    if (page.id !== activePageId) collapsed.add(page.id);
  }
  return collapsed;
}

function layerComponentLabel(component: ReportComponent): string {
  const content = component.content?.replace(/\s+/g, ' ').trim();
  if (component.type === 'text' && content && content !== 'Texto') {
    return content.length > 32 ? `${content.slice(0, 32)}…` : content;
  }
  if (component.name && !new RegExp(`^${component.type}\\d+$`, 'i').test(component.name)) {
    return component.name;
  }
  return getComponentDisplayLabel(component.type);
}

function selectionModeFromEvent(event: MouseEvent): SelectionMode {
  if (event.ctrlKey || event.metaKey) return 'toggle';
  if (event.shiftKey) return 'add';
  return 'replace';
}

function LayerRow({
  id,
  label,
  icon: Icon,
  depth,
  selected,
  primary,
  expanded,
  expandable,
  activePage,
  onToggle,
  onSelect,
}: {
  id: string;
  label: string;
  icon: typeof Type;
  depth: number;
  selected: boolean;
  primary?: boolean;
  expanded?: boolean;
  expandable?: boolean;
  activePage?: boolean;
  onToggle?: () => void;
  onSelect: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <div
      data-layer-id={id}
      role="treeitem"
      aria-selected={selected}
      aria-expanded={expandable ? expanded : undefined}
      className="flex items-center min-w-0"
      style={{ paddingLeft: 4 + depth * 14 }}
    >
      {expandable ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label={expanded ? 'Recolher' : 'Expandir'}
          onClick={(event) => {
            event.stopPropagation();
            onToggle?.();
          }}
          className="shrink-0 flex items-center justify-center w-4 h-6 text-neutral-400 hover:text-neutral-700"
        >
          <ChevronRight
            className={cn('w-3 h-3 transition-transform', expanded && 'rotate-90')}
            aria-hidden
          />
        </button>
      ) : (
        <span className="w-4 shrink-0" aria-hidden />
      )}
      <button
        type="button"
        onClick={onSelect}
        title={label}
        className={cn(
          'flex-1 min-w-0 flex items-center gap-1.5 rounded px-1 py-[3px] text-left transition-colors',
          selected && primary && 'bg-neutral-900 text-white',
          selected && !primary && 'bg-neutral-200 text-neutral-800',
          !selected && activePage && 'bg-neutral-50 text-neutral-800',
          !selected && !activePage && 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800'
        )}
      >
        <Icon
          className={cn(
            'w-3 h-3 shrink-0',
            selected && primary ? 'text-white/80' : 'text-neutral-400'
          )}
          aria-hidden
        />
        <span className="truncate text-[11px] leading-tight">{label}</span>
      </button>
    </div>
  );
}

export function LayersHierarchy() {
  const report = useDesignerStore((state) => state.report);
  const selectedIds = useDesignerStore((state) => state.selectedIds);
  const selectedPageId = useDesignerStore((state) => state.selectedPageId);
  const activePageId = useDesignerStore((state) => state.activePageId);
  const setSelection = useDesignerStore((state) => state.setSelection);
  const selectPage = useDesignerStore((state) => state.selectPage);
  const treeRef = useRef<HTMLDivElement>(null);
  const reportIdRef = useRef(report.id);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    return readCollapsed(report.id) ?? defaultCollapsed(report, activePageId);
  });

  useEffect(() => {
    if (reportIdRef.current === report.id) return;
    reportIdRef.current = report.id;
    setCollapsed(readCollapsed(report.id) ?? defaultCollapsed(report, activePageId));
  }, [report.id]);

  const primaryId = getPrimarySelectedId(selectedIds);
  const layerCount = useMemo(() => {
    const bandCount = Object.keys(report.bands).length;
    const componentCount = Object.keys(report.components).length;
    return report.pages.length + bandCount + componentCount;
  }, [report]);

  const selectedAncestry = useMemo(() => {
    const ids = new Set<string>();
    if (selectedPageId) ids.add(selectedPageId);
    for (const id of selectedIds) {
      const component = report.components[id];
      if (component) {
        ids.add(component.parentId);
        const pageId = findPageIdForComponent(report, id);
        if (pageId) ids.add(pageId);
        continue;
      }
      const pageId = findPageIdForBand(report, id);
      if (pageId) ids.add(pageId);
    }
    return ids;
  }, [report, selectedIds, selectedPageId]);

  useEffect(() => {
    setCollapsed((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const id of selectedAncestry) {
        if (next.delete(id)) changed = true;
      }
      if (!changed) return prev;
      writeCollapsed(report.id, next);
      return next;
    });
  }, [report.id, selectedAncestry]);

  useEffect(() => {
    const targetId = primaryId ?? selectedPageId;
    if (!targetId || !treeRef.current) return;
    const row = treeRef.current.querySelector<HTMLElement>(`[data-layer-id="${targetId}"]`);
    row?.scrollIntoView({ block: 'nearest' });
  }, [primaryId, selectedPageId]);

  const toggleCollapsed = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeCollapsed(report.id, next);
      return next;
    });
  };

  const selectBandOrComponent = (id: string, event: MouseEvent<HTMLButtonElement>) => {
    setSelection(id, { mode: selectionModeFromEvent(event), bringToFront: false });
  };

  return (
    <div data-tour="layers">
      <PropertyAccordion
        title="Camadas"
        icon={Layers}
        sectionId="layers"
        reportId={report.id}
        badge={layerCount}
        defaultOpen
      >
      <div
        ref={treeRef}
        role="tree"
        aria-label="Hierarquia de páginas, bandas e componentes"
        className="-mx-1 max-h-60 overflow-y-auto overflow-x-hidden"
      >
        {report.pages.map((page) => {
          const pageExpanded = !collapsed.has(page.id);
          const pageSelected = selectedPageId === page.id && selectedIds.length === 0;
          const isActivePage = activePageId === page.id;
          const bandIds = [...getAllPlacedBandIds(page, report.bands)].reverse();

          return (
            <div key={page.id} role="group">
              <LayerRow
                id={page.id}
                label={page.name || 'Página'}
                icon={FileText}
                depth={0}
                selected={pageSelected}
                primary={pageSelected}
                expandable
                expanded={pageExpanded}
                activePage={isActivePage && !pageSelected}
                onToggle={() => toggleCollapsed(page.id)}
                onSelect={() => selectPage(page.id)}
              />

              {pageExpanded &&
                bandIds.map((bandId) => {
                  const band = report.bands[bandId];
                  if (!band) return null;
                  const BandIcon = BAND_ICONS[band.type] ?? Layers;
                  const bandExpanded = !collapsed.has(bandId);
                  const componentIds = [...band.components].reverse();
                  const hasComponents = componentIds.length > 0;
                  const bandSelected = isIdSelected(selectedIds, bandId);

                  return (
                    <div key={bandId} role="group">
                      <LayerRow
                        id={bandId}
                        label={band.name || getBandDisplayLabel(band.type)}
                        icon={BandIcon}
                        depth={1}
                        selected={bandSelected}
                        primary={primaryId === bandId}
                        expandable={hasComponents}
                        expanded={bandExpanded}
                        onToggle={() => toggleCollapsed(bandId)}
                        onSelect={(event) => selectBandOrComponent(bandId, event)}
                      />

                      {hasComponents &&
                        bandExpanded &&
                        componentIds.map((componentId) => {
                          const component = report.components[componentId];
                          if (!component) return null;
                          const CompIcon = COMPONENT_ICONS[component.type] ?? Type;
                          const componentSelected = isIdSelected(selectedIds, componentId);

                          return (
                            <LayerRow
                              key={componentId}
                              id={componentId}
                              label={layerComponentLabel(component)}
                              icon={CompIcon}
                              depth={2}
                              selected={componentSelected}
                              primary={primaryId === componentId}
                              onSelect={(event) => selectBandOrComponent(componentId, event)}
                            />
                          );
                        })}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
      </PropertyAccordion>
    </div>
  );
}
