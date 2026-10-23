import { GripVertical, Trash2, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { cn } from '../../../../shared/ui/cn';
import {
  MODELO_PADRAO,
  OPERADORES,
  buildCalculoFormula,
  parseCalculoModelo,
  previewCalculo,
  type CalculoCondicao,
  type CalculoModelo,
  type FormulaContext,
  type ReportCalculo,
} from '../../../expression/domain';
import { setDesignerDragData } from '../canvas/designerDragDrop';
import { FieldSelect, TokenSelect, inputClass, labelClass } from './calculoControls';

interface CalculoCardProps {
  calculo: ReportCalculo;
  calculos: ReportCalculo[];
  campos: string[];
  context: FormulaContext;
  problema?: string;
  onChange: (next: ReportCalculo) => void;
  onRename: (nome: string) => void;
  onRemove: () => void;
}

const TIPO_ROTULO: Record<CalculoModelo['tipo'], string> = {
  percentual: 'Percentual',
  soma: 'Soma de cálculos',
  regra: 'Regra se / então',
  formula: 'Fórmula',
};

const USOS = [
  { rotulo: 'Valor da linha', token: (nome: string) => `{MOEDA(${nome})}` },
  { rotulo: 'Soma das linhas', token: (nome: string) => `{MOEDA(SOMA(${nome}))}` },
  { rotulo: 'Sobre o total', token: (nome: string) => `{MOEDA(TOTAL(${nome}))}` },
];

export function CalculoCard({ calculo, calculos, campos, context, problema, onChange, onRename, onRemove }: CalculoCardProps) {
  const [verFormula, setVerFormula] = useState(false);
  const [nome, setNome] = useState(calculo.nome);
  const outros = useMemo(() => calculos.filter((item) => item.id !== calculo.id).map((item) => item.nome).filter(Boolean), [calculos, calculo.id]);
  const modelo = useMemo(() => parseCalculoModelo(calculo.formula, calculos.map((item) => item.nome)), [calculo.formula, calculos]);
  const previa = useMemo(() => previewCalculo(calculo, calculos, context), [calculo, calculos, context]);
  const casas = calculo.casas ?? 2;

  const setModelo = (next: CalculoModelo) => onChange({ ...calculo, formula: buildCalculoFormula(next) });
  const setCondicao = (index: number, parcial: Partial<CalculoCondicao>) =>
    modelo.tipo === 'regra' &&
    setModelo({ ...modelo, condicoes: modelo.condicoes.map((item, i) => (i === index ? { ...item, ...parcial } : item)) });

  return (
    <section className="rounded-lg border border-neutral-200 bg-weave-surface p-2.5 space-y-2" aria-label={`Cálculo ${calculo.nome}`}>
      <header className="flex items-center gap-1.5">
        <input
          className={cn(inputClass, 'flex-1 font-semibold')}
          value={nome}
          placeholder="Nome do cálculo"
          aria-label="Nome do cálculo"
          onChange={(event) => setNome(event.target.value)}
          onBlur={() => nome !== calculo.nome && onRename(nome)}
        />
        <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500">{TIPO_ROTULO[modelo.tipo]}</span>
        <button type="button" onClick={onRemove} title="Excluir cálculo" aria-label="Excluir cálculo" className="shrink-0 p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </header>

      {modelo.tipo === 'percentual' && (
        <div className="flex items-center gap-1.5">
          <FieldSelect value={modelo.base} campos={campos} onChange={(base) => setModelo({ ...modelo, base })} />
          <span className="text-[12px] text-neutral-500">×</span>
          <input
            className={cn(inputClass, 'w-16 text-right')}
            inputMode="decimal"
            value={modelo.percentual}
            aria-label="Percentual"
            onChange={(event) => setModelo({ ...modelo, percentual: event.target.value.replace(/[^\d.,]/g, '') })}
          />
          <span className="text-[12px] text-neutral-500">%</span>
        </div>
      )}

      {modelo.tipo === 'soma' && (
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-1">
            {modelo.termos.length === 0 && <p className="text-[11px] text-neutral-400">Escolha o que será somado.</p>}
            {modelo.termos.map((termo, index) => (
              <span key={`${termo}-${index}`} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-700">
                {termo.replace(/^\[|\]$/g, '')}
                <button type="button" aria-label={`Remover ${termo}`} onClick={() => setModelo({ ...modelo, termos: modelo.termos.filter((_, i) => i !== index) })}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <TokenSelect campos={campos} nomes={outros} placeholder="+ adicionar à soma" onPick={(token) => setModelo({ ...modelo, termos: [...modelo.termos, token] })} className="w-full" />
        </div>
      )}

      {modelo.tipo === 'regra' && (
        <div className="space-y-1.5">
          {modelo.condicoes.map((condicao, index) => (
            <div key={index} className="flex items-center gap-1">
              <span className={cn(labelClass, 'w-7 shrink-0')}>{index === 0 ? 'Se' : modelo.ligacao === 'E' ? 'e' : 'ou'}</span>
              <FieldSelect value={condicao.campo} campos={campos} onChange={(campo) => setCondicao(index, { campo })} />
              <select className={cn(inputClass, 'cursor-pointer w-[7.5rem]')} value={condicao.operador} aria-label="Operador" onChange={(event) => setCondicao(index, { operador: event.target.value as CalculoCondicao['operador'] })}>
                {OPERADORES.map((operador) => (
                  <option key={operador.valor} value={operador.valor}>
                    {operador.rotulo}
                  </option>
                ))}
              </select>
              <input className={cn(inputClass, 'w-16')} value={condicao.valor} aria-label="Valor" onChange={(event) => setCondicao(index, { valor: event.target.value })} />
              {modelo.condicoes.length > 1 && (
                <button type="button" aria-label="Remover condição" className="p-0.5 text-neutral-400 hover:text-red-600" onClick={() => setModelo({ ...modelo, condicoes: modelo.condicoes.filter((_, i) => i !== index) })}>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2 pl-8">
            <button type="button" className="text-[11px] text-indigo-600 hover:underline" onClick={() => setModelo({ ...modelo, condicoes: [...modelo.condicoes, { campo: campos[0] ?? '', operador: '>', valor: '0' }] })}>
              + condição
            </button>
            {modelo.condicoes.length > 1 && (
              <select className={cn(inputClass, 'h-6 w-40 cursor-pointer')} value={modelo.ligacao} aria-label="Ligação das condições" onChange={(event) => setModelo({ ...modelo, ligacao: event.target.value as 'E' | 'OU' })}>
                <option value="E">todas precisam valer</option>
                <option value="OU">basta uma valer</option>
              </select>
            )}
          </div>
          {([['entao', 'então'], ['senao', 'senão']] as const).map(([chave, rotulo]) => (
            <div key={chave} className="flex items-center gap-1">
              <span className={cn(labelClass, 'w-7 shrink-0')}>{rotulo}</span>
              <input className={cn(inputClass, 'flex-1')} value={modelo[chave]} aria-label={`Valor ${rotulo}`} placeholder="0" onChange={(event) => setModelo({ ...modelo, [chave]: event.target.value })} />
              <TokenSelect campos={campos} nomes={outros} placeholder="usar…" onPick={(token) => setModelo({ ...modelo, [chave]: token })} className="w-20" />
            </div>
          ))}
        </div>
      )}

      {(verFormula || modelo.tipo === 'formula') && (
        <div className="space-y-1">
          <span className={labelClass}>Fórmula</span>
          <textarea
            className={cn(inputClass, 'h-16 w-full py-1 font-mono resize-y')}
            value={calculo.formula}
            spellCheck={false}
            placeholder="Ex.: ARREDONDAR([valor_emolumento] * 2%; 2)"
            onChange={(event) => onChange({ ...calculo, formula: event.target.value })}
          />
          <TokenSelect campos={campos} nomes={outros} placeholder="inserir campo ou cálculo…" onPick={(token) => onChange({ ...calculo, formula: `${calculo.formula}${calculo.formula && !calculo.formula.endsWith(' ') ? ' ' : ''}${token}` })} className="w-full" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-600">
        <label className="inline-flex items-center gap-1">
          <input type="checkbox" checked={calculo.arredondar !== false} onChange={(event) => onChange({ ...calculo, arredondar: event.target.checked })} />
          Arredondar em
          <input className={cn(inputClass, 'h-6 w-9 px-1 text-center')} inputMode="numeric" value={casas} aria-label="Casas decimais" disabled={calculo.arredondar === false} onChange={(event) => onChange({ ...calculo, casas: Math.min(6, Number(event.target.value.replace(/\D/g, '')) || 0) })} />
          casas
        </label>
        {modelo.tipo !== 'percentual' && (
          <label className="inline-flex items-center gap-1" title="Soma as parcelas sem arredondar e arredonda só o resultado final">
            <input type="checkbox" checked={calculo.somenteNoFinal === true} onChange={(event) => onChange({ ...calculo, somenteNoFinal: event.target.checked })} />
            Arredondar só no final
          </label>
        )}
        {modelo.tipo !== 'formula' && (
          <button type="button" className="text-indigo-600 hover:underline" onClick={() => setVerFormula((atual) => !atual)}>
            {verFormula ? 'Ocultar fórmula' : 'Ver como fórmula'}
          </button>
        )}
      </div>

      <div className={cn('rounded-md px-2 py-1 text-[11px]', previa.porLinha.ok && !problema ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700')} role="status">
        {problema ? (
          <p>⚠ {problema}</p>
        ) : previa.porLinha.ok ? (
          <p>
            Linha de exemplo: <strong>{previa.porLinha.preview}</strong>
            {previa.total.ok && (
              <>
                {' · '}Sobre o total: <strong>{previa.total.preview}</strong>
              </>
            )}
          </p>
        ) : (
          <p>
            ⚠ {previa.porLinha.message} {previa.porLinha.suggestion}
          </p>
        )}
      </div>

      {calculo.nome.trim() !== '' && (
        <div className="flex flex-wrap items-center gap-1">
          <span className={cn(labelClass, 'inline-flex items-center gap-0.5')}>
            <GripVertical className="w-3 h-3" />
            Arraste para o layout:
          </span>
          {USOS.map((uso) => (
            <span
              key={uso.rotulo}
              draggable
              onDragStart={(event) => setDesignerDragData(event, { type: 'field', content: uso.token(calculo.nome) })}
              className="cursor-grab rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] text-indigo-700 active:cursor-grabbing"
              title={uso.token(calculo.nome)}
            >
              {uso.rotulo}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

export const NOVOS_CALCULOS: { tipo: CalculoModelo['tipo']; rotulo: string }[] = [
  { tipo: 'percentual', rotulo: '+ Percentual' },
  { tipo: 'soma', rotulo: '+ Soma' },
  { tipo: 'regra', rotulo: '+ Regra se / então' },
  { tipo: 'formula', rotulo: '+ Fórmula' },
];

export { MODELO_PADRAO };
