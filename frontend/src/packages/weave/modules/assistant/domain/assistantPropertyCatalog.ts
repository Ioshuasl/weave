/**
 * Catálogo ÚNICO de propriedades que o assistente de IA pode alterar, por tipo de elemento.
 * É dado puro (sem funções) para ser embutido também no validador do n8n — manter os dois em sincronia
 * rodando `scripts` de geração (ver assistantPropertyCatalog.test) e `normalizePropertyValue` abaixo.
 */
export type PropertySpec =
  | { kind: 'color'; transparent?: boolean }
  | { kind: 'enum'; values: Record<string, string> }
  | { kind: 'int'; min: number; max: number; store?: 'px' }
  | { kind: 'number'; min: number; max: number }
  | { kind: 'bool' }
  | { kind: 'border' }
  | { kind: 'radius' }
  | { kind: 'padding' }
  | { kind: 'text'; max: number };

export interface PropertyDefinition {
  /** Onde grava: `style.*`, `imageProps.*`, `qrProps.*`, `chartProps.*`, `tableProps.*` (componente) ou caminho da banda */
  path: string;
  /** Tipos de componente (`text`, `image`...) ou de banda (`divider`, `dataTable`...) em que vale; `*` = todos */
  aplica: string[];
  spec: PropertySpec;
  /** Aceita "remover"/"padrão" para limpar a propriedade */
  removable?: boolean;
  dica: string;
}

const FONTS: Record<string, string> = {
  padrao: '',
  'courier new': "'Courier New', monospace",
  arial: 'Arial, Helvetica, sans-serif',
  'times new roman': "'Times New Roman', Times, serif",
  georgia: 'Georgia, serif',
};
const BOOL_HINT = 'true ou false';
/** Moldura vale em qualquer banda de conteúdo (todas menos o divisor) */
const BAND_ANY = ['reportTitle', 'reportSummary', 'pageHeader', 'pageFooter', 'masterData', 'dataList', 'dataListNumbered', 'dataTable', 'detailData'];

/** Estilo CSS do componente — usado em `alterar_estilo` e `adicionar_texto`. Chave = nome CSS. */
export const STYLE_PROPERTIES: Record<string, PropertyDefinition> = {
  color: { path: 'style.color', aplica: ['text'], spec: { kind: 'color' }, dica: 'cor do texto (#rrggbb)' },
  backgroundColor: { path: 'style.backgroundColor', aplica: ['text', 'shape', 'line'], spec: { kind: 'color', transparent: true }, removable: true, dica: 'preenchimento (#rrggbb ou transparent); em linha, a cor da linha' },
  fontFamily: { path: 'style.fontFamily', aplica: ['text'], spec: { kind: 'enum', values: FONTS }, removable: true, dica: 'Courier New | Arial | Times New Roman | Georgia | Padrão' },
  fontSize: { path: 'style.fontSize', aplica: ['text'], spec: { kind: 'int', min: 6, max: 72, store: 'px' }, dica: 'tamanho em px, 6 a 72' },
  fontWeight: { path: 'style.fontWeight', aplica: ['text'], spec: { kind: 'enum', values: { normal: 'normal', bold: 'bold' } }, dica: 'normal | bold' },
  fontStyle: { path: 'style.fontStyle', aplica: ['text'], spec: { kind: 'enum', values: { normal: 'normal', italic: 'italic' } }, dica: 'normal | italic' },
  textDecoration: { path: 'style.textDecoration', aplica: ['text'], spec: { kind: 'enum', values: { none: 'none', underline: 'underline', 'line-through': 'line-through' } }, dica: 'none | underline | line-through' },
  textAlign: { path: 'style.textAlign', aplica: ['text'], spec: { kind: 'enum', values: { left: 'left', center: 'center', right: 'right', justify: 'justify' } }, dica: 'left | center | right | justify' },
  lineHeight: { path: 'style.lineHeight', aplica: ['text'], spec: { kind: 'number', min: 1, max: 3 }, dica: 'entrelinha, 1 a 3 (ex.: 1.15)' },
  border: { path: 'style.border', aplica: ['*'], spec: { kind: 'border' }, removable: true, dica: 'borda "1px solid #000000" (solid|dashed|dotted|double, até 10px) ou "none"' },
  // bordas por LADO (o `border` acima vale para os 4 de uma vez); ligar/desligar um lado não mexe nos outros
  borderTop: { path: 'style.borderTop', aplica: ['*'], spec: { kind: 'border' }, removable: true, dica: 'borda SÓ do lado de CIMA "1px solid #000000" ou "none"' },
  borderRight: { path: 'style.borderRight', aplica: ['*'], spec: { kind: 'border' }, removable: true, dica: 'borda SÓ do lado DIREITO "1px solid #000000" ou "none"' },
  borderBottom: { path: 'style.borderBottom', aplica: ['*'], spec: { kind: 'border' }, removable: true, dica: 'borda SÓ do lado de BAIXO "1px solid #000000" ou "none"' },
  borderLeft: { path: 'style.borderLeft', aplica: ['*'], spec: { kind: 'border' }, removable: true, dica: 'borda SÓ do lado ESQUERDO "1px solid #000000" ou "none"' },
  borderRadius: { path: 'style.borderRadius', aplica: ['*'], spec: { kind: 'radius' }, removable: true, dica: 'cantos arredondados em px, 0 a 100' },
  padding: { path: 'style.padding', aplica: ['*'], spec: { kind: 'padding' }, removable: true, dica: 'espaço interno em px, 1 a 4 valores (ex.: "4px 8px")' },
};

/** Propriedades fora do CSS — `alterar_propriedade` (componente_id ou banda_id + propriedade + valor). */
export const ELEMENT_PROPERTIES: Record<string, PropertyDefinition> = {
  // texto
  texto_rotacao: { path: 'textProps.rotation', aplica: ['text'], spec: { kind: 'int', min: -360, max: 360 }, dica: 'graus horário, -360 a 360 (90 = texto na vertical lendo de cima para baixo; 270 ou -90 = de baixo para cima)' },
  // imagem
  imagem_ajuste: { path: 'imageProps.sizeMode', aplica: ['image'], spec: { kind: 'enum', values: { inteira: 'contain', preencher: 'cover', esticar: 'fill' } }, dica: 'inteira | preencher | esticar' },
  imagem_alinhamento_h: { path: 'imageProps.alignX', aplica: ['image'], spec: { kind: 'enum', values: { esquerda: 'left', centro: 'center', direita: 'right' } }, dica: 'esquerda | centro | direita' },
  imagem_alinhamento_v: { path: 'imageProps.alignY', aplica: ['image'], spec: { kind: 'enum', values: { topo: 'top', meio: 'middle', base: 'bottom' } }, dica: 'topo | meio | base' },
  imagem_opacidade: { path: 'imageProps.opacity', aplica: ['image'], spec: { kind: 'number', min: 0, max: 1 }, dica: 'opacidade 0 a 1 (marca d\'água ~0.15)' },
  imagem_rotacao: { path: 'imageProps.rotation', aplica: ['image'], spec: { kind: 'int', min: -360, max: 360 }, dica: 'graus, -360 a 360' },
  imagem_travar_proporcao: { path: 'imageProps.lockAspectRatio', aplica: ['image'], spec: { kind: 'bool' }, dica: BOOL_HINT },
  imagem_descricao: { path: 'imageProps.alt', aplica: ['image'], spec: { kind: 'text', max: 120 }, removable: true, dica: 'texto alternativo' },
  // qr code
  qr_cor: { path: 'qrProps.foreground', aplica: ['qr'], spec: { kind: 'color' }, dica: 'cor do código (#rrggbb)' },
  qr_fundo: { path: 'qrProps.background', aplica: ['qr'], spec: { kind: 'color' }, dica: 'fundo (#rrggbb)' },
  qr_correcao: { path: 'qrProps.errorCorrection', aplica: ['qr'], spec: { kind: 'enum', values: { baixa: 'L', media: 'M', alta: 'Q', maxima: 'H' } }, dica: 'baixa | media | alta | maxima' },
  qr_margem: { path: 'qrProps.margin', aplica: ['qr'], spec: { kind: 'int', min: 0, max: 8 }, dica: 'margem em módulos, 0 a 8' },
  // tabela simples (componente)
  tabela_primeira_linha_cabecalho: { path: 'tableProps.hasHeader', aplica: ['table'], spec: { kind: 'bool' }, dica: BOOL_HINT },
  // gráfico
  grafico_tipo: { path: 'chartProps.chartKind', aplica: ['chart'], spec: { kind: 'enum', values: { barras: 'bar', pizza: 'pie' } }, dica: 'barras | pizza' },
  grafico_cor_barras: { path: 'chartProps.barColor', aplica: ['chart'], spec: { kind: 'color' }, dica: '#rrggbb' },
  grafico_fundo: { path: 'chartProps.backgroundColor', aplica: ['chart'], spec: { kind: 'color', transparent: true }, removable: true, dica: '#rrggbb ou transparent' },
  grafico_borda: { path: 'chartProps.border', aplica: ['chart'], spec: { kind: 'border' }, removable: true, dica: 'ex.: "1px solid #cccccc" ou "none"' },
  grafico_cantos: { path: 'chartProps.borderRadius', aplica: ['chart'], spec: { kind: 'radius' }, removable: true, dica: 'px, 0 a 100' },
  grafico_grade: { path: 'chartProps.showGrid', aplica: ['chart'], spec: { kind: 'bool' }, dica: BOOL_HINT },
  grafico_legenda: { path: 'chartProps.showLegend', aplica: ['chart'], spec: { kind: 'bool' }, dica: BOOL_HINT },
  grafico_dica: { path: 'chartProps.showTooltip', aplica: ['chart'], spec: { kind: 'bool' }, dica: BOOL_HINT },
  grafico_posicao_legenda: { path: 'chartProps.legendPosition', aplica: ['chart'], spec: { kind: 'enum', values: { acima: 'top', abaixo: 'bottom' } }, dica: 'acima | abaixo' },
  grafico_titulo: { path: 'chartProps.titleContent', aplica: ['chart'], spec: { kind: 'text', max: 100 }, removable: true, dica: 'título do gráfico' },
  grafico_eixo_x: { path: 'chartProps.xAxisLabel', aplica: ['chart'], spec: { kind: 'text', max: 60 }, removable: true, dica: 'nome do eixo horizontal' },
  grafico_eixo_y: { path: 'chartProps.yAxisLabel', aplica: ['chart'], spec: { kind: 'text', max: 60 }, removable: true, dica: 'nome do eixo vertical' },
  grafico_furo: { path: 'chartProps.innerRadius', aplica: ['chart'], spec: { kind: 'int', min: 0, max: 200 }, dica: 'furo central da pizza em px (0 = pizza cheia)' },
  grafico_max_fatias: { path: 'chartProps.maxSlices', aplica: ['chart'], spec: { kind: 'int', min: 0, max: 50 }, dica: 'máximo de fatias (0 = todas)' },
  // bandas
  divisor_cor: { path: 'dividerColor', aplica: ['divider'], spec: { kind: 'color' }, dica: 'cor da linha (#rrggbb)' },
  divisor_espessura: { path: 'dividerThickness', aplica: ['divider'], spec: { kind: 'int', min: 1, max: 20 }, dica: 'espessura em px, 1 a 20' },
  tabela_dados_cabecalho: { path: 'dataTable.showHeader', aplica: ['dataTable'], spec: { kind: 'bool' }, dica: 'mostrar títulos das colunas: ' + BOOL_HINT },
  tabela_dados_borda: { path: 'dataTable.border', aplica: ['dataTable'], spec: { kind: 'border' }, removable: true, dica: 'borda da tabela' },
  tabela_dados_cabecalho_fundo: { path: 'dataTable.headerStyle.backgroundColor', aplica: ['dataTable'], spec: { kind: 'color', transparent: true }, removable: true, dica: 'fundo do cabeçalho' },
  tabela_dados_cabecalho_cor: { path: 'dataTable.headerStyle.color', aplica: ['dataTable'], spec: { kind: 'color' }, dica: 'cor do texto do cabeçalho' },
  tabela_dados_cabecalho_negrito: { path: 'dataTable.headerStyle.fontWeight', aplica: ['dataTable'], spec: { kind: 'enum', values: { sim: 'bold', nao: 'normal' } }, dica: 'sim | nao' },
  tabela_dados_zebra: { path: 'dataTable.alternateRowStyle.backgroundColor', aplica: ['dataTable'], spec: { kind: 'color', transparent: true }, removable: true, dica: 'fundo das linhas alternadas (zebra); remover tira' },
  tabela_dados_fonte: { path: 'dataTable.rowStyle.fontSize', aplica: ['dataTable'], spec: { kind: 'int', min: 6, max: 72, store: 'px' }, dica: 'tamanho da fonte das linhas, px' },
  numeracao_formato: { path: 'numberedList.format', aplica: ['dataListNumbered'], spec: { kind: 'enum', values: { '1.': 'decimal-dot', '1)': 'decimal-paren', '1': 'decimal' } }, dica: '"1." | "1)" | "1"' },
  numeracao_inicio: { path: 'numberedList.start', aplica: ['dataListNumbered'], spec: { kind: 'int', min: 1, max: 100000 }, dica: 'começar em' },
  marcador_tipo: { path: 'bulletList.marker', aplica: ['dataList'], spec: { kind: 'enum', values: { circulo: 'circle-filled', circulo_vazado: 'circle-outline', quadrado: 'square-filled', nenhum: 'none' } }, dica: 'circulo | circulo_vazado | quadrado | nenhum' },
  marcador_cor: { path: 'bulletList.color', aplica: ['dataList'], spec: { kind: 'color' }, dica: '#rrggbb' },
  marcador_tamanho: { path: 'bulletList.size', aplica: ['dataList'], spec: { kind: 'int', min: 4, max: 16 }, dica: 'px, 4 a 16' },
  // linhas de divisão da lista / do texto de encerramento
  linhas_entre_registros: { path: 'lines.rows', aplica: ['dataList', 'dataListNumbered', 'dataTable', 'masterData', 'detailData'], spec: { kind: 'bool' }, dica: 'linha embaixo de cada registro: true ou false' },
  linhas_entre_colunas: { path: 'lines.columns', aplica: ['dataList', 'dataListNumbered', 'dataTable', 'masterData', 'detailData'], spec: { kind: 'bool' }, dica: 'linhas verticais entre as colunas (só em lista com colunas): true ou false' },
  linhas_laterais: { path: 'lines.sides', aplica: ['dataList', 'dataListNumbered', 'dataTable', 'masterData', 'detailData'], spec: { kind: 'bool' }, dica: 'linhas nas laterais esquerda e direita: true ou false' },
  linhas_contorno: { path: 'lines.outline', aplica: ['dataList', 'dataListNumbered', 'dataTable', 'masterData', 'detailData'], spec: { kind: 'bool' }, dica: 'caixa ao redor de cada linha (texto de encerramento): true ou false' },
  linhas_no_titulo_das_colunas: { path: 'lines.header', aplica: ['dataList', 'dataListNumbered', 'dataTable', 'masterData', 'detailData'], spec: { kind: 'bool' }, dica: 'o título das colunas recebe a mesma grade: true ou false' },
  linhas_ate_o_fim_da_folha: { path: 'lines.fillPage', aplica: ['dataList', 'dataListNumbered', 'dataTable', 'masterData', 'detailData'], spec: { kind: 'bool' }, dica: 'continua as linhas das colunas até o fim da folha: true ou false' },
  linhas_espessura: { path: 'lines.thickness', aplica: ['dataList', 'dataListNumbered', 'dataTable', 'masterData', 'detailData'], spec: { kind: 'enum', values: { fina: 'thin', media: 'medium' } }, dica: 'fina | media' },
  linhas_cor: { path: 'lines.color', aplica: ['dataList', 'dataListNumbered', 'dataTable', 'masterData', 'detailData'], spec: { kind: 'color' }, dica: 'cor das linhas (#rrggbb)' },
  // moldura da banda: borda em volta da banda e das filhas dela, lado a lado ligável
  moldura_esquerda: { path: 'frame.left', aplica: BAND_ANY, spec: { kind: 'bool' }, dica: 'moldura: borda ESQUERDA em volta da banda e das filhas: ' + BOOL_HINT },
  moldura_direita: { path: 'frame.right', aplica: BAND_ANY, spec: { kind: 'bool' }, dica: 'moldura: borda DIREITA em volta da banda e das filhas: ' + BOOL_HINT },
  moldura_superior: { path: 'frame.top', aplica: BAND_ANY, spec: { kind: 'bool' }, dica: 'moldura: borda SUPERIOR em volta da banda e das filhas: ' + BOOL_HINT },
  moldura_inferior: { path: 'frame.bottom', aplica: BAND_ANY, spec: { kind: 'bool' }, dica: 'moldura: borda INFERIOR em volta da banda e das filhas: ' + BOOL_HINT },
  moldura_espessura: { path: 'frame.thickness', aplica: BAND_ANY, spec: { kind: 'enum', values: { fina: 'thin', media: 'medium', grossa: 'thick' } }, dica: 'espessura da moldura: fina | media | grossa' },
  moldura_cor: { path: 'frame.color', aplica: BAND_ANY, spec: { kind: 'color' }, dica: 'cor da moldura (#rrggbb)' },
  banda_altura_automatica: { path: 'autoHeight', aplica: ['dataList', 'dataListNumbered', 'dataTable', 'masterData', 'detailData'], spec: { kind: 'bool' }, dica: 'altura cresce com o texto: ' + BOOL_HINT },
  banda_manter_junto: { path: 'keepTogether', aplica: ['dataList', 'dataListNumbered', 'dataTable', 'masterData', 'detailData'], spec: { kind: 'bool' }, dica: 'não quebrar a linha entre folhas: ' + BOOL_HINT },
};

export const REMOVE = Symbol('remove');
const REMOVE_TOKENS = ['remover', 'padrao', 'padrão', 'nenhum', 'nenhuma', 'none'];
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const expandHex = (hex: string) => (hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex).toLowerCase();
const BORDER = /^(\d+(?:\.\d+)?)(?:px)?\s+(solid|dashed|dotted|double)\s+(#(?:[0-9a-f]{3}|[0-9a-f]{6}))$/i;

/** Valida e normaliza o valor textual da IA. `null` = inválido; `REMOVE` = limpar a propriedade. */
export function normalizePropertyValue(
  def: Pick<PropertyDefinition, 'spec' | 'removable'>,
  raw: unknown
): string | number | boolean | typeof REMOVE | null {
  const text = String(raw ?? '').trim();
  const lower = text.toLowerCase();
  const { spec } = def;
  if (!text) return null;
  if (spec.kind === 'border' && ['none', 'nenhuma', 'nenhum'].includes(lower)) return REMOVE;
  if (def.removable && spec.kind !== 'border' && REMOVE_TOKENS.includes(lower) && !(spec.kind === 'enum' && lower in spec.values)) return REMOVE;
  switch (spec.kind) {
    case 'color': {
      if (spec.transparent && lower === 'transparent') return 'transparent';
      if (!HEX.test(text)) return null;
      return expandHex(text);
    }
    case 'enum': return lower in spec.values ? spec.values[lower] : null;
    case 'bool': return ['true', 'sim', 'verdadeiro'].includes(lower) ? true : ['false', 'nao', 'não', 'falso'].includes(lower) ? false : null;
    case 'int':
    case 'number': {
      const pct = lower.endsWith('%');
      const n = Number(lower.replace(/(px|%|°)$/, '')) / (pct ? 100 : 1);
      if (!Number.isFinite(n) || n < spec.min || n > spec.max) return null;
      if (spec.kind === 'int') return Number.isInteger(n) ? (spec.store === 'px' ? `${n}px` : n) : null;
      return n;
    }
    case 'border': {
      const m = BORDER.exec(text);
      return m && Number(m[1]) > 0 && Number(m[1]) <= 10 ? `${Number(m[1])}px ${m[2].toLowerCase()} ${expandHex(m[3])}` : null;
    }
    case 'radius': {
      const m = /^(\d{1,3})(?:px)?$/.exec(lower);
      return m && Number(m[1]) <= 100 ? (Number(m[1]) === 0 ? REMOVE : `${Number(m[1])}px`) : null;
    }
    case 'padding': {
      const parts = lower.split(/\s+/);
      if (parts.length > 4 || !parts.every((p) => /^\d{1,3}(px)?$/.test(p) && parseInt(p, 10) <= 100)) return null;
      return parts.map((p) => `${parseInt(p, 10)}px`).join(' ');
    }
    case 'text': return text.length <= spec.max ? text : null;
  }
}

/** Texto do catálogo para o prompt da IA (gerado, nunca escrito à mão). */
export function describeAssistantCatalog(): string {
  const line = (key: string, d: PropertyDefinition) => `  - ${key} [${d.aplica.join(', ')}]: ${d.dica}${d.removable ? ' (ou "remover")' : ''}`;
  return [
    'ESTILO (alterar_estilo / estilo de adicionar_texto) — chave [vale para tipos de componente]:',
    ...Object.entries(STYLE_PROPERTIES).map(([k, d]) => line(k, d)),
    'PROPRIEDADES (alterar_propriedade: componente_id OU banda_id + propriedade + valor) — nome [vale para tipos de componente/banda]:',
    ...Object.entries(ELEMENT_PROPERTIES).map(([k, d]) => line(k, d)),
  ].join('\n');
}

/** Estilos de linhas da folha inteira (ação `aplicar_estilo_linhas`): valor da IA -> preset do Weave. */
export const LINES_PRESET_VALUES: Record<string, 'none' | 'simple' | 'grid'> = {
  nenhum: 'none',
  sem_linhas: 'none',
  simples: 'simple',
  linhas_simples: 'simple',
  grade: 'grid',
  grade_de_cartorio: 'grid',
};
