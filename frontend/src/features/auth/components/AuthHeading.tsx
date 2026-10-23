import { WeaveLogo } from '@/shared/ui/WeaveLogo'

export const AuthHeading = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <header className="mb-6">
    <WeaveLogo className="mb-6" />
    <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
    {subtitle && <p className="mt-1 text-base text-fg-secondary">{subtitle}</p>}
  </header>
)
