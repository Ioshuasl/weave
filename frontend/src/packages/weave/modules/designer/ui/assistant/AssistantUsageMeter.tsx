import { Coins } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../../../shared/ui/cn';
import {
  formatLatency,
  formatTokenCount,
  isLocalUsage,
  sliceAssistantUsage,
  sumAssistantUsage,
  type AssistantUsage,
  type AssistantUsageSlices,
} from '../../../assistant/domain';

/** Fatias na ordem em que aparecem na barra; cores fixas para a barra, a legenda e os mini-gráficos baterem */
const SLICES: { key: keyof Omit<AssistantUsageSlices, 'total'>; label: string; hint: string; color: string }[] = [
  { key: 'fresh', label: 'Entrada nova', hint: 'Instruções e relatório lidos do zero', color: 'bg-indigo-500' },
  { key: 'cached', label: 'Entrada em cache', hint: 'Reaproveitada (custa ~10x menos)', color: 'bg-emerald-400' },
  { key: 'reasoning', label: 'Raciocínio', hint: 'O modelo pensando antes de responder', color: 'bg-amber-400' },
  { key: 'answer', label: 'Resposta', hint: 'Texto e ações devolvidos', color: 'bg-sky-500' },
];

const MAX_BARS = 12;

function SegmentedBar({ slices, className }: { slices: AssistantUsageSlices; className?: string }) {
  return (
    <div className={cn('flex w-full overflow-hidden rounded-full bg-neutral-200', className)} role="img" aria-label={`${slices.total} tokens`}>
      {SLICES.map(({ key, color }) => (slices[key] > 0 ? <span key={key} className={color} style={{ width: `${(slices[key] / slices.total) * 100}%` }} /> : null))}
    </div>
  );
}

/** Chip no cabeçalho do assistente + popover com o consumo de tokens (último pedido e sessão). */
export function AssistantUsageMeter({ usage, defaultOpen = false }: { usage: AssistantUsage[]; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const last = usage[usage.length - 1];
  const lastSlices = sliceAssistantUsage(last);
  const session = sumAssistantUsage(usage);
  const recent = usage.slice(-MAX_BARS).map(sliceAssistantUsage);
  const peak = Math.max(...recent.map((s) => s.total), 1);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label="Consumo de tokens"
        title="Consumo de tokens"
        className={cn(
          'mr-1 flex h-6 items-center gap-1.5 rounded-full border border-neutral-200 px-2 text-[11px] font-medium tabular-nums text-neutral-600 transition-colors hover:bg-neutral-100',
          isOpen && 'bg-neutral-100'
        )}
      >
        {session.total > 0 ? <SegmentedBar slices={session} className="h-1.5 w-8" /> : <Coins className="size-3" aria-hidden />}
        {formatTokenCount(session.total)}
      </button>

      {isOpen && (
        <>
          <button type="button" aria-hidden tabIndex={-1} onClick={() => setIsOpen(false)} className="absolute inset-0 z-30 cursor-default" />
          <div
            role="dialog"
            aria-label="Consumo de tokens"
            onKeyDown={(event) => event.key === 'Escape' && setIsOpen(false)}
            className="absolute right-2 top-11 z-40 w-[296px] rounded-xl border border-neutral-200 bg-weave-surface p-3 text-[12px] shadow-xl"
          >
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[13px] font-semibold text-neutral-900">Último pedido</span>
              <span className="tabular-nums text-neutral-500">{isLocalUsage(last) ? 'sem IA' : `${formatTokenCount(lastSlices.total)} tokens`}</span>
            </div>

            {lastSlices.total > 0 ? (
              <>
                <SegmentedBar slices={lastSlices} className="h-2" />
                <ul className="mt-2.5 flex flex-col gap-1.5">
                  {SLICES.map(({ key, label, hint, color }) => (
                    <li key={key} title={hint} className="flex items-center gap-2 text-neutral-600">
                      <span className={cn('size-2 shrink-0 rounded-full', color)} aria-hidden />
                      <span className="flex-1">{label}</span>
                      <span className="tabular-nums text-neutral-900">{lastSlices[key].toLocaleString('pt-BR')}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-neutral-500">Resposta guardada reaproveitada: nenhuma chamada à IA, nenhum token gasto.</p>
            )}

            <p className="mt-2 text-[11px] text-neutral-500">
              {[last.modelo, formatLatency(last.latencia_ms), last.grupos && `catálogo: ${last.grupos}`, last.motivo_retry && `repetiu: ${last.motivo_retry}`].filter(Boolean).join(' · ')}
            </p>

            <div className="mb-2 mt-3 flex items-baseline justify-between border-t border-neutral-200 pt-3">
              <span className="text-[13px] font-semibold text-neutral-900">Sessão</span>
              <span className="tabular-nums text-neutral-500">
                {usage.length} {usage.length === 1 ? 'pedido' : 'pedidos'} · {formatTokenCount(session.total)} tokens
              </span>
            </div>
            {session.total > 0 && <SegmentedBar slices={session} className="h-2" />}
            <div className="mt-2.5 flex h-10 items-end gap-1" aria-label="Tokens por pedido">
              {recent.map((slices, index) => (
                <div
                  key={index}
                  title={`Pedido ${usage.length - recent.length + index + 1}: ${slices.total.toLocaleString('pt-BR')} tokens`}
                  className="flex min-h-px flex-1 flex-col-reverse overflow-hidden rounded-sm bg-neutral-200"
                  style={{ height: `${Math.max((slices.total / peak) * 100, 3)}%` }}
                >
                  {SLICES.map(({ key, color }) => (slices[key] > 0 ? <span key={key} className={color} style={{ height: `${(slices[key] / slices.total) * 100}%` }} /> : null))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
