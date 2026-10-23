import { Filter } from 'lucide-react';
import React from 'react';
import {
  BAND_CONDITION_OPERATORS_WITHOUT_VALUE,
  BAND_CONDITION_OPERATOR_LABELS,
  type BandCondition,
  type BandConditionOperator,
  type ReportBand,
} from '../../../../band/domain';
import { PropertyAccordion } from '../controls/PropertyAccordion';
import { PropertyHint, PropertySelect, PropertyTextInput } from '../controls/PropertyFields';

const OPERATOR_OPTIONS = (
  Object.entries(BAND_CONDITION_OPERATOR_LABELS) as [BandConditionOperator, string][]
).map(([value, label]) => ({ label, value }));

interface BandConditionSectionProps {
  band: ReportBand;
  bandId: string;
  reportId: string;
  /** Campos disponíveis na linha (desta fonte e da banda pai) */
  fields: string[];
  /** Nome amigável do campo */
  fieldLabel: (field: string) => string;
  updateBand: (id: string, updates: Partial<ReportBand>) => void;
}

/** "Mostrar só quando": filtra as linhas da lista por um campo, sem precisar de regra no sistema. */
export const BandConditionSection: React.FC<BandConditionSectionProps> = ({
  band,
  bandId,
  reportId,
  fields,
  fieldLabel,
  updateBand,
}) => {
  const condition = band.showWhen;
  const needsValue = condition ? !BAND_CONDITION_OPERATORS_WITHOUT_VALUE.includes(condition.operator) : false;

  const patch = (next: Partial<BandCondition>) => {
    if (!condition) return;
    updateBand(bandId, { showWhen: { ...condition, ...next } });
  };

  return (
    <PropertyAccordion
      title="Mostrar só quando…"
      icon={Filter}
      sectionId="band-condition"
      reportId={reportId}
      defaultOpen={Boolean(condition)}
      badge={condition ? 'ativo' : undefined}
    >
      <PropertySelect
        label="Informação"
        value={condition?.field ?? ''}
        onChange={(field) =>
          updateBand(bandId, { showWhen: field ? { operator: 'eq', ...condition, field } : undefined })
        }
        options={[
          { label: 'Sempre mostrar todas as linhas', value: '' },
          ...fields.map((field) => ({ label: fieldLabel(field), value: field })),
        ]}
      />

      {condition && (
        <>
          <PropertySelect
            label="Condição"
            value={condition.operator}
            onChange={(operator) => patch({ operator })}
            options={OPERATOR_OPTIONS}
          />
          {needsValue && (
            <PropertyTextInput
              label="Valor"
              value={condition.value ?? ''}
              onChange={(value) => patch({ value })}
              placeholder="Ex.: 0"
            />
          )}
          <PropertyHint>
            Mostrar só quando “{fieldLabel(condition.field)}” {BAND_CONDITION_OPERATOR_LABELS[condition.operator]}
            {needsValue ? ` “${condition.value ?? ''}”` : ''}. Linhas que não atendem não são impressas.
          </PropertyHint>
        </>
      )}
    </PropertyAccordion>
  );
};
