// Ações reutilizáveis do editor do Weave (criar caixas de texto, pré-visualizar) para os roteiros de captura.
import { ESPERA } from './lib.mjs'

const ALINHAR = { esquerda: 0, centro: 1, direita: 2, justificado: 3 }
const GIRAR = { 0: 1, 90: 2, 180: 3, 270: 4 }

/** Seleciona um elemento existente (o cabeçalho), para que "Texto"/"Imagem" entrem no mesmo bloco. */
export const selecionarElemento = async (page, x = 1000, y = 200) => { await page.mouse.move(x, y, { steps: 20 }); await page.mouse.click(x, y); await ESPERA(400) }

/** Cria um texto dentro do bloco: conteúdo (campos entre chaves viram campos), tamanho, alinhamento, bordas, rotação e posição. */
export const criarTexto = async (page, f, { texto, x, y, w, h, tamanho = 9, alinhar = 'centro', bordas = true, girar = 0 }) => {
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
  await f.abrirSecao('Aparência', 'Tamanho') // a seção recolhida da imagem vale para o texto também
  await f.preencher('Tamanho', tamanho)
  await f.clicar(page.locator(`xpath=(//*[normalize-space(text())="Alinhamento"])[1]/following::button[${ALINHAR[alinhar] + 1}]`), 300)
  if (girar) await f.clicar(page.locator(`xpath=(//*[normalize-space(text())="Girar"])[1]/following::button[${GIRAR[girar]}]`), 300)
  if (bordas) await f.clicar(page.getByText('Todas', { exact: true }), 300)
  await f.abrirSecao('Posição e espaçamento')
  await f.preencher('X', x); await f.preencher('Y', y); await f.preencher('Largura', w); await f.preencher('Altura', h)
}

export const visualizar = async (page, f) => { await f.clicar(page.getByText('Visualizar', { exact: true }).first(), 2500) }
export const fecharPrevia = async (page, f) => { await f.clicar(page.getByText('Fechar', { exact: true }).first(), 800) }
/** Mostra a pré-visualização da etapa: rola devagar até o fim e fecha. */
export const previa = async (page, f, { rolar = 0, espera = 2500 } = {}) => {
  await visualizar(page, f)
  await page.mouse.move(960, 500, { steps: 8 })
  await f.pausa(espera)
  for (let i = 0; i < rolar; i++) { await page.mouse.wheel(0, 280); await f.pausa(450) }
  await f.pausa(1200)
  await fecharPrevia(page, f)
}
