import { cn } from '@/shared/lib/cn'

/** Miniaturas de relatórios (só tokens do design system): ilustram o produto sem inventar dados reais. */

const Line = ({ w = 'w-full', strong = false, className }: { w?: string; strong?: boolean; className?: string }) => (
  <div className={cn('h-1.5 rounded-full', strong ? 'bg-fg-muted/50' : 'bg-surface-tertiary', w, className)} />
)

const Chip = ({ children, tone }: { children: string; tone: 'blue' | 'green' | 'orange' }) => (
  <span
    className={cn(
      'rounded-sm px-1.5 py-0.5 font-mono text-[9px] leading-none',
      tone === 'blue' && 'bg-tag-blue text-tag-blue-fg',
      tone === 'green' && 'bg-tag-green text-tag-green-fg',
      tone === 'orange' && 'bg-tag-orange text-tag-orange-fg',
    )}
  >
    {children}
  </span>
)

export const TableSheet = () => (
  <div className="flex h-full flex-col gap-2">
    <Line w="w-2/3" strong />
    <div className="rounded-sm bg-primary px-1.5 py-1"><div className="h-1 w-1/2 rounded-full bg-primary-fg/80" /></div>
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="grid grid-cols-[1.2fr_1fr_.6fr] gap-2 border-b border-border pb-1.5">
        <Line /><Line w="w-3/4" /><Line w="w-1/2" strong={i === 2} />
      </div>
    ))}
    <div className="mt-auto flex justify-end"><Chip tone="green">pago</Chip></div>
  </div>
)

export const ChartSheet = () => (
  <div className="flex h-full flex-col gap-2">
    <Line w="w-1/2" strong />
    <div className="flex flex-1 items-end gap-1.5 border-b border-border pb-1">
      {[40, 65, 52, 80, 58, 92, 70].map((h, i) => (
        <div key={i} className={cn('flex-1 rounded-t-sm', i === 5 ? 'bg-primary' : 'bg-primary-border')} style={{ height: `${h}%` }} />
      ))}
    </div>
    <Line w="w-3/4" /><Line w="w-1/2" />
  </div>
)

export const TextSheet = () => (
  <div className="flex h-full flex-col gap-2">
    <div className="h-2 w-3/4 rounded-full bg-fg-muted/60" />
    <Line /><Line w="w-11/12" /><Line w="w-4/5" />
    <div className="my-1 flex flex-wrap gap-1"><Chip tone="blue">{'{pessoa.nome}'}</Chip><Chip tone="orange">{'{data}'}</Chip></div>
    <Line /><Line w="w-10/12" /><Line w="w-2/3" />
    <div className="mt-auto flex items-center gap-2"><div className="size-5 rounded-full bg-primary-subtle" /><Line w="w-1/3" /></div>
  </div>
)

export const ReceiptSheet = () => (
  <div className="flex h-full flex-col gap-2">
    <div className="text-center text-[10px] font-semibold tracking-wide text-fg-secondary">RECIBO</div>
    <div className="text-center text-lg font-semibold text-foreground">R$ 350,00</div>
    <Line /><Line w="w-5/6" /><Line w="w-2/3" />
    <div className="mt-auto space-y-1">
      <div className="border-t border-fg-muted/40" />
      <Line w="w-1/2" className="mx-auto" />
    </div>
  </div>
)

export const KpiSheet = () => (
  <div className="grid h-full grid-cols-2 gap-2">
    {[true, false, false, true].map((accent, i) => (
      <div key={i} className={cn('flex flex-col justify-between rounded-md border p-2', accent ? 'border-primary-border bg-primary-subtle' : 'border-border')}>
        <Line w="w-1/2" />
        <div className={cn('h-3 w-2/3 rounded-full', accent ? 'bg-primary' : 'bg-fg-muted/50')} />
      </div>
    ))}
  </div>
)

export const ListSheet = () => (
  <div className="flex h-full flex-col gap-2.5">
    <Line w="w-1/2" strong />
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-2">
        <div className={cn('size-3 shrink-0 rounded-sm border', i < 3 ? 'border-primary bg-primary' : 'border-border-strong')} />
        <Line w={i % 2 ? 'w-3/4' : 'w-full'} />
      </div>
    ))}
    <div className="mt-auto flex gap-1"><Chip tone="blue">modelo</Chip><Chip tone="green">pronto</Chip></div>
  </div>
)
