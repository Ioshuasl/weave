import {
  estimateDataUrlBytes,
  formatImageBytes,
  MAX_EMBEDDED_IMAGE_BYTES,
} from '../domain/imagePropsUtils';

export const MAX_UPLOAD_SOURCE_BYTES = 8 * 1024 * 1024;
const COMPRESS_MAX_EDGE = 1600;

export interface EmbeddedImageResult {
  dataUrl: string;
  originalBytes: number;
  finalBytes: number;
  compressed: boolean;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result.startsWith('data:image/')) {
        reject(new Error('Não foi possível ler o arquivo como imagem.'));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Não foi possível converter a imagem comprimida.'));
    reader.readAsDataURL(blob);
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

async function compressRasterImage(file: File): Promise<EmbeddedImageResult> {
  const originalBytes = file.size;
  const bitmap = await createImageBitmap(file);
  try {
    const sourceEdge = Math.max(bitmap.width, bitmap.height);
    const edges = [Math.min(sourceEdge, COMPRESS_MAX_EDGE), 1200, 900, 640]
      .filter((edge, index, list) => edge >= 64 && list.indexOf(edge) === index)
      .sort((a, b) => b - a);
    const qualities = [0.82, 0.7, 0.55, 0.4];

    let smallest: Blob | null = null;

    for (const edge of edges) {
      const scale = Math.min(1, edge / sourceEdge);
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Não foi possível comprimir a imagem neste navegador.');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(bitmap, 0, 0, width, height);

      for (const quality of qualities) {
        const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
        if (!blob) continue;
        if (!smallest || blob.size < smallest.size) smallest = blob;
        if (blob.size <= MAX_EMBEDDED_IMAGE_BYTES) {
          const dataUrl = await blobToDataUrl(blob);
          return {
            dataUrl,
            originalBytes,
            finalBytes: blob.size,
            compressed: blob.size < originalBytes || width < bitmap.width,
          };
        }
      }
    }

    if (smallest && smallest.size <= MAX_EMBEDDED_IMAGE_BYTES) {
      const dataUrl = await blobToDataUrl(smallest);
      return {
        dataUrl,
        originalBytes,
        finalBytes: smallest.size,
        compressed: true,
      };
    }

    throw new Error(
      `Não foi possível comprimir a imagem abaixo de ${formatImageBytes(MAX_EMBEDDED_IMAGE_BYTES)}. Use uma URL.`
    );
  } finally {
    bitmap.close();
  }
}

export async function embedImageFile(file: File): Promise<EmbeddedImageResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecione um arquivo de imagem (PNG, JPEG, GIF, WebP ou SVG).');
  }
  if (file.size > MAX_UPLOAD_SOURCE_BYTES) {
    throw new Error(
      `A imagem tem ${formatImageBytes(file.size)}. O máximo para processar é ${formatImageBytes(MAX_UPLOAD_SOURCE_BYTES)}.`
    );
  }

  if (file.type === 'image/svg+xml') {
    if (file.size > MAX_EMBEDDED_IMAGE_BYTES) {
      throw new Error(
        `O SVG tem ${formatImageBytes(file.size)}. O máximo para embutir no JSON é ${formatImageBytes(MAX_EMBEDDED_IMAGE_BYTES)}. Use uma URL.`
      );
    }
    const dataUrl = await readFileAsDataUrl(file);
    return {
      dataUrl,
      originalBytes: file.size,
      finalBytes: file.size,
      compressed: false,
    };
  }

  if (file.size <= MAX_EMBEDDED_IMAGE_BYTES) {
    const dataUrl = await readFileAsDataUrl(file);
    const embedded = estimateDataUrlBytes(dataUrl);
    if (embedded <= MAX_EMBEDDED_IMAGE_BYTES) {
      return {
        dataUrl,
        originalBytes: file.size,
        finalBytes: file.size,
        compressed: false,
      };
    }
  }

  return compressRasterImage(file);
}
