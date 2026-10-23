/** Iniciais (até 2) de um nome, para avatares sem foto. */
export const formatInitials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]!.toUpperCase()).join('')
