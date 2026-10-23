import { getDataSourceKind, getSingletonRow, type DataSourceCatalog } from '../../data-source/domain';

/**
 * Fórmulas em português no estilo do Excel (pt-BR): `=ARREDONDAR([valor] * 2%; 2)`.
 * Sem `eval`: o texto é convertido em uma árvore e avaliado aqui.
 */

export type FormulaValue = number | string | boolean;

export interface FormulaContext {
  row?: Record<string, unknown>;
  data?: Record<string, unknown[]>;
  dataSourceCatalog?: DataSourceCatalog;
}

export class FormulaError extends Error {
  suggestion?: string;

  constructor(message: string, suggestion?: string) {
    super(message);
    this.suggestion = suggestion;
  }
}

type Node =
  | { kind: 'num'; value: number }
  | { kind: 'str'; value: string }
  | { kind: 'ref'; name: string }
  | { kind: 'neg'; operand: Node }
  | { kind: 'pct'; operand: Node }
  | { kind: 'bin'; op: string; left: Node; right: Node }
  | { kind: 'call'; fn: string; args: Node[] };

type Token =
  | { type: 'num'; value: number }
  | { type: 'str'; value: string }
  | { type: 'ref'; value: string }
  | { type: 'id'; value: string }
  | { type: 'op'; value: string };

const TOKEN_PATTERN =
  /\s*(?:(\d+(?:[.,]\d+)?)|"([^"]*)"|\[([^\]]+)\]|([A-Za-zÀ-ÿ_][\wÀ-ÿ]*(?:\.[\wÀ-ÿ]+)?)|(<=|>=|<>|[()+\-*/%;&=<>]))/y;

const FUNCTION_NAMES = [
  'SOMA',
  'TOTAL',
  'CONTAR',
  'ARREDONDAR',
  'TRUNCAR',
  'MOEDA',
  'NUMERO',
  'MINIMO',
  'MAXIMO',
  'ABS',
  'SE',
  'E',
  'OU',
  'NAO',
  'ERRO',
];

const MONEY_FORMAT = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function normalizeFunctionName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase();
}

export function isFormulaFunctionName(name: string): boolean {
  return FUNCTION_NAMES.includes(normalizeFunctionName(name));
}

export function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value !== 'string') return 0;
  const text = value.trim();
  const parsed = Number(text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isNumeric(value: unknown): boolean {
  if (typeof value === 'number') return true;
  if (typeof value !== 'string') return false;
  const text = value.trim();
  if (text === '') return false;
  return Number.isFinite(Number(text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text));
}

/** Arredonda meia-casa para cima de forma decimal exata (254,785 → 254,79), sem o erro do ponto flutuante. */
function roundTo(value: number, decimals: number): number {
  const absolute = Number(Math.abs(value).toPrecision(12));
  const shifted = `${absolute}e${decimals}`;
  if (shifted.includes('e-') || /e.*e/.test(shifted)) {
    const factor = 10 ** decimals;
    return Math.sign(value) * (Math.round((absolute + Number.EPSILON) * factor) / factor);
  }
  return Math.sign(value) * Number(`${Math.round(Number(shifted))}e-${decimals}`);
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  TOKEN_PATTERN.lastIndex = 0;
  while (TOKEN_PATTERN.lastIndex < source.length) {
    if (source.slice(TOKEN_PATTERN.lastIndex).trim() === '') break;
    const start = TOKEN_PATTERN.lastIndex;
    const match = TOKEN_PATTERN.exec(source);
    if (!match) {
      throw new FormulaError(`Não entendi o trecho "${source.slice(start).trim().slice(0, 20)}".`);
    }
    if (match[1] !== undefined) tokens.push({ type: 'num', value: Number(match[1].replace(',', '.')) });
    else if (match[2] !== undefined) tokens.push({ type: 'str', value: match[2] });
    else if (match[3] !== undefined) tokens.push({ type: 'ref', value: match[3].trim() });
    else if (match[4] !== undefined) tokens.push({ type: 'id', value: match[4] });
    else tokens.push({ type: 'op', value: match[5] });
  }
  return tokens;
}

const COMPARISON_OPERATORS = new Set(['=', '<>', '<', '>', '<=', '>=']);

function parse(source: string): Node {
  const tokens = tokenize(source);
  if (tokens.length === 0) throw new FormulaError('A fórmula está vazia.');
  let position = 0;

  const peek = () => tokens[position];
  const isOp = (value: string) => peek()?.type === 'op' && peek().value === value;
  const take = (): Token => {
    const token = tokens[position];
    if (!token) throw new FormulaError('A fórmula terminou antes do esperado.');
    position += 1;
    return token;
  };
  const expectOp = (value: string, message: string) => {
    if (!isOp(value)) throw new FormulaError(message);
    position += 1;
  };

  const parseComparison = (): Node => {
    let left = parseConcat();
    while (peek()?.type === 'op' && COMPARISON_OPERATORS.has(String(peek().value))) {
      const op = String(take().value);
      left = { kind: 'bin', op, left, right: parseConcat() };
    }
    return left;
  };

  const parseConcat = (): Node => {
    let left = parseSum();
    while (isOp('&')) {
      position += 1;
      left = { kind: 'bin', op: '&', left, right: parseSum() };
    }
    return left;
  };

  const parseSum = (): Node => {
    let left = parseProduct();
    while (isOp('+') || isOp('-')) {
      const op = String(take().value);
      left = { kind: 'bin', op, left, right: parseProduct() };
    }
    return left;
  };

  const parseProduct = (): Node => {
    let left = parseUnary();
    while (isOp('*') || isOp('/')) {
      const op = String(take().value);
      left = { kind: 'bin', op, left, right: parseUnary() };
    }
    return left;
  };

  const parseUnary = (): Node => {
    if (isOp('-')) {
      position += 1;
      return { kind: 'neg', operand: parseUnary() };
    }
    if (isOp('+')) {
      position += 1;
      return parseUnary();
    }
    return parsePostfix();
  };

  const parsePostfix = (): Node => {
    let node = parsePrimary();
    while (isOp('%')) {
      position += 1;
      node = { kind: 'pct', operand: node };
    }
    return node;
  };

  const parsePrimary = (): Node => {
    const token = take();
    if (token.type === 'num') return { kind: 'num', value: token.value };
    if (token.type === 'str') return { kind: 'str', value: token.value };
    if (token.type === 'ref') return { kind: 'ref', name: token.value };
    if (token.type === 'op' && token.value === '(') {
      const inner = parseComparison();
      expectOp(')', 'Faltou fechar um parêntese ")".');
      return inner;
    }
    if (token.type === 'id') {
      if (isOp('(')) {
        position += 1;
        const args: Node[] = [];
        if (!isOp(')')) {
          args.push(parseComparison());
          while (isOp(';')) {
            position += 1;
            args.push(parseComparison());
          }
        }
        expectOp(')', `Faltou fechar o parêntese da função ${token.value.toUpperCase()}.`);
        return { kind: 'call', fn: normalizeFunctionName(token.value), args };
      }
      return { kind: 'ref', name: token.value };
    }
    throw new FormulaError(`Não esperava "${token.value}" aqui.`);
  };

  const result = parseComparison();
  if (position < tokens.length) {
    const extra = tokens[position];
    throw new FormulaError(
      `Não esperava "${extra.value}" aqui. Falta um operador (+, -, *, /) ou um ";" entre os valores?`,
    );
  }
  return result;
}

const parsedCache = new Map<string, Node>();

function parseCached(source: string): Node {
  const cached = parsedCache.get(source);
  if (cached) return cached;
  const node = parse(source);
  if (parsedCache.size > 500) parsedCache.clear();
  parsedCache.set(source, node);
  return node;
}

interface EvalState {
  context: FormulaContext;
  row?: Record<string, unknown>;
  totalMode: boolean;
}

function listDatasetRows(name: string, state: EvalState): Record<string, unknown>[] {
  return (state.context.data?.[name] ?? []) as Record<string, unknown>[];
}

function findDatasetByField(field: string, state: EvalState, wantList: boolean): string | undefined {
  const { data, dataSourceCatalog } = state.context;
  if (!data) return undefined;
  for (const [dataset, rows] of Object.entries(data)) {
    if (!Array.isArray(rows) || rows.length === 0) continue;
    const first = rows[0];
    if (typeof first !== 'object' || first === null || !(field in first)) continue;
    const isList = getDataSourceKind(dataset, data, dataSourceCatalog) === 'list';
    if (isList === wantList) return dataset;
  }
  return undefined;
}

function suggestName(name: string, candidates: string[]): string | undefined {
  const target = name.toLowerCase();
  let best: { value: string; distance: number } | undefined;
  for (const candidate of candidates) {
    const other = candidate.toLowerCase();
    const previous = Array.from({ length: other.length + 1 }, (_, index) => index);
    for (let i = 1; i <= target.length; i += 1) {
      let diagonal = previous[0];
      previous[0] = i;
      for (let j = 1; j <= other.length; j += 1) {
        const above = previous[j];
        previous[j] = Math.min(
          previous[j] + 1,
          previous[j - 1] + 1,
          diagonal + (target[i - 1] === other[j - 1] ? 0 : 1),
        );
        diagonal = above;
      }
    }
    const distance = previous[other.length];
    if (distance <= Math.max(2, Math.floor(target.length / 3)) && (!best || distance < best.distance)) {
      best = { value: candidate, distance };
    }
  }
  return best?.value;
}

function knownFields(state: EvalState): string[] {
  const fields = new Set<string>();
  for (const rows of Object.values(state.context.data ?? {})) {
    const first = Array.isArray(rows) ? rows[0] : undefined;
    if (typeof first === 'object' && first !== null) Object.keys(first).filter((key) => !key.startsWith('__')).forEach((key) => fields.add(key));
  }
  return [...fields];
}

function readField(name: string, state: EvalState): unknown {
  const [datasetOrField, explicitField] = name.includes('.') ? name.split('.') : [name, undefined];
  const field = explicitField ?? datasetOrField;
  const { data, dataSourceCatalog } = state.context;

  if (explicitField !== undefined && data?.[datasetOrField]) {
    const kind = getDataSourceKind(datasetOrField, data, dataSourceCatalog);
    if (kind === 'singleton') return getSingletonRow(data, datasetOrField)?.[field];
    if (state.row && field in state.row) return state.row[field];
    return listDatasetRows(datasetOrField, state)[0]?.[field];
  }

  if (state.row && field in state.row) return state.row[field];
  const singleton = findDatasetByField(field, state, false);
  if (singleton) return getSingletonRow(data ?? {}, singleton)?.[field];
  const list = findDatasetByField(field, state, true);
  if (list) return listDatasetRows(list, state)[0]?.[field];

  const suggestion = suggestName(field, knownFields(state));
  throw new FormulaError(
    `O campo [${name}] não existe.`,
    suggestion ? `Você quis dizer [${suggestion}]?` : undefined,
  );
}

function referencedField(node: Node): string | undefined {
  if (node.kind === 'ref') return node.name.includes('.') ? node.name.split('.')[1] : node.name;
  if (node.kind === 'neg' || node.kind === 'pct') return referencedField(node.operand);
  if (node.kind === 'bin') return referencedField(node.left) ?? referencedField(node.right);
  if (node.kind === 'call') {
    for (const arg of node.args) {
      const found = referencedField(arg);
      if (found) return found;
    }
  }
  return undefined;
}

function datasetRowsForNode(node: Node, state: EvalState): Record<string, unknown>[] {
  const ref = node.kind === 'ref' ? node.name : undefined;
  if (ref?.includes('.')) return listDatasetRows(ref.split('.')[0], state);
  const field = referencedField(node);
  const dataset = field
    ? (findDatasetByField(field, state, true) ?? findDatasetByField(field, state, false))
    : undefined;
  if (!dataset) {
    throw new FormulaError(
      'Não encontrei a lista de dados desse cálculo. Use um campo de uma lista, por exemplo SOMA([valor_emolumento]).',
    );
  }
  return listDatasetRows(dataset, state);
}

function evaluate(node: Node, state: EvalState): FormulaValue {
  switch (node.kind) {
    case 'num':
    case 'str':
      return node.value;
    case 'ref': {
      if (state.totalMode) {
        const rows = datasetRowsForNode(node, state);
        const field = node.name.includes('.') ? node.name.split('.')[1] : node.name;
        return rows.reduce((total: number, current) => total + toNumber(current[field]), 0);
      }
      const value = readField(node.name, state);
      if (typeof value === 'number' || typeof value === 'boolean') return value;
      if (isNumeric(value)) return toNumber(value);
      return typeof value === 'string' ? value : '';
    }
    case 'neg':
      return -toNumber(evaluate(node.operand, state));
    case 'pct':
      return toNumber(evaluate(node.operand, state)) / 100;
    case 'bin': {
      const left = evaluate(node.left, state);
      const right = evaluate(node.right, state);
      if (node.op === '&') return `${String(left)}${String(right)}`;
      if (COMPARISON_OPERATORS.has(node.op)) {
        const numeric = isNumeric(left) && isNumeric(right);
        const a = numeric ? toNumber(left) : String(left).toLowerCase();
        const b = numeric ? toNumber(right) : String(right).toLowerCase();
        if (node.op === '=') return a === b;
        if (node.op === '<>') return a !== b;
        if (node.op === '<') return a < b;
        if (node.op === '>') return a > b;
        if (node.op === '<=') return a <= b;
        return a >= b;
      }
      const a = toNumber(left);
      const b = toNumber(right);
      if (node.op === '+') return a + b;
      if (node.op === '-') return a - b;
      if (node.op === '*') return a * b;
      if (b === 0) throw new FormulaError('Divisão por zero.');
      return a / b;
    }
    case 'call':
      return evaluateCall(node, state);
  }
}

function requireArgs(node: Extract<Node, { kind: 'call' }>, min: number, max: number, usage: string) {
  if (node.args.length < min || node.args.length > max) {
    throw new FormulaError(`${node.fn} espera ${usage}.`);
  }
}

function evaluateCall(node: Extract<Node, { kind: 'call' }>, state: EvalState): FormulaValue {
  const arg = (index: number) => evaluate(node.args[index], state);
  switch (node.fn) {
    case 'SOMA': {
      requireArgs(node, 1, 1, 'um valor, por exemplo SOMA([valor_emolumento])');
      const rows = datasetRowsForNode(node.args[0], state);
      return rows.reduce(
        (total: number, current) =>
          total + toNumber(evaluate(node.args[0], { ...state, row: current, totalMode: false })),
        0,
      );
    }
    case 'TOTAL': {
      requireArgs(node, 1, 1, 'um cálculo, por exemplo TOTAL(ISS)');
      return evaluate(node.args[0], { ...state, totalMode: true });
    }
    case 'CONTAR': {
      requireArgs(node, 1, 1, 'um campo, por exemplo CONTAR([nota_fiscal])');
      return datasetRowsForNode(node.args[0], state).length;
    }
    case 'ARREDONDAR':
      requireArgs(node, 1, 2, 'o valor e as casas decimais, por exemplo ARREDONDAR([valor]; 2)');
      return roundTo(toNumber(arg(0)), node.args[1] ? toNumber(arg(1)) : 0);
    case 'TRUNCAR': {
      requireArgs(node, 1, 2, 'o valor e as casas decimais');
      const factor = 10 ** (node.args[1] ? toNumber(arg(1)) : 0);
      return Math.trunc(toNumber(arg(0)) * factor) / factor;
    }
    case 'MOEDA':
      requireArgs(node, 1, 1, 'um valor, por exemplo MOEDA([valor])');
      return MONEY_FORMAT.format(toNumber(arg(0)));
    case 'NUMERO': {
      requireArgs(node, 1, 2, 'o valor e as casas decimais');
      const decimals = node.args[1] ? toNumber(arg(1)) : 0;
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(toNumber(arg(0)));
    }
    case 'MINIMO':
      requireArgs(node, 1, 20, 'ao menos um valor');
      return Math.min(...node.args.map((_, index) => toNumber(arg(index))));
    case 'MAXIMO':
      requireArgs(node, 1, 20, 'ao menos um valor');
      return Math.max(...node.args.map((_, index) => toNumber(arg(index))));
    case 'ABS':
      requireArgs(node, 1, 1, 'um valor');
      return Math.abs(toNumber(arg(0)));
    case 'SE': {
      requireArgs(node, 2, 3, 'a condição, o valor se verdadeiro e o valor se falso');
      const condition = arg(0);
      const truthy = typeof condition === 'boolean' ? condition : toNumber(condition) !== 0;
      if (truthy) return arg(1);
      return node.args[2] ? arg(2) : 0;
    }
    case 'E':
      requireArgs(node, 1, 20, 'ao menos uma condição');
      return node.args.every((_, index) => arg(index) === true || (arg(index) !== false && toNumber(arg(index)) !== 0));
    case 'OU':
      requireArgs(node, 1, 20, 'ao menos uma condição');
      return node.args.some((_, index) => arg(index) === true || (arg(index) !== false && toNumber(arg(index)) !== 0));
    case 'NAO':
      requireArgs(node, 1, 1, 'uma condição');
      return !(arg(0) === true || (arg(0) !== false && toNumber(arg(0)) !== 0));
    case 'ERRO':
      throw new FormulaError(String(node.args[0] ? arg(0) : 'Erro no cálculo.'));
    default: {
      const suggestion = suggestName(node.fn, FUNCTION_NAMES);
      throw new FormulaError(
        `A função ${node.fn} não existe.`,
        suggestion ? `Você quis dizer ${suggestion}?` : undefined,
      );
    }
  }
}

export function formatFormulaResult(value: FormulaValue): string {
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'string') return value;
  const rounded = roundTo(value, 10);
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2, useGrouping: false }).format(rounded);
}

/** Avalia o texto de uma fórmula (sem o `=` inicial) e devolve o valor ou lança `FormulaError`. */
export function evaluateFormula(formula: string, context: FormulaContext): FormulaValue {
  const node = parseCached(formula);
  return evaluate(node, { context, row: context.row, totalMode: false });
}

export type FormulaCheck = { ok: true; preview: string } | { ok: false; message: string; suggestion?: string };

/** Valida uma fórmula e devolve a prévia (ou a mensagem de erro em português). */
export function checkFormula(formula: string, context: FormulaContext): FormulaCheck {
  try {
    return { ok: true, preview: formatFormulaResult(evaluateFormula(formula, context)) };
  } catch (error) {
    if (error instanceof FormulaError) {
      return { ok: false, message: error.message, suggestion: error.suggestion };
    }
    return { ok: false, message: 'Não consegui calcular esta fórmula.' };
  }
}
