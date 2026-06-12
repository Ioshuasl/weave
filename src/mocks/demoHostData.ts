import type { DataSourceCatalog } from '../utils/dataSourceUtils';

/** Configuração institucional mock — fonte singleton injetada pelo host */
export const DEMO_CARTORIO_DATA: Record<string, unknown[]> = {
  cartorio: [
    {
      nome: '1º Cartório de Notas — Demo',
      cnpj: '00.000.000/0001-91',
      email: 'contato@cartorio-demo.com.br',
      telefone: '(11) 3000-0000',
      cidade: 'São Paulo',
      uf: 'SP',
    },
  ],
};

export const DEMO_DATA_SOURCE_CATALOG: DataSourceCatalog = {
  cartorio: { kind: 'singleton', label: 'Cartório' },
  users: { kind: 'list', label: 'Usuários' },
};
