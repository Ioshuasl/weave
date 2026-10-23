# Guia dos elementos do Weave

Este guia explica, um por um, o que cada elemento do editor faz, quando usar e como configurar. Ele serve de consulta: você não precisa ler do começo ao fim.

> **Como o editor está organizado**
> - **Esquerda — Elementos:** o que você pode colocar na folha. Abaixo, **Dados do relatório**: as informações que o sistema fornece (arraste-as para a folha).
> - **Centro — a folha:** o documento. Abas de página no topo e, à direita, o seletor **Dados | Campos**.
> - **Direita — Propriedades:** muda conforme o que está selecionado (folha, bloco ou elemento).
> - **Topo:** nome do modelo, estado de salvamento, Camadas, Assistente de IA, Desfazer/Refazer, Histórico, **Visualizar** e **Salvar**.

## 1. Conceitos que valem para tudo

### Blocos e elementos
O Weave trabalha com dois níveis:

- **Bloco** (internamente "banda"): uma faixa horizontal da folha que tem um papel — cabeçalho, uma linha repetida por registro, fechamento… O bloco decide **onde e quantas vezes** o conteúdo aparece.
- **Elemento** (texto, imagem, QR Code, forma, tabela fixa, gráfico): o conteúdo que fica **dentro** de um bloco.

Quando você clica em **Texto** ou **Imagem** sem ter selecionado um bloco, o Weave cria um *elemento solto*: um bloco invisível do tamanho do elemento. Nesse caso, o painel mostra **Onde aparece** (veja o item 3.1).

### Campos: o que o sistema fornece
O sistema onde o Weave está instalado entrega **fontes de dados** (por exemplo, `cartorio` ou `instrumentos`). Cada fonte pode ser:

- **Dados gerais** (uma única linha — por exemplo, os dados do cartório) ou
- **Registros** (uma lista — por exemplo, os protocolos do dia).

Num texto, um campo aparece entre chaves: `{cartorio.nome}`. Você não precisa digitar: **arraste** o campo de *Dados do relatório* para a folha ou use **Editar texto → inserir campo**.

### Modo Dados × Campos
No alto da folha, o seletor **Dados | Campos** troca o que o canvas mostra:
- **Dados:** os valores de exemplo (como o documento ficará).
- **Campos:** os nomes dos campos (útil para ver o que cada texto está usando).

### Atalhos
`Delete` exclui · `Ctrl/Cmd+C`, `Ctrl/Cmd+V`, `Ctrl/Cmd+D` copiam, colam e duplicam · `Ctrl/Cmd+Z` desfaz · `Ctrl/Cmd+Shift+Z` refaz · `Ctrl/Cmd+S` salva · `Ctrl/Cmd+H` abre o histórico · `Alt+clique` alterna entre elementos sobrepostos · `Ctrl/Cmd+clique` ou `Shift+clique` seleciona vários · `Shift` ao arrastar desliga o encaixe (snap) · duplo clique (ou `F2`) edita o texto.

---

## 2. A folha (página)

Selecione a página (clique na folha vazia ou na aba) para ver **Propriedades da página**:

| Campo | Para que serve |
|---|---|
| **Nome da página** | Aparece na aba e nas folhas de saída. |
| **Tamanho da folha** | Papéis prontos: A4, A3, A5, Carta (retrato e paisagem), folha de etiquetas, etiqueta avulsa, cupom 80 mm e 58 mm. Existe também **Personalizado**. |
| **Alternar retrato/paisagem** | Gira a folha. |
| **Medir em** | Unidade usada nas medidas (cm, mm…). |
| **Largura / Altura** | Só no tamanho personalizado. |
| **Margens** (Topo, Direita, Baixo, Esquerda) | As linhas tracejadas na folha mostram a área onde o conteúdo cabe. |
| **Linhas do relatório** | Estilo de linhas aplicado a todas as listas: sem linhas, simples ou grade. |

> **Cupom (80/58 mm):** o papel contínuo não tem altura fixa; é indicado para recibos e comprovantes.

Use o **+** no topo para adicionar páginas de design e os **…** da aba para renomear, duplicar ou excluir. Cada página de design pode gerar uma ou várias folhas de saída.

---

## 3. Blocos (o "onde" e o "quantas vezes")

Os blocos ficam em **Elementos**. Os mais usados aparecem direto; os demais ficam em **Mais elementos**.

| Bloco | Quando aparece | Use para |
|---|---|---|
| **Cabeçalho da folha** | No topo de **todas** as folhas | Nome do cartório, brasão, títulos das colunas |
| **Título do relatório** (*Mais elementos*) | **Uma vez**, no início da 1ª folha | Título do documento |
| **Lista de registros** | **Uma linha por registro** de uma lista | Um protocolo por linha, um título por folha |
| **Lista agrupada** | Registros agrupados (assistente) | Protocolos de cada dia, atos por natureza |
| **Lista numerada** (*Mais elementos*) | Uma linha por registro, com numeração | Itens numerados |
| **Tabela de dados** (*Mais elementos*) | Registros em colunas, com cabeçalho | Quadros simples, sem desenhar célula a célula |
| **Texto de fechamento** | **Uma vez**, no fim do relatório | Totais, assinatura, encerramento |
| **Rodapé da folha** | No pé de **todas** as folhas | Numeração, observações |
| **Linha divisória** (*Mais elementos*) | Onde você colocar | Separar partes da folha |

### 3.1 Onde aparece (elemento solto)
Para um elemento solto (texto/imagem criado fora de um bloco), **Mostrar este elemento** define o bloco que o contém:
- **Só na 1ª folha** (título do relatório),
- **Em todas as folhas** (cabeçalho/rodapé),
- **No fim do relatório** (fechamento).

> Se o elemento fica **abaixo de uma lista**, a lista pode crescer por cima dele. Nesse caso use **No fim do relatório**.

### 3.2 Lista de registros
Escolha **Uma linha para cada…** e selecione a lista (por exemplo, `instrumentos`). Tudo o que você colocar dentro do bloco se **repete uma vez por registro**.

Propriedades principais:
- **Uma linha para cada…** — a lista de dados.
- **Mostrar títulos das colunas** e **colunas** (nas tabelas de dados).
- **Posição e tamanho** do bloco na folha (X, Y, largura, altura).
- **Linhas da lista** — **Linhas** entre registros (*rows*), entre colunas, laterais ou contorno; **Espessura** (fina/média) e **Cor**; **Também no título das colunas**; **Continuar até o fim da folha** (preenche o espaço vazio de baixo com as linhas das colunas).
- **Moldura da banda** — borda em volta do bloco e dos blocos filhos, lado a lado (esquerda, direita, topo, base), com espessura e cor.
- **Mostrar só quando…** — filtro por registro: **Informação** + **Condição** (é igual a, é diferente de, é maior/menor…, está vazio, está preenchido) + **Valor**. Registros que não atendem não são impressos (nem as listas dentro deles).
- **Dentro de outra lista** (vínculo mestre/detalhe): faz a lista aparecer **dentro de cada registro** de outra (por exemplo, os devedores de cada título). Você escolhe **Esta lista aparece** *acima*, *ao lado* ou *abaixo* da linha do pai e o campo que liga as duas.
- **Manter junto na mesma folha** — evita que um registro e o que há dentro dele fiquem divididos entre duas folhas.
- **Altura automática (quebra de texto)** — a altura de cada linha cresce conforme o texto e **cada elemento se estica até a altura da linha**. É o que se quer em listas e tabelas (colunas com linhas divisórias), mas **desmancha layouts desenhados à mão** (caixas posicionadas com X/Y e altura próprias, como um instrumento): nesses casos, desligue. Um bloco novo de *Lista de registros* vem com ela **ligada**.

### 3.3 Lista agrupada
Abre um assistente com três perguntas:
1. **Agrupar por qual lista?** (os grupos — ex.: dias),
2. **O que mostrar dentro de cada grupo?** (os itens — ex.: protocolos),
3. **Como saber a qual grupo cada item pertence?** (o campo que liga item e grupo) e o **título de cada grupo**.

O Weave cria os blocos pai/filho já ligados.

### 3.4 Lista numerada
Como a lista de registros, mais **Estilo do número** (`1.`, `1)` ou `1`) e **Começar em**. Há também o **marcador** (círculo cheio/vazio, quadrado ou nenhum) com cor e tamanho.

### 3.5 Tabela de dados
Registros em colunas. Em **Colunas**, para cada coluna defina: **Título**, **Informação mostrada**, **Alinhamento**, **Largura** e, se precisar, **Fórmula (avançado)** — por exemplo `R$ {lista.valor}`. Arraste para reordenar. **Borda da tabela** e estilos de cabeçalho/linhas ficam em *Avançado*. Há um botão para **refazer as colunas com todas as informações da lista**.

### 3.6 Linha divisória
Uma linha com **espessura** e **cor**, que você arrasta pelas pontas (com `Shift`, o ângulo encaixa de 45 em 45°).

---

## 4. Elementos (o conteúdo)

### 4.1 Texto
É o elemento mais usado. Duplo clique (ou **Editar texto**) abre o editor.

- **Texto livre e campos misturados:** `Saibam quantos… {instrumentos.apresentante}, em {cartorio.cidade}.`
- **Formatação no texto:** `**negrito**`, `_itálico_`, `++sublinhado++`, `~~traçado~~` (também pelos botões do editor). É possível mudar cor e tamanho de um trecho.
- **Informação mostrada:** quando o texto é *só um campo*, escolha-o direto no painel.
- **Aparência:** **Fonte**, **Tamanho**, **Entre linhas**, **Cor do texto**, **Alinhamento** (esquerda/centro/direita/justificado), **Girar** (e rotação livre), **Destaque** (negrito, itálico…).
- **Posição e espaçamento:** **X**, **Y**, **Largura**, **Altura**, **Espaçamento interno** (ex.: `4px 8px`), **Cor de preenchimento**, **Bordas** e **Cantos arredondados**.

**Variáveis da folha** (valem em qualquer texto):
`{sys.pageNumber}` página atual · `{sys.pageCount}` total de folhas · `{sys.date}` e `{sys.dateLong}` data · `{sys.time}` hora · `{sys.reportName}` nome do relatório. O sistema pode oferecer ainda `{page.chave}` (por exemplo `{page.livro}`, `{page.folha}`), calculadas por folha.

**Cálculos e fórmulas** (veja o item 6): um texto pode trazer o resultado de um cálculo, como `{Total da guia}`.

### 4.2 Imagem
- **Endereço da imagem (URL)** ou **Ou usar uma imagem dos dados** (a imagem vem do registro).
- **Encaixe:** *inteira* (contém), *preencher* (cobre) ou *esticar*. **Posição da imagem** e **Foco horizontal/vertical** para recortes.
- **Aparência:** **Opacidade** (use baixa para **marca d'água**), **Girar**.
- **Avançado:** **Descrição da imagem** (acessibilidade), **Link ao clicar** (vale na visualização e na impressão), **Travar proporção**.

Sem imagem, o Weave mostra um quadro "Sem imagem" — o espaço fica reservado.

### 4.3 QR Code
- **O que o QR Code contém:** um link ou texto, **ou** uma informação dos dados — nesse caso, **cada registro gera um QR Code diferente**.
- **Cores:** do código e do fundo. **Avançado:** **Resistência a falhas** (L, M, Q, H) e **Margem**.
- O QR sempre mantém a proporção quadrada.

### 4.4 Forma
Retângulo para **fundo**, **moldura** ou destaque. Configure **cor de preenchimento**, **bordas** e **cantos arredondados**. Coloque a forma *atrás* do texto (veja **Camadas**).

### 4.5 Tabela fixa
Tabela com **células digitadas à mão** (conteúdo fixo ou com campos). Opções: **Primeira linha é o cabeçalho**, adicionar/remover **Linha** e **Coluna**, e **Largura de cada coluna (px)** — `100, 120, 80`. Para linhas que se repetem com os dados, use **Tabela de dados**.

### 4.6 Gráfico
Barras ou pizza a partir de uma lista.
- **Gráfico de qual lista?** + **Nome de cada barra/fatia** e **Tamanho de cada barra/fatia**.
- **Cores**, **Fundo do gráfico**, **Mostrar linhas de grade**.
- **Título e legenda:** título, mostrar legenda, posição da legenda, **Mostrar valor ao passar o mouse**.
- **Pizza:** **Furo no centro** (0 = pizza; maior = rosca) e **Máx. de fatias** (0 = todas).
- **Avançado:** nomes dos eixos, contornos, borda do quadro, cantos arredondados.

---

## 5. Organização na folha

- **Camadas** (ícone no topo): lista de blocos e elementos da página; use para selecionar algo escondido, **renomear** e **reordenar arrastando**.
- **Mini barra** sobre o elemento selecionado: editar, negrito, alinhamento, duplicar, excluir.
- **Seleção múltipla** (`Shift/Ctrl+clique`): ajuste vários de uma vez (alinhar, espaçar, mudar estilo).
- **Encaixe (snap)** guia o alinhamento; `Shift` ao arrastar desliga.
- **Zoom:** `−`, `+`, "ajustar" no canto inferior direito, ou `Ctrl + roda do mouse`.

---

## 6. Cálculos

Em **Cálculos** (topo da barra esquerda) você cria valores com nome, guardados no modelo, e usa o nome entre chaves no texto: `{Total da guia}`.

- **Nome** + **Fórmula**, escrita em português no estilo Excel. Campos entre colchetes: `[valor_emolumento] * 10%`.
- Um cálculo pode usar **outros cálculos** pelo nome. Cálculos circulares são recusados.
- **Arredondar** (padrão: sim, 2 casas) e **Só no final** (os cálculos citados entram sem arredondar; só o resultado final é arredondado).
- **Funções:** `SOMA`, `TOTAL`, `CONTAR`, `ARREDONDAR`, `TRUNCAR`, `MOEDA`, `NUMERO`, `MINIMO`, `MAXIMO`, `ABS`, `SE`, `E`, `OU`, `NAO`.
- **Exemplos:** `=MOEDA(SOMA([valor]))` · `=SE([quantidade] > 0; "Sim"; "Não")` · `=ARREDONDAR([valor] * 2%; 2)`.

---

## 7. Visualizar, salvar e imprimir

- **Visualizar:** mostra o documento com os dados de exemplo, folha a folha. Há três modos — uma folha, várias folhas lado a lado e livro (páginas em par) — e **zoom**.
- **Salvar** (`Ctrl/Cmd+S`): grava uma nova versão. Se houver alterações não salvas, o topo mostra "Alterações não salvas".
- **Histórico** (`Ctrl/Cmd+H`): versões anteriores do layout; você pode voltar a uma delas.
- **Imprimir:** na pré-visualização, **Imprimir** envia o documento já paginado para impressão/PDF.
- **Assistente de IA** (ícone de brilhos): descreva a mudança ("deixe o título maior e centralizado"); ele aplica como **um passo** no histórico — **Desfazer** reverte tudo. Ele pode adicionar, alterar e remover textos e colunas, mudar estilos e vincular campos; não altera os dados do sistema.

---

## 8. Dicas

1. Comece pelos **blocos** (cabeçalho, lista, fechamento) e só depois ajuste os elementos.
2. Use **Campos** para conferir quais campos cada texto usa; **Dados** para ver o resultado.
3. Dê **nomes** claros aos elementos importantes (campo *Nome do elemento*) — facilita achar na lista de Camadas.
4. Salve com frequência e use **Histórico** quando quiser voltar atrás.
5. Para documentos longos, use **Manter junto na mesma folha**. Use **Altura automática** em listas e tabelas, não em layouts posicionados à mão.
