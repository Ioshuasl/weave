import type { LucideIcon } from 'lucide-react'

export const ComingSoonSection = ({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) => (
  <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
    <Icon className="size-8 text-fg-muted" aria-hidden />
    <h3 className="text-md font-semibold">{title}</h3>
    <p className="max-w-sm text-sm text-fg-muted">{description}</p>
    <span className="mt-1 rounded-full bg-primary-subtle px-2 py-0.5 text-xs font-medium text-primary">Em breve</span>
  </div>
)
