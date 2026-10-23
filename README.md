# Weave

Editor visual de relatórios para qualquer usuário. Docs: `docs/proposta-arquitetura.md` · design: `design-weave.md`.

- `backend/` — Node ≥ 20 + TypeScript + Express 5 + Prisma 6 + Zod, PostgreSQL (monólito modular, Clean Architecture)
- `frontend/` — Next 15 (App Router) + React 19 + Tailwind 4 (tokens em `src/styles/globals.css`)

## Rodar (Node 22: `export PATH=$HOME/.local/node22/bin:$PATH`)

```bash
cd backend && cp .env.example .env   # preencher DATABASE_URL e JWT_ACCESS_SECRET
npx prisma migrate dev --name init   # cria as tabelas
npm run dev                          # http://localhost:3333

cd ../frontend && cp .env.example .env.local
npm run dev                          # http://localhost:3100
```

## Compilar rápido
```bash
cd /home/ioshua/projetos/saas/weave/backend && npm run dev

cd /home/ioshua/projetos/saas/weave/frontend && npm run dev
```

Convites: sem SMTP ainda, o link `/convite/<token>` é impresso no log do backend.

## Notas
- O motor do editor é uma cópia (vendor) de `app/src/packages/weave` em `frontend/src/packages/weave`; o documento do modelo é um `ReportDefinition` e os dados fictícios são `{ fonte: [linhas] }`.
- Se a porta 3000 estiver ocupada (ex.: EasyPanel), rode `npx next dev -p 3100` e suba o backend com `FRONTEND_URL=http://localhost:3100`.
- Assistente de IA: consome o webhook n8n AUTWEAVE-1 (`N8N_ASSISTANT_URL`, `N8N_BASIC_USER`, `N8N_BASIC_PASSWORD` em `backend/.env`). Sem essas variáveis o botão do assistente não aparece. O backend injeta usuário/conta do token, isola a sessão por conta+usuário+modelo e grava cada conversa em `assistant_interactions`.
- Suporte da plataforma: `User.platformRole = SUPPORT`. Conceder/revogar: `cd backend && npm run support:grant -- email@dominio.com` (ou `support:revoke`). O suporte vê o menu **Suporte** (modelos prontos e treinamento); o conteúdo de treinamento fica em `/treinamento` para todos. Aulas aceitam vídeo por link https (YouTube/Vimeo/.mp4); a produção dos vídeos fica para a fase 6.
- Tags (no lugar de categorias): modelos têm várias tags coloridas no estilo Notion (criar digitando, cor/renomear/excluir pelo "⋯"). Tags do sistema (as antigas categorias: Notariado, Registro Civil, Imóveis, Protesto, RTD/RCPJ, Outros) são mantidas pelo suporte e visíveis a todas as contas; cada conta também cria as suas.
- Atualizar o motor do editor: `scripts/sync-weave-package.sh` copia `app/src/packages/weave` para `frontend/src/packages/weave` (sem testes). Depois rode o typecheck/build do frontend.
- Funcionários com senha provisória (sem e-mail/SMTP por enquanto): em **Equipe → Cadastrar funcionário** o dono/admin informa nome, e-mail, papel e uma senha provisória (vale 7 dias). No primeiro login a pessoa só vê a tela "Defina sua senha"; o token dela é restrito (a API recusa o resto com `PASSWORD_CHANGE_REQUIRED`) até trocar. A empresa pode **redefinir** a senha só de quem ela mesma cadastrou (`User.managedByAccountId`). E-mail que já tem conta no Weave não é alterado: use o convite por link.
- Miniaturas da galeria: a 1ª folha do modelo (com os dados fictícios padrão) vira uma imagem PNG (~20–30 KB, `backend/storage/previews`). O editor gera/atualiza a imagem ao **Salvar**; modelos sem imagem (prontos do seed, cópias antigas, versão restaurada) são gerados sob demanda quando o card aparece na tela. Qualquer membro pode enviar a miniatura *se ainda não existir*; para substituir, só quem edita o modelo (ou o suporte, nos prontos).
- Galeria sem repetição: "Usar modelo"/duplicar grava `originId` (raiz da cadeia de cópias). Cópias do mesmo modelo viram UMA entrada (a mais recente) com "+N cópias" e menu para abrir as outras; modelos prontos ficam como estão. As versões (histórico) só aparecem dentro do modelo. O seed não recria mais os modelos prontos existentes (preserva ids, cópias e edições do suporte).
- Modelos prontos = os layouts completos do Orius: `backend/prisma/system-templates/*.json` (um por modelo: relatório no formato do motor + dados de exemplo), extraídos dos seeders `seed_g_config_relatorio_*` das releases DTP2610/DGS2610/DSAAS2610 do repositório `api` (DGS e DSAAS têm os mesmos 7 em comum; DTP2610 tem 4 a mais). `npm run seed` cria o que faltar; `npm run seed:replace-system` apaga e recria todos. Tags: sistema (Notariado/Protesto) + tipo (Livro, Relatório, Intimação/Edital, Certidão/Instrumento, Recibo).
- Variáveis por folha dos livros ({page.livro}/{page.folha}/{page.lado}) usam um padrão simples (`shared/actions/defaultPageVariables.ts`); logos/brasões dos dados de exemplo ficam vazios.
- **Meus modelos × Biblioteca**: `/` lista só os modelos da conta (criados ou copiados); `/biblioteca` lista os modelos prontos do sistema (somente leitura, "Usar modelo" cria a cópia em Meus modelos). O mesmo `TemplatesIndex` serve às duas rotas (`scope`). Cada card/linha de "Meus modelos" mostra quem criou (`createdBy`, com foto ou iniciais) no rodapé à direita; o histórico mostra o autor de cada versão e de cada pedido ao assistente com foto/iniciais (`PersonChip`). O cadastro tem **ramo de atuação** opcional (`Account.segment`); quando não é cartório, a biblioteca avisa que os modelos prontos atuais são de cartório. Publicação pela comunidade e "modelos oficiais da equipe" ficam para depois.
- **Compartilhar por link** (`/s/[token]`, página fora do app, aceita visitante): o autor escolhe em "Compartilhar" quem abre (`PUBLIC` = qualquer pessoa; `MEMBERS` = só logados — a API responde `LOGIN_REQUIRED` e a página leva ao login/cadastro, voltando ao link via `postLoginRedirect`) e se mostra "Usar este modelo" (`shareAllowCopy`). O token nasce na primeira vez e não muda ao desligar/religar; desligado, o link dá 404. A página pública mostra só layout + dados de exemplo padrão (nunca dados da conta). "Usar este modelo" (`POST /shared/:token/copy`) cria a cópia na conta de quem está logado (só tags do sistema acompanham).
- **Enviar para a Biblioteca**: `POST /templates/:id/library-submissions` grava uma cópia congelada (`LibrarySubmission`: documento + dados de exemplo) e o suporte revisa em **Suporte → Pedidos da biblioteca** (pré-visualizar em `/suporte/revisao/[id]`, aprovar escolhendo tags do sistema, ou recusar com motivo). Aprovado, vira modelo do sistema com o autor do pedido como criador. O autor pode cancelar enquanto estiver pendente; despublicar depois é do suporte (aba Modelos prontos).
- **Documentos de produto e treinamento:** `docs/auditoria-tecnica-b2b-embed.md` (auditoria do pacote para venda B2B como iframe/web component), `docs/treinamento/` (guia dos elementos e tutorial do Instrumento de Protesto; `npm run seed:training` publica o texto como trilhas em Treinamento) e `docs/fase-6-videos-remotion.md` (decisões e pipeline dos vídeos).
