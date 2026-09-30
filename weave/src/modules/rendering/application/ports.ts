/** Porta: aguarda as imagens de um documento decodificarem antes de imprimir. */
export type ElementImagesWaiter = (root: ParentNode, timeoutMs?: number) => Promise<void>;

export interface RenderingServices {
  waitForImages: ElementImagesWaiter;
}
