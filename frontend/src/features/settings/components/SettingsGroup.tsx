/** Bloco do formulário: título curto + campos em grade de 2 colunas (1 no celular). */
export const SettingsGroup = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
  <fieldset className="border-b border-border px-5 py-5 last:border-b-0">
    <legend className="sr-only">{title}</legend>
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      {description && <p className="text-xs text-fg-muted">{description}</p>}
    </div>
    <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">{children}</div>
  </fieldset>
)
