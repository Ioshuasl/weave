import { getBandLinesColor, getBandLinesThicknessPx, type LineRect, type ReportBand } from '../../band/domain';
import type { PreviewLayer } from './previewTypes';

export interface RegistroSides {
  /** Laterais de cada trecho de registro, em coordenadas da folha (esquerda e direita da caixa que junta as camadas) */
  groups: { color: string; rects: LineRect[] }[];
  /** Camadas cujas laterais PRÓPRIAS não se desenham (o trecho já tem as dele): evita buraco e traços internos */
  suppressSides: Set<string>;
  /** Extensão horizontal do trecho por banda: o preenchimento até o fim da folha segue as mesmas pontas */
  extentByBand: Map<string, { x: number; width: number }>;
}

/**
 * "Laterais" de uma lista cujo registro tem VÁRIAS bandas (pai + filhas ao lado/abaixo, ex.: Protocolo + Pessoas + Lavratura)
 * são as pontas do registro inteiro: uma linha à esquerda e outra à direita da caixa que junta as camadas, do topo da primeira
 * ao fim da última. Cada banda desenhando as suas deixava buracos (a pai é mais baixa que as filhas ao lado) e traços no meio da folha.
 *
 * Laterais na banda PAI valem para o registro inteiro. Sem laterais na pai, entram só as camadas do MESMO registro (`groupKey`) com laterais
 * ligadas e em sequência contínua (uma camada sem laterais no meio quebra o trecho). Trecho de uma banda só continua como antes
 * (cada linha desenha as suas, já contínuas).
 */
export function computeRegistroSides(layers: PreviewLayer[], bands: Record<string, ReportBand>): RegistroSides {
  const result: RegistroSides = { groups: [], suppressSides: new Set(), extentByBand: new Map() };
  const hasSides = (layer: PreviewLayer) => Boolean(layer.groupKey && layer.kind === 'data-row' && bands[layer.bandId]?.lines?.sides);

  const flush = (run: PreviewLayer[]) => {
    if (new Set(run.map((layer) => layer.bandId)).size < 2) return;
    const x0 = Math.min(...run.map((l) => l.rect.x));
    const x1 = Math.max(...run.map((l) => l.rect.x + l.rect.width));
    const y0 = Math.min(...run.map((l) => l.rect.y));
    const y1 = Math.max(...run.map((l) => l.rect.y + l.rect.height));
    const lines = bands[run[0].bandId].lines;
    const t = getBandLinesThicknessPx(lines);
    result.groups.push({
      color: getBandLinesColor(lines),
      rects: [
        { x: x0, y: y0, width: t, height: y1 - y0 },
        { x: x1 - t, y: y0, width: t, height: y1 - y0 },
      ],
    });
    run.forEach((layer) => {
      result.suppressSides.add(layer.key);
      result.extentByBand.set(layer.bandId, { x: x0, width: x1 - x0 });
    });
  };

  // Laterais ligadas na banda PAI do registro valem para o registro inteiro (pai + filhas): "a listagem de protocolos" tem lateral só nela
  // e o usuário espera a borda do registro completo. A camada da pai é a única cuja chave é a própria `groupKey`.
  const byGroup = new Map<string, PreviewLayer[]>();
  for (const layer of layers) if (layer.groupKey && layer.kind === 'data-row') byGroup.set(layer.groupKey, [...(byGroup.get(layer.groupKey) ?? []), layer]);
  const covered = new Set<string>();
  for (const [key, members] of byGroup) {
    const parent = members.find((layer) => layer.key === key);
    if (!parent || !bands[parent.bandId]?.lines?.sides) continue;
    flush(members);
    members.forEach((layer) => covered.add(layer.key));
  }

  let run: PreviewLayer[] = [];
  for (const layer of layers.filter((l) => !covered.has(l.key))) {
    if (hasSides(layer) && run.length && run[0].groupKey === layer.groupKey) run.push(layer);
    else {
      flush(run);
      run = hasSides(layer) ? [layer] : [];
    }
  }
  flush(run);
  return result;
}
