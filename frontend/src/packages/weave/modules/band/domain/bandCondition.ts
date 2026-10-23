export type BandConditionOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'empty'
  | 'notEmpty';

/** Condição "Exibir somente se": a linha da banda (e suas filhas) só entra no relatório quando verdadeira. */
export interface BandCondition {
  field: string;
  operator: BandConditionOperator;
  value?: string;
}

export const BAND_CONDITION_OPERATOR_LABELS: Record<BandConditionOperator, string> = {
  eq: 'é igual a',
  ne: 'é diferente de',
  gt: 'é maior que',
  gte: 'é maior ou igual a',
  lt: 'é menor que',
  lte: 'é menor ou igual a',
  empty: 'está vazio',
  notEmpty: 'está preenchido',
};

export const BAND_CONDITION_OPERATORS_WITHOUT_VALUE: BandConditionOperator[] = ['empty', 'notEmpty'];

function asText(value: unknown): string {
  if (value === undefined || value === null) return '';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function toNumber(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  // pt-BR "1.234,56" -> 1234.56; sem vírgula, o ponto é decimal ("12.5")
  const normalized = trimmed.includes(',') ? trimmed.replace(/\./g, '').replace(',', '.') : trimmed;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Avalia a condição sobre a linha (campos numéricos comparam como número; demais, como texto). */
export function evaluateBandCondition(
  condition: BandCondition | undefined,
  row: Record<string, unknown>
): boolean {
  if (!condition?.field) return true;

  const current = asText(row[condition.field]).trim();
  const expected = (condition.value ?? '').trim();

  switch (condition.operator) {
    case 'empty':
      return current === '';
    case 'notEmpty':
      return current !== '';
    case 'eq':
    case 'ne':
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte': {
      const left = toNumber(current);
      const right = toNumber(expected);
      const numeric = left !== null && right !== null;
      const compare = numeric ? left - right : current.localeCompare(expected, 'pt-BR');
      if (condition.operator === 'eq') return compare === 0;
      if (condition.operator === 'ne') return compare !== 0;
      if (condition.operator === 'gt') return compare > 0;
      if (condition.operator === 'gte') return compare >= 0;
      if (condition.operator === 'lt') return compare < 0;
      return compare <= 0;
    }
    default:
      return true;
  }
}
