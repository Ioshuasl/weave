import {
  Calculator,
  Database,
  PanelLeft,
} from 'lucide-react';
import React, { useState } from 'react';
import { cn } from '../../../../shared/ui/cn';
import { useDesignerStore } from '../../application/store/DesignerStoreContext';
import { CalculosPanel } from '../calculos/CalculosPanel';
import { setDesignerDragData } from '../canvas/designerDragDrop';
import { SIDEBAR_RAIL_CLASS } from '../layout/designerLayout';
import { GroupedListDialog } from './GroupedListDialog';
import { SidebarContent } from './SidebarContent';
import { MAIN_ELEMENTS, type SidebarElement, getElementDragPayload } from './sidebarElements';
import { SidebarFlyout } from './SidebarFlyout';
import { partitionDataSources } from '../../../data-source/domain';
import { useDataSourceCatalog } from '../../../data-source/ui';
import type { BandType } from '../../../band/domain';
import type { ComponentType } from '../../../components/common/domain';

interface SidebarRailProps {
  flyoutOpen: boolean;
  onFlyoutOpenChange: (open: boolean) => void;
}

function RailIconButton({
  icon: Icon,
  label,
  onClick,
  active,
  draggablePayload,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  onClick?: () => void;
  active?: boolean;
  draggablePayload?:
    | { type: 'band'; bandType: BandType }
    | { type: 'component'; componentType: ComponentType };
}) {
  const handleDragStart = (e: React.DragEvent) => {
    if (!draggablePayload) return;
    setDesignerDragData(e, draggablePayload);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      draggable={Boolean(draggablePayload)}
      onDragStart={handleDragStart}
      className={cn(
        'flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0',
        draggablePayload && 'cursor-grab active:cursor-grabbing',
        active
          ? 'bg-indigo-50 text-indigo-600'
          : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
      )}
    >
      <Icon className="w-4 h-4" strokeWidth={2} />
    </button>
  );
}

export const SidebarRail: React.FC<SidebarRailProps> = ({
  flyoutOpen,
  onFlyoutOpenChange,
}) => {
  const addBand = useDesignerStore((state) => state.addBand);
  const addComponent = useDesignerStore((state) => state.addComponent);
  const addElement = useDesignerStore((state) => state.addElement);
  const selectedIds = useDesignerStore((state) => state.selectedIds);
  const report = useDesignerStore((state) => state.report);
  const data = useDesignerStore((state) => state.data);
  const dataSourceCatalog = useDataSourceCatalog();
  const primarySelectedId =
    selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null;
  const selectedBand = primarySelectedId ? report.bands[primarySelectedId] ?? null : null;
  const selectedComponent = primarySelectedId
    ? report.components[primarySelectedId] ?? null
    : null;
  const targetBandId =
    selectedBand && selectedBand.type !== 'divider'
      ? selectedBand.id
      : selectedComponent
        ? selectedComponent.parentId
        : null;

  const [flyoutMode, setFlyoutMode] = useState<'palette' | 'data' | 'calculos'>('palette');
  const [isGroupedListOpen, setIsGroupedListOpen] = useState(false);

  const runElement = (element: SidebarElement) => {
    if (element.kind === 'groupedList') return setIsGroupedListOpen(true);
    if (element.kind === 'band') return addBand(element.type, { dataSource: partitionDataSources(data, dataSourceCatalog).lists[0] });
    // Dentro de uma lista/bloco selecionado entra nele; senão vira elemento solto na folha
    const targetBand = targetBandId ? report.bands[targetBandId] : null;
    if (targetBand && !targetBand.element) return addComponent(targetBand.id, element.type);
    addElement(element.type);
  };

  const openFlyout = (mode: 'palette' | 'data' | 'calculos') => {
    setFlyoutMode(mode);
    onFlyoutOpenChange(true);
  };

  const closeFlyout = () => onFlyoutOpenChange(false);

  return (
    <>
      <aside
        data-tour="sidebar"
        className={cn(
          SIDEBAR_RAIL_CLASS,
          'bg-weave-surface border-r border-neutral-200 flex flex-col h-full select-none z-20'
        )}
      >
        <div className="py-2 px-1.5 flex flex-col items-center gap-1 border-b border-neutral-200 shrink-0">
          <RailIconButton
            icon={PanelLeft}
            label="Abrir paleta completa"
            active={flyoutOpen && flyoutMode === 'palette'}
            onClick={() => (flyoutOpen && flyoutMode === 'palette' ? closeFlyout() : openFlyout('palette'))}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-2 px-1.5 flex flex-col items-center gap-1">
          <div className="flex flex-col items-center gap-1" data-tour="elements">
            {MAIN_ELEMENTS.map((element) => (
              <RailIconButton
                key={element.label}
                icon={element.icon}
                label={`${element.label} — ${element.description}`}
                onClick={() => runElement(element)}
                draggablePayload={getElementDragPayload(element)}
              />
            ))}
          </div>
        </div>

        <div className="py-2 px-1.5 flex flex-col items-center border-t border-neutral-200 shrink-0">
          <RailIconButton
            icon={Calculator}
            label="Cálculos"
            active={flyoutOpen && flyoutMode === 'calculos'}
            onClick={() =>
              flyoutOpen && flyoutMode === 'calculos' ? closeFlyout() : openFlyout('calculos')
            }
          />
          <span data-tour="datasets">
            <RailIconButton
              icon={Database}
              label="Fontes de dados"
              active={flyoutOpen && flyoutMode === 'data'}
              onClick={() =>
                flyoutOpen && flyoutMode === 'data' ? closeFlyout() : openFlyout('data')
              }
            />
          </span>
        </div>
      </aside>

      <SidebarFlyout
        isOpen={flyoutOpen}
        onClose={closeFlyout}
        title={flyoutMode === 'data' ? 'Fontes de dados' : flyoutMode === 'calculos' ? 'Cálculos' : 'Paleta'}
        wide={flyoutMode === 'calculos'}
      >
        {flyoutMode === 'calculos' ? <CalculosPanel /> : <SidebarContent dataOnly={flyoutMode === 'data'} />}
      </SidebarFlyout>
      {isGroupedListOpen && <GroupedListDialog onClose={() => setIsGroupedListOpen(false)} />}
    </>
  );
};
