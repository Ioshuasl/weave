import type { ComponentType } from './componentTypes';

export const COMPONENT_LABELS: Record<ComponentType, string> = {
  text: 'Texto',
  image: 'Imagem',
  qr: 'QR Code',
  shape: 'Forma',
  line: 'Linha',
  table: 'Tabela',
  chart: 'Gráfico',
};

export function getComponentDisplayLabel(type: string): string {
  return COMPONENT_LABELS[type as ComponentType] ?? type;
}
