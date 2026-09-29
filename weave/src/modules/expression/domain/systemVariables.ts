/**
 * Variáveis de sistema para expressões em runtime (Fase 3.4).
 * Não persistidas no template — resolvidas na renderização / impressão.
 */

export interface SystemVariables {
  /** Página atual no relatório completo (1-based) */
  pageNumber: number;
  /** Total de folhas de saída do relatório */
  pageCount: number;
  /** Página de saída dentro da ReportPage de design ativa */
  outputPageNumber: number;
  /** Total de folhas de saída da ReportPage de design ativa */
  outputPageCount: number;
  reportName?: string;
  /** Data curta (dd/mm/aaaa) */
  date?: string;
  /** Data por extenso */
  dateLong?: string;
  /** Hora curta (HH:mm) */
  time?: string;
  /** Hora por extenso */
  timeLong?: string;
}

/** Placeholders exibidos no canvas em modo design */
export const DESIGN_MODE_SYSTEM_VARIABLES: SystemVariables = {
  pageNumber: 1,
  pageCount: 3,
  outputPageNumber: 1,
  outputPageCount: 3,
  reportName: 'Relatório',
  date: '01/01/2026',
  dateLong: '1 de janeiro de 2026',
  time: '12:00',
  timeLong: '12 horas',
};

const SYSTEM_VARIABLE_KEYS: Record<string, keyof SystemVariables> = {
  'sys.pageNumber': 'pageNumber',
  'sys.pagenumber': 'pageNumber',
  'Page#': 'pageNumber',
  'sys.pageCount': 'pageCount',
  'sys.pagecount': 'pageCount',
  'sys.totalPages': 'pageCount',
  'sys.totalpages': 'pageCount',
  'TotalPages#': 'pageCount',
  'sys.outputPageNumber': 'outputPageNumber',
  'sys.outputpagenumber': 'outputPageNumber',
  'sys.outputPageCount': 'outputPageCount',
  'sys.outputpagecount': 'outputPageCount',
  'sys.reportName': 'reportName',
  'sys.reportname': 'reportName',
  'sys.date': 'date',
  'sys.datelong': 'dateLong',
  'sys.dateLong': 'dateLong',
  'sys.dateextended': 'dateLong',
  'sys.dateExtended': 'dateLong',
  'sys.time': 'time',
  'sys.timelong': 'timeLong',
  'sys.timeLong': 'timeLong',
  'sys.timeextended': 'timeLong',
  'sys.timeExtended': 'timeLong',
};

export function formatSystemDateLong(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatSystemTimeLong(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  const hourLabel = hours === 1 ? '1 hora' : `${hours} horas`;

  if (minutes === 0 && seconds === 0) {
    return hourLabel;
  }

  const parts = [hourLabel];

  if (minutes > 0) {
    parts.push(minutes === 1 ? '1 minuto' : `${minutes} minutos`);
  }

  if (seconds > 0) {
    parts.push(seconds === 1 ? '1 segundo' : `${seconds} segundos`);
  }

  if (parts.length === 1) {
    return parts[0];
  }

  if (parts.length === 2) {
    return `${parts[0]} e ${parts[1]}`;
  }

  return `${parts[0]}, ${parts[1]} e ${parts[2]}`;
}

export function buildSystemVariables(params: {
  globalPageNumber: number;
  globalTotalPages: number;
  outputPageNumber: number;
  outputTotalPages: number;
  reportName?: string;
  generatedAt?: Date;
}): SystemVariables {
  const at = params.generatedAt ?? new Date();

  return {
    pageNumber: params.globalPageNumber,
    pageCount: params.globalTotalPages,
    outputPageNumber: params.outputPageNumber,
    outputPageCount: params.outputTotalPages,
    reportName: params.reportName,
    date: at.toLocaleDateString('pt-BR'),
    dateLong: formatSystemDateLong(at),
    time: at.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    timeLong: formatSystemTimeLong(at),
  };
}

export function resolveSystemVariable(
  key: string,
  sys?: Partial<SystemVariables>
): string | undefined {
  if (!sys) return undefined;

  const field = SYSTEM_VARIABLE_KEYS[key.trim()];
  if (!field) return undefined;

  const value = sys[field];
  if (value === undefined || value === null) return undefined;

  return String(value);
}

export function containsSystemVariables(expression: string): boolean {
  return /\{(sys\.[^}]+|Page#|TotalPages#)\}/i.test(expression);
}

export const SYSTEM_VARIABLE_FIELD_OPTIONS: { label: string; value: string }[] = [
  { label: 'Página atual', value: '{sys.pageNumber}' },
  { label: 'Total de páginas', value: '{sys.pageCount}' },
  { label: 'Página (alias Page#)', value: '{Page#}' },
  { label: 'Total (alias TotalPages#)', value: '{TotalPages#}' },
  { label: 'Nome do relatório', value: '{sys.reportName}' },
  { label: 'Data', value: '{sys.date}' },
  { label: 'Data por extenso', value: '{sys.dateLong}' },
  { label: 'Hora', value: '{sys.time}' },
  { label: 'Hora por extenso', value: '{sys.timeLong}' },
];

/** Subconjunto para inserção rápida de data/hora no painel de propriedades */
export const SYSTEM_DATE_TIME_FIELD_OPTIONS = SYSTEM_VARIABLE_FIELD_OPTIONS.filter((opt) =>
  /sys\.(date|time)/i.test(opt.value)
);
