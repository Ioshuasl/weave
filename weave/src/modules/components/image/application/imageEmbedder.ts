import type { EmbeddedImageResult } from '../domain/embeddedImage';

/** Porta: lê um arquivo de imagem e devolve um data URL pronto para embutir no relatório. */
export type ImageEmbedder = (file: File) => Promise<EmbeddedImageResult>;
