/**
 * Modelo visual de um cálculo: converte a fórmula em português em "cartões" (percentual, soma, regra)
 * e de volta. Fórmulas que não se encaixam em nenhum cartão ficam como `formula` (texto livre).
 */

export type CalculoOperador = '>' | '>=' | '<' | '<=' | '=' | '<>';

export interface CalculoCondicao {
  campo: string;
  operador: CalculoOperador;
  valor: string;
}

export type CalculoModelo =
  | { tipo: 'percentual'; base: string; percentual: string }
  | { tipo: 'soma'; termos: string[] }
  | { tipo: 'regra'; ligacao: 'E' | 'OU'; condicoes: CalculoCondicao[]; entao: string; senao: string }
  | { tipo: 'formula'; formula: string };

export const OPERADORES: { valor: CalculoOperador; rotulo: string }[] = [
  { valor: '>', rotulo: 'é maior que' },
  { valor: '>=', rotulo: 'é maior ou igual a' },
  { valor: '<', rotulo: 'é menor que' },
  { valor: '<=', rotulo: 'é menor ou igual a' },
  { valor: '=', rotulo: 'é igual a' },
  { valor: '<>', rotulo: 'é diferente de' },
];

const PERCENTUAL = /^\s*\[([^\]]+)\]\s*\*\s*(\d+(?:[.,]\d+)?)\s*%\s*$/;
const CONDICAO = /^\s*\[([^\]]+)\]\s*(>=|<=|<>|>|<|=)\s*(\S.*?)\s*$/;

/** Divide por `separator` só fora de parênteses, colchetes e aspas. */
function splitTopLevel(text: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let inQuote = false;
  let inBracket = false;
  let current = '';
  for (const char of text) {
    if (char === '"') inQuote = !inQuote;
    else if (!inQuote && char === '[') inBracket = true;
    else if (!inQuote && char === ']') inBracket = false;
    else if (!inQuote && !inBracket && char === '(') depth += 1;
    else if (!inQuote && !inBracket && char === ')') depth -= 1;
    if (char === separator && depth === 0 && !inQuote && !inBracket) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

function parseCondicao(text: string): CalculoCondicao | null {
  const match = CONDICAO.exec(text);
  return match ? { campo: match[1], operador: match[2] as CalculoOperador, valor: match[3] } : null;
}

export function parseCalculoModelo(formula: string, nomes?: string[]): CalculoModelo {
  const percentual = PERCENTUAL.exec(formula);
  if (percentual) return { tipo: 'percentual', base: percentual[1], percentual: percentual[2] };

  const call = /^\s*SE\s*\(([\s\S]*)\)\s*$/i.exec(formula);
  if (call) {
    const [condicao, entao, senao, ...resto] = splitTopLevel(call[1], ';');
    if (condicao !== undefined && entao !== undefined && senao !== undefined && resto.length === 0) {
      const group = /^\s*(E|OU)\s*\(([\s\S]*)\)\s*$/i.exec(condicao);
      const ligacao = group ? (group[1].toUpperCase() as 'E' | 'OU') : 'E';
      const condicoes = splitTopLevel(group ? group[2] : condicao, ';').map(parseCondicao);
      if (condicoes.every((item): item is CalculoCondicao => item !== null)) {
        return { tipo: 'regra', ligacao, condicoes, entao: entao.trim(), senao: senao.trim() };
      }
    }
  }

  const termos = splitTopLevel(formula, '+').map((termo) => termo.trim());
  const conhecidos = nomes?.map((nome) => nome.trim().toLowerCase());
  const soSoma = termos.every(
    (termo) =>
      termo !== '' &&
      (/^\[[^\]]+\]$/.test(termo) ||
        (conhecidos ? conhecidos.includes(termo.toLowerCase()) : !/[*();"%<>=&]/.test(termo))),
  );
  if (soSoma && formula.trim() !== '') return { tipo: 'soma', termos };

  return { tipo: 'formula', formula };
}

export function buildCalculoFormula(modelo: CalculoModelo): string {
  switch (modelo.tipo) {
    case 'percentual':
      return `[${modelo.base}] * ${modelo.percentual}%`;
    case 'soma':
      return modelo.termos.join(' + ');
    case 'regra': {
      const condicoes = modelo.condicoes.map((item) => `[${item.campo}] ${item.operador} ${item.valor}`);
      const condicao = condicoes.length > 1 ? `${modelo.ligacao}(${condicoes.join('; ')})` : (condicoes[0] ?? '');
      return `SE(${condicao}; ${modelo.entao}; ${modelo.senao})`;
    }
    default:
      return modelo.formula;
  }
}

export const MODELO_PADRAO: Record<CalculoModelo['tipo'], (campo: string) => CalculoModelo> = {
  percentual: (campo) => ({ tipo: 'percentual', base: campo, percentual: '10' }),
  soma: () => ({ tipo: 'soma', termos: [] }),
  regra: (campo) => ({
    tipo: 'regra',
    ligacao: 'E',
    condicoes: [{ campo, operador: '>', valor: '0' }],
    entao: '0',
    senao: '0',
  }),
  formula: () => ({ tipo: 'formula', formula: '' }),
};
