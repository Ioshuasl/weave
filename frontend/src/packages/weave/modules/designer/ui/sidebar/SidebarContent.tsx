import { ChevronDown, CornerDownRight, ChevronRight, Database, GripVertical, List, Search, Settings2, X } from 'lucide-react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import React from 'react';
import { cn } from '../../../../shared/ui/cn';
import {
  getDataFieldLabel,
  getDataSourceChildren,
  getDataSourceKind,
  getDataSourceLabel,
  partitionDataSources,
} from '../../../data-source/domain';
import { useDataSourceCatalog } from '../../../data-source/ui';
import { useDesignerStore } from '../../application/store/DesignerStoreContext';
import { setDesignerDragData } from '../canvas/designerDragDrop';
import { GroupedListDialog } from './GroupedListDialog';
import { MAIN_ELEMENTS, MORE_ELEMENTS, type SidebarElement, getElementDragPayload } from './sidebarElements';
import type { BandType } from '../../../band/domain';
import type { ComponentType } from '../../../components/common/domain';

const normalizeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

function SidebarSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative px-3 py-3 border-b border-neutral-200 shrink-0" data-tour="sidebar-search">
      <Search className="pointer-events-none absolute left-5.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar elementos e campos…"
        aria-label="Buscar elementos e campos de dados"
        className="w-full min-w-0 h-8 rounded-lg border border-neutral-200 bg-weave-surface pl-8 pr-7 text-[12px] text-neutral-900 placeholder:text-neutral-400 transition-[border-color,box-shadow] hover:border-neutral-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpar busca"
          className="absolute right-4.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-neutral-400 hover:text-neutral-700"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function SidebarSection({
  title,
  children,
  className,
  tourId,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  tourId?: string;
}) {
  return (
    <section className={cn('px-3 py-2', className)} data-tour={tourId}>
      <h2 className="px-1 mb-2 text-[13px] font-semibold text-neutral-800">{title}</h2>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

function SidebarButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  title,
  draggablePayload,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  draggablePayload?: { type: 'band'; bandType: BandType } | { type: 'component'; componentType: ComponentType };
}) {
  const handleDragStart = (e: React.DragEvent) => {
    if (!draggablePayload) return;
    setDesignerDragData(e, draggablePayload);
  };

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial="rest"
        animate="rest"
        whileHover={disabled ? 'rest' : 'hover'}
        whileTap={disabled ? 'rest' : 'tap'}
        variants={{ rest: { scale: 1 }, hover: { scale: 1 }, tap: { scale: 0.98 } }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      >
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          draggable={Boolean(draggablePayload) && !disabled}
          onDragStart={handleDragStart}
          title={title ?? label}
          className={cn(
            'group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
            draggablePayload && !disabled && 'cursor-grab active:cursor-grabbing',
            !disabled && 'text-neutral-700 hover:bg-indigo-50/70 hover:text-indigo-700',
            disabled && 'text-neutral-400 opacity-50 cursor-not-allowed'
          )}
        >
          <motion.span
            className="flex shrink-0"
            variants={{ rest: { scale: 1, rotate: 0 }, hover: { scale: 1.12, rotate: -4 } }}
          >
            <Icon className="w-4 h-4 text-neutral-500 transition-colors group-hover:text-indigo-600" />
          </motion.span>
          <motion.span className="truncate text-left" variants={{ rest: { x: 0 }, hover: { x: 2 } }}>
            {label}
          </motion.span>
        </button>
      </motion.div>
    </MotionConfig>
  );
}

interface SidebarContentProps {
  /** Exibir só fontes de dados (flyout do ícone Database no rail) */
  dataOnly?: boolean;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({ dataOnly = false }) => {
  const addBand = useDesignerStore((state) => state.addBand);
  const addComponent = useDesignerStore((state) => state.addComponent);
  const addElement = useDesignerStore((state) => state.addElement);
  const selectedIds = useDesignerStore((state) => state.selectedIds);
  const report = useDesignerStore((state) => state.report);
  const primarySelectedId =
    selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null;
  const selectedBand = primarySelectedId ? report.bands[primarySelectedId] ?? null : null;
  const selectedComponent = primarySelectedId
    ? report.components[primarySelectedId] ?? null
    : null;
  const data = useDesignerStore((state) => state.data);
  const dataSourceCatalog = useDataSourceCatalog();
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [search, setSearch] = React.useState('');
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);
  const [isGroupedListOpen, setIsGroupedListOpen] = React.useState(false);
  const query = normalizeSearch(search);
  const matches = (text: string) => normalizeSearch(text).includes(query);
  const targetBandId =
    selectedBand && selectedBand.type !== 'divider'
      ? selectedBand.id
      : selectedComponent
        ? selectedComponent.parentId
        : null;

  const runElement = (element: SidebarElement) => {
    if (element.kind === 'groupedList') return setIsGroupedListOpen(true);
    if (element.kind === 'band') return addBand(element.type, { dataSource: lists[0] });
    // Dentro de uma lista/bloco selecionado entra nele; senão vira elemento solto na folha
    const targetBand = targetBandId ? report.bands[targetBandId] : null;
    if (targetBand && !targetBand.element) return addComponent(targetBand.id, element.type);
    addElement(element.type);
  };

  const renderElement = (element: SidebarElement) => (
    <SidebarButton
      key={element.label}
      icon={element.icon}
      label={element.label}
      onClick={() => runElement(element)}
      draggablePayload={getElementDragPayload(element)}
      title={element.description}
    />
  );

  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFieldDragStart = (e: React.DragEvent, dataset: string, field: string) => {
    setDesignerDragData(e, {
      type: 'field',
      content: `{${dataset}.${field}}`,
    });
  };

  const { singletons, lists } = partitionDataSources(data, dataSourceCatalog);
  const hasDatasets = singletons.length > 0 || lists.length > 0;

  const childrenOf = (dataset: string) => getDataSourceChildren(dataset, lists, dataSourceCatalog);

  const matchesDataset = (dataset: string) => {
    if (!query) return true;
    if (matches(getDataSourceLabel(dataset, dataSourceCatalog)) || matches(dataset)) return true;
    return Object.keys(data[dataset]?.[0] ?? {}).some(matches);
  };
  const matchesTree = (dataset: string): boolean =>
    matchesDataset(dataset) || childrenOf(dataset).some(matchesTree);

  const renderDataset = (dataset: string, depth: number): React.ReactNode => {
    const rows = data[dataset];
    const allFields = rows?.length > 0 ? Object.keys(rows[0]).filter((field) => !field.startsWith('__')) : [];
    const label = getDataSourceLabel(dataset, dataSourceCatalog);
    const datasetMatches = !query || matches(label) || matches(dataset);
    const fieldLabel = (field: string) => getDataFieldLabel(dataset, field, dataSourceCatalog);
    const fields = datasetMatches
      ? allFields
      : allFields.filter((field) => matches(field) || matches(fieldLabel(field)));
    const children = childrenOf(dataset).filter(matchesTree);
    const isSingleton = getDataSourceKind(dataset, data, dataSourceCatalog) === 'singleton';
    const isRoot = depth === 0;
    const isExpanded = query ? true : (expanded[dataset] ?? (isRoot && !isSingleton));
    const GroupIcon = isSingleton ? Settings2 : isRoot ? List : CornerDownRight;

    return (
      <div key={dataset} className="mb-0.5">
        <motion.button
          type="button"
          aria-expanded={isExpanded}
          whileTap={{ scale: 0.98 }}
          className="group w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-neutral-700 transition-colors hover:bg-neutral-100"
          onClick={() => toggleExpand(dataset)}
        >
          <span
            className={cn(
              'flex shrink-0 items-center justify-center rounded-md transition-colors',
              isRoot
                ? 'size-6 bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
                : 'size-5 bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200'
            )}
          >
            <GroupIcon className="w-3.5 h-3.5" />
          </span>
          <span className={cn('truncate text-left', isRoot ? 'text-[13px] font-medium' : 'text-[12.5px]')}>
            {label}
          </span>
          <motion.span
            className="ml-auto flex shrink-0 text-neutral-400"
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.18 }}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.span>
        </motion.button>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="ml-5 mt-0.5 mb-1 space-y-0.5 border-l border-neutral-200 pl-2">
                {fields.map((field) => (
                  <motion.div
                    key={field}
                    draggable
                    onDragStart={(e) => handleFieldDragStart(e as unknown as React.DragEvent, dataset, field)}
                    title="Arraste para a folha para mostrar esta informação"
                    whileHover={{ x: 2 }}
                    className="flex items-center gap-1.5 px-1.5 py-1.5 rounded-md cursor-grab active:cursor-grabbing group/field text-neutral-600 transition-colors hover:bg-indigo-50/70 hover:text-indigo-700"
                  >
                    <GripVertical className="w-3 h-3 shrink-0 text-neutral-300 transition-colors group-hover/field:text-indigo-400" />
                    <span className="text-[13px] truncate">{fieldLabel(field)}</span>
                  </motion.div>
                ))}
                {fields.length === 0 && children.length === 0 && (
                  <p className="text-xs text-neutral-400 pl-1 py-1">Nada para mostrar aqui</p>
                )}
                {children.length > 0 && (
                  <div className={cn(fields.length > 0 && 'pt-1.5')}>
                    {children.map((child) => renderDataset(child, depth + 1))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderGroup = (title: string, datasetKeys: string[], depth = 0) =>
    datasetKeys.length > 0 && (
      <div className="mb-3">
        <p className="px-2 mb-1 text-[11px] font-medium text-neutral-400">{title}</p>
        {datasetKeys.map((dataset) => renderDataset(dataset, depth))}
      </div>
    );

  const visibleSingletons = singletons.filter(matchesDataset);
  const visibleLists = lists.filter((key) => !dataSourceCatalog[key]?.parent || !lists.includes(dataSourceCatalog[key].parent!)).filter(matchesTree);
  const matchesElement = (element: SidebarElement) => matches(element.label) || matches(element.description);
  const visibleMain = MAIN_ELEMENTS.filter(matchesElement);
  const visibleMore = MORE_ELEMENTS.filter(matchesElement);
  const showMore = Boolean(query) || isMoreOpen;
  const hasResults =
    visibleMain.length + visibleMore.length + visibleSingletons.length + visibleLists.length > 0;

  const searchBar = <SidebarSearch value={search} onChange={setSearch} />;

  const dataSection = (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden" data-tour="datasets">
      <div className="px-3 pt-3 pb-1 shrink-0">
        <h2 className="px-1 text-[13px] font-semibold text-neutral-800 flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-neutral-500" />
          Dados do relatório
        </h2>
        <p className="px-1 pt-1 text-[11px] leading-snug text-neutral-400">
          Arraste uma informação até a folha para mostrá-la.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {!hasDatasets && (
          <p className="text-xs text-neutral-400 px-2 py-4 text-center">
            Nenhuma informação disponível.
          </p>
        )}

        {renderGroup('Dados gerais', visibleSingletons)}
        {renderGroup('Registros', visibleLists)}
      </div>
    </div>
  );

  if (dataOnly) {
    return (
      <div className="flex flex-col h-full min-h-0">
        {searchBar}
        {query && visibleSingletons.length + visibleLists.length === 0 ? (
          <p className="text-xs text-neutral-400 px-3 py-6 text-center">Nenhum resultado para “{search.trim()}”.</p>
        ) : (
          dataSection
        )}
      </div>
    );
  }

  return (
    <>
      {searchBar}

      {query && !hasResults && (
        <p className="text-xs text-neutral-400 px-3 py-6 text-center">Nenhum resultado para “{search.trim()}”.</p>
      )}

      {(visibleMain.length > 0 || visibleMore.length > 0) && (
        <SidebarSection title="Elementos" tourId="elements" className="border-b border-neutral-200/80 shrink-0">
          {visibleMain.map(renderElement)}
          {visibleMore.length > 0 && (
            <button
              type="button"
              onClick={() => setIsMoreOpen((open) => !open)}
              aria-expanded={showMore}
              className="flex w-full items-center gap-1.5 rounded-md px-1 pt-1.5 text-left text-[12px] font-medium text-neutral-500 hover:text-neutral-800"
            >
              {showMore ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              Mais elementos
              <span className="ml-auto rounded bg-neutral-100 px-1.5 text-[10px] text-neutral-500">
                {visibleMore.length}
              </span>
            </button>
          )}
          {showMore && visibleMore.map(renderElement)}
          <p className="px-1 pt-1 text-[10px] leading-snug text-neutral-400">
            Texto e Imagem entram no bloco selecionado na folha — ou arraste até o bloco.
          </p>
        </SidebarSection>
      )}

      {isGroupedListOpen && <GroupedListDialog onClose={() => setIsGroupedListOpen(false)} />}

      {(!query || visibleSingletons.length + visibleLists.length > 0) && dataSection}
    </>
  );
};
