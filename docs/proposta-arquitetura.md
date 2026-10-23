# Weave — Proposta de arquitetura (para aprovação)

Status: **aprovada. Fases 1–5 implementadas (fundação, modelos, editor + dados fictícios, assistente de IA via n8n + histórico/diff, painel do suporte + treinamento). Fase 6 (vídeos Remotion): ver docs/fase-6-videos-remotion.md.**

## 1. Estrutura de pastas

```
weave/
├── design-weave.md            # design system (fonte normativa visual)
├── docs/                      # DDT, proposta, ADRs
├── assets/                    # logo copiado de app/public/images/weave-logo*.png (sem alteração)
├── docker-compose.yml         # PostgreSQL 16 local
├── frontend/                  # Next.js (App Router) + React + TSX
│   └── src/
│       ├── app/               # rotas (só composição): (public)/ (auth)/ (app)/
│       ├── features/          # auth, account, members, templates, editor, assistant, history
│       │   └── <feature>/{components,hooks,services,schemas,types}
│       ├── shared/            # ui (Button, Input, Tabs…), formatters, enums, lib/http
│       └── styles/            # tokens.css (design-weave.md) + tailwind
└── backend/                   # Node + TS + Express (monólito modular)
    ├── prisma/{schema.prisma,migrations,seed.ts}
    └── src/
        ├── main/              # server.ts, app.ts, composition root (DI manual)
        ├── shared/            # kernel: errors, Result, middlewares, config (Zod env), logger
        └── modules/
            └── <modulo>/
                ├── domain/          # entidades, value objects, interfaces de repositório
                ├── application/     # use-cases (1 classe = 1 caso de uso), DTOs (Zod)
                ├── infra/           # repositórios Prisma, adapters (hash, JWT, IA)
                └── presentation/    # controllers + routes Express
```

Regra de dependência (Clean Architecture): `presentation → application → domain ← infra`.
Módulos só se falam por interface pública (`index.ts`) do módulo, nunca por import interno.
SOLID: use-case depende de interfaces (repositório, hasher, token), injetadas no composition root.

Mapeamento com os padrões Orius: Endpoint→Controller→UseCase(Service)→Repository.
Rules para `weave/`: criar `.claude/rules/weave-backend.md` e `weave-frontend.md` (paths `weave/backend/**`, `weave/frontend/**`),
reaproveitando: Zod nos limites, sem lógica em controller, skeleton em todo componente que carrega dados,
formatação só via `shared/`, `useEffect` só chama `execute*/handle*`, sem `void`, sem trailers em commit.

## 2. Modelo de dados (Prisma / PostgreSQL)

- **User**: id, email (único), passwordHash, name, status, emailVerifiedAt, createdAt.
- **Account**: id, type (`PERSONAL` | `COMPANY`), name, document (CPF/CNPJ), ownerUserId, plan, createdAt.
  Toda pessoa tem uma conta; PF = conta com 1 membro (owner). Todo dado de negócio pertence a `accountId` (multi-tenant lógico).
- **Membership**: id, accountId, userId, role (`OWNER` | `ADMIN` | `EDITOR` | `VIEWER`), status, @@unique(accountId,userId).
- **Invitation**: id, accountId, email, role, tokenHash, expiresAt, acceptedAt, invitedById.
- **RefreshToken** (sessão): id, userId, tokenHash, expiresAt, revokedAt, userAgent, ip.
- **Permission por papel**: matriz estática no código (`can(role, action)`), sem tabela na fase 1 (YAGNI); tabela só se surgirem papéis customizados.
- **ReportTemplate**: id, accountId (null = modelo do sistema/suporte), name, category (`NOTARIAL`,`REGISTRO_CIVIL`,`IMOVEIS`,`PROTESTO`,`RTD_RCPJ`,`OUTROS`), isSystem, currentVersionId, createdBy.
- **ReportVersion** (histórico): id, templateId, number, document (JSON do layout), changeSummary, source (`MANUAL`|`ASSISTANT`|`RESTORE`), authorId, createdAt — imutável.
- **MockDataset**: id, templateId, name, data (JSON livre cadastrado pelo usuário), isDefault — dados fictícios para pré-visualização.
- **AssistantSession / AssistantMessage**: templateId, userId, role, content, proposedPatch (JSON), appliedVersionId.
- **AuditLog**: accountId, actorId, action, entity, entityId, meta, createdAt.

## 3. Módulos do backend

| Módulo | Responsabilidade | Fase |
|---|---|---|
| `identity` | cadastro, login, refresh/logout, recuperação de senha, `me` | 1 |
| `accounts` | conta PF/empresa, dados da conta | 1 |
| `members` | convites, listar/alterar papel/remover funcionário, RBAC | 1 |
| `templates` | CRUD de modelos, categorias, duplicar, modelos do sistema | 2 |
| `versions` | versionamento, diff, restaurar (histórico de alterações) | 2/4 |
| `mock-data` | datasets fictícios + preview (render do documento com dados) | 3 |
| `assistant` | chat com IA, aplica patch → nova versão (sem MCP) | 4 |
| `support-admin` | painel de treinamento/modelos prontos do suporte | 5 |

Stack backend: Express 4/5, Prisma, Zod, argon2 (hash), JWT access curto + refresh rotativo em cookie httpOnly,
helmet, cors, pino, vitest + supertest, eslint, tsx. Erros de domínio → middleware global (sem try/catch em use-case).

## 4. Telas do frontend

Públicas: landing (“Relatórios poderosos. Sem complicação.”), login, cadastro (escolha PF/empresa), recuperar senha, aceitar convite.
App: seletor/header da conta; **Modelos de relatórios** (busca + categorias Todos/Notariado/Registro Civil/Imóveis/Protesto/RTD-RCPJ, cards, “Usar modelo”);
**Editor** (header Salvar/Visualizar/desfazer, sidebar Elementos + Campos de dados, canvas, painel Propriedades com abas Conteúdo/Estilo);
**Visualização** (dados fictícios); **Dados fictícios**; **Histórico** de versões; **Assistente** (painel lateral);
**Equipe** (membros, convites, papéis); **Configurações da conta**; Painel do suporte (fase 5).

## 5. Fases de entrega

1. **Fundação**: scaffold front/back, tokens/design system, Prisma+Postgres, auth, conta PF/empresa, equipe (convite/papéis), telas de login/cadastro/equipe. ← esta sessão
2. Modelos: CRUD, categorias, galeria “Modelos de relatórios”, versionamento básico.
3. Editor visual + pré-visualização com dados fictícios (reaproveitar motor `app/src/packages/weave`).
4. Assistente de IA + histórico/diff/restauração (reaproveitando catálogo de propriedades e prompt do workflow n8n).
5. Painel do suporte (treinamento/modelos prontos), billing/planos, hardening.

## 6. Decisões que preciso de você

Ver perguntas enviadas na sessão (Git, Node/Next, ORM de infra local, auth, escopo da fase 1).
