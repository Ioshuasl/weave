import { type CSSProperties } from 'react';
import { Copy, Layout, Settings } from 'lucide-react';
import type { ReportPage } from '../../../page/domain';
import { useDesignerStore, useDesignerStoreApi } from '../../application/store/DesignerStoreContext';
import { getBandDisplayLabel } from '../../../band/domain';
import { getComponentDisplayLabel } from '../../../components/common/domain';
import { canBandAcceptPastedComponents } from '../../domain/designerClipboard';
import { buildGroupedDataFieldOptions } from '../../../expression/domain';
import {
  getPrimarySelectedId,
  getSelectedBandIds,
  getSelectedComponentIds,
} from '../../domain/selectionUtils';
import { useDataSourceCatalog } from '../../../data-source/ui';
import { PagePropertiesSection } from './page/PagePropertiesSection';
import { PropertiesPanelShell } from './PropertiesPanelShell';
import { BandProperties } from './band/BandProperties';
import { TextComponentProperties } from './components/TextComponentProperties';
import { MultiSelectionProperties } from './MultiSelectionProperties';
import { PropertiesPanelBreadcrumb } from './PropertiesPanelBreadcrumb';
import { LayersHierarchy } from './LayersHierarchy';

export const PropertiesPanel = () => {
  const designerStore = useDesignerStoreApi();
  const selectedIds = useDesignerStore((state) => state.selectedIds);
  const selectedPageId = useDesignerStore((state) => state.selectedPageId);
  const activePageId = useDesignerStore((state) => state.activePageId);
  const report = useDesignerStore((state) => state.report);
  const page =
    report.pages.find((p) => p.id === (selectedPageId ?? activePageId)) ?? report.pages[0];
  const updatePage = useDesignerStore((state) => state.updatePage);
  const applyPagePreset = useDesignerStore((state) => state.applyPagePreset);
  const flipPageOrientation = useDesignerStore((state) => state.flipPageOrientation);
  const primarySelectedId = getPrimarySelectedId(selectedIds);
  const selectedComponentIds = getSelectedComponentIds(selectedIds, report);
  const selectedBandIds = getSelectedBandIds(selectedIds, report);
  const isMultiComponentSelect =
    selectedComponentIds.length > 1 && selectedBandIds.length === 0;
  const selectedBand = primarySelectedId ? report.bands[primarySelectedId] ?? null : null;
  const selectedComponent = primarySelectedId
    ? report.components[primarySelectedId] ?? null
    : null;
  const selectedId = primarySelectedId;
  const updateComponent = useDesignerStore((state) => state.updateComponent);
  const updateBand = useDesignerStore((state) => state.updateBand);
  const removeSelected = useDesignerStore((state) => state.removeSelected);
  const duplicateSelected = useDesignerStore((state) => state.duplicateSelected);
  const copySelected = useDesignerStore((state) => state.copySelected);
  const pasteToTargetBand = useDesignerStore((state) => state.pasteToTargetBand);
  const clipboard = useDesignerStore((state) => state.clipboard);
  const data = useDesignerStore((state) => state.data);
  const dataSourceCatalog = useDataSourceCatalog();
  const canPasteHere =
    Boolean(clipboard?.items.length) &&
    (selectedBand
      ? canBandAcceptPastedComponents(selectedBand)
      : selectedComponent
        ? canBandAcceptPastedComponents(
            designerStore.getState().report.bands[selectedComponent.parentId]
          )
        : false);
  const groupedDataFields = buildGroupedDataFieldOptions(data, dataSourceCatalog);

  const patchSelectedComponentStyle = (patch: CSSProperties) => {
    if (!selectedId) return;
    const current = designerStore.getState().report.components[selectedId];
    if (!current) return;
    updateComponent(selectedId, { style: { ...current.style, ...patch } });
  };

  const hasValidSelection =
    selectedIds.length > 0 &&
    (selectedBandIds.length > 0 || selectedComponentIds.length > 0);

  const isPageSelected = selectedPageId === page.id;

  if (isPageSelected) {
    return (
      <PropertiesPanelShell
        title="Propriedades da folha"
        icon={Layout}
        variant="page"
        breadcrumb={<PropertiesPanelBreadcrumb pageName={page.name} />}
      >
        <PagePropertiesSection
          page={page}
          reportId={report.id}
          onApplyPreset={(presetId: string) => applyPagePreset(page.id, presetId)}
          onFlipOrientation={() => flipPageOrientation(page.id)}
          onUpdatePage={(
            updates: Partial<ReportPage>,
            options?: { scaleContent?: boolean }
          ) => updatePage(page.id, updates, options)}
        />
        <LayersHierarchy />
      </PropertiesPanelShell>
    );
  }

  if (!hasValidSelection) {
    return (
      <PropertiesPanelShell title="Propriedades" icon={Settings} variant="empty">
        <LayersHierarchy />
        <p className="text-[11px] text-neutral-400 leading-snug">
          Selecione uma camada na árvore, ou clique numa banda, componente ou na folha.
        </p>
      </PropertiesPanelShell>
    );
  }

  const panelTitle = isMultiComponentSelect
    ? `${selectedComponentIds.length} componentes`
    : selectedBand
      ? getBandDisplayLabel(selectedBand.type)
      : selectedComponent
        ? getComponentDisplayLabel(selectedComponent.type)
        : 'Seleção';

  const contextBand =
    selectedComponent && !isMultiComponentSelect
      ? report.bands[selectedComponent.parentId] ?? null
      : selectedBand;

  return (
    <PropertiesPanelShell
      title={panelTitle}
      icon={Settings}
      variant="selection"
      breadcrumb={
        !isMultiComponentSelect ? (
          <PropertiesPanelBreadcrumb band={contextBand} pageName={page.name} />
        ) : undefined
      }
      trailing={
        <button
          type="button"
          onClick={() => duplicateSelected()}
          className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
          title="Duplicar (Ctrl+D)"
          aria-label="Duplicar seleção"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      }
    >
      {isMultiComponentSelect && (
        <MultiSelectionProperties
          count={selectedComponentIds.length}
          onDuplicate={duplicateSelected}
          onRemove={removeSelected}
        />
      )}

      {selectedBand && selectedId && !isMultiComponentSelect && (
        <BandProperties
          band={selectedBand}
          bandId={selectedId}
          page={page}
          data={data}
          dataSourceCatalog={dataSourceCatalog}
          reportId={report.id}
          updateBand={updateBand}
          canPaste={canPasteHere}
          onPaste={() => pasteToTargetBand()}
          onDuplicate={duplicateSelected}
          onRemove={removeSelected}
        />
      )}

      {selectedComponent && selectedId && !isMultiComponentSelect && (
        <TextComponentProperties
          component={selectedComponent}
          componentId={selectedId}
          reportId={report.id}
          groupedDataFields={groupedDataFields}
          data={data}
          dataSourceCatalog={dataSourceCatalog}
          canPaste={canPasteHere}
          onUpdate={(updates) => updateComponent(selectedId, updates)}
          onPatchStyle={patchSelectedComponentStyle}
          onCopy={copySelected}
          onDuplicate={duplicateSelected}
          onPaste={() => pasteToTargetBand()}
          onRemove={removeSelected}
        />
      )}

      <LayersHierarchy />
    </PropertiesPanelShell>
  );
};
