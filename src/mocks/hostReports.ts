/**
 * Dados mockados do "sistema hospedeiro" — simulam relatórios
 * cadastrados no ERP/CRM antes de abrir o designer embutido.
 */

export type HostReportStatus = 'ativo' | 'rascunho';

export interface HostReportTemplate {
  id: string;
  name: string;
  description: string;
  dataset: string;
  updatedAt: string;
  status: HostReportStatus;
}

export const MOCK_HOST_REPORTS: HostReportTemplate[] = [
  {
    id: 'rep_1',
    name: 'Lista de usuários (A4)',
    description:
      'Título, cabeçalho, lista com 50 registros, gráfico no resumo e rodapé com contador de páginas.',
    dataset: 'users',
    updatedAt: '2026-06-10',
    status: 'ativo',
  },
  {
    id: 'rep_multipage',
    name: 'Multipágina (capa + corpo)',
    description: 'Duas páginas de design: capa A4 e corpo com lista paginada.',
    dataset: 'users',
    updatedAt: '2026-06-10',
    status: 'ativo',
  },
  {
    id: 'rep_a5',
    name: 'Lista compacta A5',
    description: 'Preset A5 retrato — valida paginação e contador em folha menor.',
    dataset: 'users',
    updatedAt: '2026-06-10',
    status: 'ativo',
  },
  {
    id: 'rep_receipt',
    name: 'Cupom 80 mm',
    description: 'Perfil contínuo (bobina) — largura estreita, altura expansível.',
    dataset: 'users',
    updatedAt: '2026-06-10',
    status: 'ativo',
  },
];
