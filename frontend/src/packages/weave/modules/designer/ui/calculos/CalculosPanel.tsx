import React, { useEffect, useMemo } from 'react';
import { createId } from '../../../../shared/domain/id';
import { getDataSourceKind } from '../../../data-source/domain';
import { useDataSourceCatalog } from '../../../data-source/ui';
import { MODELO_PADRAO, buildCalculoFormula, validateCalculos, type ReportCalculo } from '../../../expression/domain';
import { useDesignerStore } from '../../application/store/DesignerStoreContext';
import { CalculoCard, NOVOS_CALCULOS } from './CalculoCard';

/** Painel "Cálculos": cria e edita os cálculos com nome do layout, sem digitar fórmula. */
export function CalculosPanel() {
  const calculos = (useDesignerStore((state) => state.report.calculos)) ?? EMPTY;
  const data = useDesignerStore((state) => state.data as Record<string, unknown[]>);
  const setCalculos = useDesignerStore((state) => state.setCalculos);
  const renameCalculo = useDesignerStore((state) => state.renameCalculo);
  const setCalculosPanelOpen = useDesignerStore((state) => state.setCalculosPanelOpen);
  const dataSourceCatalog = useDataSourceCatalog();

  /** Enquanto o painel está aberto, o item selecionado no canvas não pode ficar por cima dele. */
  const handleOverlayOpen = () => {
    setCalculosPanelOpen(true);
    return () => setCalculosPanelOpen(false);
  };

  useEffect(handleOverlayOpen, [setCalculosPanelOpen]);

  const { campos, context } = useMemo(() => {
    const fields = new Set<string>();
    let row: Record<string, unknown> | undefined;
    for (const [dataset, rows] of Object.entries(data ?? {})) {
      const first = Array.isArray(rows) ? (rows[0] as Record<string, unknown> | undefined) : undefined;
      if (typeof first !== 'object' || first === null) continue;
      Object.keys(first).filter((key) => !key.startsWith('__')).forEach((key) => fields.add(key));
      if (!row && getDataSourceKind(dataset, data, dataSourceCatalog) === 'list') row = first;
    }
    return { campos: [...fields], context: { row, data, dataSourceCatalog } };
  }, [data, dataSourceCatalog]);

  const problemas = useMemo(() => Object.fromEntries(validateCalculos(calculos).map((item) => [item.calculoId, item.message])), [calculos]);

  const adicionar = (tipo: keyof typeof MODELO_PADRAO) => {
    const modelo = MODELO_PADRAO[tipo](campos[0] ?? '');
    setCalculos([...calculos, { id: createId(), nome: `Novo cálculo ${calculos.length + 1}`, formula: buildCalculoFormula(modelo) }]);
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2.5">
      <p className="text-[11px] leading-snug text-neutral-500">
        Crie um cálculo uma vez e use o nome no layout, na tabela e no resumo. Mudou um percentual? Altere aqui e todo o relatório acompanha.
      </p>
      <div className="flex flex-wrap gap-1">
        {NOVOS_CALCULOS.map((novo) => (
          <button key={novo.tipo} type="button" onClick={() => adicionar(novo.tipo)} className="rounded-md border border-neutral-200 bg-weave-surface px-2 py-1 text-[11px] text-neutral-700 hover:bg-neutral-100">
            {novo.rotulo}
          </button>
        ))}
      </div>
      {calculos.length === 0 && <p className="rounded-md border border-dashed border-neutral-300 p-3 text-center text-[12px] text-neutral-400">Nenhum cálculo ainda.</p>}
      {calculos.map((calculo) => (
        <CalculoCard
          key={calculo.id}
          calculo={calculo}
          calculos={calculos}
          campos={campos}
          context={context}
          problema={problemas[calculo.id]}
          onChange={(next) => setCalculos(calculos.map((item) => (item.id === calculo.id ? next : item)))}
          onRename={(nome) => renameCalculo(calculo.id, nome)}
          onRemove={() => setCalculos(calculos.filter((item) => item.id !== calculo.id))}
        />
      ))}
    </div>
  );
}

const EMPTY: ReportCalculo[] = [];
