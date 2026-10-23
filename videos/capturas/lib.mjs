// Biblioteca de gravação: abre o Weave num navegador com vídeo, mostra um cursor visível e marca o início de cada cena.
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const AQUI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const WEB = process.env.WEAVE_WEB ?? 'http://192.168.1.100:3100'
export const API = process.env.WEAVE_API ?? 'http://192.168.1.100:3333'
export const CONTA = { email: 'treinamento@weave-demo.com', senha: 'Treinamento123', nome: 'Equipe Weave' }
export const VIEWPORT = { width: 1920, height: 1080 }

const ESPERA = (ms) => new Promise((r) => setTimeout(r, ms))
export { ESPERA }

/** Cursor e "clique" desenhados na página: o vídeo do Playwright não grava o ponteiro do sistema. */
const CURSOR_SCRIPT = () => {
  const montar = () => {
    if (document.getElementById('__cursor')) return
    const c = document.createElement('div')
    c.id = '__cursor'
    c.style.cssText = 'position:fixed;left:0;top:0;width:26px;height:26px;z-index:2147483647;pointer-events:none;transform:translate(-4px,-3px);transition:none;filter:drop-shadow(0 2px 3px rgba(15,23,42,.35))'
    c.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M3 2l7.5 19 2.6-7.9L21 10.5z" fill="#0F172A" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>'
    document.documentElement.appendChild(c)
    const r = document.createElement('div')
    r.id = '__ripple'
    r.style.cssText = 'position:fixed;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid #2563EB;z-index:2147483646;pointer-events:none;opacity:0'
    document.documentElement.appendChild(r)
    window.addEventListener('mousemove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px' }, true)
    window.addEventListener('mousedown', (e) => {
      r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'
      r.animate([{ opacity: 0.9, transform: 'scale(.4)' }, { opacity: 0, transform: 'scale(1.5)' }], { duration: 520, easing: 'ease-out' })
    }, true)
  }
  // o indicador do Next (modo dev) é recriado a cada navegação: some com ele sempre
  setInterval(() => document.querySelectorAll('nextjs-portal').forEach((e) => e.remove()), 150)
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar)
  else montar()
}

const api = async (caminho, { metodo = 'GET', corpo, token, conta } = {}) => {
  const res = await fetch(`${API}${caminho}`, {
    method: metodo,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(conta ? { 'x-account-id': conta } : {}) },
    body: corpo ? JSON.stringify(corpo) : undefined,
  })
  const texto = await res.text()
  return { status: res.status, dados: texto ? JSON.parse(texto) : null }
}
export { api }

/** Entra (ou cria) a conta de demonstração e devolve token + id da conta ativa. */
export const entrar = async () => {
  let r = await api('/auth/login', { metodo: 'POST', corpo: { email: CONTA.email, password: CONTA.senha } })
  if (r.status !== 200) {
    await api('/auth/register', { metodo: 'POST', corpo: { name: CONTA.nome, email: CONTA.email, password: CONTA.senha, accountType: 'PERSONAL', segment: 'CARTORIO' } })
    r = await api('/auth/login', { metodo: 'POST', corpo: { email: CONTA.email, password: CONTA.senha } })
  }
  const token = r.dados.accessToken
  const eu = await api('/me', { token })
  return { token, conta: eu.dados.memberships[0].accountId }
}

/** Faz login pela tela (sem gravar) e guarda os cookies para os contextos gravados. */
export const salvarSessao = async (browser, arquivo) => {
  const ctx = await browser.newContext({ viewport: VIEWPORT })
  const page = await ctx.newPage()
  await page.goto(`${WEB}/login`)
  const form = page.locator('form', { has: page.getByRole('button', { name: 'Entrar' }) })
  await form.getByLabel('E-mail').fill(CONTA.email)
  await form.getByLabel('Senha').fill(CONTA.senha)
  await form.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL(`${WEB}/`, { timeout: 20000 })
  await page.waitForTimeout(1500)
  await ctx.storageState({ path: arquivo })
  await ctx.close()
}

/**
 * Grava um vídeo: `roteiro` é o JSON de roteiros/, `cenas` mapeia id da cena → função de ações.
 * Cada cena dura no mínimo o tempo da narração (build/<id>/tempos.json) mais uma pausa.
 */
export const gravar = async (roteiro, cenas, { aoIniciar, viewport = VIEWPORT, pausaCena = 0.9 } = {}) => {
  const pasta = path.join(AQUI, 'build', roteiro.id)
  const tempos = JSON.parse(fs.readFileSync(path.join(pasta, 'tempos.json'), 'utf8')).duracoes
  const bruto = path.join(pasta, 'bruto')
  fs.rmSync(bruto, { recursive: true, force: true })
  fs.mkdirSync(bruto, { recursive: true })

  await entrar() // garante que a conta de demonstração existe
  const browser = await chromium.launch({ headless: true })
  const sessao = path.join(AQUI, 'build', 'sessao.json')
  await salvarSessao(browser, sessao)
  const ctx = await browser.newContext({ viewport, storageState: sessao, recordVideo: { dir: bruto, size: viewport }, deviceScaleFactor: 1 })
  await ctx.addInitScript(CURSOR_SCRIPT)
  const page = await ctx.newPage()
  const t0 = Date.now()
  const agora = () => (Date.now() - t0) / 1000
  const marcas = []
  const destaques = []
  globalThis.__weave = { agora, destaques }
  const ferr = ferramentas(page)

  try {
    if (aoIniciar) await aoIniciar(page, ferr)
    for (const cena of roteiro.cenas) {
      const inicio = agora()
      const alvo = tempos[cena.id] + pausaCena
      const acao = cenas[cena.id]
      if (acao) await acao(page, ferr)
      const falta = inicio + alvo - agora()
      if (falta > 0) await ESPERA(falta * 1000)
      marcas.push({ id: cena.id, inicio: round(inicio), fim: round(agora()) })
      console.log(`cena ${cena.id}: ${round(inicio)}s → ${round(agora())}s`)
    }
  } catch (erro) {
    await page.screenshot({ path: path.join(pasta, 'erro.png') }).catch(() => {})
    console.error('Falha na gravação:', erro.message)
    await ctx.close()
    await browser.close()
    process.exit(1)
  }
  const duracao = round(agora())
  await page.close()
  const video = await page.video().path()
  await ctx.close()
  await browser.close()
  fs.copyFileSync(video, path.join(pasta, 'bruto.webm'))
  fs.writeFileSync(path.join(pasta, 'marcas.json'), JSON.stringify({ duracao, viewport, cenas: marcas, destaques }, null, 2))
  console.log(`gravado: ${pasta}/bruto.webm (${duracao}s)`)
}

const round = (n) => Math.round(n * 100) / 100

/** Ações "humanas": movem o cursor com suavidade, clicam e digitam devagar. */
export const ferramentas = (page, escala = 1) => {
  const pausa = (ms = 500) => ESPERA(ms * escala)
  const ate = async (alvo) => {
    const caixa = await alvo.boundingBox()
    if (!caixa) throw new Error('elemento sem caixa: ' + alvo)
    await page.mouse.move(caixa.x + caixa.width / 2, caixa.y + Math.min(caixa.height / 2, 24), { steps: escala < 1 ? 7 : 28 })
  }
  const clicar = async (alvo, espera = 700) => {
    await alvo.scrollIntoViewIfNeeded()
    await ate(alvo)
    await pausa(250)
    await page.mouse.down()
    await page.mouse.up()
    await pausa(espera)
  }
  const digitar = async (alvo, texto, atraso = 55) => {
    await clicar(alvo, 200)
    await page.keyboard.press('Control+A')
    await page.keyboard.type(texto, { delay: atraso * escala })
    await pausa(300)
  }
  /** Campo numérico/texto do painel: acha o primeiro input depois do rótulo visível. */
  const campo = (rotulo, indice = 0) => page.locator(`xpath=(//*[normalize-space(text())="${rotulo}"])[${indice + 1}]/following::input[1]`)
  const preencher = async (rotulo, valor, indice = 0) => {
    const entrada = campo(rotulo, indice)
    await entrada.scrollIntoViewIfNeeded()
    await ate(entrada)
    await page.mouse.down(); await page.mouse.up()
    await page.keyboard.press('Control+A')
    await page.keyboard.type(String(valor), { delay: 70 * escala })
    await page.keyboard.press('Enter')
    await pausa(450)
  }
  /** Abre uma seção recolhida do painel só se ainda estiver fechada (o estado do acordeão persiste entre elementos). */
  const abrirSecao = async (titulo, rotuloInterno = 'X') => {
    if (await campo(rotuloInterno).first().isVisible().catch(() => false)) return
    await clicar(page.getByText(titulo, { exact: true }).first(), 700)
  }
  /** Marca um elemento para o vídeo desenhar um contorno nele durante `dur` segundos. */
  const destacar = async (alvo, dur = 2.2) => {
    const caixa = await alvo.boundingBox().catch(() => null)
    const w = globalThis.__weave
    if (caixa && w) w.destaques.push({ t: Math.round(w.agora() * 100) / 100, dur, rect: { x: Math.round(caixa.x), y: Math.round(caixa.y), w: Math.round(caixa.width), h: Math.round(caixa.height) } })
  }
  return { pausa, ate, clicar, digitar, campo, preencher, abrirSecao, destacar }
}
