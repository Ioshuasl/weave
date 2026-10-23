# Montando um Instrumento de Protesto do zero

Neste passo a passo você vai criar, do zero, um **Instrumento de Protesto** de uma folha: cabeçalho com brasão e dados do cartório, quadro com os dados do título, texto corrido com campos, devedores, selo com QR Code e rodapé. Ao final, o documento é gerado **uma folha para cada título protestado**.

- **Tempo:** cerca de 40 minutos.
- **Antes de começar:** leia a seção 1 do *Guia dos elementos* (blocos, elementos, campos). Se tiver dúvida sobre algum campo do painel, consulte o guia.
- **Resultado:** uma versão didática do modelo **Instrumento - Protesto** da Biblioteca. No final, abra o modelo da Biblioteca ao lado do seu para comparar.

> **A ideia central:** o Weave desenha **um bloco por registro**. Aqui, o bloco é "um título protestado" e ocupa a folha inteira; como o sistema entrega vários títulos, o Weave repete o bloco, uma folha para cada.

---

## Passo 1 — Preparar os dados de exemplo

O sistema onde o Weave roda fornece os dados reais. Para montar o layout, você usa **dados de exemplo**: o documento fica com a aparência que terá de verdade.

1. Em **Meus modelos**, clique em **Novo modelo**, dê o nome **Instrumento de Protesto (treino)** e clique em **Criar modelo**.
2. Na página do modelo, aba **Dados de exemplo**, clique em **Novo conjunto de dados**.
3. Dê o nome **Exemplo** e mude o modo para **Avançado (JSON)**.
4. Cole o JSON abaixo e clique em **Salvar dados**.

```json
{
  "cartorio": [
    {
      "estado": "ESTADO DE GOIÁS",
      "denominacao": "1º Tabelionato de Protesto de Títulos de Goiânia",
      "cidade": "Goiânia", "uf": "GO", "titular": "Carlos Almeida", "logo": ""
    }
  ],
  "instrumentos": [
    {
      "livro_letra": "A", "livro_numero": "45", "folha": "120",
      "tipo_protesto": "por falta de pagamento",
      "apresentacao_dia": "20", "apresentacao_mes": "outubro", "apresentacao_ano": "2026",
      "apresentante": "Banco Exemplo S/A",
      "sacador_completo": "Comercial Beta Ltda - CNPJ 11.222.333/0001-44",
      "data_distribuicao": "20/10/2026", "numero_apontamento": "88121", "data_apontamento": "20/10/2026",
      "motivo": "Falta de pagamento", "natureza": "Duplicata Mercantil",
      "numero_titulo": "DM-2026/001", "data_emissao": "15/09/2026", "data_vencimento": "10/10/2026",
      "valor_titulo": "R$ 12.500,00", "valor_protesto": "R$ 12.819,00",
      "selo": "ABC12345-6", "selo_url": "https://selo.exemplo.gov.br/consulta/ABC123456",
      "assinante": "Carlos Almeida",
      "devedores": [
        { "nome": "Empresa Alfa Ltda", "documento": "CNPJ 33.444.555/0001-66", "endereco": "Rua das Acácias, 45 - Goiânia/GO" }
      ]
    },
    {
      "livro_letra": "A", "livro_numero": "45", "folha": "121",
      "tipo_protesto": "por falta de pagamento",
      "apresentacao_dia": "20", "apresentacao_mes": "outubro", "apresentacao_ano": "2026",
      "apresentante": "Fomento Exemplo Ltda",
      "sacador_completo": "Distribuidora Gama S/A - CNPJ 55.666.777/0001-88",
      "data_distribuicao": "20/10/2026", "numero_apontamento": "88122", "data_apontamento": "20/10/2026",
      "motivo": "Falta de pagamento", "natureza": "Nota Promissória",
      "numero_titulo": "NP-2026/044", "data_emissao": "15/09/2026", "data_vencimento": "10/10/2026",
      "valor_titulo": "R$ 4.800,00", "valor_protesto": "R$ 4.968,50",
      "selo": "ABC12346-7", "selo_url": "https://selo.exemplo.gov.br/consulta/ABC123467",
      "assinante": "Carlos Almeida",
      "devedores": [
        { "nome": "João da Silva Pereira", "documento": "CPF 123.456.789-00", "endereco": "Rua das Flores, 120 - Goiânia/GO" },
        { "nome": "Maria Souza Pereira", "documento": "CPF 987.654.321-00", "endereco": "Rua das Flores, 120 - Goiânia/GO" }
      ]
    }
  ]
}
```

> **Por que dois títulos?** Com mais de um registro, o Weave entende `instrumentos` como uma **lista** e repete o bloco. Com apenas um, ele trata como "Dados gerais". O segundo título também tem **dois devedores**, para testar a lista aninhada.

5. Volte à página do modelo e clique em **Abrir editor**. Na barra da esquerda, em **Dados do relatório**, você deve ver:
   - **Dados gerais:** `cartorio`
   - **Registros:** `instrumentos` (com a lista `devedores` dentro dele)

---

## Passo 2 — Configurar a folha

1. Clique na folha vazia (fora de qualquer elemento) para abrir **Propriedades da página**.
2. **Tamanho da folha:** *A4 retrato*.
3. **Margens:** deixe cerca de **0,5 cm** (≈ 20 px) nos quatro lados. A área útil fica com **754 × 1083 px**.

---

## Passo 3 — Criar o bloco do instrumento

1. Em **Elementos**, clique em **Lista de registros**. Um bloco é criado na folha.
2. No painel da direita, em **Uma linha para cada…**, escolha **instrumentos**.
3. Renomeie o bloco para **Instrumento (um por folha)**.
4. Abra **Posição e tamanho** e preencha: **X** `0`, **Y** `0`, **Largura** `754`, **Altura** `1070`.

5. No painel, abra **Avançado** e **desligue "Altura automática (quebra de texto)"**. Um bloco novo vem com ela ligada; nesse modo o Weave estica cada elemento até a altura do bloco e as caixas com borda ficam desformadas no documento. Como você vai posicionar cada elemento à mão, ela deve ficar desligada.

O bloco passa a ocupar a folha inteira. Tudo que você colocar dentro dele se repete **para cada título**.

> **Dica:** deixe o bloco selecionado enquanto cria os textos; é nele que **Texto** e **Imagem** são colocados. Se você criar um texto sem bloco selecionado, ele vira um *elemento solto* e fica fora do bloco.
> **Dica 2:** um bloco novo já vem ligado a uma lista (a primeira da fonte, por exemplo `devedores`). Troque para `instrumentos` antes de criar os textos.

---

## Passo 4 — Cabeçalho: brasão e dados do cartório

### 4.1 Logotipo
1. Com o bloco selecionado, clique em **Imagem**.
2. No painel, em **Ou usar uma imagem dos dados**, escolha **cartorio · Logo**.
3. Posição e tamanho: **X** `28`, **Y** `14`, **Largura** `80`, **Altura** `84`.

*(Nos dados de exemplo a logo está vazia, então aparece "Sem imagem". No sistema real a imagem do cartório será exibida.)*

### 4.2 Texto do cabeçalho
1. Clique em **Texto**, depois em **Editar texto** (ou duplo clique / `F2`).
2. Digite o texto abaixo. Para inserir um campo, digite `{` ou clique no campo à direita (aba **Campos de dados**):

```
REPÚBLICA FEDERATIVA DO BRASIL
{cartorio.estado}
{cartorio.denominacao}
{cartorio.cidade} - {cartorio.uf}
```

3. Clique em **Salvar** do editor. Na **Aparência**: **Tamanho** `12`, **Alinhamento** *centro*.
4. Posição: **X** `118`, **Y** `14`, **Largura** `360`, **Altura** `84`.

---

## Passo 5 — Caixinhas "Tipo / Livro / Página"

Use **textos com borda** como células de uma tabela. Cada célula é um texto pequeno.

1. Crie um texto com `TIPO`. Em **Aparência**: **Tamanho** `9`, **Alinhamento** *centro*. Em **Aparência → Bordas**, clique em **Todas** (liga os quatro lados; cada lado também tem sua chave: Superior, Direita, Inferior, Esquerda).
2. Abra a seção **Posição e espaçamento** (fica recolhida, abaixo de *Aparência*) e preencha: **X** `492`, **Y** `14`, **Largura** `58`, **Altura** `17`.
3. Selecione-o e **duplique** (`Ctrl/Cmd+D`) duas vezes. Ajuste os duplicados:

| Texto | X | Y | Largura | Altura |
|---|---|---|---|---|
| `TIPO` | 492 | 14 | 58 | 17 |
| `LIVRO` | 549 | 14 | 83 | 17 |
| `PÁGINA` | 632 | 14 | 83 | 17 |

4. Duplique a fila inteira (selecione os três com `Shift+clique`, `Ctrl/Cmd+D`), mova para **Y** `30` e troque o conteúdo pelos campos:

| Texto | Conteúdo | X | Y | Largura | Altura |
|---|---|---|---|---|---|
| célula 1 | `{instrumentos.livro_letra}` | 492 | 30 | 58 | 17 |
| célula 2 | `{instrumentos.livro_numero}` | 549 | 30 | 83 | 17 |
| célula 3 | `{instrumentos.folha}` | 632 | 30 | 83 | 17 |

> **Dica:** as células encostam umas nas outras (a diferença de 1 px entre uma e outra evita bordas duplas). Use `Shift` ao arrastar se o encaixe atrapalhar.

---

## Passo 6 — Título e texto corrido

### 6.1 Título
1. Texto `INSTRUMENTO DE PROTESTO`: **Tamanho** `16`, **Alinhamento** *centro*, **X** `0`, **Y** `128`, **Largura** `714`, **Altura** `22`.

### 6.2 Parágrafo com campos misturados
1. Novo texto, **Editar texto**:

```
Saibam quantos, este público instrumento de protesto bastante virem que, aos {instrumentos.apresentacao_dia} dias do mês de {instrumentos.apresentacao_mes} de {instrumentos.apresentacao_ano}, neste {cartorio.denominacao}, em cartório compareceu o representante {instrumentos.apresentante} e me apresentou para ser apontado e depois protestado {instrumentos.tipo_protesto}, o título cujas características são:
```

2. **Tamanho** `11`, **Alinhamento** *justificado*. **X** `0`, **Y** `158`, **Largura** `714`, **Altura** `66`.

> **Boa prática:** se uma parte do texto precisar de destaque, selecione-a no editor e use **negrito** ou mude a cor só daquele trecho.

---

## Passo 7 — Quadro com os dados do título

Esse quadro é feito de textos com borda, como no passo 5. Para cada célula use **Tamanho** `8` nos rótulos e `9` nos valores, **Alinhamento** *centro* e **Bordas** ligadas.

**Linha de rótulos** (Y `236`, Altura `27`) e **linha de valores** (Y `262`, Altura `21`):

| Rótulo | Valor | X | Largura |
|---|---|---|---|
| `DATA DA DISTRIBUIÇÃO` | `{instrumentos.data_distribuicao}` | 0 | 96 |
| `NÚMERO E DATA DO PROTOCOLO` | `{instrumentos.numero_apontamento} - {instrumentos.data_apontamento}` | 95 | 124 |
| `MOTIVO DO PROTESTO` | `{instrumentos.motivo}` | 218 | 105 |
| `TIPO DE DOCUMENTO` | `{instrumentos.natureza}` | 322 | 393 |

**Apresentante e sacador** (rótulo à esquerda, valor à direita):

| Texto | X | Y | Largura | Altura |
|---|---|---|---|---|
| `APRESENTANTE` | 0 | 320 | 105 | 26 |
| `{instrumentos.apresentante}` (alinhado à esquerda) | 104 | 320 | 611 | 26 |
| `SACADOR` | 0 | 345 | 105 | 40 |
| `{instrumentos.sacador_completo}` (à esquerda) | 104 | 345 | 611 | 40 |

> **Atalho:** monte a primeira célula do rótulo e do valor, depois **duplique** e **arraste para o lado**; ajuste o conteúdo e a largura de cada uma.

---

## Passo 8 — Devedores (lista dentro do registro)

Cada título pode ter **um ou mais devedores**. Em vez de criar um bloco novo, use a lista aninhada no próprio texto.

1. Crie dois cabeçalhos: `DEVEDOR(ES)` (**X** `0`, **Y** `384`, **Largura** `474`, **Altura** `19`) e `DOCUMENTOS DE IDENTIFICAÇÃO` (**X** `474`, **Largura** `242`). Alinhamento à esquerda, tamanho `9`, borda ligada.
2. Crie o texto da esquerda (**X** `0`, **Y** `402`, **Largura** `474`, **Altura** `150`, borda ligada):

```
{devedores.nome}
{devedores.endereco}
```

3. Crie o texto da direita (**X** `474`, **Y** `402`, **Largura** `242`, **Altura** `150`, borda ligada):

```
{devedores.documento}
```

4. Abra **Visualizar** e confira: o primeiro título mostra **um** devedor; o segundo mostra **dois**, um embaixo do outro.

> **Como funciona:** `devedores` é uma lista dentro de `instrumentos`. Quando um texto usa campos dessa lista, o Weave **repete o texto uma vez por devedor** do título atual (separados por quebra de linha).
> **Atenção à altura:** cada devedor acrescenta linhas. Dê altura de sobra à caixa (aqui, `150`); texto que passa da altura do elemento é cortado.
> **Se preferir** uma linha por devedor com linhas divisórias, use uma **Lista de registros** com **Dentro de outra lista** (guia dos elementos, item 3.2).

---

## Passo 9 — Selo eletrônico e QR Code

1. Crie um **texto vazio** (apague o conteúdo padrão) com **Bordas → Todas**, em **X** `0`, **Y** `566`, **Largura** `714`, **Altura** `86`. Ele é o quadro do selo.
   *(Uma **Forma** também serve, mas ela vem com fundo cinza e borda; se usar, troque a **Cor de preenchimento** para branco ou transparente.)*
2. Abra **Mais elementos** e clique em **QR Code**. No painel: **O que o QR Code contém → Ou usar uma informação dos dados → instrumentos · Selo url**. Posição: **X** `19`, **Y** `574`, **Largura** `66`, **Altura** `70`.
3. Crie um texto, centralizado, tamanho `9`, borda ligada, **X** `417`, **Y** `574`, **Largura** `275`, **Altura** `70`:

```
**Poder Judiciário do Estado de Goiás**
**Selo Eletrônico de Fiscalização**
{instrumentos.selo}
Consulte esse selo em {instrumentos.selo_url}
```

> Cada título tem um selo diferente: o QR Code muda de registro para registro.

---

## Passo 10 — Informações e assinatura

1. Texto `INFORMAÇÃO` (tamanho `10`, borda): **X** `0`, **Y** `652`, **Largura** `714`, **Altura** `60`.
2. Texto `AVERBAÇÃO` (tamanho `10`, borda): **X** `0`, **Y** `711`, **Largura** `181`, **Altura** `94`.
3. Texto de averbação (tamanho `10`, **justificado**, borda): **X** `180`, **Y** `711`, **Largura** `535`, **Altura** `94`:

```
{instrumentos.assinante}. Pelo que, para garantia do credor, digitei o presente Instrumento de Protesto e o subscrevi.
```

4. Aviso legal (tamanho `8`, borda): **X** `0`, **Y** `847`, **Largura** `714`, **Altura** `24`:

```
DOCUMENTO ASSINADO DIGITALMENTE NOS TERMOS DA MP nº 2200-2 de 24/08/2001.
```

---

## Passo 11 — Visualizar, ajustar e salvar

1. Clique em **Visualizar**. Você deve ver **duas folhas**, uma para cada título; o segundo traz dois devedores.
2. Alterne entre **Dados** e **Campos** na folha para conferir o que cada texto usa.
3. Se algo ficar cortado, volte e aumente a **Altura** do texto. (Não ligue **Altura automática** no bloco: ela estica as caixas e desmancha o desenho.)
   Se as caixas aparecerem esticadas ou com linhas atravessando a folha, confira se **Altura automática** está desligada no bloco (Passo 3).
4. Clique em **Salvar** (`Ctrl/Cmd+S`). O topo muda para **Salvo** e uma nova versão entra no **Histórico**.
5. Volte à página do modelo: a **miniatura** foi atualizada. Em **Compartilhar** você pode gerar um link para mostrar o modelo a alguém.

---

## Revisão: o que você aprendeu

| Conceito | Onde apareceu |
|---|---|
| Bloco repetido por registro | Passo 3 (uma folha por título) |
| Campos e texto misturados | Passos 4 e 6 |
| Células com borda | Passos 5, 7 e 8 |
| Lista aninhada | Passo 8 (`devedores`) |
| Imagem e QR Code dos dados | Passos 4 e 9 |
| Duplicar e alinhar | Passos 5 e 7 |
| Visualizar e salvar | Passo 11 |

## Para ir além
- Acrescente o rodapé **Página {sys.pageNumber} de {sys.pageCount}** (*Rodapé da folha*).
- Use **Mostrar só quando…** para um texto aparecer apenas em protestos com valor acima de zero.
- Crie um **Cálculo** (`Valor protestado`) e use `{Valor protestado}` no texto.
- Abra o modelo **Instrumento - Protesto** da **Biblioteca** e compare com o seu: o dele tem todos os quadros (apresentação, custas e demais seções).
- Peça ao **Assistente de IA**: "aumente o título e deixe em negrito".
