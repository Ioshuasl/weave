import type { AssistantImage } from './assistantImages';
import type { AssistantUsage } from './assistantUsage';

/** Chave = nome CSS do catálogo (`STYLE_PROPERTIES`); valor sempre texto — o catálogo valida e normaliza. */
export type AssistantStyle = Partial<Record<string, string>>;

export type AssistantAction =
  | { tipo: 'adicionar_texto'; banda_id: string; conteudo: string; estilo?: AssistantStyle }
  | { tipo: 'alterar_texto'; componente_id: string; conteudo: string }
  | { tipo: 'alterar_estilo'; componente_id: string; estilo: AssistantStyle }
  | { tipo: 'vincular_campo'; componente_id: string; fonte: string; campo: string }
  | { tipo: 'adicionar_coluna_tabela'; banda_id: string; campo: string; titulo: string; alinhamento?: 'left' | 'center' | 'right' }
  | { tipo: 'remover_coluna_tabela'; banda_id: string; coluna_id: string }
  | { tipo: 'remover_componente'; componente_id: string }
  | { tipo: 'alterar_propriedade'; componente_id: string | null; banda_id: string | null; propriedade: string; valor: string }
  | { tipo: 'aplicar_estilo_linhas'; estilo: 'nenhum' | 'simples' | 'grade' }
  | { tipo: 'trocar_colunas'; coluna_a: string; coluna_b: string }
  | { tipo: 'mover_coluna'; coluna: string; depois_de: string | null }
  | { tipo: 'alterar_largura_coluna'; coluna: string; largura: number }
  | { tipo: 'alterar_condicao_banda'; banda_id: string; campo: string | null; operador: AssistantConditionOperator; valor: string | null };

export type AssistantConditionOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'empty' | 'notEmpty' | 'remover';

/** Coluna de uma listagem montada com textos lado a lado (cabeçalho + linha de dados alinhados por x/largura). */
export interface AssistantLayoutColumn {
  /** Id do texto da linha de dados — identifica a coluna */
  id: string;
  rotulo: string;
  campo: string;
  banda_id: string;
  x: number;
  largura: number;
  /** Ids de todos os textos que formam a coluna (dados + cabeçalho) */
  componentes: string[];
}

export interface AssistantRequest {
  sessao_id: string;
  pedido: string;
  /** `passo` = executar um passo de um plano já aprovado (a IA não replaneja) */
  modo?: 'normal' | 'passo';
  selecao: { componentes: string[]; bandas: string[] };
  relatorio: {
    bandas: {
      id: string;
      tipo: string;
      nome: string;
      fonte: string;
      /** Banda filha de outra (lista encadeada): `pai` = id da banda pai; `posicao` = onde se encaixa (below, above, beside) */
      vinculo?: { pai: string; posicao: string } | null;
      condicao?: { campo: string; operador: string; valor: string } | null;
      /** Linhas de divisão atuais da banda (`ReportBand.lines`) */
      linhas?: Record<string, unknown> | null;
      colunas: { id: string; campo: string; titulo: string }[];
      componentes: { id: string; tipo: string; nome: string; conteudo: string }[];
    }[];
  };
  campos: { fonte: string; campo: string; rotulo: string }[];
  /** Imagens de referência (já reduzidas). Só vão no pedido em que o usuário as anexa; as etapas de um plano seguem só com texto */
  imagens?: AssistantImage[];
  colunas_layout: { id: string; rotulo: string; campo: string; banda_id: string; x: number; largura: number }[];
}

export interface AssistantResponse {
  mensagem: string;
  acoes: AssistantAction[];
  /** Plano em etapas: quando preenchido, `acoes` vem vazio e o usuário confirma antes de executar */
  passos?: string[];
  /** A IA não teve certeza total: `mensagem` é a pergunta e `acoes` vem vazio (nunca decide sozinha) */
  pergunta?: boolean;
  /** Respostas sugeridas para a pergunta (vazio = resposta livre) */
  opcoes?: string[];
  /** Ações sensíveis (remover, muitos itens): o usuário confirma o resumo antes de aplicar */
  confirmacao?: { resumo: string[]; acoes: AssistantAction[] } | null;
  /** Tokens gastos neste pedido (opcional; o painel só mostra se o host ligar `assistantUsage`) */
  uso?: AssistantUsage | null;
}

/** Envio do pedido ao host (que fala com a API); `null` = falha já tratada pelo host. */
export type AssistantSender = (request: AssistantRequest) => Promise<AssistantResponse | null | undefined>;

export interface AssistantApplyResult {
  applied: number;
  skipped: number;
}
