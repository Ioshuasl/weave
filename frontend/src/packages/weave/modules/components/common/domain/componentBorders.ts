import type { StyleDeclaration } from '../../../../shared/domain/style';

export type BorderSide = 'top' | 'right' | 'bottom' | 'left';
export const BORDER_SIDES: BorderSide[] = ['top', 'right', 'bottom', 'left'];
export const BORDER_SIDE_KEYS = { top: 'borderTop', right: 'borderRight', bottom: 'borderBottom', left: 'borderLeft' } as const;
export const DEFAULT_BORDER = '1px solid #000000';

export type BorderSides = Partial<Record<BorderSide, string>>;

const isOff = (value: unknown): boolean => value === undefined || value === null || value === '' || String(value).trim().toLowerCase() === 'none';

/**
 * Borda efetiva de cada lado. `border` (atalho dos 4 lados) vale para todos; `borderTop/Right/Bottom/Left` sobrepõem o atalho.
 * Lado desligado = sem chave no resultado.
 */
export function getBorderSides(style: StyleDeclaration | undefined): BorderSides {
  const out: BorderSides = {};
  if (!style) return out;
  const all = isOff(style.border) ? undefined : String(style.border);
  for (const side of BORDER_SIDES) {
    const own = style[BORDER_SIDE_KEYS[side]];
    const value = own === undefined ? all : isOff(own) ? undefined : String(own);
    if (value) out[side] = value;
  }
  return out;
}

/** Algum lado definido à parte (então a borda padrão do componente, ex. a caixa preta de uma forma, não deve voltar por cima) */
export const hasSideBorders = (style: StyleDeclaration | undefined): boolean => BORDER_SIDES.some((side) => style?.[BORDER_SIDE_KEYS[side]] !== undefined);

/**
 * Grava as bordas por lado (`undefined`/'none' desliga o lado) sem mutar o estilo.
 * Se os 4 lados ficam iguais, volta ao atalho `border` (menor e compatível com tudo que já lê `border`);
 * senão grava só os lados ligados e remove o atalho. Nunca deixa atalho e lados juntos.
 */
export function setBorderSides(style: StyleDeclaration | undefined, sides: Partial<Record<BorderSide, string | undefined>>): StyleDeclaration {
  const effective: BorderSides = { ...getBorderSides(style) };
  for (const side of BORDER_SIDES) {
    if (!(side in sides)) continue;
    if (isOff(sides[side])) delete effective[side];
    else effective[side] = String(sides[side]);
  }
  const { border: _border, borderTop: _t, borderRight: _r, borderBottom: _b, borderLeft: _l, ...rest } = (style ?? {}) as StyleDeclaration;
  const values = BORDER_SIDES.map((side) => effective[side]);
  if (values.every((v) => v) && new Set(values).size === 1) return { ...rest, border: values[0] };
  const result: StyleDeclaration = { ...rest };
  for (const side of BORDER_SIDES) if (effective[side]) (result as Record<string, unknown>)[BORDER_SIDE_KEYS[side]] = effective[side];
  return result;
}

/**
 * Normaliza um estilo que acabou de receber um patch cru de `border` e/ou dos lados (ex.: vindo do assistente):
 * - mudou `border`: vale para os 4 lados e apaga os lados (ou apaga tudo, se `border` foi removido);
 * - mudaram só lados: parte da borda efetiva ANTES (o atalho vira 4 lados) e troca só os lados tocados;
 * - mudaram os dois: `border` vira a base dos 4 lados e os lados tocados sobrepõem.
 */
export function mergeBorderPatch(before: StyleDeclaration | undefined, after: StyleDeclaration): StyleDeclaration {
  const changedSides = BORDER_SIDES.filter((side) => before?.[BORDER_SIDE_KEYS[side]] !== after[BORDER_SIDE_KEYS[side]]);
  const borderChanged = before?.border !== after.border;
  if (!borderChanged && !changedSides.length) return after;
  const touched: Partial<Record<BorderSide, string | undefined>> = {};
  for (const side of changedSides) touched[side] = after[BORDER_SIDE_KEYS[side]] as string | undefined;
  if (borderChanged) {
    const base: Partial<Record<BorderSide, string | undefined>> = {};
    for (const side of BORDER_SIDES) base[side] = isOff(after.border) ? undefined : String(after.border);
    const cleared = setBorderSides({ ...after, border: undefined, borderTop: undefined, borderRight: undefined, borderBottom: undefined, borderLeft: undefined }, { ...base, ...touched });
    return cleared;
  }
  return setBorderSides({ ...after, ...Object.fromEntries(changedSides.map((side) => [BORDER_SIDE_KEYS[side], before?.[BORDER_SIDE_KEYS[side]]])) }, touched);
}

/**
 * CSS final das bordas de um componente (para os renderers). Lados sobrepõem o atalho; os 4 lados iguais viram `border`.
 * Devolve SEMPRE as 5 chaves (algumas `undefined`) para neutralizar o que veio no estilo original quando o spread vem antes.
 * `fallback` = borda padrão do tipo (ex.: caixa preta de uma forma), usada só se o estilo não define nenhuma borda.
 */
export function resolveBorderCss(style: StyleDeclaration | undefined, fallback?: string): StyleDeclaration {
  const none: StyleDeclaration = { border: undefined, borderTop: undefined, borderRight: undefined, borderBottom: undefined, borderLeft: undefined };
  const explicitNone = typeof style?.border === 'string' && style.border.trim().toLowerCase() === 'none' && !hasSideBorders(style);
  if (explicitNone) return { ...none, border: 'none' };
  const sides = getBorderSides(style);
  const values = BORDER_SIDES.map((side) => sides[side]);
  if (!values.some(Boolean)) return fallback && !hasSideBorders(style) ? { ...none, border: fallback } : none;
  if (values.every((v) => v) && new Set(values).size === 1) return { ...none, border: values[0] };
  const out = { ...none } as Record<string, unknown>;
  for (const side of BORDER_SIDES) if (sides[side]) out[BORDER_SIDE_KEYS[side]] = sides[side];
  return out as StyleDeclaration;
}

const BORDER_KEYS = ['border', 'borderTop', 'borderRight', 'borderBottom', 'borderLeft'] as const;

/** Estilo sem nenhuma chave de borda (as bordas entram depois, via `resolveBorderCssForRender`). */
export function omitBorderKeys(style: StyleDeclaration | undefined): StyleDeclaration {
  const rest: Record<string, unknown> = { ...(style ?? {}) };
  for (const key of BORDER_KEYS) delete rest[key];
  return rest as StyleDeclaration;
}

/**
 * Bordas para os renderers: só as chaves com valor. O React aplica o `style` na ordem das chaves e `borderTop: undefined`
 * depois de `border: '1px solid …'` limpa o lado que o atalho acabou de definir (a borda sumia). Usar junto com `omitBorderKeys`
 * no spread do estilo, para o estilo original não deixar `border`/lados antes destes.
 */
export function resolveBorderCssForRender(style: StyleDeclaration | undefined, fallback?: string): StyleDeclaration {
  const css = resolveBorderCss(style, fallback) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of BORDER_KEYS) if (css[key] !== undefined) out[key] = css[key];
  return out as StyleDeclaration;
}
