import { AnimatePresence, Reorder, motion } from 'framer-motion';
import {
  BarChart,
  ChevronRight,
  FileText,
  GripHorizontal,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Layers,
  List,
  ListOrdered,
  Minus,
  Plus,
  QrCode,
  Square,
  Table2,
  Type,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { cn } from '../../../../shared/ui/cn';
import { type BandType, getBandDisplayLabel } from '../../../band/domain';
import {
  type ComponentType,
  type ReportComponent,
  getComponentDisplayLabel,
} from '../../../components/common/domain';
import { richTextToPlainText } from '../../../components/text/domain';
import { useDesignerStore } from '../../application/store/DesignerStoreContext';
import {
  getPrimarySelectedId,
  isIdSelected,
  type SelectionMode,
} from '../../domain/selectionUtils';

/** Largura do painel flutuante sobre o canvas */
const PANEL_WIDTH = 272;

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

const layerComponentLabel = (component: ReportComponent): string => {
  if (component.name && !new RegExp(`^${component.type}\\d+$`, 'i').test(component.name))
    return component.name;
  const content = component.type === 'text' ? richTextToPlainText(component.content ?? '') : '';
  if (content && content !== 'Texto')
    return content.length > 32 ? `${content.slice(0, 32)}…` : content;
  return getComponentDisplayLabel(component.type);
};

const selectionModeFromEvent = (event: MouseEvent): SelectionMode =>
  event.ctrlKey || event.metaKey ? 'toggle' : event.shiftKey ? 'add' : 'replace';

function LayerRow({
  id,
  label,
  icon: Icon,
  depth,
  selected,
  primary,
  expanded,
  expandable,
  onToggle,
  onSelect,
  onRename,
}: {
  id: string;
  label: string;
  icon: typeof Type;
  depth: number;
  selected: boolean;
  primary?: boolean;
  expanded?: boolean;
  expandable?: boolean;
  onToggle?: () => void;
  onSelect: (event: MouseEvent<HTMLElement>) => void;
  onRename: (name: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  const commitRename = () => {
    const name = draft?.trim();
    if (name && name !== label) onRename(name);
    setDraft(null);
  };

  return (
    <div
      data-layer-id={id}
      role="treeitem"
      aria-selected={selected}
      aria-expanded={expandable ? expanded : undefined}
      onClick={onSelect}
      onDoubleClick={() => setDraft(label)}
      title={draft === null ? `${label} — duplo clique para renomear` : undefined}
      style={{ paddingLeft: 6 + depth * 16 }}
      className={cn(
        'group/layer flex h-7 min-w-0 cursor-default items-center gap-1 rounded-md pr-2 text-[13px] transition-colors',
        selected && primary && 'bg-sky-100 text-neutral-900',
        selected && !primary && 'bg-sky-50 text-neutral-900',
        !selected && 'text-neutral-700 hover:bg-neutral-100',
      )}
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
          onDoubleClick={(event) => event.stopPropagation()}
          className="flex size-4 shrink-0 items-center justify-center rounded text-neutral-400 hover:text-neutral-800"
        >
          <motion.span
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
            className="flex"
          >
            <ChevronRight className="size-3" aria-hidden />
          </motion.span>
        </button>
      ) : (
        <span className="size-4 shrink-0" aria-hidden />
      )}
      <Icon className="size-3.5 shrink-0 text-neutral-500" aria-hidden />
      {draft === null ? (
        <span className="truncate">{label}</span>
      ) : (
        <input
          autoFocus
          value={draft}
          aria-label="Renomear camada"
          onChange={(event) => setDraft(event.target.value)}
          onFocus={(event) => event.currentTarget.select()}
          onBlur={commitRename}
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commitRename();
            if (event.key === 'Escape') setDraft(null);
          }}
          className="h-5 min-w-0 flex-1 rounded border border-sky-400 bg-white px-1 text-[13px] text-neutral-900 outline-none"
        />
      )}
    </div>
  );
}

/** Lista reordenável por arraste (como o Figma); só grava no store ao soltar. */
function SortableLayers({
  ids,
  onCommit,
  renderItem,
}: {
  ids: string[];
  onCommit: (ids: string[]) => void;
  renderItem: (id: string) => ReactNode;
}) {
  const [draft, setDraft] = useState<string[] | null>(null);
  const order = draft ?? ids;

  const handleDragEnd = () => {
    if (draft && draft.join() !== ids.join()) onCommit(draft);
    setDraft(null);
  };

  return (
    <Reorder.Group as="div" axis="y" values={order} onReorder={setDraft} role="group">
      {order.map((id) => (
        <Reorder.Item
          key={id}
          as="div"
          value={id}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 1.02, boxShadow: '0 6px 18px rgba(0,0,0,0.12)', zIndex: 10 }}
          className="bg-weave-surface relative rounded-md"
        >
          {renderItem(id)}
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}

function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex h-8 items-center justify-between px-3">
      <h3 className="text-[13px] font-semibold text-neutral-900">{children}</h3>
      {action}
    </div>
  );
}

export function LayersPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const report = useDesignerStore((state) => state.report);
  const selectedIds = useDesignerStore((state) => state.selectedIds);
  const activePageId = useDesignerStore((state) => state.activePageId);
  const setSelection = useDesignerStore((state) => state.setSelection);
  const selectPage = useDesignerStore((state) => state.selectPage);
  const addReportPage = useDesignerStore((state) => state.addReportPage);
  const renameReportPage = useDesignerStore((state) => state.renameReportPage);
  const updatePage = useDesignerStore((state) => state.updatePage);
  const updateBand = useDesignerStore((state) => state.updateBand);
  const updateComponent = useDesignerStore((state) => state.updateComponent);
  const treeRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const primaryId = getPrimarySelectedId(selectedIds);
  const page = report.pages.find((item) => item.id === activePageId) ?? report.pages[0];

  const handleScrollToSelection = () => {
    const tree = treeRef.current;
    const row = primaryId
      ? tree?.querySelector<HTMLElement>(`[data-layer-id="${primaryId}"]`)
      : null;
    if (!tree || !row) return;
    const treeRect = tree.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    if (rowRect.top < treeRect.top) tree.scrollTop -= treeRect.top - rowRect.top;
    else if (rowRect.bottom > treeRect.bottom) tree.scrollTop += rowRect.bottom - treeRect.bottom;
  };

  useEffect(() => {
    handleScrollToSelection();
  }, [primaryId, isOpen]);

  const toggleCollapsed = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const select = (id: string, event: MouseEvent<HTMLElement>) =>
    setSelection(id, { mode: selectionModeFromEvent(event), bringToFront: false });

  const renderComponent = (componentId: string, depth: number) => {
    const component = report.components[componentId];
    if (!component) return null;
    return (
      <LayerRow
        id={componentId}
        label={layerComponentLabel(component)}
        icon={COMPONENT_ICONS[component.type] ?? Type}
        depth={depth}
        selected={isIdSelected(selectedIds, componentId)}
        primary={primaryId === componentId}
        onSelect={(event) => select(componentId, event)}
        onRename={(name) => updateComponent(componentId, { name })}
      />
    );
  };

  const renderBand = (bandId: string) => {
    const band = report.bands[bandId];
    if (!band) return null;

    // Elemento solto: mostra só o componente, direto sob a página
    if (band.element && report.components[band.components[0]])
      return renderComponent(band.components[0], 0);

    const componentIds = [...band.components].reverse();
    const isExpanded = !collapsed.has(bandId);

    return (
      <>
        <LayerRow
          id={bandId}
          label={band.name || getBandDisplayLabel(band.type)}
          icon={BAND_ICONS[band.type] ?? Layers}
          depth={0}
          selected={isIdSelected(selectedIds, bandId)}
          primary={primaryId === bandId}
          expandable={componentIds.length > 0}
          expanded={isExpanded}
          onToggle={() => toggleCollapsed(bandId)}
          onSelect={(event) => select(bandId, event)}
          onRename={(name) => updateBand(bandId, { name })}
        />
        <AnimatePresence initial={false}>
          {isExpanded && componentIds.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <SortableLayers
                ids={componentIds}
                onCommit={(ids) => updateBand(bandId, { components: [...ids].reverse() })}
                renderItem={(componentId) => renderComponent(componentId, 1)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  };

  const flowBandIds = page ? page.bands.filter((id) => report.bands[id]) : [];
  const dividerIds = page ? (page.dividers ?? []).filter((id) => report.bands[id]) : [];

  return (
    <AnimatePresence>
      {isOpen && page && (
        <motion.div
          initial={{ opacity: 0, x: -16, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -16, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
          className="absolute bottom-3 left-3 top-3 z-30 overflow-hidden rounded-xl border border-neutral-200 bg-weave-surface shadow-xl"
        >
          <aside
            data-tour="layers"
            aria-label="Camadas"
            style={{ width: PANEL_WIDTH }}
            className="flex h-full flex-col select-none"
          >
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-neutral-200 px-3">
              <span className="flex items-center gap-2 text-[13px] font-semibold text-neutral-900">
                <Layers className="size-3.5 text-neutral-500" aria-hidden />
                Camadas
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar camadas"
                title="Fechar"
                className="flex size-6 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="shrink-0 border-b border-neutral-200 pb-2">
              <SectionTitle
                action={
                  <button
                    type="button"
                    onClick={addReportPage}
                    aria-label="Nova página"
                    title="Nova página"
                    className="flex size-6 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                  >
                    <Plus className="size-4" />
                  </button>
                }
              >
                Páginas
              </SectionTitle>
              <div role="listbox" aria-label="Páginas" className="max-h-36 overflow-y-auto px-2">
                {report.pages.map((item) => (
                  <LayerRow
                    key={item.id}
                    id={item.id}
                    label={item.name || 'Página'}
                    icon={FileText}
                    depth={0}
                    selected={item.id === page.id}
                    primary
                    onSelect={() => selectPage(item.id)}
                    onRename={(name) => renameReportPage(item.id, name)}
                  />
                ))}
              </div>
            </div>

            <SectionTitle>Camadas</SectionTitle>
            <div
              ref={treeRef}
              role="tree"
              aria-label="Camadas da página"
              className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2 pb-2"
            >
              {dividerIds.map((id) => (
                <div key={id}>{renderBand(id)}</div>
              ))}
              <SortableLayers
                key={page.id}
                ids={[...flowBandIds].reverse()}
                onCommit={(ids) => updatePage(page.id, { bands: [...ids].reverse() })}
                renderItem={renderBand}
              />
            </div>
          </aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
