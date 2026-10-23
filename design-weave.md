# Weave — UI/UX Design System v1.0

## Objetivo

Estabelecer uma identidade visual consistente para o Weave, um motor de relatórios com editor visual, priorizando simplicidade, modernidade, clareza, praticidade e facilidade de uso.

A referência visual é o protótipo aprovado pelo usuário: interface predominantemente branca, superfícies em tons frios, azul como cor de destaque, bordas discretas, tipografia limpa e componentes compactos.

O design system deve ser aplicado consistentemente em todas as telas do produto.

### Diretrizes obrigatórias

- Priorizar simplicidade visual e clareza.
- Evitar elementos decorativos desnecessários.
- Usar o azul para ações, seleção e foco, sem aplicá-lo indiscriminadamente.
- Manter bom contraste e legibilidade.
- Preferir bordas discretas a sombras fortes.
- Manter espaçamentos e dimensões consistentes.
- Usar componentes reutilizáveis sempre que possível.
- Preservar a identidade visual existente do logo Weave. Não recriar nem substituir o logo.
- Não alterar funcionalidades ou regras de negócio como consequência da implementação visual.
- Não modificar a tipografia ou as cores dos relatórios gerados pelo usuário. Os tokens deste documento se aplicam à interface do produto, salvo quando explicitamente indicado.

---

# 1. Identidade visual

## 1.1. Conceito

O Weave deve transmitir:

- Simplicidade e facilidade de uso.
- Precisão e confiabilidade.
- Modernidade e profissionalismo.
- Organização e produtividade.
- Flexibilidade para tarefas simples e avançadas.

A interface deve parecer uma ferramenta profissional de produtividade, não um painel administrativo genérico nem um software técnico visualmente sobrecarregado.

## 1.2. Direção estética

Adotar uma estética minimalista, inspirada na linguagem visual do shadcn/ui, com identidade própria.

Características:

- Fundo predominantemente branco ou cinza-azulado muito claro.
- Superfícies brancas para áreas de conteúdo.
- Azul para ações primárias e elementos interativos relevantes.
- Bordas finas e discretas.
- Sombras leves, reservadas principalmente a elementos flutuantes.
- Cantos levemente arredondados.
- Ícones lineares.
- Tipografia sem serifa.
- Hierarquia visual clara entre títulos, conteúdo, labels e informações auxiliares.
- Densidade visual equilibrada: interface compacta, mas sem comprometer a legibilidade.

## 1.3. Princípios de composição

1. A informação mais importante deve ter maior destaque visual.
2. Elementos relacionados devem ficar agrupados.
3. Espaçamento deve estabelecer hierarquia, não apenas preencher espaço.
4. Ações primárias devem ser facilmente identificáveis.
5. Elementos secundários devem permanecer disponíveis sem competir com o conteúdo principal.
6. Estados interativos precisam ser perceptíveis, mas discretos.
7. A aparência dos componentes deve permanecer consistente entre telas.

## 1.4. Uso da marca

- Utilizar o logo existente do Weave.
- Preservar proporções, cores e área de proteção do arquivo original.
- Não adicionar efeitos, contornos ou gradientes ao logo sem autorização.
- Manter uma apresentação visual limpa no cabeçalho e nos pontos de identificação do produto.

---

# 2. Cores

Utilizar uma paleta baseada em tons frios de Slate e azul. Os valores abaixo são os tokens oficiais iniciais da interface.

## 2.1. Cores principais

| Token | Valor | Aplicação |
|---|---|---|
| Primary | #2563EB | Ações principais, links e seleção |
| Primary Hover | #1D4ED8 | Hover de ações primárias |
| Primary Active | #1E40AF | Estado pressionado |
| Primary Subtle | #EFF6FF | Fundo de seleção e realce suave |
| Primary Border | #BFDBFE | Bordas de elementos selecionados |
| Primary Foreground | #FFFFFF | Texto sobre fundo primário |

## 2.2. Superfícies

| Token | Valor | Aplicação |
|---|---|---|
| Background | #F8FAFC | Fundo geral |
| Surface | #FFFFFF | Cards, painéis e áreas de conteúdo |
| Surface Secondary | #F1F5F9 | Áreas secundárias e toolbars |
| Surface Tertiary | #E2E8F0 | Destaques de superfície mais fortes |
| Surface Hover | #F8FAFC | Hover de itens claros |
| Surface Selected | #EFF6FF | Itens selecionados |

## 2.3. Textos

| Token | Valor | Aplicação |
|---|---|---|
| Foreground | #0F172A | Títulos e texto principal |
| Text Secondary | #475569 | Texto complementar |
| Text Muted | #64748B | Labels, metadados e informações auxiliares |
| Placeholder | #94A3B8 | Placeholders |
| Text Inverse | #FFFFFF | Texto sobre fundos escuros |

Não usar textos auxiliares excessivamente claros. A legibilidade deve ser preservada mesmo em tamanhos pequenos.

## 2.4. Bordas e foco

| Token | Valor | Aplicação |
|---|---|---|
| Border | #E2E8F0 | Divisórias e limites padrão |
| Border Strong | #CBD5E1 | Bordas que precisam de maior contraste |
| Input Border | #CBD5E1 | Inputs e selects |
| Focus Ring | #3B82F6 | Indicador de foco |
| Focus Ring Offset | 2px | Espaçamento do indicador de foco |

## 2.5. Cores semânticas

| Token | Valor | Aplicação |
|---|---|---|
| Success | #16A34A | Sucesso e conclusão |
| Success Subtle | #F0FDF4 | Fundo de sucesso |
| Warning | #D97706 | Avisos e atenção |
| Warning Subtle | #FFFBEB | Fundo de aviso |
| Destructive | #DC2626 | Erros críticos e exclusão |
| Destructive Subtle | #FEF2F2 | Fundo de erro |
| Info | #0284C7 | Informações e orientações |
| Info Subtle | #F0F9FF | Fundo informativo |

As cores semânticas devem ser usadas apenas quando o significado justificar. Não utilizar verde, vermelho ou amarelo como elementos decorativos.

Sempre que possível, combinar cores semânticas com texto ou ícones. Não comunicar estados apenas pela cor.

## 2.6. Regras de aplicação

- Botões primários utilizam Primary com texto branco.
- Botões secundários utilizam Surface, borda Border e texto Foreground.
- Botões terciários utilizam fundo transparente e texto Foreground ou Text Secondary.
- Hover deve produzir mudanças sutis e previsíveis.
- Estados selecionados devem utilizar Primary Subtle e um indicador de seleção perceptível.
- Foco por teclado deve utilizar Focus Ring.
- Fundos de página devem ser claros e pouco saturados.
- Não utilizar gradientes em grandes áreas da interface.
- Não utilizar sombras coloridas.
- Não utilizar azul em todos os ícones ou textos indiscriminadamente.

---

# 3. Tipografia

## 3.1. Família tipográfica

Fonte principal: Inter.

Fallback:

`Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

Fonte monoespaçada para valores técnicos, expressões, códigos e identificadores:

`"JetBrains Mono", "SFMono-Regular", Consolas, monospace`

A fonte monoespaçada deve ser utilizada somente quando melhorar a leitura de conteúdo técnico. Não deve ser aplicada indiscriminadamente a toda a interface.

## 3.2. Escala tipográfica

| Token | Tamanho | Altura de linha | Peso padrão |
|---|---:|---:|---:|
| text-xs | 12px | 16px | 400 |
| text-sm | 13px | 20px | 400 |
| text-base | 14px | 20px | 400 |
| text-md | 16px | 24px | 400–500 |
| text-lg | 18px | 28px | 500–600 |
| text-xl | 20px | 28px | 600 |
| text-2xl | 24px | 32px | 600 |
| text-3xl | 30px | 36px | 600–700 |

## 3.3. Pesos disponíveis

- Regular: 400.
- Medium: 500.
- Semibold: 600.
- Bold: 700.

Evitar utilizar muitos pesos diferentes na mesma área visual. A hierarquia deve ser estabelecida principalmente por tamanho, peso, cor e espaçamento.

## 3.4. Aplicação por contexto

| Contexto | Token recomendado |
|---|---|
| Título de página | text-2xl ou text-3xl |
| Título de seção | text-lg |
| Título de card | text-base ou text-md |
| Texto comum | text-base |
| Botões | text-sm, peso 500 |
| Labels | text-sm, peso 500 |
| Metadados | text-xs ou text-sm |
| Tooltips | text-xs |
| Expressões e identificadores técnicos | Fonte monoespaçada, 12–13px |

## 3.5. Regras tipográficas

- Não utilizar tamanhos excessivamente grandes em interfaces de produtividade.
- Evitar textos longos em caixa alta.
- Utilizar caixa alta apenas em pequenos rótulos quando fizer sentido.
- Evitar textos auxiliares com baixo contraste.
- Manter alturas de linha consistentes.
- Aplicar truncamento apenas quando necessário, oferecendo acesso ao conteúdo completo.
- Não alterar automaticamente a tipografia do documento editado quando o usuário estiver apenas navegando pela interface.

---

# 4. Espaçamento, dimensões e raios

## 4.1. Escala de espaçamento

Utilizar uma escala baseada em múltiplos de 4px.

| Token | Valor | Aplicação |
|---|---:|---|
| space-1 | 4px | Espaços mínimos entre elementos |
| space-2 | 8px | Espaços entre ícones, textos e controles próximos |
| space-3 | 12px | Padding de controles compactos |
| space-4 | 16px | Padding padrão de painéis |
| space-5 | 20px | Separação entre grupos |
| space-6 | 24px | Separação entre seções |
| space-8 | 32px | Espaçamento entre áreas principais |
| space-10 | 40px | Espaçamento amplo |
| space-12 | 48px | Separação de seções maiores |

Priorizar os tokens existentes em vez de introduzir valores arbitrários.

Valores específicos podem ser utilizados quando houver necessidade real de alinhamento ou compatibilidade com componentes existentes.

## 4.2. Border radius

| Token | Valor | Aplicação |
|---|---:|---|
| radius-sm | 4px | Controles muito compactos |
| radius-md | 6px | Botões, inputs e selects |
| radius-lg | 8px | Cards e menus |
| radius-xl | 12px | Diálogos e superfícies amplas |
| radius-full | 9999px | Badges e elementos circulares |

Evitar arredondamentos excessivos em todos os elementos. A interface deve parecer moderna e profissional, não infantil ou excessivamente lúdica.

## 4.3. Sombras

| Token | Valor | Aplicação |
|---|---|---|
| shadow-xs | 0 1px 2px rgb(15 23 42 / 4%) | Destaque mínimo |
| shadow-sm | 0 1px 3px rgb(15 23 42 / 8%) | Cards e controles elevados |
| shadow-md | 0 4px 12px rgb(15 23 42 / 10%) | Menus e popovers |
| shadow-lg | 0 12px 32px rgb(15 23 42 / 14%) | Diálogos e overlays importantes |

As sombras devem estabelecer profundidade, não substituir bordas ou criar contraste excessivo.

A maioria dos componentes deve utilizar bordas discretas, sem sombra.

## 4.4. Dimensões padrão

| Token | Valor inicial |
|---|---:|
| control-height-sm | 28px |
| control-height | 36px |
| control-height-lg | 40px |
| icon-size-sm | 14px |
| icon-size | 16px |
| icon-size-lg | 18px |
| border-width | 1px |
| focus-ring-width | 2px |

Os tamanhos devem ser aplicados de forma consistente. Controles compactos não podem comprometer a facilidade de interação ou o uso por pessoas com limitações motoras.

## 4.5. Regras de composição

- Agrupar elementos relacionados.
- Utilizar padding consistente em cards e painéis.
- Evitar empilhamento excessivo de bordas.
- Evitar cards dentro de cards sem justificativa.
- Não utilizar sombras fortes para todos os componentes.
- Manter alinhamentos consistentes entre títulos, textos e controles.
- Priorizar a distribuição equilibrada do espaço disponível.
- Permitir adaptação dos componentes a diferentes larguras de tela, sem sobreposição ou corte de conteúdo essencial.

---

# 5. Tokens dos componentes

Os componentes devem utilizar os tokens das seções anteriores. Evitar estilos independentes e valores de cores, bordas ou dimensões duplicados em cada componente.

## 5.1. Botões

### Primário

- Fundo: Primary.
- Texto: Primary Foreground.
- Hover: Primary Hover.
- Active: Primary Active.
- Altura padrão: 36px.
- Padding horizontal: 12px.
- Border radius: radius-md.
- Peso tipográfico: 500.

Utilizar para a ação principal de uma área, como salvar ou confirmar.

### Secundário

- Fundo: Surface.
- Texto: Foreground.
- Borda: Border.
- Hover: Surface Secondary.
- Altura padrão: 36px.

Utilizar para ações alternativas que precisam continuar visíveis.

### Terciário ou ghost

- Fundo: transparente.
- Borda: transparente.
- Texto: Foreground ou Text Secondary.
- Hover: Surface Secondary.

Utilizar para ações auxiliares, ferramentas e controles de baixo destaque.

### Destrutivo

- Utilizar Destructive para ações de exclusão e operações perigosas.
- Solicitar confirmação quando a operação for irreversível ou tiver impacto relevante.
- Não utilizar vermelho para ações comuns que não sejam destrutivas.

Todos os botões devem apresentar estados de hover, focus, active e disabled. Utilizar estado de loading quando houver processamento.

## 5.2. Inputs e textareas

- Fundo: Surface.
- Texto: Foreground.
- Placeholder: Placeholder.
- Borda: Input Border.
- Altura padrão do input: 36px.
- Border radius: radius-md.
- Padding horizontal: 10–12px.
- Foco: Focus Ring.
- Erro: Destructive e mensagem explicativa.
- Desabilitado: contraste reduzido, sem aparência de controle ativo.

O label deve ficar claramente associado ao campo. Não depender exclusivamente do placeholder para identificar sua finalidade.

Textareas devem utilizar padding consistente e altura flexível conforme o conteúdo.

## 5.3. Selects e menus

- Aparência consistente com inputs.
- Altura padrão: 36px.
- Ícone discreto.
- Menu com fundo Surface, borda Border e shadow-md.
- Itens com padding confortável.
- Hover: Surface Secondary.
- Item selecionado: Primary Subtle.
- Estado desabilitado claramente identificável.

Menus devem evitar listas visualmente densas. Quando houver muitas opções, utilizar pesquisa ou agrupamento.

## 5.4. Tabs

- Altura padrão: aproximadamente 40px.
- Texto: text-sm.
- Peso: 500.
- Texto inativo: Text Secondary.
- Texto ativo: Primary ou Foreground.
- Indicador ativo: 2px, Primary.
- Transições discretas.

As tabs devem deixar clara a seção selecionada sem utilizar fundos saturados desnecessários.

## 5.5. Cards

- Fundo: Surface.
- Borda: Border.
- Border radius: radius-lg.
- Padding padrão: 16px.
- Sombra: nenhuma ou shadow-xs.
- Hover: mudança sutil quando o card for interativo.

Não transformar todo agrupamento de conteúdo em um card. Utilizar cards quando houver necessidade de agrupar ou distinguir informações.

## 5.6. Diálogos e popovers

### Diálogos

- Fundo: Surface.
- Border radius: radius-xl.
- Borda: Border.
- Sombra: shadow-lg.
- Overlay: fundo escuro translúcido.
- Cabeçalho, conteúdo e ações claramente separados.

### Popovers

- Fundo: Surface.
- Borda: Border.
- Border radius: radius-lg.
- Sombra: shadow-md.
- Padding: 8px.
- Posicionamento sem cortar conteúdo importante.

Diálogos devem ser reservados a tarefas que exigem atenção ou confirmação. Não utilizar diálogos para todas as interações simples.

## 5.7. Tooltips

- Fundo escuro, preferencialmente #0F172A.
- Texto branco.
- Fonte: text-xs.
- Border radius: radius-sm.
- Padding: 6–8px.
- Abertura após aproximadamente 400–600ms de hover.
- Exibir atalhos de teclado quando forem relevantes.

Tooltips devem complementar os rótulos, não substituir os nomes de ações essenciais.

## 5.8. Ícones

Biblioteca recomendada: Lucide.

- Tamanho padrão: 16px.
- Ações importantes: 18px.
- Controles compactos: 14px.
- Espessura de traço consistente.
- Cor herdada do contexto.
- Não misturar bibliotecas de ícones com estilos visuais incompatíveis.

Ícones isolados devem possuir tooltip ou nome acessível quando a função não for óbvia.

## 5.9. Estados interativos

Todos os componentes interativos devem definir os estados aplicáveis:

- Default.
- Hover.
- Focus.
- Active.
- Selected.
- Disabled.
- Loading.
- Error.
- Success.

### Regras

**Hover:** alteração sutil de fundo, borda ou texto.

**Focus:** indicador de foco visível, com largura de 2px e offset de 2px.

**Active:** feedback visual claro durante a interação.

**Selected:** fundo ou indicador de seleção perceptível, preferencialmente utilizando Primary Subtle e Primary.

**Disabled:** aparência inativa, sem sugerir que o componente pode ser acionado.

**Loading:** indicar processamento e evitar múltiplos envios acidentais.

**Error:** utilizar Destructive e mensagem que explique como corrigir o problema.

**Success:** utilizar Success e uma mensagem clara quando o feedback for necessário.

Não comunicar estados exclusivamente por cor.

## 5.10. Movimento e transições

- Transição rápida: 120ms.
- Transição padrão: 180ms.
- Curva padrão: ease-out.
- Evitar movimentos longos ou exagerados.
- Respeitar a preferência do sistema por redução de movimento.
- Utilizar animações para feedback e transições funcionais, não apenas decoração.

---

# Critérios de aceitação

A implementação será considerada consistente com o design system quando:

1. Todos os componentes reutilizáveis utilizarem os tokens definidos.
2. Não houver cores, raios ou sombras arbitrários quando já existir um token adequado.
3. A tipografia mantiver uma hierarquia clara.
4. Os estados interativos estiverem definidos e visualmente distinguíveis.
5. A interface preservar a identidade azul, branca e cinza-azulada do Weave.
6. Os componentes forem consistentes entre as diferentes telas.
7. Contraste, foco por teclado e legibilidade forem preservados.
8. O logo existente permanecer inalterado.
9. A implementação visual não modificar o comportamento funcional nem a renderização dos relatórios.

A prioridade é construir uma interface simples, limpa e profissional, seguindo o protótipo aprovado, sem introduzir complexidade visual desnecessária.
