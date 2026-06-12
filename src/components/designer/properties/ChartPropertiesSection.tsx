import React, { useCallback, useMemo } from 'react';
import { useLiveChartPreview } from '../../../hooks/useLiveChartPreview';
import type { ChartKind, ChartProps, ReportComponent } from '../../../types/report';
import type { DataSourceCatalog } from '../../../utils/dataSourceUtils';
import {
  buildDatasetComboboxGroups,
  buildDatasetFieldComboboxOptions,
} from '../../../utils/comboboxOptions';
import { DEFAULT_CHART_COLOR_PALETTE } from '../../../utils/chartUtils';
import {
  PropertyCheckbox,
  PropertyColorInput,
  PropertyFieldGrid,
  PropertyHint,
  PropertyNumberInput,
  PropertySegmentedControl,
} from '../PropertyFields';
import { TextContentField } from '../TextContentField';
import { PropertyCombobox } from './PropertyCombobox';
import { ChartColorPaletteEditor } from './ChartColorPaletteEditor';
import {
  PropertyBorderInput,
  PropertyBorderRadiusInput,
  PropertyStrokeInput,
} from './PropertyBorderInput';

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
      <span className="block text-[11px] font-medium text-neutral-600">{label}</span>
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
  chartProps,
  data,
  dataSourceCatalog,
  onUpdate,
}: {
  componentId: string;
  chartProps: ChartProps;
  data: Record<string, unknown[]>;
  dataSourceCatalog?: DataSourceCatalog;
  onUpdate: (updates: Partial<ReportComponent>) => void;
}) {
  const chartKind: ChartKind = chartProps.chartKind ?? 'bar';
  const chartDataset = chartProps.dataset ?? '';
  const legendMode = chartProps.legendMode ?? 'auto';

  const chartFieldOptions = useMemo(
    () => buildDatasetFieldComboboxOptions(chartDataset, data),
    [chartDataset, data]
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

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <span className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">
          Dados
        </span>
        <PropertySegmentedControl
          label="Tipo de gráfico"
          value={chartKind}
          onChange={setChartKind}
          options={[
            { value: 'bar', label: 'Barras' },
            { value: 'pie', label: 'Pizza' },
          ]}
        />

        <PropertyCombobox
          label="Fonte de dados"
          value={chartDataset}
          onChange={(dataset) => {
            const fields = buildDatasetFieldComboboxOptions(dataset, data);
            const first = fields[0]?.value ?? '';
            const second = fields[1]?.value ?? first;
            patchChart({
              dataset,
              xAxisKey: first,
              yAxisKey: second,
              nameKey: first,
              valueKey: second,
            });
          }}
          groups={chartDatasetGroups}
          placeholder="Selecione uma lista…"
          searchPlaceholder="Buscar fonte…"
          hint="Somente fontes repetíveis (listas)."
        />

        {chartKind === 'bar' ? (
          <>
            <PropertyCombobox
              label="Campo do eixo X"
              value={chartProps.xAxisKey ?? ''}
              onChange={(xAxisKey) => patchChart({ xAxisKey })}
              options={chartFieldOptions}
              placeholder="Selecione o campo…"
              searchPlaceholder="Buscar campo…"
              disabled={!chartDataset}
            />
            <PropertyCombobox
              label="Campo do eixo Y"
              value={chartProps.yAxisKey ?? ''}
              onChange={(yAxisKey) => patchChart({ yAxisKey })}
              options={chartFieldOptions}
              placeholder="Selecione o campo…"
              searchPlaceholder="Buscar campo…"
              disabled={!chartDataset}
            />
          </>
        ) : (
          <>
            <PropertyCombobox
              label="Campo do rótulo"
              value={chartProps.nameKey ?? chartProps.xAxisKey ?? ''}
              onChange={(nameKey) => patchChart({ nameKey })}
              options={chartFieldOptions}
              placeholder="Selecione o campo…"
              searchPlaceholder="Buscar campo…"
              disabled={!chartDataset}
            />
            <PropertyCombobox
              label="Campo do valor"
              value={chartProps.valueKey ?? chartProps.yAxisKey ?? ''}
              onChange={(valueKey) => patchChart({ valueKey })}
              options={chartFieldOptions}
              placeholder="Selecione o campo…"
              searchPlaceholder="Buscar campo…"
              disabled={!chartDataset}
            />
            <PropertyFieldGrid>
              <PropertyNumberInput
                label="Raio interno"
                suffix="px"
                min={0}
                value={chartProps.innerRadius ?? 0}
                onChange={(innerRadius) => patchChart({ innerRadius })}
                hint="0 = pizza; maior = donut."
              />
              <PropertyNumberInput
                label="Máx. fatias"
                min={0}
                value={chartProps.maxSlices ?? 0}
                onChange={(maxSlices) => patchChart({ maxSlices: maxSlices || undefined })}
                hint="0 = todas as linhas."
              />
            </PropertyFieldGrid>
          </>
        )}
      </div>

      <div className="space-y-3 pt-3 border-t border-neutral-100">
        <span className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">
          Aparência
        </span>

        {chartKind === 'bar' ? (
          <>
            <PropertyColorInput
              label="Cor da barra"
              value={chartProps.barColor ?? DEFAULT_CHART_COLOR_PALETTE[0]}
              onPreview={(barColor) => previewChart({ barColor })}
              onPreviewCancel={discardPreview}
              onChange={(barColor) => commitChart({ barColor })}
            />
            <PropertyStrokeInput
              label="Borda da barra"
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
            <ChartColorPaletteEditor
              colors={chartProps.colorPalette ?? [...DEFAULT_CHART_COLOR_PALETTE]}
              onChange={(colorPalette) => patchChart({ colorPalette })}
            />
            <PropertyStrokeInput
              label="Borda das fatias"
              color={chartProps.barStroke ?? '#ffffff'}
              width={chartProps.barStrokeWidth ?? 1}
              onColorChange={(barStroke) => patchChart({ barStroke })}
              onWidthChange={(barStrokeWidth) => patchChart({ barStrokeWidth })}
            />
          </>
        )}

        <PropertyColorInput
          label="Fundo do gráfico"
          value={chartProps.backgroundColor ?? '#ffffff'}
          onPreview={(backgroundColor) => previewChart({ backgroundColor })}
          onPreviewCancel={discardPreview}
          onChange={(backgroundColor) => commitChart({ backgroundColor })}
        />

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

        {chartKind === 'bar' && (
          <PropertyCheckbox
            label="Exibir grade"
            checked={chartProps.showGrid !== false}
            onChange={(showGrid) => patchChart({ showGrid })}
          />
        )}
      </div>

      <div className="space-y-3 pt-3 border-t border-neutral-100">
        <span className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">
          Legendas e rótulos
        </span>

        <PropertyFieldGrid>
          <PropertyCheckbox
            label="Exibir legenda"
            checked={chartProps.showLegend !== false}
            onChange={(showLegend) => patchChart({ showLegend })}
          />
          <PropertyCheckbox
            label="Tooltip"
            checked={chartProps.showTooltip !== false}
            onChange={(showTooltip) => patchChart({ showTooltip })}
          />
        </PropertyFieldGrid>

        <PropertySegmentedControl
          label="Modo da legenda"
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
            { value: 'auto', label: 'Automática' },
            { value: 'custom', label: 'Personalizada' },
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
              placeholder="Ex.: Vendas por **região** — {users.name}"
              hint="Suporta formatação e campos de dados."
            />
          </>
        )}

        {legendMode === 'auto' && chartKind === 'bar' && (
          <ChartTextField
            label="Nome na legenda automática"
            value={chartProps.seriesLabel ?? ''}
            onChange={(seriesLabel) => patchChart({ seriesLabel })}
            data={data}
            dataSourceCatalog={dataSourceCatalog}
            placeholder={chartProps.yAxisKey ?? 'Campo do eixo Y'}
            hint="Deixe vazio para usar o nome do campo Y."
          />
        )}

        <ChartTextField
          label="Título do gráfico"
          value={chartProps.titleContent ?? ''}
          onChange={(titleContent) => patchChart({ titleContent })}
          data={data}
          dataSourceCatalog={dataSourceCatalog}
          placeholder="Ex.: **Vendas** do período"
        />

        {chartKind === 'bar' && (
          <>
            <ChartTextField
              label="Rótulo eixo X"
              value={chartProps.xAxisLabel ?? ''}
              onChange={(xAxisLabel) => patchChart({ xAxisLabel })}
              data={data}
              dataSourceCatalog={dataSourceCatalog}
              placeholder="Categorias"
            />
            <ChartTextField
              label="Rótulo eixo Y"
              value={chartProps.yAxisLabel ?? ''}
              onChange={(yAxisLabel) => patchChart({ yAxisLabel })}
              data={data}
              dataSourceCatalog={dataSourceCatalog}
              placeholder="Valores"
            />
          </>
        )}

        {chartKind === 'pie' && legendMode === 'auto' && (
          <PropertyHint>
            A legenda automática lista as fatias pelo campo de rótulo.
          </PropertyHint>
        )}
      </div>
    </div>
  );
}
