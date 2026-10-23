import { cn } from '../../../../shared/ui/cn';

const LOGO_ICON_SRC = '/images/weave-logo-icon.png';

/** Logo Weave (PNG sem fundo, serve nos dois temas). `full` = "W" + texto; `icon` = só o "W". */
export function WeaveLogo({ variant = 'full', className }: { variant?: 'full' | 'icon'; className?: string }) {
  return (
    <span className={cn('inline-flex h-8 shrink-0 items-center gap-2', className)} role="img" aria-label="Weave">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO_ICON_SRC} alt="" draggable={false} className="h-5 w-auto select-none" />
      {variant === 'full' && (
        <span className="text-[20px] font-bold leading-none tracking-tight text-neutral-900">weave</span>
      )}
    </span>
  );
}
