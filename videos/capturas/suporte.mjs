// Vídeo único para o suporte da Orius: montagem do Instrumento de Protesto, da folha à conferência final.
// Os dados já vêm carregados (como no sistema da Orius): o modelo é criado pela API com os dados de exemplo,
// e a gravação começa direto na configuração da folha.
// Uso: node capturas/suporte.mjs
import fs from 'node:fs'
import path from 'node:path'
import { AQUI, WEB, api, entrar, gravar, ferramentas, ESPERA } from './lib.mjs'
import { criarTexto, previa, selecionarElemento } from './editor.mjs'

const ID = 'suporte-instrumento-de-protesto'
const NOME = 'Instrumento de Protesto (suporte Orius)'
const VIEWPORT = { width: 1920, height: 972 } // 1080 - faixa de legenda (108 px) que fica fora da captura
const roteiro = JSON.parse(fs.readFileSync(path.join(AQUI, 'roteiros', `${ID}.json`), 'utf8'))

/** Cria o modelo vazio com os dados de exemplo do instrumento (2 títulos; o segundo com 2 devedores). */
const prepararModelo = async () => {
  const { token, conta } = await entrar()
  const lista = await api('/templates', { token, conta })
  for (const t of lista.dados.filter((x) => !x.isSystem && x.name === NOME)) await api(`/templates/${t.id}`, { metodo: 'DELETE', token, conta })
  const base = JSON.parse(fs.readFileSync(path.join(AQUI, '..', 'backend', 'prisma', 'system-templates', '09-instrumento_protesto.json'), 'utf8')).mockData
  const segundo = structuredClone(base.instrumentos[0])
  Object.assign(segundo, {
    numero_apontamento: '88122', numero_titulo: 'NP-2026/044', natureza: 'Nota Promissória', apresentante: 'Fomento Exemplo Ltda',
    sacador_completo: 'Distribuidora Gama S/A - CNPJ 55.666.777/0001-88', valor_titulo: 'R$ 4.800,00', valor_protesto: 'R$ 4.968,50', folha: '121',
    selo: 'ABC12346-7', selo_url: 'https://selo.exemplo.gov.br/consulta/ABC123467',
    devedores: [
      { nome: 'João da Silva Pereira', documento: 'CPF 123.456.789-00', endereco: 'Rua das Flores, 120 - Goiânia/GO' },
      { nome: 'Maria Souza Pereira', documento: 'CPF 987.654.321-00', endereco: 'Rua das Flores, 120 - Goiânia/GO' },
    ],
  })
  const criado = await api('/templates', { metodo: 'POST', corpo: { name: NOME, description: 'Treinamento do suporte', tagIds: [] }, token, conta })
  await api(`/templates/${criado.dados.id}/mock-datasets`, { metodo: 'POST', corpo: { name: 'Exemplo', data: { cartorio: base.cartorio, instrumentos: [base.instrumentos[0], segundo] }, isDefault: true }, token, conta })
  fs.mkdirSync(path.join(AQUI, 'build'), { recursive: true })
  fs.writeFileSync(path.join(AQUI, 'build', 'suporte-estado.json'), JSON.stringify({ templateId: criado.dados.id }))
  return criado.dados.id
}

const abrirEditor = async (page) => {
  const templateId = await prepararModelo()
  await page.goto(`${WEB}/editor/${templateId}`)
  await page.getByText('Dados do relatório').waitFor({ timeout: 30000 })
  await ESPERA(1500)
}
const salvar = async (page) => {
  await page.keyboard.press('Control+S')
  await page.getByText('Salvo', { exact: true }).first().waitFor({ timeout: 15000 }).catch(() => {})
  await ESPERA(600)
}

/** Ritmo das ações: 0.9 = calmo o bastante para acompanhar na tela (e fechar ≥ 15 min). */
const R = 0.9
const rapido = (page) => ferramentas(page, R)
const caixas = async (page, itens) => { const f = rapido(page); for (const c of itens) await criarTexto(page, f, c) }

const CENAS = {
  // ── Etapa 1 · folha e lista ──────────────────────────────────────────────
  'e1-folha': async (page, f) => {
    await page.mouse.move(960, 700, { steps: 25 }); await page.mouse.click(960, 700); await f.pausa(700)
    const tamanho = page.locator('xpath=(//*[normalize-space(text())="Tamanho do papel"])[1]/following::*[self::select or @role="combobox"][1]')
    await f.destacar(tamanho, 2.5); await f.pausa(1500)
    const g = rapido(page)
    for (const lado of ['Topo', 'Direita', 'Baixo', 'Esquerda']) await g.preencher(lado, 0.5)
  },
  'e1-lista': async (page, f) => {
    // clicar fora da folha tira a seleção da página; senão o painel da direita não troca para a lista nova
    await page.mouse.move(330, 500, { steps: 15 }); await page.mouse.click(330, 500); await f.pausa(500)
    const botao = page.getByRole('button', { name: 'Lista de registros' })
    await f.destacar(botao, 3); await f.pausa(1800)
    await f.clicar(botao, 900)
    const caixa = page.locator('xpath=(//*[normalize-space(text())="Uma linha para cada…"])[1]/following::button[1]')
    await f.destacar(caixa, 3.5)
    await f.clicar(caixa, 900)
    await f.clicar(page.getByText('instrumentos', { exact: true }).last(), 1200)
  },
  'e1-tamanho': async (page, f) => {
    const g = rapido(page)
    await g.digitar(page.locator('input[value="Lista livre"]').first(), 'Instrumento (um por folha)', 40); await page.keyboard.press('Enter')
    await g.clicar(page.getByText('Posição e tamanho', { exact: true }), 500)
    await g.preencher('X', 0); await g.preencher('Y', 0); await g.preencher('Largura', 754); await g.preencher('Altura', 1070)
    const alternador = page.locator('label', { hasText: 'Altura automática' }).locator('input, [role="switch"]').first()
    if (!(await alternador.isVisible().catch(() => false))) await g.clicar(page.getByText('Avançado', { exact: true }).first(), 700)
    await f.destacar(alternador, 3)
    await f.pausa(1500)
    if (await alternador.isChecked()) await g.clicar(alternador, 700)
    if (await alternador.isChecked()) throw new Error('Altura automática continua ligada')
  },
  'e1-previa': async (page, f) => { await previa(page, f, { rolar: 5, espera: 1500 }) },

  // ── Etapa 2 · cabeçalho ──────────────────────────────────────────────────
  'e2-logo': async (page, f) => {
    await page.mouse.move(1000, 600, { steps: 25 }); await page.mouse.click(1000, 600); await f.pausa(600)
    await f.clicar(page.getByRole('button', { name: 'Imagem', exact: true }), 1000)
    const dados = page.locator('xpath=(//*[normalize-space(text())="Ou usar uma imagem dos dados"])[1]/following::button[1]')
    await f.destacar(dados, 2.5)
    await f.clicar(dados, 800)
    await f.clicar(page.getByText(/cartorio\s*·\s*Logo/i).last(), 900)
    await f.abrirSecao('Posição e espaçamento')
    const g = rapido(page)
    await g.preencher('X', 28); await g.preencher('Y', 14); await g.preencher('Largura', 80); await g.preencher('Altura', 84)
  },
  'e2-texto': async (page) => {
    await caixas(page, [{ texto: 'REPÚBLICA FEDERATIVA DO BRASIL\n{cartorio.estado}\n{cartorio.denominacao}\n{cartorio.cidade} - {cartorio.uf}', x: 118, y: 14, w: 360, h: 84, tamanho: 12, bordas: false }])
  },
  'e2-caixas': async (page) => {
    await caixas(page, [
      { texto: 'TIPO', x: 492, y: 14, w: 58, h: 17 }, { texto: 'LIVRO', x: 549, y: 14, w: 83, h: 17 }, { texto: 'PÁGINA', x: 632, y: 14, w: 83, h: 17 },
      { texto: '{instrumentos.livro_letra}', x: 492, y: 30, w: 58, h: 17 }, { texto: '{instrumentos.livro_numero}', x: 549, y: 30, w: 83, h: 17 }, { texto: '{instrumentos.folha}', x: 632, y: 30, w: 83, h: 17 },
      { texto: 'TIPO DO PROTESTO', x: 492, y: 46, w: 222, h: 17 }, { texto: '{instrumentos.tipo_protesto}', x: 492, y: 62, w: 222, h: 17 },
    ])
  },
  'e2-previa': async (page, f) => { await previa(page, f, { rolar: 0, espera: 3500 }) },

  // ── Etapa 3 · título e dados do título ───────────────────────────────────
  'e3-titulo': async (page) => { await caixas(page, [{ texto: 'INSTRUMENTO DE PROTESTO', x: 0, y: 128, w: 714, h: 22, tamanho: 16, bordas: false }]) },
  'e3-paragrafo': async (page) => {
    await caixas(page, [{ texto: 'Saibam quantos, este público instrumento de protesto bastante virem que, aos {instrumentos.apresentacao_dia} dias do mês de {instrumentos.apresentacao_mes} de {instrumentos.apresentacao_ano}, neste {cartorio.denominacao}, nesta cidade de {cartorio.cidade} - {cartorio.uf}, em cartório compareceu o representante {instrumentos.apresentante} e me apresentou para ser apontado e depois protestado por {instrumentos.motivo}, o título cujas características são:', x: 0, y: 158, w: 714, h: 66, tamanho: 11, alinhar: 'justificado', bordas: false }])
  },
  'e3-quadro1': async (page) => {
    await caixas(page, [
      { texto: 'DATA DA DISTRIBUIÇÃO', x: 0, y: 236, w: 96, h: 27, tamanho: 8 }, { texto: 'NÚMERO E DATA DO PROTOCOLO', x: 95, y: 236, w: 124, h: 27, tamanho: 8 },
      { texto: 'MOTIVO DO PROTESTO', x: 218, y: 236, w: 105, h: 27, tamanho: 8 }, { texto: 'TIPO DE DOCUMENTO', x: 322, y: 236, w: 393, h: 27, tamanho: 8 },
      { texto: '{instrumentos.data_distribuicao}', x: 0, y: 262, w: 96, h: 21 }, { texto: '{instrumentos.numero_apontamento} - {instrumentos.data_apontamento}', x: 95, y: 262, w: 124, h: 21 },
      { texto: '{instrumentos.motivo}', x: 218, y: 262, w: 105, h: 21 }, { texto: '{instrumentos.natureza}', x: 322, y: 262, w: 393, h: 21 },
    ])
  },
  'e3-quadro2': async (page) => {
    await caixas(page, [
      { texto: 'DOCUMENTO', x: 0, y: 282, w: 181, h: 19, tamanho: 8 }, { texto: 'EMISSÃO', x: 180, y: 282, w: 105, h: 19, tamanho: 8 }, { texto: 'VENCIMENTO', x: 284, y: 282, w: 105, h: 19, tamanho: 8 },
      { texto: 'VALOR DO DOCUMENTO', x: 388, y: 282, w: 164, h: 19, tamanho: 8 }, { texto: 'VALOR PROTESTO', x: 551, y: 282, w: 164, h: 19, tamanho: 8 },
      { texto: '{instrumentos.numero_titulo}', x: 0, y: 300, w: 181, h: 21 }, { texto: '{instrumentos.data_emissao}', x: 180, y: 300, w: 105, h: 21 }, { texto: '{instrumentos.data_vencimento}', x: 284, y: 300, w: 105, h: 21 },
      { texto: '{instrumentos.valor_titulo}', x: 388, y: 300, w: 164, h: 21 }, { texto: '{instrumentos.valor_protesto}', x: 551, y: 300, w: 164, h: 21 },
    ])
  },
  'e3-partes': async (page) => {
    await caixas(page, [
      { texto: 'APRESENTANTE', x: 0, y: 320, w: 105, h: 26 }, { texto: '{instrumentos.apresentante}', x: 104, y: 320, w: 611, h: 26, alinhar: 'esquerda' },
      { texto: 'SACADOR', x: 0, y: 345, w: 105, h: 40 }, { texto: '{instrumentos.sacador_completo}', x: 104, y: 345, w: 611, h: 40, alinhar: 'esquerda' },
    ])
  },
  'e3-previa': async (page, f) => { await previa(page, f, { rolar: 0, espera: 4000 }) },

  // ── Etapa 4 · devedores ──────────────────────────────────────────────────
  'e4-cabecalhos': async (page) => {
    await caixas(page, [{ texto: 'DEVEDOR(ES)', x: 0, y: 384, w: 474, h: 19, alinhar: 'esquerda' }, { texto: 'DOCUMENTOS DE IDENTIFICAÇÃO', x: 474, y: 384, w: 242, h: 19, alinhar: 'esquerda' }])
  },
  'e4-caixas': async (page) => {
    await caixas(page, [{ texto: '{devedores.nome}\n{devedores.endereco}', x: 0, y: 402, w: 474, h: 150, alinhar: 'esquerda' }, { texto: '{devedores.documento}', x: 474, y: 402, w: 242, h: 150, alinhar: 'esquerda' }])
  },
  'e4-previa': async (page, f) => { await previa(page, f, { rolar: 7, espera: 3000 }) },

  // ── Etapa 5 · selo e QR Code ─────────────────────────────────────────────
  'e5-moldura': async (page) => { await caixas(page, [{ texto: '', x: 0, y: 566, w: 714, h: 86 }]) },
  'e5-qr': async (page, f) => {
    if (!(await page.getByRole('button', { name: 'QR Code', exact: true }).isVisible().catch(() => false))) await f.clicar(page.getByText('Mais elementos').first(), 600)
    await f.clicar(page.getByRole('button', { name: 'QR Code', exact: true }), 1000)
    const info = page.locator('xpath=(//*[normalize-space(text())="Ou usar uma informação dos dados"])[1]/following::button[1]')
    await f.destacar(info, 2.5)
    await f.clicar(info, 800)
    await f.clicar(page.getByText(/instrumentos\s*·\s*Selo url/i).last(), 1000)
    await f.abrirSecao('Posição e espaçamento')
    const g = rapido(page)
    await g.preencher('X', 19); await g.preencher('Y', 574); await g.preencher('Largura', 66); await g.preencher('Altura', 70)
  },
  'e5-texto': async (page) => {
    await caixas(page, [{ texto: '**Poder Judiciário do Estado de Goiás**\n**Selo Eletrônico de Fiscalização**\n{instrumentos.selo}\nConsulte esse selo em\nhttp://extrajudicial.tjgo.jus.br/selo', x: 417, y: 574, w: 275, h: 70 }])
  },
  'e5-previa': async (page, f) => { await previa(page, f, { rolar: 3, espera: 3000 }) },

  // ── Etapa 6 · finalização ────────────────────────────────────────────────
  'e6-info': async (page) => {
    await caixas(page, [{ texto: 'INFORMAÇÃO', x: 0, y: 652, w: 714, h: 60, tamanho: 10, alinhar: 'esquerda' }, { texto: 'AVERBAÇÃO', x: 0, y: 711, w: 181, h: 94, tamanho: 10, alinhar: 'esquerda' }])
  },
  'e6-averbacao': async (page) => {
    await caixas(page, [{ texto: '{instrumentos.assinante}. Pelo que, para garantia do(a) credor(a), digitei o presente Instrumento de Protesto que vai por mim datado e assinado, do que dou fé.\n{cartorio.cidade} - {cartorio.uf}, {instrumentos.data_impressao}.\nQuem Assina: {instrumentos.assinante}.', x: 180, y: 711, w: 535, h: 94, tamanho: 10, alinhar: 'justificado' }])
  },
  'e6-custas': async (page) => {
    await caixas(page, [
      { texto: 'As custas, os emolumentos e demais despesas relativas a este protesto serão devidos e cobrados do interessado por ocasião do cancelamento do protesto, com base nos valores da taxa da tabela em vigor na data em que tal fato ocorrer.', x: 0, y: 804, w: 714, h: 44, alinhar: 'justificado' },
      { texto: 'DOCUMENTO ASSINADO DIGITALMENTE NOS TERMOS DA MP nº 2200-2 de 24/08/2001, CONFORME IMPRESSÃO E MARGEM DIREITA.', x: 0, y: 847, w: 714, h: 24, tamanho: 8, alinhar: 'esquerda' },
    ])
  },
  'e6-lateral': async (page) => {
    await caixas(page, [{ texto: 'Este documento foi assinado digitalmente por Oficial Tabelião: {cartorio.titular}.\nSe impresso, para conferência acesse o site http://pesquisaprotesto.com.br/', x: 426, y: 317, w: 620, h: 26, bordas: false, girar: 270 }])
  },
  'e6-previa': async (page, f) => { await previa(page, f, { rolar: 6, espera: 3000 }) },

  // ── Etapa 7 · conferência final ──────────────────────────────────────────
  'e7-final': async (page, f) => {
    await previa(page, f, { rolar: 4, espera: 2500 })
    await page.keyboard.press('Control+S')
    await salvar(page)
    await f.pausa(1500)
  },
}

await gravar(roteiro, CENAS, { aoIniciar: abrirEditor, viewport: VIEWPORT, pausaCena: 0.5 })
