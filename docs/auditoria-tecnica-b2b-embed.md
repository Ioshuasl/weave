# Auditoria técnica do pacote Weave — virada para produto B2B embutível

Data: 22/10/2026 · Escopo: `app/src/packages/weave` (a cópia em `weave/frontend/src/packages/weave` é idêntica, exceto testes).
Objetivo: avaliar o que falta para vender o Weave a empresas de software como **web component / iframe** (React, Vue, PHP, Angular…), com o diferencial de o **usuário final montar o próprio documento a partir dos dados que a empresa dona do software fornece**.

> Método: leitura do código, buscas (`grep`), build de teste com esbuild para medir o tamanho e execução da suíte de testes. Nada foi alterado no pacote. O que **não** foi verificado está marcado como "a validar".

---

## 1. Resumo executivo

**O que já existe e vale ouro**
- O pacote **já nasceu embutível**: o host injeta `report`, `data`, `dataSources` e recebe `onSave`, `onPrint`, `onPersistHistory`; imagens (`imageResolver`), variáveis por folha (`resolvePageVariables`) e a IA (`onAssistantRequest`) são **callbacks do host**, nada passa por serviço nosso. Isso é exatamente o contrato de um produto B2B.
- **Estado por instância** (`createStore` + contexto do zustand): dá para ter mais de um editor na mesma página.
- **Motor de paginação e de expressões são código puro** (sem DOM): `buildReportPreviewSheets` devolve folhas e camadas de forma determinística, e o avaliador de fórmulas é um tokenizador próprio (sem `eval`/`new Function`). Isso abre a porta para renderização no servidor.
- Já há versões em dois contratos de saída (`REPORT_PRINT_JOB_VERSION`, `REPORT_FILE_VERSION`).

**O que impede vender hoje (bloqueadores, P0)**
1. **Não há empacotamento**: é código-fonte TS consumido por um Next + Tailwind v4 do host (`@source ".."`, `@theme inline`). Não existe build, `.d.ts`, semver nem artefato servível.
2. **O contrato é feito de funções** (`onSave`, `imageResolver`…): não atravessa um iframe. É preciso um protocolo `postMessage` versionado.
3. **O formato do relatório não é versionado nem validado de verdade**: `ReportDefinition` não tem `schemaVersion`; a validação de importação olha só a 1ª página.
4. **Sem renderização no servidor**: o único caminho de PDF é o navegador (`window.print`/iframe) ou um `onPrint` que o cliente implementa sozinho. Quem emite documento fiscal/jurídico precisa de API.
5. **Pagina por estimativa de texto**, não por medição real (`estimateTextLines`): o mesmo documento pode quebrar de página diferente no navegador e no servidor.
6. **Segurança do conteúdo**: sanitização de HTML por regex em um ponto com `dangerouslySetInnerHTML`; layouts vindos de terceiros (links compartilhados, biblioteca, usuários do cliente) precisam de defesa em profundidade.
7. **Qualidade**: 12 arquivos de teste para ~326 arquivos (~32 mil linhas); **4 testes falhando hoje**; sem `ErrorBoundary`; sem teste visual.

**Veredito:** o desenho é bom e o núcleo (formato + paginação + fórmulas) é reaproveitável. Falta transformar um *componente interno* em um *produto*: empacotar, estabilizar o contrato, medir de verdade a paginação e criar o servidor de renderização. Estimativa grosseira: **5 a 6 meses de uma pessoa dedicada** (ou ~3–4 meses com duas), sem contar documentação e piloto. As estimativas por fase estão na seção 6 e têm margem de erro grande.

---

## 2. Arquitetura-alvo recomendada

```
   Sistema do cliente (React / Vue / PHP / Angular / HTML puro)
   ┌──────────────────────────────────────────────────────────────┐
   │  <script src="https://cdn.weave.app/v1/loader.js">           │
   │  WeaveEmbed.create(el, { token, mode, schema, theme, … })   │
   └──────────────┬───────────────────────────────────────────────┘
                  │ iframe + postMessage (protocolo weave.v1)
   ┌──────────────▼──────────────┐        ┌───────────────────────────┐
   │ embed.html (editor/viewer)  │        │ API de renderização       │
   │ React + Weave + CSS próprio │        │ POST /v1/render → PDF/PNG │
   └─────────────────────────────┘        │ Chromium pool + fila      │
        dados e layouts ficam no sistema  └───────────────────────────┘
        do cliente (onSave devolve o JSON)    (só quando o cliente pedir)
```

**Decisão: iframe primeiro** (estilo OnlyOffice), com três entregas:
1. `embed.html` — app completo, com React e CSS embutidos (self-contained);
2. `loader.js` (~poucos KB) com `WeaveEmbed.create()` e wrapper para `<weave-designer>` (web component fino que apenas cria o iframe);
3. `@weave/react` e exemplos Vue/PHP/Angular — todos falam com o mesmo iframe.

**Por que não Shadow DOM** (a validar com protótipo, mas os indícios são fortes): há **23 listeners globais** em `window/document` (atalhos, `keydown` capturando), **12 `createPortal` para `document.body`** (modais, menus, preview), Tailwind compilado para `:root`/`rem`, `@font-face` não funciona dentro de shadow root e a preview imprime clonando `<link>`/`<style>` do documento. O iframe resolve isolamento de CSS, de eventos, de versão e de portais de uma vez.

---

## 3. Achados por área

Legenda: **P0** bloqueia a venda · **P1** necessário para o primeiro cliente pagante · **P2** evolução.

### 3.1 Empacotamento e distribuição — P0
**Evidência:** não há `package.json` em `packages/weave`; `styles/weave.css` começa com `@source ".."` e `@theme inline` (depende do Tailwind v4 do host); `index.ts` exporta tipos e componentes, mas não há build, `d.ts` nem changelog. A cópia em `weave/frontend` é mantida por **sincronização manual** (já houve drift de arquivos de teste).
**Medição (esbuild, `react`/`react-dom` externos):** 1,09 MB minificado, **327 KB gzip**. Maiores itens: código próprio 425 KB, **recharts 254 KB (23%)**, framer-motion + motion-dom 120 KB, lodash 34 KB (vem do recharts), tailwind-merge 27 KB, driver.js 25 KB, qrcode 23 KB.
**Recomendações**
- Transformar em pacote de verdade num monorepo (um só código-fonte; `app`, `weave/frontend` e `embed` consomem o mesmo pacote — acaba a cópia manual).
- Build com Vite (modo biblioteca) para: (a) `embed` (HTML+JS+CSS com React incluso), (b) ESM/CJS + `d.ts` para os wrappers.
- CSS final **compilado e escopado** no build do embed; remover a dependência de Tailwind no host.
- Divisão em dois pontos de entrada: **viewer** (só renderiza, sem designer, sem zustand do editor) e **designer**. Hoje `Weave.tsx` importa os dois.
- Carregar `recharts` sob demanda (só quando há gráfico no layout); avaliar trocar `framer-motion` por CSS.
- Versionar o embed por URL: `/v1/` (canal estável, só correções compatíveis) e `/v1.4.2/` (imutável), com SRI opcional.

### 3.2 Contrato de integração (iframe/postMessage) — P0
**Evidência:** `WeaveProps` tem `onSave`, `onPrint`, `onPersistHistory`, `imageResolver`, `resolvePageVariables`, `onAssistantRequest`, `onClose` — todos funções.
**Recomendações**
- Protocolo `weave.v1` com mensagens JSON e tipos publicados:
  - *host → embed:* `init`, `load` (report/data/schema), `setMode`, `setData`, `getReport`, `destroy`;
  - *embed → host:* `ready`, `change` (dirty), `save`, `print`, `error`, `resize`;
  - *RPC reverso (embed pede, host responde, com `id` e timeout):* `resolveImage`, `resolvePageVariables`, `assistantRequest`, `uploadAsset`.
- Segurança do canal: `targetOrigin` explícito (nunca `*`), allowlist de origens por cliente, validação de esquema de toda mensagem.
- Garantir **timeouts e cancelamento** (um callback do host que nunca responde não pode travar o editor).
- Entregar **exemplos executáveis**: React, Vue 3, Laravel/Blade (PHP puro), Angular, HTML estático.

### 3.3 Dicionário de dados — o diferencial do produto — P0
**Evidência:** `data` é `Record<string, unknown[]>` e `DataSourceCatalog` só diz `singleton`/`list`. O seletor de campos mostra as chaves técnicas; não há rótulo, tipo, formato, descrição, nem noção de campo aninhado declarada.
**Por quê importa:** a autonomia do usuário final depende de ele **entender** os dados. "valor_emolumento" precisa aparecer como "Valor do emolumento (R$)", com tipo e formatação padrão.
**Recomendações**
- Criar o **`DataSchema`** informado pela empresa: fontes (`id`, `label`, `kind`, `description`) e campos (`key`, `label`, `type: text|number|currency|date|boolean|list`, `format`, `description`, `children` para aninhados, `example`).
- Separar claramente **schema** (contrato), **dados de exemplo** (design-time) e **dados reais** (render/execução).
- Formatação automática por tipo (moeda, data, CPF/CNPJ) vinda do schema, em vez de depender de fórmula manual.
- **Permissões e travas** (muito pedido em B2B): `capabilities` (desligar elementos, importar/exportar, IA), **áreas protegidas** do layout (ex.: texto legal que o usuário não pode editar), fontes/campos permitidos por usuário, `readOnly` por modo.

### 3.4 Formato do relatório e compatibilidade — P0
**Evidência:** `ReportDefinition` (`report.ts`) não tem `schemaVersion`; `normalizeReportDefinition` faz ajustes pontuais (preset inferido, margens padrão, QR quadrado); `isReportDefinition` valida só `pages[0]` e a existência de ids; `ReportExportPayload.version = 1` existe só no envelope de arquivo.
**Risco:** clientes vão guardar milhares de layouts no banco deles. Qualquer mudança incompatível vira incidente de produção deles, fora do nosso controle.
**Recomendações**
- Campo `schemaVersion` no próprio relatório + **cadeia de migrações** (`v1→v2→…`) com testes de "arquivo dourado" por versão.
- **JSON Schema/Zod** como fonte única do formato; validação estrita nas fronteiras (load, import, API de render); política para campos desconhecidos.
- Promessa de compatibilidade (ex.: o embed `v1` lê qualquer layout `v1.x`; N-1 para major).
- Publicar o schema do `ReportDefinition` e do `ReportPrintJob` na documentação.

### 3.5 Renderização no servidor / PDF — P0 (é onde está a receita)
**O que ajuda (verificado):** `modules/rendering/domain` (paginação, camadas, `reportPrintJob`) e `modules/expression/domain` são puros; fora do designer, só `ReportPreview` usa `window/document`.
**O que falta:** não há renderizador de HTML/PDF no servidor; `onPrint` entrega o `printJob` para o cliente se virar.
**Opções**
| Opção | Prós | Contras |
|---|---|---|
| **A. Chromium headless (Playwright) renderizando as mesmas folhas React → `page.pdf()`** | Fidelidade máxima com o que o usuário vê; menos código | Custo por documento (0,5–2 s de CPU), fila/pool, memória, fontes |
| B. Gerar PDF "na mão" (pdf-lib/pdfkit) a partir do `printJob` | Rápido e leve | Reimplementar todo o desenho; risco de divergência permanente |
| C. Deixar o cliente imprimir (`onPrint`) | Zero custo para nós | Sem receita, sem lote, sem PDF/A |
**Recomendação:** **A**, com `renderToStaticMarkup` das folhas + CSS próprio → Chromium. API `POST /v1/render { layout, data, format: pdf|png|html }`, execução assíncrona com webhook para lotes, *idempotency key*, metering por documento. **PDF/A** exige pós-processamento (Ghostscript/qpdf) e **assinatura ICP-Brasil** deve ficar com o cliente (ou integração futura).
**Requisitos de produção:** pool de navegadores com limite de memória/tempo, rede desligada por padrão no render (imagens como `data:`/URLs permitidas), proteção contra **SSRF** (bloquear IPs internos), fontes embutidas, quotas por cliente.

### 3.6 Fidelidade da paginação — P0 (a validar com testes)
**Evidência:** `bandHierarchyBlocks.ts` calcula a altura de bandas `autoHeight` com `estimateTextLines(text, largura, fontSize, fontFamily)` — estimativa por caracteres, sem medir a fonte real.
**Risco:** o navegador quebra o texto de um jeito e a paginação calculada assume outro; o resultado diverge entre editor, preview e servidor, principalmente com fontes diferentes ou texto longo.
**Recomendações**
- Medir texto de verdade (canvas `measureText` com a fonte carregada, ou métricas pré-computadas por fonte) com a mesma rotina no navegador e no servidor.
- **Fontes controladas:** conjunto embutido (open-source) + `@font-face` do cliente; mesma fonte no editor e no render.
- Suíte de **regressão visual**: documentos de referência (livro de protocolos, instrumento, certidão…) → PNG/PDF "dourados" comparados a cada mudança (já temos Playwright).

### 3.7 Segurança — P0/P1
- **XSS (P0):** `sanitizeRichHtml` (`richTextUtils.ts`) filtra HTML por **regex** e é usado com `dangerouslySetInnerHTML` em `FormattedText.tsx` e `ChartRichText.tsx`. Hoje o texto é escapado antes, o que mitiga, mas regex não é um sanitizador confiável (atributos `data-inline-*` só têm aspas removidas). Como layouts podem vir de terceiros (link compartilhado, biblioteca, usuário do cliente), trocar por **DOMPurify** ou renderizar rich text a partir de uma estrutura (AST) sem HTML; criar teste com corpus de XSS.
- **Iframe/embutir (P0):** `Content-Security-Policy: frame-ancestors` por cliente (allowlist de domínios licenciados), atributo `sandbox` mínimo necessário, `postMessage` com origem validada.
- **Autenticação do embed (P1):** token JWT curto emitido pelo **backend do cliente** (como no OnlyOffice): `tenant`, `user`, `permissions`, `sources`, `exp`. O embed não guarda segredo.
- **Imagens (P1):** `referrerPolicy="no-referrer"` já existe (bom). No servidor: allowlist de hosts, bloqueio de redes internas, tamanho máximo. Imagens hoje podem ser embutidas como `data:` no JSON (`embedImageFile`), o que **incha o layout**; oferecer `onUploadAsset` que devolve URL.
- **Expressões (P1):** sem `eval` (bom). Falta limite de tamanho/profundidade e de tempo (principalmente no servidor, com somas sobre listas grandes).
- **Importação (P1):** validação superficial (ver 3.4).
- **Armazenamento local (P2):** painéis/recentes ficam em `localStorage` por `reportId`; chavear também por tenant para não vazar nomes de campos entre contas no mesmo navegador.
- **LGPD/sigilo (P0 de negócio):** no modo cliente, dados ficam no navegador do cliente (ótimo argumento). No modo servidor, os dados **trafegam** para a nossa infraestrutura: contrato de operador (DPA), retenção zero, sem log de conteúdo, região. **Importante para cartórios** (regra do projeto: servidor do cartório só na rede interna) — ver "Self-hosted" em 5.

### 3.8 Qualidade, testes e observabilidade — P0/P1
- **12 arquivos de teste** para ~326 arquivos de código (domínio e fórmulas cobertos; **UI, designer e renderização praticamente sem teste**).
- **4 testes falham hoje** em `expressionCalc.test.ts`: os testes usam funções em inglês (`money`, `sum`, `round`) e o motor atual usa fórmulas em português (`formulaPt.ts`, ex.: `MOEDA`, `SOMA`). Provável teste desatualizado ou perda de compatibilidade com os nomes antigos — **decidir e corrigir antes de qualquer release**.
- **Sem `ErrorBoundary`:** uma exceção de renderização derruba o editor inteiro e perde o que não foi salvo. Precisa de boundary + recuperação de rascunho + evento `error` para o host.
- **Sem telemetria:** não há como saber erros em produção do cliente. Planejar captura de erros (ex.: Sentry self-hosted) respeitando privacidade.
- **Sem teste visual/E2E** do editor (Playwright já existe no ambiente).
- **CI:** typecheck, testes, `license-checker` das dependências, tamanho do bundle como orçamento.

### 3.9 Desempenho — P1 (a medir)
- Paginação e fórmulas rodam na thread principal; não medi com 10 mil/50 mil linhas (**a validar**). Planejar benchmark de 1k/10k/50k linhas, mover a paginação para Web Worker se passar do orçamento e **virtualizar a pré-visualização** (renderizar só as folhas visíveis).
- Bundle: ver 3.1. Preferir o modo viewer leve para exibir documentos sem editor.

### 3.10 Produto e experiência B2B — P1/P2
- **Tema/white-label:** hoje só `canvasSelectionClasses`; o tema usa variáveis (`--weave-brand`, escala neutral/indigo). Expor `theme` (cor da marca, claro/escuro, densidade, logotipo no cabeçalho) via `init`. White-label como diferenciador de plano.
- **Elemento de código de barras ausente:** só há QR (`qrcode`). Em documentos brasileiros (boleto, etiquetas, selo) Code128/EAN são comuns — nos modelos do Orius o código de barras entra como imagem pronta.
- **Idioma:** textos da UI e `Intl('pt-BR')` fixos. Para o mercado BR está certo; para LATAM/exterior precisa de `locale` (pode esperar).
- **Acessibilidade:** ~213 atributos `aria-*`; edição por teclado do canvas e leitor de tela **a validar**.
- **Histórico/versões:** `onPersistHistory` já entrega snapshots ao host (bom ponto de venda).
- **Permissões de edição por papel**, **comentários**, **aprovação de layout** (workflow) — evolução (P2).

### 3.11 Licenciamento, medição e operação — P1
- **Licença:** validação **no servidor que entrega o embed** (domínio/origem, plano, validade), não em chave no navegador (facilmente burlável). Trial com marca d'água.
- **Medição:** contagem de documentos renderizados (cobrança por uso) e de editores ativos (cobrança por assento/domínio).
- **Operação:** CDN, SLA, canal estável/canário, rollback, página de status, política de depreciação (ex.: 12 meses).
- **Self-hosted / on-prem (P1 para cartórios e órgãos públicos):** imagem Docker (embed + render) rodando na rede do cliente, com licença offline. É o equivalente ao modelo do OnlyOffice e responde ao requisito de sigilo.
- **Licenças de dependências:** recharts, framer-motion, driver.js, qrcode, zustand, react-draggable, lucide são permissivas (MIT/ISC); automatizar a conferência no CI.

---

## 4. Riscos

**Técnicos**
1. Divergência de paginação navegador × servidor (3.6) — risco principal de reputação.
2. Escopo do render no servidor (fontes, PDF/A, escala, SSRF) subestimado.
3. Dívida de testes: refatorar para empacotar sem rede de segurança.
4. Compatibilidade de layouts dos clientes (3.4) — incidente "invisível" até acontecer.
5. Comportamento do editor dentro de iframe em navegadores/políticas corporativas (cookies de terceiros, CSP, bloqueio de iframes): **testar cedo**.

**Negócio**
1. Cliente do tipo cartório/órgão pode **não aceitar nuvem** → precisa do pacote on-prem.
2. Concorrentes dão ao desenvolvedor "tudo por API"; nosso argumento é a **autonomia do usuário final** — o dicionário de dados (3.3) e o tema/white-label sustentam isso. Medir isso com clientes-piloto antes de investir em cobrança.
3. Suporte técnico a integradores (documentação, exemplos, SLA) consome mais que o código.
4. Manter **dois produtos** (a plataforma Weave e o embed) dispersa o foco; usar a plataforma como vitrine e como base de modelos.

**Jurídicos**
- Operador de dados (LGPD) no modo servidor; termos de uso do embed; propriedade dos layouts dos clientes; licenças das fontes.

---

## 5. Roadmap sugerido (estimativas grosseiras)

| Fase | Entrega | Estimativa (1 pessoa) |
|---|---|---|
| **0. Estabilizar** | corrigir os 4 testes; `schemaVersion` + validação + migrações; `ErrorBoundary`; trocar o sanitizador; monorepo único do pacote; CI | 2–3 semanas |
| **1. Empacotar** | build Vite (embed + viewer + wrappers), CSS próprio, protocolo `weave.v1`, `loader.js`, `@weave/react`, exemplos Vue/PHP/Angular | 4–6 semanas |
| **2. Contrato de dados e produto** | `DataSchema`, `capabilities`, áreas protegidas, tema/white-label, JWT de sessão do embed | 4–6 semanas |
| **3. Renderização** | medição real de texto + fontes, regressão visual, API `/v1/render` (Chromium pool, fila, webhook, quotas), PDF/A opcional | 6–8 semanas |
| **4. Go-to-market técnico** | licenciamento no servidor do embed, metering, site de documentação + playground, imagem on-prem, piloto (Orius + 2 parceiros) | 4 semanas |

Total ≈ **20–27 semanas** para uma pessoa (≈ 5–6 meses), **sem** contar o tempo de piloto e vendas. Fases 0 e 1 já permitem um **piloto interno com o Orius dentro de um iframe**, que é o melhor teste de realidade.

**Critérios de pronto para vender:** (1) 3 integrações de referência (React, Vue, PHP) rodando; (2) render de 5 documentos reais idêntico ao editor (regressão visual verde); (3) layout `v1` salvo hoje abre igual daqui a 12 meses (testes dourados); (4) política de segurança publicada (CSP, token, LGPD); (5) orçamento de bundle e de tempo de render documentados.

---

## 6. Decisões em aberto (para o dono do produto)
1. Confirmar **iframe-first** (recomendado) e adiar o web component "nativo" sem iframe.
2. Render no servidor: **Chromium** (recomendado) × motor próprio de PDF.
3. Oferecer **on-prem** desde o início (cartórios) ou só nuvem no piloto?
4. Modelo de cobrança: por **editor/assento**, por **documento renderizado**, ou combinado.
5. Idioma: só pt-BR no começo?
6. Onde ficam os layouts: sempre no sistema do cliente (recomendado) ou opção de nuvem Weave (a plataforma atual).

---

## 7. O que não foi verificado
Desempenho com grandes volumes; comportamento real em Safari/Firefox; acessibilidade por teclado/leitor de tela; cobertura completa de elementos (condicionais, subrelatórios, agrupamentos, totais por grupo) frente a concorrentes; cabeçalhos/rodapés repetidos; fidelidade de impressão em papéis de formato especial.
