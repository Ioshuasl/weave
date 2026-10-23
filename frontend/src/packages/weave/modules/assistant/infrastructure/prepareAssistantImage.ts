import { ASSISTANT_IMAGE_LIMITS, type AssistantImage, computeResizedSize, sanitizeImageName } from '../domain/assistantImages';

/** Reduz a imagem no navegador (lado maior ≤ 1280 px) e a converte em JPEG sobre fundo branco. Nada é gravado. */
export async function prepareAssistantImage(file: File): Promise<AssistantImage> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = computeResizedSize(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Não foi possível preparar a imagem neste navegador.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const dataUrl = canvas.toDataURL('image/jpeg', ASSISTANT_IMAGE_LIMITS.jpegQuality);
  return { nome: `${sanitizeImageName(file.name)}.jpg`, tipo: 'image/jpeg', base64: dataUrl.slice(dataUrl.indexOf(',') + 1) };
}
