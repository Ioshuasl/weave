import { checkFormula, isFormulaFunctionName, type FormulaCheck, type FormulaContext } from './formulaPt';

/**
 * Cálculo com nome, guardado no layout (`ReportDefinition.calculos`).
 * A fórmula usa a sintaxe em português (ex.: `[valor_emolumento] * 10%`) e pode citar outros cálculos pelo nome.
 */
export interface ReportCalculo {
  id: string;
  nome: string;
  formula: string;
  /** Arredonda o resultado deste cálculo (padrão: sim). */
  arredondar?: boolean;
  /** Casas decimais do arredondamento (padrão: 2). */
  casas?: number;
  /** Os cálculos citados na fórmula entram sem arredondar; só o resultado final é arredondado. */
  somenteNoFinal?: boolean;
}

const TOKEN_PATTERN = /\{([^}]+)\}/g;
const WORD = 'A-Za-z0-9_À-ÿ';

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildNameMatchers(calculos: ReportCalculo[]) {
  return [...calculos]
    .filter((calculo) => calculo.nome.trim() !== '' && calculo.formula.trim() !== '')
    .sort((a, b) => b.nome.length - a.nome.length)
    .map((calculo) => {
      const nome = escapeRegExp(calculo.nome.trim());
      return {
        calculo,
        pattern: new RegExp(
          `\\[\\s*${nome}\\s*\\]|(?<![${WORD}.\\[])${nome}(?![${WORD}\\]])`,
          'gi',
        ),
      };
    });
}

type Matchers = ReturnType<typeof buildNameMatchers>;

function expandCalculo(calculo: ReportCalculo, matchers: Matchers, stack: string[], raw: boolean): string {
  if (stack.includes(calculo.id)) {
    const nomes = [...stack, calculo.id].map((id) => matchers.find((m) => m.calculo.id === id)?.calculo.nome ?? id);
    throw new Error(`Cálculo circular: ${nomes.join(' → ')}.`);
  }
  const inner = expandText(calculo.formula, matchers, [...stack, calculo.id], raw || calculo.somenteNoFinal === true);
  if (raw || calculo.arredondar === false) return `(${inner})`;
  return `ARREDONDAR((${inner});${calculo.casas ?? 2})`;
}

function expandText(text: string, matchers: Matchers, stack: string[], raw: boolean): string {
  return text
    .split(/("[^"]*")/)
    .map((part, index) => {
      if (index % 2 === 1) return part;
      let result = part;
      for (const { calculo, pattern } of matchers) {
        pattern.lastIndex = 0;
        result = result.replace(pattern, () => expandCalculo(calculo, matchers, stack, raw));
      }
      return result;
    })
    .join('');
}

function looksLikeFormula(body: string): boolean {
  const trimmed = body.trim();
  if (trimmed.startsWith('=') || trimmed.startsWith('[')) return true;
  const call = /^([A-Za-zÀ-ÿ]+)\s*\(/.exec(trimmed);
  return call !== null && isFormulaFunctionName(call[1]);
}

function expandToken(inner: string, matchers: Matchers): string | null {
  const body = inner.trim().replace(/^=\s*/, '');
  try {
    const expanded = expandText(body, matchers, [], false);
    if (!looksLikeFormula(inner) && expanded === body) return null;
    return `=${expanded}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro no cálculo.';
    return `=ERRO("${message.replace(/"/g, "'")}")`;
  }
}

function expandStrings<T>(value: T, matchers: Matchers): T {
  if (typeof value === 'string') {
    if (!value.includes('{')) return value;
    return value.replace(TOKEN_PATTERN, (match: string, inner: string) => {
      const expanded = expandToken(inner, matchers);
      return expanded === null ? match : `{${expanded}}`;
    }) as T;
  }
  if (Array.isArray(value)) return (value as unknown[]).map((item) => expandStrings(item, matchers)) as T;
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, expandStrings(item, matchers)]),
    ) as T;
  }
  return value;
}

/**
 * Troca, em cada `{...}` do layout, os nomes dos cálculos pela fórmula correspondente.
 * É usado só para visualizar/imprimir: o layout salvo continua com os nomes.
 */
export function expandCalculos<R extends { calculos?: ReportCalculo[]; bands: unknown; components: unknown }>(
  report: R,
): R {
  const calculos = report.calculos ?? [];
  if (calculos.length === 0) return report;
  const matchers = buildNameMatchers(calculos);
  return {
    ...report,
    bands: expandStrings(report.bands, matchers),
    components: expandStrings(report.components, matchers),
  };
}

export interface CalculoIssue {
  calculoId: string;
  message: string;
}

/** Aponta cálculos sem nome, com nome repetido ou que dependem de si mesmos. */
export function validateCalculos(calculos: ReportCalculo[]): CalculoIssue[] {
  const issues: CalculoIssue[] = [];
  const names = new Set<string>();
  const matchers = buildNameMatchers(calculos);
  for (const calculo of calculos) {
    const key = calculo.nome.trim().toLowerCase();
    if (key === '') issues.push({ calculoId: calculo.id, message: 'Dê um nome ao cálculo.' });
    else if (names.has(key)) issues.push({ calculoId: calculo.id, message: `Já existe um cálculo chamado "${calculo.nome}".` });
    else if (isFormulaFunctionName(calculo.nome)) {
      issues.push({ calculoId: calculo.id, message: `"${calculo.nome}" é o nome de uma função; escolha outro nome.` });
    }
    names.add(key);
    try {
      expandCalculo(calculo, matchers, [], false);
    } catch (error) {
      issues.push({ calculoId: calculo.id, message: error instanceof Error ? error.message : 'Fórmula inválida.' });
    }
  }
  return issues;
}

export interface CalculoPrevia {
  porLinha: FormulaCheck;
  total: FormulaCheck;
}

/** Calcula a prévia de um cálculo: valor na linha de exemplo e valor sobre o total. */
export function previewCalculo(
  calculo: ReportCalculo,
  calculos: ReportCalculo[],
  context: FormulaContext,
): CalculoPrevia {
  try {
    const expressao = expandCalculo(calculo, buildNameMatchers(calculos), [], false);
    return {
      porLinha: checkFormula(expressao, context),
      total: checkFormula(`TOTAL(${expressao})`, context),
    };
  } catch (error) {
    const erro: FormulaCheck = { ok: false, message: error instanceof Error ? error.message : 'Fórmula inválida.' };
    return { porLinha: erro, total: erro };
  }
}

function nameReplacer(antigo: string, novo: string) {
  const nome = escapeRegExp(antigo.trim());
  const pattern = new RegExp(`\\[\\s*${nome}\\s*\\]|(?<![${WORD}.\\[])${nome}(?![${WORD}\\]])`, 'gi');
  return (text: string) =>
    text
      .split(/("[^"]*")/)
      .map((part, index) => (index % 2 === 1 ? part : part.replace(pattern, (found) => (found.startsWith('[') ? `[${novo}]` : novo))))
      .join('');
}

function renameInTokens<T>(value: T, replace: (text: string) => string): T {
  if (typeof value === 'string') {
    return (value.includes('{') ? value.replace(TOKEN_PATTERN, (_match: string, inner: string) => `{${replace(inner)}}`) : value) as T;
  }
  if (Array.isArray(value)) return (value as unknown[]).map((item) => renameInTokens(item, replace)) as T;
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, renameInTokens(item, replace)]),
    ) as T;
  }
  return value;
}

/** Renomeia um cálculo e atualiza as fórmulas dos outros cálculos e os `{...}` do layout. */
export function renameCalculo<R extends { calculos?: ReportCalculo[]; bands: unknown; components: unknown }>(
  report: R,
  id: string,
  novoNome: string,
): R {
  const calculos = report.calculos ?? [];
  const alvo = calculos.find((calculo) => calculo.id === id);
  if (!alvo || alvo.nome === novoNome) return report;
  const novo = novoNome.trim();
  const replace = alvo.nome.trim() !== '' && novo !== '' ? nameReplacer(alvo.nome, novo) : (text: string) => text;
  return {
    ...report,
    calculos: calculos.map((calculo) =>
      calculo.id === id
        ? { ...calculo, nome: novoNome }
        : { ...calculo, formula: replace(calculo.formula) },
    ),
    bands: renameInTokens(report.bands, replace),
    components: renameInTokens(report.components, replace),
  };
}

/** Nome legível de um token de cálculo (ex.: `MOEDA(SOMA(ISS))` → "ISS (soma das linhas)"); `undefined` se não for um cálculo. */
export function describeCalculoToken(inner: string): string | undefined {
  const body = inner.trim().replace(/^=\s*/, '');
  const soma = /^MOEDA\(\s*SOMA\(\s*([\s\S]+?)\s*\)\s*\)$/i.exec(body);
  if (soma) return `${soma[1]} (soma das linhas)`;
  const total = /^MOEDA\(\s*TOTAL\(\s*([\s\S]+?)\s*\)\s*\)$/i.exec(body);
  if (total) return `${total[1]} (sobre o total)`;
  const valor = /^MOEDA\(\s*([\s\S]+?)\s*\)$/i.exec(body);
  return valor ? valor[1] : undefined;
}
