import React from 'react';
import { useDesignerStore } from '../../store/designerStore';
import { cn } from '../../utils/cn';
import {
  FileText,
  Type,
  Image as ImageIcon,
  Database,
  Minus,
  Table as TableIcon,
  BarChart,
  Square,
  List,
  ListOrdered,
  Table2,
  Heading1,
  Heading2,
  GripHorizontal,
  Folder,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import type { BandType, ComponentType } from '../../types/report';
import { setDesignerDragData } from '../../utils/designerDragDrop';
import { useDataSourceCatalog } from './designerHostContext';
import {
  getDataSourceKind,
  getDataSourceLabel,
  partitionDataSources,
} from '../../utils/dataSourceUtils';

function SidebarSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('px-3 py-2', className)}>
      <h2 className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
        {title}
      </h2>
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
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      draggable={Boolean(draggablePayload) && !disabled}
      onDragStart={handleDragStart}
      title={title ?? label}
      className={cn(
        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors',
        draggablePayload && !disabled && 'cursor-grab active:cursor-grabbing',
        !disabled && 'text-neutral-700 hover:bg-neutral-100',
        disabled && 'text-neutral-400 opacity-50 cursor-not-allowed'
      )}
    >
      <Icon className="w-4 h-4 shrink-0 opacity-80" />
      <span className="truncate text-left">{label}</span>
    </button>
  );
}

export const BAND_ITEMS: {
  type: BandType;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}[] = [
  { type: 'reportTitle', icon: Heading1, label: 'Título' },
  { type: 'pageHeader', icon: Heading2, label: 'Cabeçalho' },
  { type: 'dataList', icon: List, label: 'Lista livre' },
  { type: 'dataListNumbered', icon: ListOrdered, label: 'Lista numerada' },
  { type: 'dataTable', icon: Table2, label: 'Tabela' },
  { type: 'divider', icon: Minus, label: 'Linha' },
  { type: 'pageFooter', icon: GripHorizontal, label: 'Rodapé' },
  { type: 'reportSummary', icon: FileText, label: 'Resumo' },
];

export const COMPONENT_ITEMS: {
  type: ComponentType;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}[] = [
  { type: 'text', icon: Type, label: 'Texto' },
  { type: 'shape', icon: Square, label: 'Forma' },
  { type: 'image', icon: ImageIcon, label: 'Imagem' },
  { type: 'table', icon: TableIcon, label: 'Tabela' },
  { type: 'chart', icon: BarChart, label: 'Gráfico' },
];

interface SidebarContentProps {
  /** Exibir só fontes de dados (flyout do ícone Database no rail) */
  dataOnly?: boolean;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({ dataOnly = false }) => {
  const addBand = useDesignerStore((state) => state.addBand);
  const addComponent = useDesignerStore((state) => state.addComponent);
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
  const targetBandId =
    selectedBand && selectedBand.type !== 'divider'
      ? selectedBand.id
      : selectedComponent
        ? selectedComponent.parentId
        : null;

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

  const renderDatasetGroup = (
    title: string,
    datasetKeys: string[],
    badge: string
  ) => {
    if (datasetKeys.length === 0) return null;

    return (
      <div className="mb-3">
        <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
          {title}
        </p>
        {datasetKeys.map((dataset) => {
          const isExpanded = expanded[dataset] !== false;
          const rows = data[dataset];
          const fields = rows?.length > 0 ? Object.keys(rows[0]) : [];
          const label = getDataSourceLabel(dataset, dataSourceCatalog);
          const kind = getDataSourceKind(dataset, data, dataSourceCatalog);

          return (
            <div key={dataset} className="mb-1">
              <button
                type="button"
                className="w-full flex items-center gap-1.5 px-2 py-1.5 hover:bg-neutral-200/50 rounded-md cursor-pointer text-neutral-700 transition-colors"
                onClick={() => toggleExpand(dataset)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                )}
                <Folder className="w-3.5 h-3.5 opacity-70 shrink-0" />
                <span className="text-sm font-medium truncate">{label}</span>
                <span className="text-[10px] text-neutral-400 ml-auto bg-neutral-200/50 px-1.5 rounded shrink-0">
                  {kind === 'singleton' ? badge : rows?.length ?? 0}
                </span>
              </button>

              {isExpanded && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-neutral-200/50 pl-2">
                  {fields.map((field) => (
                    <div
                      key={field}
                      draggable
                      onDragStart={(e) => handleFieldDragStart(e, dataset, field)}
                      className="flex items-center gap-2 px-2 py-1 hover:bg-neutral-200/50 rounded-md cursor-grab active:cursor-grabbing group transition-colors"
                    >
                      <FileText className="w-3 h-3 text-neutral-400 group-hover:text-neutral-600 shrink-0" />
                      <span className="text-xs text-neutral-600 group-hover:text-neutral-900 truncate">
                        {field}
                      </span>
                    </div>
                  ))}
                  {fields.length === 0 && (
                    <p className="text-xs text-neutral-400 italic pl-1 py-1">Sem campos</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const dataSection = (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="px-3 pt-3 pb-1 shrink-0">
        <h2 className="px-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
          <Database className="w-3 h-3" />
          Fontes de dados
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {!hasDatasets && (
          <p className="text-xs text-neutral-400 px-2 py-4 text-center">
            Nenhum dataset carregado.
          </p>
        )}

        {renderDatasetGroup('Configuração', singletons, 'config')}
        {renderDatasetGroup('Listas', lists, 'lista')}
      </div>
    </div>
  );

  if (dataOnly) {
    return <div className="flex flex-col h-full min-h-0">{dataSection}</div>;
  }

  return (
    <>
      <SidebarSection title="Bandas" className="border-b border-neutral-200/80 shrink-0">
        {BAND_ITEMS.map((item) => (
          <React.Fragment key={item.type}>
            <SidebarButton
              icon={item.icon}
              label={item.label}
              onClick={() => addBand(item.type)}
              draggablePayload={{ type: 'band', bandType: item.type }}
              title={`${item.label} — clique ou arraste para o canvas`}
            />
          </React.Fragment>
        ))}
      </SidebarSection>

      <SidebarSection title="Componentes" className="border-b border-neutral-200/80 shrink-0">
        <p className="px-2.5 pb-2 text-[10px] text-neutral-400 leading-snug">
          Arraste para uma banda no canvas ou selecione uma banda e clique para adicionar.
        </p>
        {COMPONENT_ITEMS.map((item) => (
          <React.Fragment key={item.type}>
            <SidebarButton
              icon={item.icon}
              label={item.label}
              onClick={() => targetBandId && addComponent(targetBandId, item.type)}
              draggablePayload={{ type: 'component', componentType: item.type }}
              title={`${item.label} — arraste para uma banda ou clique com banda selecionada`}
            />
          </React.Fragment>
        ))}
      </SidebarSection>

      {dataSection}
    </>
  );
};
