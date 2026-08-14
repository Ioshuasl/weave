import type { ComponentType } from '../types/report';

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

export const DESIGNER_STEPS = [
  {
    step: 1,
    title: 'Adicione bandas',
    description: 'Use a seção Bandas na barra lateral — Título, Cabeçalho, Lista ou Tabela.',
  },
  {
    step: 2,
    title: 'Configure os dados',
    description: 'Em Editar dados, defina seus datasets JSON ou arraste campos para a banda.',
  },
  {
    step: 3,
    title: 'Monte o layout',
    description: 'Selecione a banda no canvas, adicione componentes e posicione os campos.',
  },
  {
    step: 4,
    title: 'Pré-visualize',
    description: 'Abra Pré-visualização para conferir o relatório com dados reais.',
  },
] as const;

export const DESIGNER_SHORTCUTS_HINT =
  'Delete excluir · Alt+clique cicla sobreposições · Ctrl/Cmd+clique ou Shift+clique = seleção múltipla · Ctrl+C copiar · Ctrl+V colar · Ctrl+D duplicar · Ctrl+Z desfazer · Ctrl+Shift+Z refazer · Ctrl+H histórico · Shift arrastar = sem snap · Duplo-clique no texto para editar';
