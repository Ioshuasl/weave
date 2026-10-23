import { useCallback, useMemo } from 'react';
import { getQrBackground, getQrErrorCorrection, getQrForeground, getQrMargin } from '../../../../components/qr/domain';
import { ReportQr } from '../../../../components/qr/ui';
import { type DataFieldOption, evaluateExpression } from '../../../../expression/domain';
import { useDesignerStore } from '../../../application/store/DesignerStoreContext';
import { PropertyAccordion } from '../controls/PropertyAccordion';
import { type ComboboxGroup, PropertyCombobox } from '../controls/PropertyCombobox';
import {
  PropertyColorInput,
  PropertyHint,
  PropertyNumberInput,
  PropertySegmentedControl,
  PropertyTextarea,
} from '../controls/PropertyFields';
import type { QrErrorCorrection, ReportComponent } from '../../../../components/common/domain';
import type { DataSourceCatalog } from '../../../../data-source/domain';

const ECC_OPTIONS: { value: QrErrorCorrection; label: string }[] = [
  { value: 'L', label: 'Baixa' },
  { value: 'M', label: 'Média' },
  { value: 'Q', label: 'Alta' },
  { value: 'H', label: 'Máxima' },
];

const FIELD_TOKEN = /^\{[^{}\n]+\}$/;

export function QrPropertiesSection({
  component,
  reportId,
  groupedDataFields,
  data,
  dataSourceCatalog,
  onUpdate,
}: {
  component: ReportComponent;
  reportId: string;
  groupedDataFields: {
    singletons: DataFieldOption[];
    lists: DataFieldOption[];
    all: DataFieldOption[];
  };
  data: Record<string, unknown[]>;
  dataSourceCatalog?: DataSourceCatalog;
  onUpdate: (updates: Partial<ReportComponent>) => void;
}) {
  const parentDataSource = useDesignerStore(
    (state) => state.report.bands[component.parentId]?.dataSource
  );
  const qrProps = component.qrProps;

  const previewValue = useMemo(() => {
    const rows = parentDataSource ? data[parentDataSource] : undefined;
    const first = Array.isArray(rows) ? rows[0] : undefined;
    const row =
      first && typeof first === 'object' && first !== null
        ? (first as Record<string, unknown>)
        : undefined;
    return evaluateExpression(component.content, { data, dataSourceCatalog, row });
  }, [component.content, data, dataSourceCatalog, parentDataSource]);

  const patchQrProps = useCallback(
    (patch: Partial<NonNullable<ReportComponent['qrProps']>>) => {
      onUpdate({ qrProps: { ...component.qrProps, ...patch } });
    },
    [component.qrProps, onUpdate]
  );

  const fieldGroups: ComboboxGroup[] = [
    { label: 'Dados gerais', options: groupedDataFields.singletons },
    { label: 'Registros', options: groupedDataFields.lists },
  ]
    .map((group) => ({
      label: group.label,
      options: group.options.map((opt) => ({ label: opt.label, value: opt.value })),
    }))
    .filter((group) => group.options.length > 0);
  const fieldToken = FIELD_TOKEN.test(component.content.trim()) ? component.content.trim() : '';

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex h-28 items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
          <div className="size-24 overflow-hidden rounded bg-white">
            <ReportQr value={previewValue} width={96} height={96} qrProps={qrProps} />
          </div>
        </div>

        <PropertyTextarea
          label="O que o QR Code contém"
          rows={2}
          value={component.content}
          onChange={(content) => onUpdate({ content })}
          placeholder="Um link ou texto, ex.: https://exemplo.com"
        />

        {fieldGroups.length > 0 && (
          <PropertyCombobox
            label="Ou usar uma informação dos dados"
            value={fieldToken}
            onChange={(token) => onUpdate({ content: token })}
            groups={fieldGroups}
            placeholder="Escolher informação…"
            searchPlaceholder="Buscar…"
            hint="Com uma informação dos dados, cada linha gera um QR Code diferente."
          />
        )}
      </div>

      <section className="space-y-3">
        <h4 className="text-[13px] font-semibold text-neutral-800">Cores</h4>
        <PropertyColorInput
          label="Cor do código"
          value={getQrForeground(qrProps)}
          onChange={(foreground) => patchQrProps({ foreground })}
        />
        <PropertyColorInput
          label="Fundo"
          value={getQrBackground(qrProps)}
          onChange={(background) => patchQrProps({ background })}
        />
      </section>

      <PropertyAccordion title="Avançado" sectionId="qr-advanced" reportId={reportId} defaultOpen={false}>
        <PropertySegmentedControl
          label="Resistência a falhas"
          value={getQrErrorCorrection(qrProps)}
          onChange={(errorCorrection) => patchQrProps({ errorCorrection })}
          options={ECC_OPTIONS}
        />
        <PropertyHint>Quanto maior, mais o código resiste a sujeira ou danos, mas fica mais denso.</PropertyHint>
        <PropertyNumberInput
          label="Margem"
          min={0}
          max={8}
          value={getQrMargin(qrProps)}
          onChange={(margin) => patchQrProps({ margin })}
          hint="Espaço em branco ao redor do código."
        />
      </PropertyAccordion>
    </div>
  );
}
