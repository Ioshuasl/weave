# Fase 6 — Vídeos de treinamento com Remotion (proposta)

Status: **em andamento — Série B, passos 1 a 11 gravados e renderizados (22/10/2026); faltam abertura e comparação com a Biblioteca, e a Série A; pipeline em `weave/videos/`.** A fase 5 já entrega o player: cada aula aceita um link `https` (YouTube, Vimeo ou arquivo `.mp4/.webm`). A fase 6 produz os vídeos.

## Objetivo
Gerar vídeos curtos (1–3 min, 1080p) que ensinam o fluxo do produto — "escolha um modelo → edite → ajuste o estilo → visualize e salve", dados fictícios, assistente de IA, equipe — com a identidade do `design-weave.md`.

## Proposta
- Projeto separado `weave/videos/` (Remotion + TypeScript), fora do `frontend/` e do `backend/`.
- **Identidade:** tokens de `design-weave.md` em um módulo compartilhado (cores, Inter, raios, sombras), logo original (`weave/assets/`), sem recriá-lo.
- **Composições:** uma por aula (`01-escolha-um-modelo`, `02-edite-e-ajuste-o-estilo`, `03-dados-ficticios`, `04-assistente-de-ia`, `05-equipe`), montadas com cenas reutilizáveis (título, "tela do produto" com destaque/zoom, legenda, encerramento).
- **Telas do produto:** capturas feitas com Playwright a partir da própria aplicação (dados de demonstração), usadas como imagens/vídeos nas cenas — sem inventar UI.
- **Narração/legendas:** roteiros em pt-BR versionados em `videos/roteiros/*.md`; legendas geradas a partir deles (narração em áudio: decisão pendente — voz humana, TTS ou só legenda).
- **Render:** `npx remotion render` → MP4 em `videos/out/`; publicação manual (upload no YouTube/Vimeo ou arquivo hospedado) e o link entra na aula pelo painel do suporte.

## Decisões tomadas (22/10/2026)
1. **Voz:** TTS gratuito e offline com **Kokoro** (Apache-2.0, uso comercial permitido). Antes de gravar, confirmar na instalação quais vozes pt-BR existem e testar pronúncia de termos do domínio (protesto, apontamento, tabelião).
2. **Montagem:** **Remotion** (cenas por código, escritas e ajustadas pelo Claude) + **FFmpeg via MCP open source** (ex.: Kinocut, Apache-2.0) para cortes, mixagem de áudio e exportação.
3. **Gravação da sessão:** **Playwright** com `recordVideo` (e `trace`) sobre a própria aplicação, com roteiros de ação em `videos/capturas/*.mjs`.
4. **Ordem:** documentação escrita **primeiro** (concluída: `docs/treinamento/01` e `02`); os vídeos seguem os mesmos textos.
5. **Texto-fonte:** os guias `.md` em `docs/treinamento/` são a fonte única; cada vídeo é derivado de uma ou mais seções.

> **Licença do Remotion:** gratuita só para organizações com **até 3 pessoas**. Com mais gente na empresa (ou ao vender o Weave como produto), é preciso a licença de empresa. Se isso for um problema, a alternativa sem custo é só Playwright + FFmpeg (menos animação).

## Séries de vídeo
**Série A — "Cada elemento em 1 minuto"** (derivada do guia 01), uma aula por tópico:
folha e margens · blocos (cabeçalho, lista, fechamento, rodapé) · lista de registros · lista agrupada · texto e campos · imagem · QR Code · forma e tabela fixa · tabela de dados · gráfico · cálculos · visualizar/salvar/histórico · assistente de IA.

**Série B — "Montando um Instrumento de Protesto do zero"** (derivada do guia 02), um vídeo por passo (1–11) mais uma abertura e um fechamento com a comparação com o modelo da Biblioteca. Um vídeo longo único (≈ 15 min) pode ser montado juntando os passos.

Opcional (decisão futura): repetir a Série B com o **Livro de Protocolos** do tabelionato de notas.

## Pipeline por vídeo
1. **Roteiro** (`videos/roteiros/<id>.md`): texto da narração + marcadores de ação, extraído da seção do guia.
2. **Captura:** script Playwright executa as ações no editor com dados de exemplo e cursor visível, gravando em 1080p (viewport fixo, zoom 100%).
3. **Narração:** Kokoro gera o áudio por frase; os tempos orientam a duração de cada cena.
4. **Composição (Remotion):** abertura com logo, a captura com zoom/destaques nos pontos do roteiro, legendas geradas do roteiro, encerramento.
5. **Acabamento (FFmpeg MCP):** normalização de áudio, cortes e exportação em MP4 H.264.
6. **Publicação:** o MP4 vai para o armazenamento escolhido e o link entra na aula pelo Painel do suporte.

## Ainda em aberto
- Onde hospedar os MP4 (YouTube não listado, Vimeo ou storage próprio) e se haverá legendas `.vtt` junto do arquivo.
- Renderização local ou em CI (Remotion precisa de Chromium e FFmpeg).
- Qual série gravar primeiro (sugestão: Série B, passos 1–4, para validar o pipeline).
