import { useCallback, useMemo, useState } from 'react';
import type { QrErrorCorrection, ReportComponent } from '../../../types/report';
import type { DataFieldOption } from '../../../utils/reportUtils';
import { evaluateExpression } from '../../../utils/reportUtils';
import type { DataSourceCatalog } from '../../../utils/dataSourceUtils';
import { pushRecentFieldToken } from '../../../utils/fieldRecentStorage';
import { useDesignerStore } from '../../../store/designerStore';
import {
  getQrBackground,
  getQrErrorCorrection,
  getQrForeground,
  getQrMargin,
} from '../../../utils/qrPropsUtils';
import {
  PropertyColorInput,
  PropertyHint,
  PropertyNumberInput,
  PropertySegmentedControl,
  PropertyTextarea,
} from '../PropertyFields';
import { FieldChipBar } from './FieldChipBar';
import { FieldTokenPicker } from './FieldTokenPicker';
import { ReportQr } from '../../ReportQr';

const ECC_OPTIONS: { value: QrErrorCorrection; label: string }[] = [
  { value: 'L', label: 'L' },
  { value: 'M', label: 'M' },
  { value: 'Q', label: 'Q' },
  { value: 'H', label: 'H' },
];

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
  const [recentVersion, setRecentVersion] = useState(0);
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

  const insertField = useCallback(
    (token: string) => {
      onUpdate({ content: token });
      pushRecentFieldToken(token, reportId);
      setRecentVersion((n) => n + 1);
    },
    [onUpdate, reportId]
  );

  return (
    <div className="space-y-3">
      <div className="relative h-24 rounded-md border border-neutral-200 overflow-hidden bg-white">
        <ReportQr
          value={previewValue}
          width={96}
          height={96}
          qrProps={qrProps}
        />
      </div>

      <PropertyTextarea
        label="Conteúdo do QR"
        value={component.content}
        onChange={(content) => onUpdate({ content })}
        placeholder="https://exemplo.com ou {dataset.campo}"
      />
      <PropertyHint>
        O código é gerado a partir deste texto. Insira um campo para variar por linha.
      </PropertyHint>

      <FieldChipBar
        singletons={groupedDataFields.singletons}
        reportId={reportId}
        recentVersion={recentVersion}
        onInsert={insertField}
      />
      <FieldTokenPicker
        singletons={groupedDataFields.singletons}
        lists={groupedDataFields.lists}
        reportId={reportId}
        insertHint="Clique em um campo para usar o valor no QR."
        onInsert={insertField}
      />

      <PropertySegmentedControl
        label="Correção de erro"
        value={getQrErrorCorrection(qrProps)}
        onChange={(errorCorrection) => patchQrProps({ errorCorrection })}
        options={ECC_OPTIONS}
      />

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
      <PropertyNumberInput
        label="Margem"
        min={0}
        max={8}
        value={getQrMargin(qrProps)}
        onChange={(margin) => patchQrProps({ margin })}
        hint="Módulos em branco ao redor do código."
      />
    </div>
  );
}
