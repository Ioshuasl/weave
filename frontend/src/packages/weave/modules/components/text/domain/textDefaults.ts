/** Altura de linha padrão dos textos — a mesma no editor, na impressão e no cálculo da altura automática */
export const DEFAULT_TEXT_LINE_HEIGHT = 1.15;

export function getTextLineHeight(lineHeight: unknown): number {
  const parsed = Number(lineHeight);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TEXT_LINE_HEIGHT;
}

/** Fontes oferecidas no editor (valor vazio = fonte padrão do relatório) */
export const TEXT_FONT_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Padrão' },
  { value: "'Courier New', monospace", label: 'Courier New' },
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: "'Times New Roman', Times, serif", label: 'Times New Roman' },
  { value: 'Georgia, serif', label: 'Georgia' },
];

export const TEXT_LINE_HEIGHT_OPTIONS = [1, 1.15, 1.5, 2] as const;

/** Rotação do texto em graus (sentido horário); inválido vira 0. */
export function getTextRotation(props?: { rotation?: number }): number {
  const n = props?.rotation;
  if (typeof n !== 'number' || Number.isNaN(n)) return 0;
  return n;
}
