import React, { useState } from 'react';
import {
  ChevronLeft,
  Database,
  LayoutTemplate,
  PanelLeft,
} from 'lucide-react';
import { useDesignerStore } from '../../store/designerStore';
import { cn } from '../../utils/cn';
import { setDesignerDragData } from '../../utils/designerDragDrop';
import type { BandType, ComponentType } from '../../types/report';
import { SIDEBAR_RAIL_CLASS } from './designerLayout';
import { BAND_ITEMS, COMPONENT_ITEMS, SidebarContent } from './SidebarContent';
import { SidebarFlyout } from './SidebarFlyout';

interface SidebarRailProps {
  onClose?: () => void;
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
  icon: React.ComponentType<{ className?: string }>;
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
        'flex items-center justify-center w-9 h-9 rounded-md transition-colors shrink-0',
        draggablePayload && 'cursor-grab active:cursor-grabbing',
        active
          ? 'bg-neutral-900 text-white'
          : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/60'
      )}
    >
      <Icon className="w-4 h-4" strokeWidth={2} />
    </button>
  );
}

export const SidebarRail: React.FC<SidebarRailProps> = ({
  onClose,
  flyoutOpen,
  onFlyoutOpenChange,
}) => {
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
  const targetBandId =
    selectedBand && selectedBand.type !== 'divider'
      ? selectedBand.id
      : selectedComponent
        ? selectedComponent.parentId
        : null;

  const [flyoutMode, setFlyoutMode] = useState<'palette' | 'data'>('palette');

  const openFlyout = (mode: 'palette' | 'data') => {
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
          'bg-[#fbfbfa] border-r border-neutral-200 flex flex-col h-full select-none z-20'
        )}
      >
        <div className="py-2 px-1.5 flex flex-col items-center gap-1 border-b border-neutral-200 shrink-0">
          {onClose && (
            <RailIconButton icon={ChevronLeft} label="Voltar ao sistema" onClick={onClose} />
          )}
          <RailIconButton
            icon={PanelLeft}
            label="Abrir paleta completa"
            active={flyoutOpen && flyoutMode === 'palette'}
            onClick={() => (flyoutOpen && flyoutMode === 'palette' ? closeFlyout() : openFlyout('palette'))}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-2 px-1.5 flex flex-col items-center gap-1">
          <div className="flex flex-col items-center gap-1" data-tour="bands">
            {BAND_ITEMS.map((item) => (
              <React.Fragment key={item.type}>
                <RailIconButton
                  icon={item.icon}
                  label={item.label}
                  onClick={() => addBand(item.type)}
                  draggablePayload={{ type: 'band', bandType: item.type }}
                />
              </React.Fragment>
            ))}
          </div>

          <div className="w-6 h-px bg-neutral-200 my-1 shrink-0" aria-hidden />

          <div className="flex flex-col items-center gap-1" data-tour="components">
            {COMPONENT_ITEMS.map((item) => (
              <React.Fragment key={item.type}>
                <RailIconButton
                  icon={item.icon}
                  label={item.label}
                  onClick={() => targetBandId && addComponent(targetBandId, item.type)}
                  draggablePayload={{ type: 'component', componentType: item.type }}
                />
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="py-2 px-1.5 flex flex-col items-center border-t border-neutral-200 shrink-0">
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
          <div
            className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center mt-1"
            title="Weave"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </aside>

      <SidebarFlyout
        isOpen={flyoutOpen}
        onClose={closeFlyout}
        title={flyoutMode === 'data' ? 'Fontes de dados' : 'Paleta'}
      >
        <SidebarContent dataOnly={flyoutMode === 'data'} />
      </SidebarFlyout>
    </>
  );
};
