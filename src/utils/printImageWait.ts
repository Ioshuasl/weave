/** Espera imagens do DOM decodificarem antes de imprimir (evita página em branco). */
export function waitForElementImages(
  root: ParentNode,
  timeoutMs = 8000
): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'));
  if (images.length === 0) return Promise.resolve();

  const waitOne = (img: HTMLImageElement): Promise<void> => {
    const decodeSafe = () =>
      typeof img.decode === 'function'
        ? img.decode().then(
            () => undefined,
            () => undefined
          )
        : Promise.resolve();

    if (img.complete) {
      if (img.naturalWidth > 0) return decodeSafe();
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      img.addEventListener(
        'load',
        () => {
          void decodeSafe().then(() => resolve());
        },
        { once: true }
      );
      img.addEventListener('error', () => resolve(), { once: true });
    });
  };

  return Promise.race([
    Promise.all(images.map(waitOne)).then(() => undefined),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, timeoutMs);
    }),
  ]);
}
