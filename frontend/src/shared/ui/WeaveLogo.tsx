import { cn } from '@/shared/lib/cn'

/** Logo existente do Weave (ícone original + wordmark), mesma composição do app Orius. Não recriar. */
export const WeaveLogo = ({ variant = 'full', className }: { variant?: 'full' | 'icon'; className?: string }) => (
  <span className={cn('inline-flex h-8 shrink-0 items-center gap-2', className)} role="img" aria-label="Weave">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/images/weave-logo-icon.png" alt="" draggable={false} className="h-5 w-auto select-none" />
    {variant === 'full' && <span className="text-xl font-bold leading-none tracking-tight text-foreground">weave</span>}
  </span>
)
