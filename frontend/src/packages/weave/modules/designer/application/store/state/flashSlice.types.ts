import type { ReportChanges } from '../../../../assistant/domain';

export interface FlashSlice {
  /** Itens destacados no canvas depois que o assistente os alterou (some sozinho). `nonce` reinicia a animação ao repetir o destaque */
  flash: ReportChanges & { nonce: number };

  /** Acende o destaque por um instante; um novo destaque substitui o anterior */
  flashChanges: (changes: ReportChanges, durationMs?: number) => void;
}
