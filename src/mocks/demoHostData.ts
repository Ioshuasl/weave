import type { DataSourceCatalog } from '../utils/dataSourceUtils';

/** Configuração institucional mock — fonte singleton injetada pelo host */
export const DEMO_CARTORIO_DATA: Record<string, unknown[]> = {
  cartorio: [
    {
      nome: '1º Cartório de Notas — Demo',
      cnpj: '00.000.000/0001-91',
      email: 'contato@cartorio-demo.com.br',
      telefone: '(64) 3441-0000',
      cidade: 'Caiapônia',
      uf: 'GO',
      cidade_uf: 'Caiapônia-GO',
      tabeliao: 'Darleide Teixeira Borges Alves',
      cargo: 'Tabeliã',
      url_selo: 'http://extrajudicial.tjgo.jus.br/selo',
    },
  ],
};

export const DEMO_ATO_AUTENTICACAO = {
  tipo: 'AUTENTICAÇÃO',
  natureza: 'fotocopia',
  texto:
    'Confere com a fotocópia devidamente autenticada a\nmim apresentada. Dou fé.',
  signatario: '',
  cidade_uf: 'Caiapônia-GO',
  data: '13/08/2026',
  emolumentos: '5.56',
  numero_selo: '02242002193364024330060',
  url_consulta: 'http://extrajudicial.tjgo.jus.br/selo',
  oficial_nome: 'Darleide Teixeira Borges Alves',
  oficial_cargo: 'Tabeliã',
};

export const DEMO_ATO_RECONHECIMENTO_FIRMA = {
  tipo: 'RECONHECIMENTO DE FIRMA',
  natureza: 'verdadeira',
  texto:
    'Reconheço por verdadeira a firma de João da Silva Santos, do documento em questão. Dou fé.',
  signatario: 'João da Silva Santos',
  cidade_uf: 'Caiapônia-GO',
  data: '13/08/2026',
  emolumentos: '8.34',
  numero_selo: '02242002193364024330061',
  url_consulta: 'http://extrajudicial.tjgo.jus.br/selo',
  oficial_nome: 'Darleide Teixeira Borges Alves',
  oficial_cargo: 'Tabeliã',
};

/** Atos extraprotocolares de tabelionato de notas (autenticação + reconhecimento de firma) */
export const DEMO_ATO_EXTRAPROTOCOLAR_DATA: Record<string, unknown[]> = {
  ato: [DEMO_ATO_AUTENTICACAO, DEMO_ATO_RECONHECIMENTO_FIRMA],
};

export const DEMO_DATA_SOURCE_CATALOG: DataSourceCatalog = {
  cartorio: { kind: 'singleton', label: 'Cartório' },
  users: { kind: 'list', label: 'Usuários' },
  ato: { kind: 'list', label: 'Ato extraprotocolar' },
};
