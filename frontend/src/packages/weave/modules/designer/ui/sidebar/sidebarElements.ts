import {
  BarChart,
  FileText,
  GripHorizontal,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Layers,
  List,
  ListOrdered,
  Minus,
  QrCode,
  Square,
  Table as TableIcon,
  Table2,
  Type,
} from 'lucide-react';
import type { BandType } from '../../../band/domain';
import type { ComponentType } from '../../../components/common/domain';
import type React from 'react';

type ElementIcon = React.ComponentType<{ className?: string }>;

/** Item da paleta: cria um bloco (banda), um componente dentro do bloco selecionado ou abre um assistente */
export type SidebarElement =
  | { kind: 'band'; type: BandType; icon: ElementIcon; label: string; description: string }
  | {
      kind: 'component';
      type: ComponentType;
      icon: ElementIcon;
      label: string;
      description: string;
    }
  | { kind: 'groupedList'; icon: ElementIcon; label: string; description: string };

/** Blocos principais — nomes pela intenção, não pelo termo técnico "banda" */
export const MAIN_ELEMENTS: SidebarElement[] = [
  {
    kind: 'band',
    type: 'pageHeader',
    icon: Heading2,
    label: 'Cabeçalho da folha',
    description: 'Repete no topo de todas as folhas (nome do cartório, títulos das colunas).',
  },
  {
    kind: 'band',
    type: 'dataList',
    icon: List,
    label: 'Lista de registros',
    description: 'Uma linha para cada registro de uma lista (ex.: um protocolo por linha).',
  },
  {
    kind: 'groupedList',
    icon: Layers,
    label: 'Lista agrupada',
    description: 'Registros agrupados (ex.: protocolos de cada dia). Abre um assistente.',
  },
  {
    kind: 'component',
    type: 'text',
    icon: Type,
    label: 'Texto',
    description: 'Texto livre ou com campos. Selecione um bloco na folha antes, ou arraste.',
  },
  {
    kind: 'component',
    type: 'image',
    icon: ImageIcon,
    label: 'Imagem',
    description: 'Logomarca ou imagem. Selecione um bloco na folha antes, ou arraste.',
  },
  {
    kind: 'band',
    type: 'reportSummary',
    icon: FileText,
    label: 'Texto de fechamento',
    description: 'Aparece uma vez, no fim do relatório (totais, assinatura, encerramento).',
  },
  {
    kind: 'band',
    type: 'pageFooter',
    icon: GripHorizontal,
    label: 'Rodapé da folha',
    description: 'Repete no pé de todas as folhas (numeração, observações).',
  },
];

/** Recursos menos usados — ficam recolhidos em "Mais elementos" */
export const MORE_ELEMENTS: SidebarElement[] = [
  {
    kind: 'band',
    type: 'reportTitle',
    icon: Heading1,
    label: 'Título do relatório',
    description: 'Aparece uma vez, no início da primeira folha.',
  },
  {
    kind: 'band',
    type: 'dataListNumbered',
    icon: ListOrdered,
    label: 'Lista numerada',
    description: 'Lista de registros com numeração automática.',
  },
  {
    kind: 'band',
    type: 'dataTable',
    icon: Table2,
    label: 'Tabela de dados',
    description: 'Registros em colunas com cabeçalho, montada automaticamente.',
  },
  {
    kind: 'band',
    type: 'divider',
    icon: Minus,
    label: 'Linha divisória',
    description: 'Linha para separar partes da folha.',
  },
  {
    kind: 'component',
    type: 'shape',
    icon: Square,
    label: 'Forma',
    description: 'Retângulo de fundo ou moldura.',
  },
  {
    kind: 'component',
    type: 'qr',
    icon: QrCode,
    label: 'QR Code',
    description: 'Código QR com texto ou campo.',
  },
  {
    kind: 'component',
    type: 'table',
    icon: TableIcon,
    label: 'Tabela fixa',
    description: 'Tabela com células digitadas à mão.',
  },
  {
    kind: 'component',
    type: 'chart',
    icon: BarChart,
    label: 'Gráfico',
    description: 'Gráfico de barras ou pizza a partir de uma lista.',
  },
];

export function getElementDragPayload(
  element: SidebarElement,
):
  | { type: 'band'; bandType: BandType }
  | { type: 'component'; componentType: ComponentType }
  | undefined {
  if (element.kind === 'band') return { type: 'band', bandType: element.type };
  if (element.kind === 'component') return { type: 'component', componentType: element.type };
  return undefined;
}
