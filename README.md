# FastReport JSON Web

Gerador de relatórios **web**, orientado a **JSON**, inspirado no [FastReport](https://www.fast-report.com/). O produto é pensado para ser **embutido** em sistemas existentes (CRM, ERP, portal SaaS) como um componente React — não como uma aplicação isolada.

> **Roadmap de publicação npm/container:** [`docs/plano-antes-de-publicar.md`](../docs/plano-antes-de-publicar.md)

---

## Início rápido (desenvolvimento)

```bash
cd frontend
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). A página inicial simula um **CRM com lista de relatórios**; os botões **Editar layout** e **Visualizar** montam o `<ReportDesigner />` em tela cheia.

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server (porta 3000) |
| `npm run build` | Build em `dist/` |
| `npm run preview` | Preview do build |
| `npm run lint` | Verificação TypeScript |

---

## Componente `<ReportDesigner />`

Ponto de entrada da integração. O **sistema hospedeiro** (seu CRM) monta este componente quando o usuário edita ou visualiza um relatório.

### Props

```tsx
import {
  ReportDesigner,
  REPORT_AUTO_SAVE_INTERVAL_MS,
  REPORT_HISTORY_PERSIST_INTERVAL_MS,
  DEFAULT_CANVAS_SELECTION_CLASSES,
  type ReportDesignerMode,
  type ReportDesignerSavePayload,
  type ReportDesignerHistoryPersistPayload,
  type CanvasSelectionClasses,
} from './ReportDesigner';
import type { ReportDefinition } from './types/report';

interface ReportDesignerProps {
  reportId?: string;
  reportName?: string;
  mode?: ReportDesignerMode; // default: 'design'
  report?: ReportDefinition;
  data?: Record<string, unknown[]>;
  onClose?: () => void;

  /** Persiste o layout atual no host (Ctrl+S + botão Salvar). Sem callback = sem UI de save */
  onSave?: (payload: ReportDesignerSavePayload) => void | Promise<void>;
  /** Auto-save do layout. Requer `onSave`. Use `REPORT_AUTO_SAVE_INTERVAL_MS` ou ms customizado */
  autoSaveIntervalMs?: number; // 0 = desligado (padrão)

  /** Envia versões do timeline (undo/redo) para backup remoto no host */
  onPersistHistory?: (payload: ReportDesignerHistoryPersistPayload) => void | Promise<void>;
  /** Auto-backup do histórico. Requer `onPersistHistory` */
  historyPersistIntervalMs?: number; // 0 = desligado (padrão)

  /** Classes Tailwind de hover/seleção no canvas (parcial = merge com defaults) */
  canvasSelectionClasses?: Partial<CanvasSelectionClasses>;

  /** Estado inicial dos painéis no layout compacto (<1280px). Padrão: `canvas-first` */
  defaultPanelLayout?: 'full' | 'compact' | 'canvas-first';
  /** Persistir abertura dos painéis em localStorage por reportId. Padrão: true se reportId definido */
  persistPanelState?: boolean;
  /** Densidade reduzida nos painéis. Padrão: true se compact ou viewport <1280px */
  compactMode?: boolean;

  className?: string;
}
```

### Payloads de persistência

**`onSave`** — layout **atual** (estado oficial do relatório):

```ts
interface ReportDesignerSavePayload {
  reportId?: string;
  report: ReportDefinition;  // ← gravar no banco (ex.: coluna layout_json)
  data: Record<string, unknown[]>; // datasets de preview (opcional persistir)
  source?: 'manual' | 'auto';
}
```

**`onPersistHistory`** — **versões anteriores** do timeline (recuperação sem export manual):

```ts
interface ReportDesignerHistoryPersistPayload {
  reportId?: string;
  entries: HistoryEntry[];     // novas desde o último envio; cada uma tem report + data
  historyPast: HistoryEntry[];
  historyPointer: number;
  report: ReportDefinition;  // estado atual no momento do envio
  data: Record<string, unknown[]>;
  source?: 'manual' | 'auto';
}
```

### Intervalos (presets)

```ts
REPORT_AUTO_SAVE_INTERVAL_MS.OFF      // 0 — desligado
REPORT_AUTO_SAVE_INTERVAL_MS.SEC_10   // 10s
REPORT_AUTO_SAVE_INTERVAL_MS.SEC_20
REPORT_AUTO_SAVE_INTERVAL_MS.SEC_30
REPORT_AUTO_SAVE_INTERVAL_MS.MIN_1
REPORT_AUTO_SAVE_INTERVAL_MS.MIN_5

REPORT_HISTORY_PERSIST_INTERVAL_MS    // mesmos valores
```

### Modos de uso

| `mode` | UI | Quando usar no CRM |
|--------|-----|-------------------|
| `design` | Sidebar, canvas A4, painel de propriedades, undo/redo, export/import JSON | Administrador ou analista **montando o layout** |
| `preview` | Relatório renderizado + imprimir + botão Voltar | Usuário final **consultando o resultado** com dados reais |

No modo `design`, o usuário ainda pode abrir um preview interno pelo botão **Pré-visualização** na barra de ações (ícone ▶, acima do painel de propriedades).

### Injeção de template e dados

O host é responsável por **carregar** o template e os datasets do seu backend e passá-los como props. Ao montar (ou remontar) o componente com `report`, o designer chama `loadReport` internamente:

```tsx
<ReportDesigner
  reportId={template.id}
  reportName={template.name}
  mode="design"
  report={template.layout}          // ReportDefinition do seu banco
  data={previewDatasets}            // ex.: { users: [...], orders: [...] }
  onClose={() => setSession(null)}
  className="h-screen w-screen"
/>
```

**Contrato de dados:**

- `report` — objeto `ReportDefinition` (bandas, componentes, páginas). Ver [`src/types/report.ts`](src/types/report.ts).
- `data` — mapa de datasets; cada chave é referenciada nas bandas (`dataSource`) e em expressões `{dataset.campo}`.

Se `report` não for passado, o designer usa o estado já presente no store (útil só em dev isolado).

### Exemplo completo (integração CRM)

```tsx
import {
  ReportDesigner,
  REPORT_AUTO_SAVE_INTERVAL_MS,
  REPORT_HISTORY_PERSIST_INTERVAL_MS,
} from './ReportDesigner';

function ReportSession({
  template,
  mode,
  onClose,
}: {
  template: { id: string; name: string; layout: ReportDefinition };
  mode: 'design' | 'preview';
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50">
      <ReportDesigner
        reportId={template.id}
        reportName={template.name}
        mode={mode}
        report={template.layout}
        data={previewDatasets}
        onClose={onClose}
        onSave={async ({ reportId, report, source }) => {
          await api.put(`/reports/${reportId}`, { layout: report });
          if (source === 'manual') toast.success('Salvo');
        }}
        autoSaveIntervalMs={REPORT_AUTO_SAVE_INTERVAL_MS.MIN_1}
        onPersistHistory={async ({ reportId, entries }) => {
          await api.post(`/reports/${reportId}/history`, {
            versions: entries.map((e) => ({
              id: e.id,
              label: e.label,
              timestamp: e.timestamp,
              layout: e.report,
            })),
          });
        }}
        historyPersistIntervalMs={REPORT_HISTORY_PERSIST_INTERVAL_MS.MIN_5}
        className="h-screen w-screen"
      />
    </div>
  );
}
```

Sem `onSave` / `onPersistHistory`, o usuário continua podendo **Exportar relatório** (JSON) pela barra de ações (ícones no canto superior direito).

---

## Responsividade (notebook / Fase 2.9)

O designer adapta o layout conforme a largura do **container** (não da janela inteira do SO). O host deve montar o componente em área **sem padding extra** e com altura definida.

### Requisitos do host

```tsx
// Recomendado: overlay fullscreen no CRM
<div className="fixed inset-0 z-50">
  <ReportDesigner className="h-screen w-screen" /* ... */ />
</div>
```

| Requisito | Motivo |
|-----------|--------|
| `h-screen` ou `h-full` no ancestral | Colunas internas usam `flex-1 min-h-0` |
| Largura útil ≥ **1024px** (landscape) | Abaixo disso: banner de aviso; edição ainda possível, mas não é alvo MVP |
| Evitar padding lateral no wrapper | Padding reduz o canvas e atrasa o fit-to-width |

### Breakpoints

| Largura | Layout |
|---------|--------|
| ≥1440px | 3 colunas — sidebar 240px + propriedades 288px |
| 1280–1439px | 3 colunas estreitas — 200px + 240px + zoom fit-to-width |
| 1024–1279px | **Rail** 48px + flyout esquerdo + **drawer** de propriedades + fit-to-width |
| <1024px | Banner “use paisagem / tela maior”; preview modal em **fullscreen** |

### Props de layout (R3)

| Prop | Padrão | Uso |
|------|--------|-----|
| `defaultPanelLayout` | `canvas-first` | `full` = propriedades abertas ao entrar; `compact` = canvas-first + densidade reduzida; `canvas-first` = máximo espaço no canvas |
| `persistPanelState` | `true` se `reportId` | Salva estado dos flyouts/drawer em `localStorage` por relatório |
| `compactMode` | derivado | Força padding e tipografia menores na toolbar e no painel de propriedades |

```tsx
<ReportDesigner
  reportId={id}
  defaultPanelLayout="canvas-first"
  persistPanelState
  className="h-screen w-screen"
  /* ... */
/>
```

### Atalhos (layout compacto)

| Tecla | Ação |
|-------|------|
| `[` | Abre/fecha paleta (flyout esquerdo) |
| `]` | Abre/fecha propriedades (drawer direito) |

### Matriz de teste manual

| Resolução | Verificar |
|-----------|-----------|
| 1280×720 | Folha A4 visível (fit-to-width); `[` / `]`; editar texto; preview fullscreen |
| 1366×768 | Idem + drawer sem overflow horizontal |
| 1440×900 | Layout 3 colunas estreitas; zoom 100% se couber |
| 1920×1080 | Layout desktop completo (240 + 288) |

---

## Integrando em CRMs web

### Papel de cada camada

```
┌─────────────────────────────────────────────────────────────┐
│  Seu CRM (React / Next / Vue+wrapper / etc.)                │
│  • Lista relatórios (API)                                   │
│  • Persiste ReportDefinition + metadados                    │
│  • Busca datasets (contatos, negócios, faturas…)            │
│  • Decide mode: design | preview                            │
└───────────────────────────┬─────────────────────────────────┘
                            │ props: report, data, mode, onClose
                            ▼
                   ┌─────────────────┐
                   │ ReportDesigner  │
                   │ (este pacote)   │
                   └─────────────────┘
```

| Responsabilidade | Host (CRM) | ReportDesigner |
|------------------|------------|----------------|
| Autenticação / permissões | ✅ | — |
| Salvar template no banco | ✅ via `onSave` | dispara Ctrl+S / auto-save |
| Backup de versões antigas | ✅ via `onPersistHistory` | timeline undo/redo |
| Buscar dados de produção | ✅ | — |
| Editar layout visual | — | ✅ (`mode="design"`) |
| Renderizar preview | — | ✅ (`mode="preview"`) |
| Export/import JSON na UI | — | ✅ (toolbar de ações, backup manual) |

### Fluxo típico em um CRM

**1. Listagem de templates**

Tela com relatórios cadastrados (nome, dataset, status). Cada linha dispara uma sessão embutida:

```tsx
const [session, setSession] = useState<{
  template: ReportTemplate;
  mode: 'design' | 'preview';
} | null>(null);

// Botões na tabela
<button onClick={() => openSession(template, 'preview')}>Visualizar</button>
<button onClick={() => openSession(template, 'design')}>Editar layout</button>
```

**2. Carregar dados antes de abrir**

```tsx
async function openSession(template: ReportTemplate, mode: 'design' | 'preview') {
  const layout = await api.getReportLayout(template.id);     // ReportDefinition
  const data = await api.getReportPreviewData(template.id); // Record<string, unknown[]>
  setSession({ template, mode, layout, data });
}

{session && (
  <ReportDesigner
    reportId={session.template.id}
    reportName={session.template.name}
    mode={session.mode}
    report={session.layout}
    data={session.data}
    onClose={() => setSession(null)}
    className="h-screen w-screen"
  />
)}
```

**3. Onde montar no layout do CRM**

- **Overlay fullscreen** (padrão do demo): `fixed inset-0 z-50` — não exige rota dedicada.
- **Rota dedicada**: `/crm/relatorios/:id/editar` com container `h-screen`.
- **Drawer / modal largo**: passe `className="h-full"` e garanta altura definida no pai.

O componente precisa de **altura explícita** (`h-full`, `h-screen` ou flex pai com `min-h-0`).

**4. Persistência**

| Mecanismo | Quando | O que enviar à API |
|-----------|--------|-------------------|
| `onSave` | Ctrl+S, botão **Salvar**, auto-save | `payload.report` (layout atual) |
| `onPersistHistory` | Botão **Salvar backup do histórico**, intervalo automático | `payload.entries[].report` (versões do timeline) |
| Export JSON (toolbar) | Manual | Arquivo backup / migração |

```tsx
onSave={async ({ reportId, report }) => {
  await api.put(`/reports/${reportId}`, { layout: report });
}}
```

O campo `data` no save é o dataset de **preview** do designer — em produção o host costuma persistir só o `report` e injetar dados reais no `mode="preview"`.

**Restaurar versão antiga:** o host carrega `entry.report` de uma entrada salva via `onPersistHistory` e remonta `<ReportDesigner report={...} />`.

**Sair com alterações pendentes:** no modo `design`, ao clicar **Voltar** (`ChevronLeft` no cabeçalho da sidebar) ou usar o botão voltar do navegador (`Alt+←`, gesto, etc.) com layout modificado, o designer exibe um modal:

> *Deseja salvar as alterações feitas no editor de layout antes de sair?*

Opções: **Salvar e sair** (requer `onSave`), **Sair sem salvar**, **Cancelar**. Sem alterações desde o último save, a saída é imediata.

**5. Datasets no CRM**

Passe dados já normalizados como arrays de objetos:

```json
{
  "contacts": [
    { "name": "Ana", "email": "ana@crm.com", "stage": "Negociação" }
  ],
  "deals": [
    { "title": "Contrato X", "amount": 12000, "owner": "Carlos" }
  ]
}
```

No layout, use `{contacts.name}`, configure `dataSource: "contacts"` nas bandas de lista/tabela e arraste campos da árvore na sidebar.

**6. Preview para usuário final**

Usuários sem permissão de edição recebem apenas:

```tsx
<ReportDesigner
  mode="preview"
  report={layout}
  data={liveData}
  reportName="Pipeline de vendas"
  onClose={goBack}
  className="h-screen w-screen"
/>
```

Sem sidebar de edição, sem arrastar componentes — só visualização e impressão.

### Checklist de integração

- [ ] Container com altura definida (`h-screen` ou equivalente)
- [ ] `report` carregado do backend antes de montar (ou remount ao trocar de relatório)
- [ ] `data` com datasets que o template referencia
- [ ] `onClose` retorna à navegação do CRM
- [ ] `mode` adequado ao perfil (editor vs visualização)
- [ ] `onSave` implementado no host (ou export JSON como fallback)
- [ ] (Opcional) `onPersistHistory` para versionamento / recuperação
- [ ] (Opcional) `autoSaveIntervalMs` / `historyPersistIntervalMs`

---

## Atalhos de teclado (modo design)

| Atalho | Ação |
|--------|------|
| `Ctrl+S` / `Cmd+S` | Salvar (`onSave`) |
| `Ctrl+Z` / `Cmd+Z` | Desfazer |
| `Ctrl+Y` / `Cmd+Shift+Z` | Refazer |
| `Ctrl+H` / `Cmd+H` | Abrir histórico de alterações |
| `Ctrl+D` / `Cmd+D` | Duplicar seleção |
| `Ctrl+C` / `Cmd+C` | Copiar componentes |
| `Ctrl+V` / `Cmd+V` | Colar componentes |
| `Delete` / `Backspace` | Excluir seleção |
| `F2` | Abrir editor de texto (componente `text` selecionado) |
| `Ctrl+clique` | Seleção múltipla (toggle) |
| `Shift+clique` | Adicionar à seleção |

---

## Modelo de dados (resumo)

### `ReportDefinition`

```ts
interface ReportDefinition {
  id: string;
  name: string;
  pages: ReportPage[];
  bands: Record<string, ReportBand>;
  components: Record<string, ReportComponent>;
}
```

Grafo normalizado: páginas → bandas (por ID) → componentes (por ID). Detalhes em [`src/types/report.ts`](src/types/report.ts).

### Data binding

Expressões no conteúdo de textos e células:

```
{users.name}
{users.email}
```

Em bandas de lista (`dataList`, `dataListNumbered`, `dataTable`), o preview repete a banda para cada linha do `dataSource`.

**Lista livre (`dataList`):** marcadores configuráveis (círculo, quadrado, sem marcador) no painel de propriedades da banda — padrão **sem marcador**.

**Lista numerada (`dataListNumbered`):** numeração automática à esquerda; conteúdo deslocado por coluna dedicada (compatível com componentes `position: absolute`).

### Export / import

Payload versionado (`reportIO.ts`):

```json
{
  "version": 1,
  "exportedAt": "2026-06-09T12:00:00.000Z",
  "report": { "...": "ReportDefinition" },
  "data": { "users": [ "..."] }
}
```

Disponível na sidebar do designer para backup; o host pode usar o mesmo formato para armazenar no banco.

---

## Estrutura do código

```
src/
├── App.tsx                 # Demo do CRM hospedeiro (lista + sessão ReportDesigner)
├── ReportDesigner.tsx      # ★ Componente de integração
├── mocks/
│   ├── demoReport.ts       # DEMO_REPORT + DEMO_DATA (único template do MVP)
│   └── hostReports.ts      # Metadados mockados da listagem
├── types/report.ts         # ReportDefinition, bandas, componentes
├── store/designerStore.ts  # Estado global (Zustand) — MVP singleton
├── hooks/
│   ├── useDesignerKeyboard.ts      # Atalhos globais
│   ├── useReportAutoSave.ts
│   ├── useReportHistoryPersist.ts
│   └── useUnsavedChangesGuard.ts   # Voltar / navegador com dirty check
├── utils/
│   ├── reportIO.ts              # Export/import JSON
│   ├── reportSaveSnapshot.ts    # Dirty check do auto-save
│   ├── reportHistoryPersist.ts  # Flush do timeline
│   ├── selectionUtils.ts        # Seleção múltipla
│   ├── designerDragThreshold.ts # Clique vs arrasto (5px)
│   ├── reportUtils.ts           # Expressões {dataset.campo}
│   └── designerSnap.ts          # Guias e snap no canvas
└── components/
    ├── designer/           # Sidebar, Canvas, DesignerActionToolbar, PropertiesPanel, …
    └── renderer/           # ReportPreview, ReportPageSheet
```

---

## Funcionalidades do designer (MVP atual)

- Editor visual com bandas, componentes, zoom, snap e guias de alinhamento
- **Seleção múltipla** de bandas e componentes; arrasto em grupo na mesma banda/página
- Undo/redo e histórico de alterações (`Ctrl+Z`, `Ctrl+H`)
- **Salvar** (`Ctrl+S`), **auto-save** e **backup do histórico** configuráveis por props
- **Barra de ações** — ícones + tooltip acima do painel de propriedades (salvar, preview, histórico, export/import)
- **Layout notebook (R1+R2+R3)** — rail + drawer, fit-to-width, persistência de painéis, densidade `compactMode`, preview fullscreen &lt;1024px
- **Confirmação ao sair** — Voltar no cabeçalho da sidebar ou botão voltar do navegador com alterações não salvas
- Duplicar (`Ctrl+D`), copiar/colar entre bandas (`Ctrl+C` / `Ctrl+V`)
- **Editor de texto em modal** — duplo-clique, `F2` ou botão no painel; rich text, autocomplete `{`, formatação e alinhamento; painel mostra prévia read-only
- Marcadores em lista livre; numeração em lista numerada
- Contornos de hover/seleção customizáveis (`canvasSelectionClasses`)
- Export/import do layout + dados em JSON
- Preview embutido ou modal; impressão via navegador
- Modos `design` e `preview` via prop `mode`

### Componente de texto — edição

| Onde | Comportamento |
|------|----------------|
| Canvas | Visualização (`FormattedText`); **duplo-clique** abre modal |
| Painel **Conteúdo** | Prévia truncada + botão **Editar texto…** |
| Modal | `RichTextEditor`, toolbar (negrito/itálico/alinhamento), chips, catálogo de campos, tamanho e cor; **Salvar** persiste no relatório |

Atalho **F2** com um componente de texto selecionado abre o mesmo modal. Alterações ficam em draft até **Salvar**; fechar com mudanças pede confirmação. Enquanto o modal está aberto, o **canvas e a prévia do painel** refletem o draft em tempo real (badge *Editando* no componente).

### Roadmap Fase 2 (trecho)

| Item | Status |
|------|--------|
| 2.7 Seleção múltipla | ✅ |
| 2.8 Save / auto-save / histórico remoto | ✅ |
| 2.9 Responsividade notebook (R1+R2+R3) | ✅ — fit-to-width, rail, drawer, persistência, compactMode |
| 3.0 Presets de folha + px/cm | ✅ — seleção da folha no canvas, catálogo completo, escala automática |
| 3.1 Multipágina de design | ✅ — dropdown, nova/duplicar/excluir/renomear, canvas por página ativa |
| 3.3 Paginação runtime (MVP) | ✅ — quebra em bandas de dados, header/footer repetidos, preview empilhado |
| 3.2 Semântica bandas | ✅ — once / everyPage / flow / onceLast |
| 3.4 Contador de páginas | ✅ — `{sys.pageNumber}`, `{Page#}`, `{TotalPages#}` |
| 3.5 Integração host | ✅ — `pagePresets`, `onPrint`, demos A5/cupom/multipágina/etiqueta extraprotocolar, `@page` dinâmico |
| 4.1 / 4.2 | 📋 grade etiquetas, cupom bobina |

---

## Limitações conhecidas (MVP)

- **Store singleton** — duas instâncias `<ReportDesigner />` na mesma página compartilham estado (correção prevista na Fase 4)
- **`onReportChange`** em tempo real — não exposto; use `onSave` / auto-save
- **`detailData`** — tipo existe; suporte parcial na UI e no preview
- **Uma página** na prática (`pages[0]`) — multipágina de design na Fase 3.1
- **Presets de folha** — A4/A3/A5/Letter, etiqueta, cupom 58/80, personalizado (cm/px); clique na folha para editar
- **Preview** — sem paginação A4 real nem header/footer repetidos por página impressa
- Pacote ainda não publicado no npm (`react-example` no `package.json`)

---

## Personalização visual do canvas

```tsx
import {
  ReportDesigner,
  DEFAULT_CANVAS_SELECTION_CLASSES,
} from './ReportDesigner';

<ReportDesigner
  canvasSelectionClasses={{
    idle: 'ring-1 ring-transparent hover:ring-2 hover:ring-emerald-400',
    active: 'ring-2 ring-emerald-600',
    bandIdle: 'hover:border-emerald-400 hover:ring-2 hover:ring-emerald-400/60',
    bandActive: 'ring-2 ring-emerald-600 border-emerald-500',
  }}
  // ...
/>
```

Chaves: `idle`, `active` (componentes), `bandIdle`, `bandActive` (bandas). Valores são **classes Tailwind**.

---

## Stack

React 19 · TypeScript · Vite 6 · Zustand · Tailwind CSS 4 · Recharts · react-draggable

---

## Licença

Arquivos principais sob **Apache-2.0** (SPDX nos cabeçalhos `.ts` / `.tsx`).
