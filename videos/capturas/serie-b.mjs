// Série B — "Montando um Instrumento de Protesto do zero": captura dos passos 1 a 4.
// Uso: node capturas/serie-b.mjs <id-do-roteiro>   (ex.: b01-dados-de-exemplo)
import fs from 'node:fs'
import path from 'node:path'
import { AQUI, WEB, api, entrar, gravar, ferramentas, ESPERA } from './lib.mjs'

const id = process.argv[2]
const roteiro = JSON.parse(fs.readFileSync(path.join(AQUI, 'roteiros', `${id}.json`), 'utf8'))
const ESTADO = path.join(AQUI, 'build', 'estado.json')
const lerEstado = () => (fs.existsSync(ESTADO) ? JSON.parse(fs.readFileSync(ESTADO, 'utf8')) : {})
const gravarEstado = (parcial) => fs.writeFileSync(ESTADO, JSON.stringify({ ...lerEstado(), ...parcial }, null, 2))
const NOME_MODELO = 'Instrumento de Protesto (treino)'

/** O JSON dos dados de exemplo vive no guia escrito (fonte única). */
const dadosDoGuia = () => {
  const md = fs.readFileSync(path.join(AQUI, '..', 'docs', 'treinamento', '02-montando-o-instrumento-de-protesto.md'), 'utf8')
  return JSON.stringify(JSON.parse(md.match(/```json\n([\s\S]*?)\n```/)[1]), null, 2)
}

/** Remove cópias antigas do modelo de treino para o passo 1 começar do zero. */
const limparModelosDeTreino = async () => {
  const { token, conta } = await entrar()
  const lista = await api('/templates', { token, conta })
  for (const t of lista.dados.filter((x) => !x.isSystem && x.name === NOME_MODELO)) await api(`/templates/${t.id}`, { metodo: 'DELETE', token, conta })
}

const abrirEditor = async (page) => {
  const { templateId } = lerEstado()
  await page.goto(`${WEB}/editor/${templateId}`)
  await page.getByText('Dados do relatório').waitFor({ timeout: 30000 })
  await ESPERA(1500)
}
const salvar = async (page) => {
  await page.keyboard.press('Control+S')
  await page.getByText('Salvo', { exact: true }).first().waitFor({ timeout: 15000 }).catch(() => {})
  await ESPERA(800)
}


const ORDEM = ['b01-dados-de-exemplo', 'b02-configurar-a-folha', 'b03-criar-o-bloco', 'b04-cabecalho', 'b05-caixinhas', 'b06-titulo-e-texto', 'b07-quadro-de-dados', 'b08-devedores', 'b09-selo-e-qr', 'b10-informacoes', 'b11-visualizar-e-salvar']
const arquivoSnap = (idVideo) => path.join(AQUI, 'build', `snap-${idVideo}.json`)

/** Guarda o layout ao fim do passo: permite regravar o passo seguinte sem refazer os anteriores. */
const tirarSnapshot = async () => {
  const { token, conta } = await entrar()
  const t = await api(`/templates/${lerEstado().templateId}`, { token, conta })
  fs.writeFileSync(arquivoSnap(id), JSON.stringify({ document: t.dados.document }))
}
/** Volta o modelo ao fim do passo anterior (se houver snapshot), antes de gravar. */
const restaurarAnterior = async () => {
  const anterior = ORDEM[ORDEM.indexOf(id) - 1]
  if (!anterior || !fs.existsSync(arquivoSnap(anterior))) return
  const { token, conta } = await entrar()
  const { document } = JSON.parse(fs.readFileSync(arquivoSnap(anterior), 'utf8'))
  await api(`/templates/${lerEstado().templateId}`, { metodo: 'PATCH', corpo: { document, changeSummary: 'Restaurado para regravar o passo' }, token, conta })
}
const abrirEditorRestaurado = async (page) => { await restaurarAnterior(); await abrirEditor(page) }

const ALINHAR = { esquerda: 0, centro: 1, direita: 2, justificado: 3 }
const selecionarElemento = async (page) => { await page.mouse.move(1000, 200, { steps: 20 }); await page.mouse.click(1000, 200); await ESPERA(400) }

/** Cria um texto dentro do bloco: conteúdo (campos entre chaves viram campos), tamanho, alinhamento, bordas e posição. */
const criarTexto = async (page, f, { texto, x, y, w, h, tamanho = 9, alinhar = 'centro', bordas = true }) => {
  await f.clicar(page.getByRole('button', { name: 'Texto', exact: true }), 600)
  await f.clicar(page.getByText('Editar texto', { exact: true }), 700)
  const editor = page.locator('[contenteditable="true"]').first()
  await f.clicar(editor, 150)
  await page.keyboard.press('Control+A')
  if (texto === '') await page.keyboard.press('Backspace')
  const linhas = texto.split('\n')
  for (const [i, linha] of linhas.entries()) {
    if (linha) await page.keyboard.type(linha, { delay: 6 })
    // Shift+Enter: Enter logo após a 1ª linha perde a quebra no editor de texto (bug a corrigir no pacote)
    if (i < linhas.length - 1) await page.keyboard.press('Shift+Enter')
  }
  await f.pausa(300)
  await f.clicar(page.getByRole('button', { name: 'Salvar', exact: true }).last(), 600)
  await f.preencher('Tamanho', tamanho)
  await f.clicar(page.locator(`xpath=(//*[normalize-space(text())="Alinhamento"])[1]/following::button[${ALINHAR[alinhar] + 1}]`), 300)
  if (bordas) await f.clicar(page.getByText('Todas', { exact: true }), 300)
  await f.abrirSecao('Posição e espaçamento')
  await f.preencher('X', x); await f.preencher('Y', y); await f.preencher('Largura', w); await f.preencher('Altura', h)
}
const visualizar = async (page, f) => {
  await f.clicar(page.getByText('Visualizar', { exact: true }).first(), 3500)
}
const fecharPrevia = async (page, f) => { await f.clicar(page.getByText('Fechar', { exact: true }).first(), 800) }

const CENAS = {
  'b01-dados-de-exemplo': {
    inicio: async (page) => { await limparModelosDeTreino(); await page.goto(`${WEB}/`); await page.getByRole('heading', { name: 'Meus modelos' }).waitFor() },
    cenas: {
      abertura: async (page, f) => { await f.pausa(1500); await f.ate(page.getByRole('button', { name: 'Novo modelo' })) },
      novo: async (page, f) => {
        await f.clicar(page.getByRole('button', { name: 'Novo modelo' }))
        await f.digitar(page.getByLabel('Nome'), NOME_MODELO, 45)
        await f.clicar(page.getByRole('button', { name: 'Criar modelo' }), 1500)
        await page.waitForURL('**/modelos/**')
        gravarEstado({ templateId: page.url().split('/').pop() })
      },
      dados: async (page, f) => {
        await f.pausa(1200)
        await f.clicar(page.getByText('Novo conjunto de dados').first(), 1200)
      },
      json: async (page, f) => {
        await f.digitar(page.locator('#dataset-name'), 'Exemplo', 70)
        await f.clicar(page.getByRole('tab', { name: 'Avançado (JSON)' }), 800)
        const area = page.getByLabel('Dados em JSON')
        await f.ate(area)
        await area.fill(dadosDoGuia())
        await f.pausa(1500)
        await area.evaluate((el) => { el.scrollTop = 0 })
      },
      salvar: async (page, f) => { await f.clicar(page.getByRole('button', { name: 'Salvar dados' }), 1500) },
      editor: async (page, f) => {
        await f.clicar(page.getByRole('link', { name: /Abrir editor/ }), 800)
        await page.getByText('Dados do relatório').waitFor({ timeout: 30000 })
        await f.pausa(1500)
        await f.ate(page.getByText('cartorio', { exact: true }).first())
        await f.pausa(1200)
        await f.ate(page.getByText('instrumentos', { exact: true }).first())
        await f.pausa(800)
      },
      fecho: async (page, f) => { await f.pausa(500) },
    },
  },
  'b02-configurar-a-folha': {
    inicio: abrirEditor,
    cenas: {
      abertura: async (page, f) => { await f.pausa(1200) },
      pagina: async (page, f) => { await page.mouse.move(960, 820, { steps: 30 }); await f.pausa(300); await page.mouse.click(960, 820); await f.pausa(1200) },
      tamanho: async (page, f) => {
        await f.pausa(500)
        const sel = page.locator('xpath=(//*[normalize-space(text())="Tamanho da folha"])[1]/following::*[self::select or @role="combobox"][1]')
        await f.clicar(sel, 900)
      },
      margens: async (page, f) => {
        for (const lado of ['Topo', 'Direita', 'Baixo', 'Esquerda']) await f.preencher(lado, 0.5)
      },
      fecho: async (page, f) => { await salvar(page); await f.pausa(800) },
    },
  },
  'b03-criar-o-bloco': {
    inicio: abrirEditor,
    cenas: {
      abertura: async (page, f) => { await f.pausa(1500) },
      lista: async (page, f) => { await f.clicar(page.getByRole('button', { name: 'Lista de registros' }), 1200) },
      fonte: async (page, f) => {
        const caixa = page.locator('xpath=(//*[normalize-space(text())="Uma linha para cada…"])[1]/following::button[1]')
        await f.clicar(caixa, 800)
        await f.clicar(page.getByText('instrumentos', { exact: true }).last(), 1000)
      },
      nome: async (page, f) => { await f.digitar(page.locator('input[value="Lista livre"]').first(), 'Instrumento (um por folha)', 55); await page.keyboard.press('Enter') },
      tamanho: async (page, f) => {
        await f.clicar(page.getByText('Posição e tamanho', { exact: true }), 600)
        await f.preencher('X', 0); await f.preencher('Y', 0); await f.preencher('Largura', 754); await f.preencher('Altura', 1070)
      },
      altura: async (page, f) => {
        const alternador = page.locator('label', { hasText: 'Altura automática' }).locator('input, [role="switch"]').first()
        if (!(await alternador.isVisible().catch(() => false))) await f.clicar(page.getByText('Avançado', { exact: true }).first(), 800)
        await f.ate(alternador)
        await f.pausa(900)
        if (await alternador.isChecked()) await f.clicar(alternador, 900)
        if (await alternador.isChecked()) throw new Error('Altura automática continua ligada')
      },
      fecho: async (page, f) => { await salvar(page); await f.pausa(800) },
    },
  },
  'b04-cabecalho': {
    inicio: abrirEditor,
    cenas: {
      abertura: async (page, f) => { await f.pausa(1200) },
      imagem: async (page, f) => {
        await page.mouse.move(1000, 600, { steps: 30 }); await page.mouse.click(1000, 600); await f.pausa(700)
        await f.clicar(page.getByRole('button', { name: 'Imagem', exact: true }), 1200)
        const dados = page.locator('xpath=(//*[normalize-space(text())="Ou usar uma imagem dos dados"])[1]/following::button[1]')
        await f.clicar(dados, 800)
        await f.clicar(page.getByText(/cartorio\s*·\s*Logo/i).last(), 1000)
      },
      imagemPos: async (page, f) => {
        await f.abrirSecao('Posição e espaçamento')
        await f.preencher('X', 28); await f.preencher('Y', 14); await f.preencher('Largura', 80); await f.preencher('Altura', 84)
      },
      texto: async (page, f) => {
        await page.mouse.move(1100, 700, { steps: 30 }); await page.mouse.click(1100, 700); await f.pausa(700)
        await f.clicar(page.getByRole('button', { name: 'Texto', exact: true }), 1000)
        await f.clicar(page.getByText('Editar texto', { exact: true }), 1200)
        const editor = page.locator('[contenteditable="true"]').first()
        await f.clicar(editor, 300)
        await page.keyboard.press('Control+A')
        await page.keyboard.type('REPÚBLICA FEDERATIVA DO BRASIL', { delay: 45 })
        // Enter logo após a 1ª linha perde a quebra no editor de texto (bug a corrigir no pacote); Shift+Enter preserva
        await page.keyboard.press('Shift+Enter')
        await f.pausa(600)
      },
      campos: async (page, f) => {
        for (const rotulo of [/cartorio\s*·\s*Estado/i, /cartorio\s*·\s*Denominacao/i]) {
          await f.clicar(page.getByText(rotulo).first(), 600)
          await page.keyboard.press('Enter')
          await f.pausa(300)
        }
        await f.clicar(page.getByText(/cartorio\s*·\s*Cidade/i).first(), 600)
        await page.keyboard.type(' - ', { delay: 60 })
        await f.clicar(page.getByText(/cartorio\s*·\s*Uf/i).first(), 900)
      },
      textoPos: async (page, f) => {
        await f.clicar(page.getByRole('button', { name: 'Salvar', exact: true }).last(), 1000)
        await f.preencher('Tamanho', 12)
        await f.clicar(page.getByRole('button', { name: /centralizar|centro/i }).first(), 600).catch(() => {})
        await f.abrirSecao('Posição e espaçamento')
        await f.preencher('X', 118); await f.preencher('Y', 14); await f.preencher('Largura', 360); await f.preencher('Altura', 84)
      },
      salvar: async (page, f) => { await salvar(page); await f.pausa(1000) },
    },
  },
  'b05-caixinhas': {
    inicio: abrirEditorRestaurado,
    cenas: {
      abertura: async (page, f) => { await selecionarElemento(page); await f.pausa(1500) },
      tipo: async (page, f) => { await criarTexto(page, f, { texto: 'TIPO', x: 492, y: 14, w: 58, h: 17 }) },
      rotulos: async (page) => {
        const f = ferramentas(page, 0.25)
        await criarTexto(page, f, { texto: 'LIVRO', x: 549, y: 14, w: 83, h: 17 })
        await criarTexto(page, f, { texto: 'PÁGINA', x: 632, y: 14, w: 83, h: 17 })
      },
      valores: async (page) => {
        const f = ferramentas(page, 0.25)
        await criarTexto(page, f, { texto: '{instrumentos.livro_letra}', x: 492, y: 30, w: 58, h: 17 })
        await criarTexto(page, f, { texto: '{instrumentos.livro_numero}', x: 549, y: 30, w: 83, h: 17 })
        await criarTexto(page, f, { texto: '{instrumentos.folha}', x: 632, y: 30, w: 83, h: 17 })
      },
      fecho: async (page, f) => { await salvar(page); await f.pausa(800) },
    },
  },
  'b06-titulo-e-texto': {
    inicio: abrirEditorRestaurado,
    cenas: {
      abertura: async (page, f) => { await selecionarElemento(page); await f.pausa(1500) },
      titulo: async (page, f) => { await criarTexto(page, f, { texto: 'INSTRUMENTO DE PROTESTO', x: 0, y: 128, w: 714, h: 22, tamanho: 16, bordas: false }) },
      paragrafo: async (page, f) => {
        await f.clicar(page.getByRole('button', { name: 'Texto', exact: true }), 600)
        await f.clicar(page.getByText('Editar texto', { exact: true }), 700)
        await f.clicar(page.locator('[contenteditable="true"]').first(), 150)
        await page.keyboard.press('Control+A')
        await page.keyboard.type('Saibam quantos, este público instrumento de protesto bastante virem que, aos {instrumentos.apresentacao_dia} dias do mês de {instrumentos.apresentacao_mes} de {instrumentos.apresentacao_ano}, neste {cartorio.denominacao}, em cartório compareceu o representante {instrumentos.apresentante} e me apresentou para ser apontado e depois protestado {instrumentos.tipo_protesto}, o título cujas características são:', { delay: 14 })
        await f.pausa(800)
        await f.clicar(page.getByRole('button', { name: 'Salvar', exact: true }).last(), 800)
      },
      ajuste: async (page, f) => {
        await f.preencher('Tamanho', 11)
        await f.clicar(page.locator('xpath=(//*[normalize-space(text())="Alinhamento"])[1]/following::button[4]'), 400)
        await f.abrirSecao('Posição e espaçamento')
        await f.preencher('X', 0); await f.preencher('Y', 158); await f.preencher('Largura', 714); await f.preencher('Altura', 66)
      },
      fecho: async (page, f) => { await salvar(page); await f.pausa(800) },
    },
  },
  'b07-quadro-de-dados': {
    inicio: abrirEditorRestaurado,
    cenas: {
      abertura: async (page, f) => { await selecionarElemento(page); await f.pausa(1500) },
      rotulos: async (page) => {
        const f = ferramentas(page, 0.2)
        for (const [texto, x, w] of [['DATA DA DISTRIBUIÇÃO', 0, 96], ['NÚMERO E DATA DO PROTOCOLO', 95, 124], ['MOTIVO DO PROTESTO', 218, 105], ['TIPO DE DOCUMENTO', 322, 393]]) await criarTexto(page, f, { texto, x, y: 236, w, h: 27, tamanho: 8 })
      },
      valores: async (page) => {
        const f = ferramentas(page, 0.2)
        for (const [texto, x, w] of [['{instrumentos.data_distribuicao}', 0, 96], ['{instrumentos.numero_apontamento} - {instrumentos.data_apontamento}', 95, 124], ['{instrumentos.motivo}', 218, 105], ['{instrumentos.natureza}', 322, 393]]) await criarTexto(page, f, { texto, x, y: 262, w, h: 21, tamanho: 9 })
      },
      partes: async (page) => {
        const f = ferramentas(page, 0.2)
        await criarTexto(page, f, { texto: 'APRESENTANTE', x: 0, y: 320, w: 105, h: 26 })
        await criarTexto(page, f, { texto: '{instrumentos.apresentante}', x: 104, y: 320, w: 611, h: 26, alinhar: 'esquerda' })
        await criarTexto(page, f, { texto: 'SACADOR', x: 0, y: 345, w: 105, h: 40 })
        await criarTexto(page, f, { texto: '{instrumentos.sacador_completo}', x: 104, y: 345, w: 611, h: 40, alinhar: 'esquerda' })
      },
      fecho: async (page, f) => { await salvar(page); await f.pausa(800) },
    },
  },
  'b08-devedores': {
    inicio: abrirEditorRestaurado,
    cenas: {
      abertura: async (page, f) => { await selecionarElemento(page); await f.pausa(1500) },
      cabecalhos: async (page) => {
        const f = ferramentas(page, 0.2)
        await criarTexto(page, f, { texto: 'DEVEDOR(ES)', x: 0, y: 384, w: 474, h: 19, alinhar: 'esquerda' })
        await criarTexto(page, f, { texto: 'DOCUMENTOS DE IDENTIFICAÇÃO', x: 474, y: 384, w: 242, h: 19, alinhar: 'esquerda' })
      },
      caixas: async (page) => {
        const f = ferramentas(page, 0.2)
        await criarTexto(page, f, { texto: '{devedores.nome}\n{devedores.endereco}', x: 0, y: 402, w: 474, h: 150, alinhar: 'esquerda' })
        await criarTexto(page, f, { texto: '{devedores.documento}', x: 474, y: 402, w: 242, h: 150, alinhar: 'esquerda' })
      },
      visualizar: async (page, f) => {
        await visualizar(page, f)
        await page.mouse.move(960, 600, { steps: 10 })
        for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 260); await f.pausa(450) }
        await f.pausa(1500)
        await fecharPrevia(page, f)
      },
      fecho: async (page, f) => { await salvar(page); await f.pausa(800) },
    },
  },
  'b09-selo-e-qr': {
    inicio: abrirEditorRestaurado,
    cenas: {
      abertura: async (page, f) => { await selecionarElemento(page); await f.pausa(1500) },
      moldura: async (page) => {
        const f = ferramentas(page, 0.3)
        await criarTexto(page, f, { texto: '', x: 0, y: 566, w: 714, h: 86 })
      },
      qr: async (page, f) => {
        const mais = page.getByText('Mais elementos').first()
        if (!(await page.getByRole('button', { name: 'QR Code', exact: true }).isVisible().catch(() => false))) await f.clicar(mais, 600)
        await f.clicar(page.getByRole('button', { name: 'QR Code', exact: true }), 1000)
        await f.clicar(page.locator('xpath=(//*[normalize-space(text())="Ou usar uma informação dos dados"])[1]/following::button[1]'), 800)
        await f.clicar(page.getByText(/instrumentos\s*·\s*Selo url/i).last(), 1000)
        await f.abrirSecao('Posição e espaçamento')
        await f.preencher('X', 19); await f.preencher('Y', 574); await f.preencher('Largura', 66); await f.preencher('Altura', 70)
      },
      texto: async (page) => {
        const f = ferramentas(page, 0.25)
        await criarTexto(page, f, { texto: '**Poder Judiciário do Estado de Goiás**\n**Selo Eletrônico de Fiscalização**\n{instrumentos.selo}\nConsulte esse selo em {instrumentos.selo_url}', x: 417, y: 574, w: 275, h: 70 })
      },
      fecho: async (page, f) => { await salvar(page); await f.pausa(800) },
    },
  },
  'b10-informacoes': {
    inicio: abrirEditorRestaurado,
    cenas: {
      abertura: async (page, f) => { await selecionarElemento(page); await f.pausa(1500) },
      informacao: async (page) => {
        const f = ferramentas(page, 0.3)
        await criarTexto(page, f, { texto: 'INFORMAÇÃO', x: 0, y: 652, w: 714, h: 60, tamanho: 10, alinhar: 'esquerda' })
      },
      averbacao: async (page) => {
        const f = ferramentas(page, 0.25)
        await criarTexto(page, f, { texto: 'AVERBAÇÃO', x: 0, y: 711, w: 181, h: 94, tamanho: 10, alinhar: 'esquerda' })
        await criarTexto(page, f, { texto: '{instrumentos.assinante}. Pelo que, para garantia do credor, digitei o presente Instrumento de Protesto e o subscrevi.', x: 180, y: 711, w: 535, h: 94, tamanho: 10, alinhar: 'justificado' })
      },
      aviso: async (page) => {
        const f = ferramentas(page, 0.3)
        await criarTexto(page, f, { texto: 'DOCUMENTO ASSINADO DIGITALMENTE NOS TERMOS DA MP nº 2200-2 de 24/08/2001.', x: 0, y: 847, w: 714, h: 24, tamanho: 8, alinhar: 'esquerda' })
      },
      fecho: async (page, f) => { await salvar(page); await f.pausa(800) },
    },
  },
  'b11-visualizar-e-salvar': {
    inicio: abrirEditorRestaurado,
    cenas: {
      abertura: async (page, f) => { await f.pausa(1500) },
      visualizar: async (page, f) => {
        await visualizar(page, f)
        await page.mouse.move(960, 600, { steps: 10 })
        for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 300); await f.pausa(500) }
        await f.pausa(1000)
        await fecharPrevia(page, f)
      },
      campos: async (page, f) => {
        await f.clicar(page.getByText('Campos', { exact: true }).first(), 2500)
        await f.clicar(page.getByText('Dados', { exact: true }).first(), 1500)
      },
      salvar: async (page, f) => { await page.keyboard.press('Control+S'); await f.pausa(300); await salvar(page); await f.pausa(1200) },
      modelo: async (page, f) => {
        await page.goto(`${WEB}/modelos/${lerEstado().templateId}`)
        await page.getByRole('button', { name: /Compartilhar/ }).waitFor({ timeout: 20000 })
        await f.pausa(1500)
        await f.ate(page.getByRole('button', { name: /Compartilhar/ }))
        await f.pausa(1500)
      },
      fecho: async (page, f) => { await f.pausa(800) },
    },
  },
}

const cfg = CENAS[id]
if (!cfg) throw new Error(`Sem roteiro de captura para ${id}`)
await gravar(roteiro, cfg.cenas, { aoIniciar: cfg.inicio })
await tirarSnapshot()
