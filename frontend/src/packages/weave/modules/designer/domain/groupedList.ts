/** Configuração do assistente "Lista agrupada" (mestre/detalhe montado de uma vez) */
export interface GroupedListConfig {
  /** Lista que forma os grupos (ex.: dias) */
  groupDataSource: string;
  /** Lista repetida dentro de cada grupo (ex.: protocolos) */
  itemDataSource: string;
  /** Campo do grupo usado na ligação */
  groupField: string;
  /** Campo dos itens que deve ser igual ao do grupo */
  itemField: string;
  /** Campo exibido como título de cada grupo (vazio = grupo sem título) */
  titleField: string;
  /** Campos dos itens viram colunas da linha */
  itemFields: string[];
  groupLabel: string;
  itemLabel: string;
  /** Nomes amigáveis dos campos dos itens (nome das camadas) */
  fieldLabels: Record<string, string>;
}

const LINK_FIELD_HINTS = ['chave', '_id', 'id'];
const TITLE_FIELD_HINTS = ['extenso', 'fmt', 'nome', 'descricao', 'titulo', 'data'];
const MAX_SUGGESTED_COLUMNS = 4;

function isTechnicalField(field: string): boolean {
  return /(_chave|_id|^id)$/i.test(field);
}

function rankByHints(fields: string[], hints: string[]): string[] {
  const score = (field: string) => {
    const index = hints.findIndex((hint) => field.toLowerCase().includes(hint));
    return index < 0 ? hints.length : index;
  };
  return [...fields].sort((a, b) => score(a) - score(b));
}

export function getRowFields(rows: unknown[] | undefined): string[] {
  const first = Array.isArray(rows) ? rows[0] : undefined;
  return first && typeof first === 'object' ? Object.keys(first).filter((field) => !field.startsWith('__')) : [];
}

/** Campo comum aos dois conjuntos, preferindo chaves de ligação (`*_chave`, `*_id`). */
export function suggestLinkField(groupFields: string[], itemFields: string[]): string {
  const common = groupFields.filter((field) => itemFields.includes(field));
  return rankByHints(common, LINK_FIELD_HINTS)[0] ?? '';
}

/** Campo legível para o título do grupo (ex.: `data_extenso`), evitando o campo de ligação. */
export function suggestTitleField(groupFields: string[], linkField: string): string {
  const candidates = groupFields.filter((field) => field !== linkField && !isTechnicalField(field));
  return rankByHints(candidates, TITLE_FIELD_HINTS)[0] ?? '';
}

/** Primeiros campos dos itens que fazem sentido como colunas (sem chaves técnicas). */
export function suggestItemColumns(itemFields: string[], linkField: string): string[] {
  return itemFields
    .filter((field) => field !== linkField && !isTechnicalField(field))
    .slice(0, MAX_SUGGESTED_COLUMNS);
}
