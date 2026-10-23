import { Link2 } from 'lucide-react';
import React from 'react';
import { type BandLink, type BandLinkPlacement, type ReportBand, isDataBand } from '../../../../band/domain';
import { getDataFieldLabel, getDataSourceLabel } from '../../../../data-source/domain';
import { useDataSourceCatalog } from '../../../../data-source/ui';
import { getReportPage } from '../../../../report/domain';
import { useDesignerStore } from '../../../application/store/DesignerStoreContext';
import { PropertyAccordion } from '../controls/PropertyAccordion';
import { PropertyCheckbox, PropertySegmentedControl, PropertySelect } from '../controls/PropertyFields';
import { BandConditionSection } from './BandConditionSection';

const PLACEMENT_OPTIONS: { label: string; value: BandLinkPlacement }[] = [
  { label: 'Abaixo', value: 'below' },
  { label: 'Ao lado', value: 'beside' },
  { label: 'Acima', value: 'above' },
];

const PLACEMENT_SENTENCE: Record<BandLinkPlacement, string> = {
  below: 'abaixo',
  beside: 'ao lado',
  above: 'acima',
};

function fieldsOf(dataSource: string | undefined, data: Record<string, unknown[]>): string[] {
  const first = dataSource ? data[dataSource]?.[0] : undefined;
  return first && typeof first === 'object' ? Object.keys(first) : [];
}

interface BandLinkPropertiesSectionProps {
  band: ReportBand;
  bandId: string;
  reportId: string;
  data: Record<string, unknown[]>;
  updateBand: (id: string, updates: Partial<ReportBand>) => void;
}

/** Vínculo mestre/detalhe: uma banda filha repete suas linhas dentro de cada linha da banda pai. */
export const BandLinkPropertiesSection: React.FC<BandLinkPropertiesSectionProps> = ({
  band,
  bandId,
  reportId,
  data,
  updateBand,
}) => {
  const report = useDesignerStore((state) => state.report);
  const catalog = useDataSourceCatalog();
  const datasetLabel = (dataset?: string) => (dataset ? getDataSourceLabel(dataset, catalog) : '');
  const fieldOptions = (dataset: string | undefined, fields: string[]) =>
    fields.map((field) => ({ label: dataset ? getDataFieldLabel(dataset, field, catalog) : field, value: field }));
  const activePageId = useDesignerStore((state) => state.activePageId);
  const page = getReportPage(report, activePageId);
  const candidates = (page?.bands ?? [])
    .map((id) => report.bands[id])
    .filter((item): item is ReportBand => Boolean(item) && item.id !== bandId && isDataBand(item.type));

  const link = band.link;
  const parent = link ? report.bands[link.parentBandId] : undefined;
  const parentFields = fieldsOf(parent?.dataSource, data);
  const ownFields = fieldsOf(band.dataSource, data);

  const patchLink = (patch: Partial<BandLink>) => {
    if (!link) return;
    updateBand(bandId, { link: { ...link, ...patch } });
  };

  const parentName = datasetLabel(parent?.dataSource) || parent?.name || '';
  const ownName = datasetLabel(band.dataSource) || band.name;
  const linkField = link?.field ?? link?.parentField;
  const summary = !link
    ? `Lista principal: uma linha para cada registro de ${ownName}.`
    : link.parentField && linkField
      ? `Para cada ${parentName}, mostra ${ownName} ${PLACEMENT_SENTENCE[link.placement ?? 'below']}, quando ` +
        `"${getDataFieldLabel(band.dataSource ?? '', linkField, catalog)}" for igual a ` +
        `"${getDataFieldLabel(parent?.dataSource ?? '', link.parentField, catalog)}".`
      : `Para cada ${parentName}, mostra ${ownName} ${PLACEMENT_SENTENCE[link.placement ?? 'below']}, usando a mesma linha.`;

  return (
    <>
      <PropertyAccordion
        title="Dentro de outra lista"
        icon={Link2}
        sectionId="band-link"
        reportId={reportId}
        defaultOpen={Boolean(link)}
        badge={link ? 'ativo' : undefined}
      >
        <p className="rounded-lg bg-neutral-50 px-3 py-2 text-[12px] leading-relaxed text-neutral-600">{summary}</p>

        <PropertySelect
          label="Esta lista aparece"
          value={link?.parentBandId ?? ''}
          onChange={(parentBandId) =>
            updateBand(bandId, {
              link: parentBandId ? { ...(link ?? {}), parentBandId, placement: link?.placement ?? 'below' } : undefined,
            })
          }
          options={[
            { label: 'Sozinha (lista principal)', value: '' },
            ...candidates.map((item) => ({
              label: `Dentro de cada linha de ${item.dataSource ? datasetLabel(item.dataSource) : item.name}`,
              value: item.id,
            })),
          ]}
        />

        {link && (
          <>
            <PropertySegmentedControl
              label="Posição"
              value={link.placement ?? 'below'}
              onChange={(placement) => patchLink({ placement })}
              options={PLACEMENT_OPTIONS}
            />
            <PropertySelect
              label={`Campo de ${parentName}`}
              value={link.parentField ?? ''}
              onChange={(parentField) => patchLink({ parentField: parentField || undefined })}
              options={[
                { label: 'Mostrar todos os registros', value: '' },
                ...fieldOptions(parent?.dataSource, parentFields),
              ]}
            />
            {link.parentField && (
              <PropertySelect
                label={`…igual ao campo de ${ownName}`}
                value={link.field ?? link.parentField}
                onChange={(field) => patchLink({ field })}
                options={fieldOptions(band.dataSource, ownFields)}
              />
            )}
          </>
        )}
      </PropertyAccordion>

      <BandConditionSection
        band={band}
        bandId={bandId}
        reportId={reportId}
        fields={[...new Set([...ownFields, ...parentFields])]}
        fieldLabel={(field) =>
          getDataFieldLabel(ownFields.includes(field) ? (band.dataSource ?? '') : (parent?.dataSource ?? ''), field, catalog)
        }
        updateBand={updateBand}
      />

      <PropertyAccordion title="Avançado" sectionId="band-link-advanced" reportId={reportId} defaultOpen={false}>
        <PropertyCheckbox
          label="Manter junto na mesma folha"
          checked={Boolean(band.keepTogether)}
          onChange={(keepTogether) => updateBand(bandId, { keepTogether })}
          hint="Evita que a linha e o que aparece dentro dela fiquem divididos entre duas folhas."
        />
        <PropertyCheckbox
          label="Altura automática (quebra de texto)"
          checked={Boolean(band.autoHeight)}
          onChange={(autoHeight) => updateBand(bandId, { autoHeight })}
        />
      </PropertyAccordion>
    </>
  );
};
