import { marginsCmToPx, PAGE_PRESET_BY_ID, presetDimensionsToPx, type ReportDefinition } from 'weave';
import { DEMO_DATA, DEMO_REPORT } from './demoReport';
import { DEMO_ATO_EXTRAPROTOCOLAR_DATA, DEMO_CARTORIO_DATA } from './demoHostData';
import { PRESET_ETIQUETA_EXTRAPROTOCOLAR } from './demoHostPresets';

export { DEMO_DATA, DEMO_REPORT };

const a5 = presetDimensionsToPx(PAGE_PRESET_BY_ID['a5-portrait']);
const receipt80 = presetDimensionsToPx(PAGE_PRESET_BY_ID['receipt-80']);
const etiquetaExtraprotocolar = presetDimensionsToPx(PRESET_ETIQUETA_EXTRAPROTOCOLAR);

/** Relatório com 2 páginas de design (capa + corpo) */
export const DEMO_MULTIPAGE_REPORT: ReportDefinition = {
  id: 'rep_multipage',
  name: 'Relatório multipágina',
  pages: [
    {
      id: 'page_cover',
      name: 'Capa',
      presetId: 'a4-portrait',
      profile: 'document',
      width: 794,
      height: 1123,
      margins: marginsCmToPx({ top: 2.1, right: 2.1, bottom: 2.1, left: 2.1 }),
      bands: ['mp_cover_title'],
    },
    {
      id: 'page_body',
      name: 'Corpo',
      presetId: 'a4-portrait',
      profile: 'document',
      width: 794,
      height: 1123,
      margins: marginsCmToPx({ top: 2.1, right: 2.1, bottom: 2.1, left: 2.1 }),
      bands: ['mp_header', 'mp_data', 'mp_footer'],
    },
  ],
  bands: {
    mp_cover_title: {
      id: 'mp_cover_title',
      type: 'reportTitle',
      name: 'Capa',
      height: 120,
      bandRect: { x: 8, y: 200, width: 738, height: 120 },
      components: ['mp_comp_cover'],
    },
    mp_header: {
      id: 'mp_header',
      type: 'pageHeader',
      name: 'Cabeçalho',
      height: 40,
      bandRect: { x: 8, y: 76, width: 738, height: 40 },
      components: ['mp_comp_h_name'],
    },
    mp_data: {
      id: 'mp_data',
      type: 'dataList',
      name: 'Usuários',
      height: 30,
      bandRect: { x: 8, y: 124, width: 738, height: 30 },
      dataSource: 'users',
      components: ['mp_comp_d_name', 'mp_comp_d_email'],
    },
    mp_footer: {
      id: 'mp_footer',
      type: 'pageFooter',
      name: 'Rodapé',
      height: 30,
      bandRect: { x: 8, y: 420, width: 738, height: 30 },
      components: ['mp_comp_footer'],
    },
  },
  components: {
    mp_comp_cover: {
      id: 'mp_comp_cover',
      type: 'text',
      name: 'Título capa',
      parentId: 'mp_cover_title',
      rect: { x: 10, y: 20, width: 500, height: 60 },
      content: '**Relatório multipágina**\n\nCapa do documento',
      style: { fontSize: '28px', color: '#4338ca' },
    },
    mp_comp_h_name: {
      id: 'mp_comp_h_name',
      type: 'text',
      name: 'Header',
      parentId: 'mp_header',
      rect: { x: 10, y: 10, width: 200, height: 20 },
      content: '**Nome**',
      style: { fontSize: '14px', color: '#666' },
    },
    mp_comp_d_name: {
      id: 'mp_comp_d_name',
      type: 'text',
      name: 'Nome',
      parentId: 'mp_data',
      rect: { x: 10, y: 5, width: 200, height: 20 },
      content: '{users.name}',
      style: { fontSize: '14px' },
    },
    mp_comp_d_email: {
      id: 'mp_comp_d_email',
      type: 'text',
      name: 'Email',
      parentId: 'mp_data',
      rect: { x: 220, y: 5, width: 240, height: 20 },
      content: '{users.email}',
      style: { fontSize: '14px' },
    },
    mp_comp_footer: {
      id: 'mp_comp_footer',
      type: 'text',
      name: 'Rodapé',
      parentId: 'mp_footer',
      rect: { x: 10, y: 5, width: 400, height: 20 },
      content: 'Página {sys.pageNumber} de {sys.pageCount}',
      style: { fontSize: '10px', color: '#999' },
    },
  },
};

/** Lista compacta em folha A5 */
export const DEMO_A5_REPORT: ReportDefinition = {
  id: 'rep_a5',
  name: 'Lista A5',
  pages: [
    {
      id: 'a5_page',
      name: 'Folha A5',
      presetId: 'a5-portrait',
      profile: 'document',
      width: a5.width,
      height: a5.height,
      margins: a5.margins,
      bands: ['a5_header', 'a5_data', 'a5_footer'],
    },
  ],
  bands: {
    a5_header: {
      id: 'a5_header',
      type: 'pageHeader',
      name: 'Cabeçalho',
      height: 36,
      bandRect: { x: 8, y: 60, width: a5.width - a5.margins.left - a5.margins.right - 16, height: 36 },
      components: ['a5_comp_title'],
    },
    a5_data: {
      id: 'a5_data',
      type: 'dataList',
      name: 'Itens',
      height: 28,
      bandRect: { x: 8, y: 100, width: a5.width - a5.margins.left - a5.margins.right - 16, height: 28 },
      dataSource: 'users',
      components: ['a5_comp_name'],
    },
    a5_footer: {
      id: 'a5_footer',
      type: 'pageFooter',
      name: 'Rodapé',
      height: 24,
      bandRect: {
        x: 8,
        y: a5.height - a5.margins.top - a5.margins.bottom - 40,
        width: a5.width - a5.margins.left - a5.margins.right - 16,
        height: 24,
      },
      components: ['a5_comp_footer'],
    },
  },
  components: {
    a5_comp_title: {
      id: 'a5_comp_title',
      type: 'text',
      name: 'Título',
      parentId: 'a5_header',
      rect: { x: 8, y: 8, width: 300, height: 20 },
      content: '**Lista A5**',
      style: { fontSize: '16px', fontWeight: 'bold' },
    },
    a5_comp_name: {
      id: 'a5_comp_name',
      type: 'text',
      name: 'Nome',
      parentId: 'a5_data',
      rect: { x: 8, y: 4, width: 320, height: 20 },
      content: '{users.name} — {users.email}',
      style: { fontSize: '12px' },
    },
    a5_comp_footer: {
      id: 'a5_comp_footer',
      type: 'text',
      name: 'Rodapé',
      parentId: 'a5_footer',
      rect: { x: 8, y: 4, width: 280, height: 16 },
      content: 'Folha {Page#} / {TotalPages#}',
      style: { fontSize: '9px', color: '#888' },
    },
  },
};

const receiptContentWidth = receipt80.width - receipt80.margins.left - receipt80.margins.right;

/** Cupom térmico 80 mm — perfil contínuo */
export const DEMO_RECEIPT_REPORT: ReportDefinition = {
  id: 'rep_receipt',
  name: 'Cupom 80 mm',
  pages: [
    {
      id: 'receipt_page',
      name: 'Cupom',
      presetId: 'receipt-80',
      profile: 'continuous',
      width: receipt80.width,
      height: receipt80.height,
      margins: receipt80.margins,
      bands: ['rc_header', 'rc_items', 'rc_total'],
    },
  ],
  bands: {
    rc_header: {
      id: 'rc_header',
      type: 'reportTitle',
      name: 'Cabeçalho loja',
      height: 70,
      bandRect: { x: 4, y: 8, width: receiptContentWidth - 8, height: 70 },
      components: ['rc_comp_store', 'rc_comp_date'],
    },
    rc_items: {
      id: 'rc_items',
      type: 'dataList',
      name: 'Itens',
      height: 24,
      bandRect: { x: 4, y: 82, width: receiptContentWidth - 8, height: 24 },
      dataSource: 'users',
      components: ['rc_comp_item'],
    },
    rc_total: {
      id: 'rc_total',
      type: 'reportSummary',
      name: 'Total',
      height: 40,
      bandRect: { x: 4, y: 110, width: receiptContentWidth - 8, height: 40 },
      components: ['rc_comp_total'],
    },
  },
  components: {
    rc_comp_store: {
      id: 'rc_comp_store',
      type: 'text',
      name: 'Loja',
      parentId: 'rc_header',
      rect: { x: 4, y: 4, width: receiptContentWidth - 16, height: 32 },
      content: '**RESTAURANTE DEMO**\nRua Exemplo, 100',
      style: { fontSize: '13px', textAlign: 'center' },
    },
    rc_comp_date: {
      id: 'rc_comp_date',
      type: 'text',
      name: 'Data',
      parentId: 'rc_header',
      rect: { x: 4, y: 40, width: receiptContentWidth - 16, height: 16 },
      content: '{sys.date} {sys.time}',
      style: { fontSize: '10px', textAlign: 'center', color: '#666' },
    },
    rc_comp_item: {
      id: 'rc_comp_item',
      type: 'text',
      name: 'Item',
      parentId: 'rc_items',
      rect: { x: 4, y: 2, width: receiptContentWidth - 16, height: 20 },
      content: '{users.name}',
      style: { fontSize: '11px' },
    },
    rc_comp_total: {
      id: 'rc_comp_total',
      type: 'text',
      name: 'Total',
      parentId: 'rc_total',
      rect: { x: 4, y: 8, width: receiptContentWidth - 16, height: 24 },
      content: '**Obrigado!**',
      style: { fontSize: '12px', textAlign: 'center' },
    },
  },
};

const etiquetaContentWidth = etiquetaExtraprotocolar.width;
const etiquetaContentHeight = etiquetaExtraprotocolar.height;

/** Etiqueta 9×5 cm — autenticação e reconhecimento de firma (tabelionato de notas) */
export const DEMO_ETIQUETA_EXTRAPROTOCOLAR_REPORT: ReportDefinition = {
  id: 'rep_etiqueta_extraprotocolar',
  name: 'Etiqueta extraprotocolar',
  pages: [
    {
      id: 'etiqueta_page',
      name: 'Etiqueta',
      presetId: PRESET_ETIQUETA_EXTRAPROTOCOLAR.id,
      profile: 'label',
      sizeUnit: 'cm',
      width: etiquetaContentWidth,
      height: etiquetaContentHeight,
      margins: etiquetaExtraprotocolar.margins,
      bands: ['etq_ato'],
    },
  ],
  bands: {
    etq_ato: {
      id: 'etq_ato',
      type: 'dataList',
      name: 'Ato extraprotocolar',
      height: etiquetaContentHeight,
      bandRect: {
        x: 0,
        y: 0,
        width: etiquetaContentWidth,
        height: etiquetaContentHeight,
      },
      dataSource: 'ato',
      components: ['etq_comp_texto'],
    },
  },
  components: {
    etq_comp_texto: {
      id: 'etq_comp_texto',
      type: 'text',
      name: 'Texto do selo',
      parentId: 'etq_ato',
      rect: {
        x: 8,
        y: 10,
        width: etiquetaContentWidth - 16,
        height: etiquetaContentHeight - 20,
      },
      content:
        '**{ato.tipo}**\n{ato.texto} {ato.cidade_uf}, {ato.data}. Emol.:\nR$ {ato.emolumentos};;\n{ato.numero_selo} - Consulte este selo em:\n[color=#46747d]{ato.url_consulta}[/color]\n{ato.oficial_nome}-{ato.oficial_cargo}',
      style: {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '11px',
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#000000',
        lineHeight: 1.3,
      },
    },
  },
};

export interface DemoReportBundle {
  report: ReportDefinition;
  data: Record<string, unknown[]>;
}

export const DEMO_REPORT_BUNDLES: Record<string, DemoReportBundle> = {
  rep_1: { report: DEMO_REPORT, data: DEMO_DATA },
  rep_multipage: { report: DEMO_MULTIPAGE_REPORT, data: DEMO_DATA },
  rep_a5: { report: DEMO_A5_REPORT, data: DEMO_DATA },
  rep_receipt: { report: DEMO_RECEIPT_REPORT, data: DEMO_DATA },
  rep_etiqueta_extraprotocolar: {
    report: DEMO_ETIQUETA_EXTRAPROTOCOLAR_REPORT,
    data: DEMO_ATO_EXTRAPROTOCOLAR_DATA,
  },
};

export function resolveDemoReportBundle(reportId: string): DemoReportBundle {
  const bundle = DEMO_REPORT_BUNDLES[reportId] ?? DEMO_REPORT_BUNDLES.rep_1;
  return {
    report: bundle.report,
    data: { ...DEMO_CARTORIO_DATA, ...bundle.data },
  };
}
