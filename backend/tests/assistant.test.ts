import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { SendAssistantRequestUseCase, type AssistantInput } from '../src/modules/assistant/application/assistant.use-cases'
import type { AssistantGateway, AssistantHistoryRepository, AssistantReply, InteractionRecord } from '../src/modules/assistant/domain/ports'
import { N8nAssistantGateway } from '../src/modules/assistant/infra/n8n-assistant.gateway'
import { diffReportDocuments } from '../src/modules/templates/domain/report-diff'

const tenant = { userId: 'u1', accountId: 'a1', role: 'EDITOR' as const, isSupport: false }
const input = (extra: Partial<AssistantInput> = {}): AssistantInput => ({
  sessao_id: 'sessao-12345',
  pedido: 'deixe o título em negrito',
  modo: 'normal',
  selecao: { componentes: [], bandas: [] },
  relatorio: { bandas: [] },
  campos: [],
  colunas_layout: [],
  imagens: [],
  ...extra,
})
const reply: AssistantReply = { mensagem: 'ok', acoes: [{ tipo: 'alterar_estilo' }], passos: [], pergunta: false, opcoes: [], confirmacao: null, uso: null }

const setup = (over: { configured?: boolean; isSystem?: boolean } = {}) => {
  const sent: Record<string, unknown>[] = []
  const recorded: InteractionRecord[] = []
  const gateway: AssistantGateway = {
    isConfigured: () => over.configured ?? true,
    send: async (r) => (sent.push(r as unknown as Record<string, unknown>), reply),
  }
  const history: AssistantHistoryRepository = { record: async (d) => void recorded.push(d), list: async () => [] }
  const templates = { findVisible: async () => ({ isSystem: over.isSystem ?? false }) }
  return { sent, recorded, uc: new SendAssistantRequestUseCase(gateway, history, templates) }
}

describe('SendAssistantRequestUseCase', () => {
  it('injeta usuário/conta do token, isola a sessão e grava o histórico', async () => {
    const { uc, sent, recorded } = setup()
    await uc.execute({ tenant, templateId: 't1', input: input() })
    expect(sent[0]).toMatchObject({ usuario_id: 'u1', tenant: 'a1' })
    expect(sent[0]!.sessao_id).not.toBe('sessao-12345')
    expect(recorded[0]).toMatchObject({ kind: 'ACTIONS', request: 'deixe o título em negrito' })

    const other = setup()
    await other.uc.execute({ tenant: { ...tenant, userId: 'u2' }, templateId: 't1', input: input() })
    expect(other.sent[0]!.sessao_id).not.toBe(sent[0]!.sessao_id)
  })

  it('recusa viewer, modelo do sistema e assistente desligado', async () => {
    await expect(setup().uc.execute({ tenant: { ...tenant, role: 'VIEWER' }, templateId: 't1', input: input() })).rejects.toThrow()
    await expect(setup({ isSystem: true }).uc.execute({ tenant, templateId: 't1', input: input() })).rejects.toThrow(/somente|sua conta/)
    await expect(setup({ configured: false }).uc.execute({ tenant, templateId: 't1', input: input() })).rejects.toThrow(/não configurado/)
  })

  it('valida o conteúdo real das imagens', async () => {
    const fake = Buffer.from('não sou uma imagem'.repeat(20)).toString('base64')
    await expect(
      setup().uc.execute({ tenant, templateId: 't1', input: input({ imagens: [{ nome: 'x', tipo: 'image/png', base64: fake }] }) }),
    ).rejects.toThrow(/não é um arquivo PNG/)
  })
})

describe('N8nAssistantGateway', () => {
  let server: Server
  let url = ''
  let lastHeaders: Record<string, unknown> = {}
  let status = 200
  let body: unknown = { sucesso: true, mensagem: 'feito', acoes: [{ tipo: 'alterar_estilo' }], uso: { modelo: 'x' } }

  beforeAll(async () => {
    server = createServer((req, res) => {
      lastHeaders = req.headers
      req.resume()
      req.on('end', () => {
        res.writeHead(status, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(body))
      })
    })
    await new Promise<void>((r) => server.listen(0, r))
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/webhook`
  })
  afterAll(() => server.close())

  const gw = () => new N8nAssistantGateway({ url, user: 'u', password: 'p', timeoutSeconds: 5 })
  const req = { ...input(), usuario_id: 'u1', tenant: 'a1' } as Parameters<AssistantGateway['send']>[0]

  it('envia Basic Auth e user-agent curl e normaliza a resposta', async () => {
    const r = await gw().send(req)
    expect(lastHeaders.authorization).toBe(`Basic ${Buffer.from('u:p').toString('base64')}`)
    expect(lastHeaders['user-agent']).toMatch(/^curl/)
    expect(r).toMatchObject({ mensagem: 'feito', passos: [], pergunta: false, confirmacao: null })
  })

  it('mapeia 429, 422 e erro do provedor', async () => {
    status = 429
    body = { mensagem: 'devagar' }
    await expect(gw().send(req)).rejects.toMatchObject({ status: 429, message: 'devagar' })
    status = 422
    await expect(gw().send(req)).rejects.toMatchObject({ status: 422 })
    status = 500
    await expect(gw().send(req)).rejects.toMatchObject({ status: 502 })
    status = 200
    body = { sucesso: false, mensagem: 'não deu' }
    await expect(gw().send(req)).rejects.toMatchObject({ status: 422, message: 'não deu' })
  })

  it('sem URL/usuário fica desligado', () => {
    expect(new N8nAssistantGateway({ timeoutSeconds: 5 }).isConfigured()).toBe(false)
  })
})

describe('diffReportDocuments', () => {
  const doc = (components: Record<string, unknown>) => ({ pages: [], bands: {}, components })
  it('detecta adicionado, removido e alterado (conteúdo/estilo)', () => {
    const before = doc({
      a: { id: 'a', name: 'Título', content: 'Olá', style: { fontSize: 14 }, rect: { x: 0, y: 0 } },
      b: { id: 'b', name: 'Rodapé', content: 'x', style: {} },
    })
    const after = doc({
      a: { id: 'a', name: 'Título', content: 'Olá', style: { fontSize: 14, fontWeight: 700 }, rect: { x: 0, y: 0 } },
      c: { id: 'c', name: 'Novo', content: 'y', style: {} },
    })
    const d = diffReportDocuments(before, after)
    expect([d.added, d.removed, d.changed]).toEqual([1, 1, 1])
    expect(d.changes.find((c) => c.kind === 'changed')?.fields).toEqual(['style.fontWeight'])
  })
})
