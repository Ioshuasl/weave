import { BarChart3, PieChart } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';
import { DEFAULT_CHART_COLOR_PALETTE } from '../../../../components/chart/domain';
import { TextContentField } from '../../text-editor/TextContentField';
import {
  buildDatasetComboboxGroups,
  buildDatasetFieldComboboxOptions,
} from '../controls/comboboxOptions';
import {
  PropertyBorderInput,
  PropertyBorderRadiusInput,
  PropertyStrokeInput,
} from '../controls/PropertyBorderInput';
import { PropertyCombobox } from '../controls/PropertyCombobox';
import { PropertyAccordion } from '../controls/PropertyAccordion';
import {
  PropertyCheckbox,
  PropertyColorInput,
  PropertyFieldGrid,
  PropertyHint,
  PropertyNumberInput,
  PropertySegmentedControl,
} from '../controls/PropertyFields';
import { ChartColorPaletteEditor } from './ChartColorPaletteEditor';
import { useLiveChartPreview } from './useLiveChartPreview';
import type { ChartKind, ChartProps, ReportComponent } from '../../../../components/common/domain';
import type { DataSourceCatalog } from '../../../../data-source/domain';

function ChartTextField({
  label,
  value,
  onChange,
  data,
  dataSourceCatalog,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  data: Record<string, unknown[]>;
  dataSourceCatalog?: DataSourceCatalog;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <span className="block text-[12px] font-medium text-neutral-600">{label}</span>
      <TextContentField
        content={value}
        onContentChange={onChange}
        data={data}
        dataSourceCatalog={dataSourceCatalog}
        placeholder={placeholder}
      />
      {hint && <PropertyHint>{hint}</PropertyHint>}
    </div>
  );
}

export function ChartPropertiesSection({
  componentId,
  reportId,
  chartProps,
  data,
  dataSourceCatalog,
  onUpdate,
}: {
  componentId: string;
  reportId: string;
  chartProps: ChartProps;
  data: Record<string, unknown[]>;
  dataSourceCatalog?: DataSourceCatalog;
  onUpdate: (updates: Partial<ReportComponent>) => void;
}) {
  const chartKind: ChartKind = chartProps.chartKind ?? 'bar';
  const chartDataset = chartProps.dataset ?? '';
  const legendMode = chartProps.legendMode ?? 'auto';

  const chartFieldOptions = useMemo(
    () => buildDatasetFieldComboboxOptions(chartDataset, data, dataSourceCatalog),
    [chartDataset, data, dataSourceCatalog]
  );
  const chartDatasetGroups = useMemo(
    () => buildDatasetComboboxGroups(data, dataSourceCatalog, { listsOnly: true }),
    [data, dataSourceCatalog]
  );

  const { schedulePreview, commitVisualPatch, discardPreview } =
    useLiveChartPreview(componentId);

  const patchChart = useCallback(
    (patch: Partial<ChartProps>) => {
      onUpdate({ chartProps: { ...chartProps, ...patch } });
    },
    [chartProps, onUpdate]
  );

  const previewChart = useCallback(
    (patch: Partial<ChartProps>) => {
      schedulePreview(patch);
    },
    [schedulePreview]
  );

  const commitChart = useCallback(
    (patch: Partial<ChartProps>) => {
      commitVisualPatch(patch, () => patchChart(patch));
    },
    [commitVisualPatch, patchChart]
  );

  const setChartKind = (kind: ChartKind) => {
    if (kind === chartKind) return;

    if (kind === 'pie') {
      patchChart({
        chartKind: 'pie',
        nameKey: chartProps.nameKey ?? chartProps.xAxisKey ?? chartFieldOptions[0]?.value ?? '',
        valueKey:
          chartProps.valueKey ??
          chartProps.yAxisKey ??
          chartFieldOptions[1]?.value ??
          chartFieldOptions[0]?.value ??
          '',
        colorPalette: chartProps.colorPalette ?? [...DEFAULT_CHART_COLOR_PALETTE],
        innerRadius: chartProps.innerRadius ?? 0,
      });
      return;
    }

    patchChart({
      chartKind: 'bar',
      xAxisKey: chartProps.xAxisKey ?? chartProps.nameKey ?? chartFieldOptions[0]?.value ?? '',
      yAxisKey:
        chartProps.yAxisKey ??
        chartProps.valueKey ??
        chartFieldOptions[1]?.value ??
        chartFieldOptions[0]?.value ??
        '',
      barColor: chartProps.barColor ?? DEFAULT_CHART_COLOR_PALETTE[0],
      showGrid: chartProps.showGrid ?? true,
    });
  };

  const isBar = chartKind === 'bar';
  const fieldProps = { options: chartFieldOptions, placeholder: 'Escolha a informação…', searchPlaceholder: 'Buscar…', disabled: !chartDataset };

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <PropertySegmentedControl
          value={chartKind}
          onChange={setChartKind}
          options={[
            { value: 'bar', label: 'Barras', icon: BarChart3 },
            { value: 'pie', label: 'Pizza', icon: PieChart },
          ]}
        />

        <PropertyCombobox
          label="Gráfico de qual lista?"
          value={chartDataset}
          onChange={(dataset) => {
            const fields = buildDatasetFieldComboboxOptions(dataset, data);
            const first = fields[0]?.value ?? '';
            const second = fields[1]?.value ?? first;
            patchChart({ dataset, xAxisKey: first, yAxisKey: second, nameKey: first, valueKey: second });
          }}
          groups={chartDatasetGroups}
          placeholder="Escolha uma lista…"
          searchPlaceholder="Buscar lista…"
        />

        {isBar ? (
          <>
            <PropertyCombobox
              label="Nome de cada barra"
              value={chartProps.xAxisKey ?? ''}
              onChange={(xAxisKey) => patchChart({ xAxisKey })}
              {...fieldProps}
            />
            <PropertyCombobox
              label="Tamanho de cada barra"
              value={chartProps.yAxisKey ?? ''}
              onChange={(yAxisKey) => patchChart({ yAxisKey })}
              {...fieldProps}
            />
          </>
        ) : (
          <>
            <PropertyCombobox
              label="Nome de cada fatia"
              value={chartProps.nameKey ?? chartProps.xAxisKey ?? ''}
              onChange={(nameKey) => patchChart({ nameKey })}
              {...fieldProps}
            />
            <PropertyCombobox
              label="Tamanho de cada fatia"
              value={chartProps.valueKey ?? chartProps.yAxisKey ?? ''}
              onChange={(valueKey) => patchChart({ valueKey })}
              {...fieldProps}
            />
          </>
        )}
      </section>

      <PropertyAccordion title="Cores" sectionId="chart-colors" reportId={reportId} defaultOpen className="border-t border-neutral-100 pt-3">
        {isBar ? (
          <PropertyColorInput
            label="Cor das barras"
            value={chartProps.barColor ?? DEFAULT_CHART_COLOR_PALETTE[0]}
            onPreview={(barColor) => previewChart({ barColor })}
            onPreviewCancel={discardPreview}
            onChange={(barColor) => commitChart({ barColor })}
          />
        ) : (
          <ChartColorPaletteEditor
            colors={chartProps.colorPalette ?? [...DEFAULT_CHART_COLOR_PALETTE]}
            onChange={(colorPalette) => patchChart({ colorPalette })}
          />
        )}
        <PropertyColorInput
          label="Fundo do gráfico"
          value={chartProps.backgroundColor ?? '#ffffff'}
          onPreview={(backgroundColor) => previewChart({ backgroundColor })}
          onPreviewCancel={discardPreview}
          onChange={(backgroundColor) => commitChart({ backgroundColor })}
        />
        {isBar && (
          <PropertyCheckbox
            label="Mostrar linhas de grade"
            checked={chartProps.showGrid !== false}
            onChange={(showGrid) => patchChart({ showGrid })}
          />
        )}
      </PropertyAccordion>

      <PropertyAccordion title="Título e legenda" sectionId="chart-legend" reportId={reportId} defaultOpen className="border-t border-neutral-100 pt-3">
        <ChartTextField
          label="Título do gráfico"
          value={chartProps.titleContent ?? ''}
          onChange={(titleContent) => patchChart({ titleContent })}
          data={data}
          dataSourceCatalog={dataSourceCatalog}
          placeholder="Ex.: Protocolos do mês"
        />
        <PropertyCheckbox
          label="Mostrar legenda"
          checked={chartProps.showLegend !== false}
          onChange={(showLegend) => patchChart({ showLegend })}
        />
        <PropertyCheckbox
          label="Mostrar valor ao passar o mouse"
          checked={chartProps.showTooltip !== false}
          onChange={(showTooltip) => patchChart({ showTooltip })}
        />
      </PropertyAccordion>

      <PropertyAccordion title="Avançado" sectionId="chart-advanced" reportId={reportId} defaultOpen={false} className="border-t border-neutral-100 pt-3">
        {isBar ? (
          <>
            <ChartTextField
              label="Nome do eixo horizontal"
              value={chartProps.xAxisLabel ?? ''}
              onChange={(xAxisLabel) => patchChart({ xAxisLabel })}
              data={data}
              dataSourceCatalog={dataSourceCatalog}
              placeholder="Categorias"
            />
            <ChartTextField
              label="Nome do eixo vertical"
              value={chartProps.yAxisLabel ?? ''}
              onChange={(yAxisLabel) => patchChart({ yAxisLabel })}
              data={data}
              dataSourceCatalog={dataSourceCatalog}
              placeholder="Valores"
            />
            <PropertyStrokeInput
              label="Contorno das barras"
              color={chartProps.barStroke ?? '#ffffff'}
              width={chartProps.barStrokeWidth ?? 0}
              onColorPreview={(barStroke) => previewChart({ barStroke })}
              onColorChange={(barStroke) => commitChart({ barStroke })}
              onWidthPreview={(barStrokeWidth) => previewChart({ barStrokeWidth })}
              onWidthChange={(barStrokeWidth) => commitChart({ barStrokeWidth })}
            />
          </>
        ) : (
          <>
            <PropertyFieldGrid>
              <PropertyNumberInput
                label="Furo no centro"
                suffix="px"
                min={0}
                value={chartProps.innerRadius ?? 0}
                onChange={(innerRadius) => patchChart({ innerRadius })}
                hint="0 = pizza; maior = rosca."
              />
              <PropertyNumberInput
                label="Máx. de fatias"
                min={0}
                value={chartProps.maxSlices ?? 0}
                onChange={(maxSlices) => patchChart({ maxSlices: maxSlices || undefined })}
                hint="0 = todas."
              />
            </PropertyFieldGrid>
            <PropertyStrokeInput
              label="Contorno das fatias"
              color={chartProps.barStroke ?? '#ffffff'}
              width={chartProps.barStrokeWidth ?? 1}
              onColorChange={(barStroke) => patchChart({ barStroke })}
              onWidthChange={(barStrokeWidth) => patchChart({ barStrokeWidth })}
            />
          </>
        )}

        <PropertyBorderInput
          label="Borda do quadro"
          value={chartProps.border ?? ''}
          onPreview={(border) => previewChart({ border: border || undefined })}
          onChange={(border) => commitChart({ border: border || undefined })}
        />
        <PropertyBorderRadiusInput
          label="Cantos arredondados"
          value={chartProps.borderRadius ?? ''}
          onPreview={(borderRadius) => previewChart({ borderRadius: borderRadius || undefined })}
          onChange={(borderRadius) => commitChart({ borderRadius: borderRadius || undefined })}
        />

        <PropertySegmentedControl
          label="Texto da legenda"
          value={legendMode}
          onChange={(mode) =>
            patchChart({
              legendMode: mode,
              legendContent:
                mode === 'custom'
                  ? chartProps.legendContent ??
                    (chartKind === 'pie'
                      ? `_Distribuição_ por **{${chartDataset}.${chartProps.nameKey ?? 'name'}}**`
                      : `**${chartProps.yAxisKey ?? 'valor'}** por categoria`)
                  : chartProps.legendContent,
            })
          }
          options={[
            { value: 'auto', label: 'Automático' },
            { value: 'custom', label: 'Personalizado' },
          ]}
        />
        {legendMode === 'custom' && (
          <>
            <PropertySegmentedControl
              label="Posição da legenda"
              value={chartProps.legendPosition ?? 'bottom'}
              onChange={(legendPosition) => patchChart({ legendPosition })}
              options={[
                { value: 'top', label: 'Acima' },
                { value: 'bottom', label: 'Abaixo' },
              ]}
            />
            <ChartTextField
              label="Legenda personalizada"
              value={chartProps.legendContent ?? ''}
              onChange={(legendContent) => patchChart({ legendContent })}
              data={data}
              dataSourceCatalog={dataSourceCatalog}
              placeholder="Ex.: Vendas por **região**"
              hint="Aceita formatação e informações dos dados."
            />
          </>
        )}
        {legendMode === 'auto' && isBar && (
          <ChartTextField
            label="Nome na legenda"
            value={chartProps.seriesLabel ?? ''}
            onChange={(seriesLabel) => patchChart({ seriesLabel })}
            data={data}
            dataSourceCatalog={dataSourceCatalog}
            placeholder={chartProps.yAxisKey ?? 'Tamanho de cada barra'}
            hint="Deixe vazio para usar o nome da informação."
          />
        )}
      </PropertyAccordion>
    </div>
  );
}
