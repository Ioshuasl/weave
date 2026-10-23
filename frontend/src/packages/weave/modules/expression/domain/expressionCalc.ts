import { getDataSourceKind, getSingletonRow, type DataSourceCatalog } from '../../data-source/domain';

type CalcValue = number | string;

interface CalcContext {
  row?: Record<string, unknown>;
  data?: Record<string, unknown[]>;
  dataSourceCatalog?: DataSourceCatalog;
}

type Token =
  | { type: 'num'; value: number }
  | { type: 'ref'; value: string }
  | { type: 'str'; value: string }
  | { type: 'op'; value: string };

const TOKEN_PATTERN = /\s*(?:(\d+(?:\.\d+)?)|([A-Za-z_][\w]*(?:\.[\w]+)?)|'([^']*)'|([()+\-*/,]))/y;

const CALC_EXPRESSION_PATTERN = /[()*/+]|\s-\s/;

const MONEY_FORMAT = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function isCalcExpression(key: string): boolean {
  return CALC_EXPRESSION_PATTERN.test(key);
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function tokenize(source: string): Token[] | undefined {
  const tokens: Token[] = [];
  TOKEN_PATTERN.lastIndex = 0;
  while (TOKEN_PATTERN.lastIndex < source.length) {
    if (source.slice(TOKEN_PATTERN.lastIndex).trim() === '') break;
    const match = TOKEN_PATTERN.exec(source);
    if (!match) return undefined;
    if (match[1] !== undefined) tokens.push({ type: 'num', value: Number(match[1]) });
    else if (match[2] !== undefined) tokens.push({ type: 'ref', value: match[2] });
    else if (match[3] !== undefined) tokens.push({ type: 'str', value: match[3] });
    else tokens.push({ type: 'op', value: match[4] });
  }
  return tokens;
}

function resolveRef(ref: string, context: CalcContext): number {
  const [dataset, field] = ref.split('.');
  if (field === undefined) return 0;
  const { row, data, dataSourceCatalog } = context;
  if (data && getDataSourceKind(dataset, data, dataSourceCatalog) === 'singleton') {
    return toNumber(getSingletonRow(data, dataset)?.[field]);
  }
  if (row && row[field] !== undefined) return toNumber(row[field]);
  const first = data?.[dataset]?.[0] as Record<string, unknown> | undefined;
  return toNumber(first?.[field]);
}

function aggregateRef(fn: string, ref: string, context: CalcContext): number {
  const [dataset, field] = ref.split('.');
  const rows = (context.data?.[dataset] ?? []) as Record<string, unknown>[];
  if (fn === 'count') return rows.length;
  return rows.reduce((total, current) => total + toNumber(current[field]), 0);
}

/**
 * Avalia expressões aritméticas dentro de `{...}`: + - * / ( ), números, `dataset.campo`
 * e funções sum(ds.campo), count(ds.campo), round(x, n), money(x), number(x, n), int(x).
 * Retorna `undefined` quando a expressão é inválida (o token original é mantido).
 */
function evaluateTokens(tokens: Token[], context: CalcContext): CalcValue {
  let position = 0;

  const peek = () => tokens[position];
  const take = () => tokens[position++];
  const isOp = (value: string) => peek()?.type === 'op' && peek().value === value;

  const parseExpression = (): CalcValue => {
    let left = parseTerm();
    while (isOp('+') || isOp('-')) {
      const operator = take().value;
      const right = toNumber(parseTerm());
      left = operator === '+' ? toNumber(left) + right : toNumber(left) - right;
    }
    return left;
  };

  const parseTerm = (): CalcValue => {
    let left = parseFactor();
    while (isOp('*') || isOp('/')) {
      const operator = take().value;
      const right = toNumber(parseFactor());
      const base = toNumber(left);
      left = operator === '*' ? base * right : right === 0 ? 0 : base / right;
    }
    return left;
  };

  const parseFactor = (): CalcValue => {
    const token = take();
    if (!token) throw new Error('fim inesperado');
    if (token.type === 'num') return token.value;
    if (token.type === 'str') return token.value;
    if (token.type === 'op' && token.value === '-') return -toNumber(parseFactor());
    if (token.type === 'op' && token.value === '(') {
      const inner = parseExpression();
      if (!isOp(')')) throw new Error('parêntese');
      take();
      return inner;
    }
    if (token.type === 'ref' && isOp('(')) {
      take();
      const fn = token.value;
      const datasetToken = peek();
      if (fn === 'sum' && datasetToken?.type === 'ref' && !datasetToken.value.includes('.')) {
        take();
        if (!isOp(',')) throw new Error('soma por linha');
        take();
        const start = position;
        let depth = 1;
        while (position < tokens.length && depth > 0) {
          const current = take();
          if (current.type === 'op' && current.value === '(') depth += 1;
          if (current.type === 'op' && current.value === ')') depth -= 1;
        }
        if (depth !== 0) throw new Error('parêntese');
        const body = tokens.slice(start, position - 1);
        const rows = (context.data?.[datasetToken.value] ?? []) as Record<string, unknown>[];
        return rows.reduce(
          (total: number, current) =>
            total + toNumber(evaluateTokens(body, { ...context, row: current })),
          0,
        );
      }
      if (fn === 'sum' || fn === 'count') {
        const target = take();
        if (!target || target.type !== 'ref' || !isOp(')')) throw new Error('agregação');
        take();
        return aggregateRef(fn, target.value, context);
      }
      const args: CalcValue[] = [];
      while (!isOp(')')) {
        args.push(parseExpression());
        if (isOp(',')) take();
        if (position >= tokens.length) throw new Error('parêntese');
      }
      take();
      const value = toNumber(args[0]);
      if (fn === 'round') return roundTo(value, args[1] === undefined ? 0 : toNumber(args[1]));
      if (fn === 'int') return Math.trunc(value);
      if (fn === 'money') return MONEY_FORMAT.format(value);
      if (fn === 'number') {
        const decimals = args[1] === undefined ? 0 : toNumber(args[1]);
        return new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(value);
      }
      throw new Error(`função desconhecida: ${fn}`);
    }
    if (token.type === 'ref') return resolveRef(token.value, context);
    throw new Error('token inesperado');
  };

  const result = parseExpression();
  if (position < tokens.length) throw new Error('sobra de tokens');
  return result;
}

export function evaluateCalcExpression(source: string, context: CalcContext): string | undefined {
  const tokens = tokenize(source);
  if (!tokens || tokens.length === 0) return undefined;
  try {
    const result = evaluateTokens(tokens, context);
    return typeof result === 'number' ? String(result) : result;
  } catch {
    return undefined;
  }
}
