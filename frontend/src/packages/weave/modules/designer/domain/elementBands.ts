import { createId } from '../../../shared/domain/id';
import { getBandRect } from '../../band/domain';
import { clampRectToPage, getPageContentSize } from '../../page/domain';
import type { Rect } from '../../../shared/domain/geometry';
import type { BandType, ReportBand } from '../../band/domain';
import type { ReportComponent } from '../../components/common/domain';
import type { ReportPage } from '../../page/domain';
import type { ReportDefinition } from '../../report/domain';

/**
 * "Em todas as folhas": no alto da folha vira cabeçalho (listas começam abaixo dele);
 * na metade de baixo vira rodapé (listas terminam acima dele).
 */
export function getRepeatingElementBandType(rect: Rect, page: ReportPage): BandType {
  return rect.y + rect.height / 2 > getPageContentSize(page).height / 2
    ? 'pageFooter'
    : 'pageHeader';
}

/**
 * Elemento solto = um componente dentro de uma banda invisível (`band.element`) do mesmo tamanho.
 * Roda em todo registro de histórico e mantém a regra "1 elemento = 1 banda":
 * - a banda assume posição/tamanho do componente na folha e o componente volta a (0, 0);
 * - banda de elemento sem componente (excluído/recortado) é removida;
 * - componente extra (duplicado/colado dentro do elemento) vira um elemento próprio.
 * O motor de impressão não precisa saber de nada disso.
 */
export function normalizeElementBands(report: ReportDefinition): ReportDefinition {
  let changed = false;
  const bands: Record<string, ReportBand> = { ...report.bands };
  const components: Record<string, ReportComponent> = { ...report.components };

  const pages = report.pages.map((page) => {
    const pageBands: string[] = [];

    for (const bandId of page.bands) {
      const band = bands[bandId];
      if (!band?.element) {
        pageBands.push(bandId);
        continue;
      }

      const memberIds = band.components.filter((id) => components[id]);
      if (memberIds.length === 0) {
        delete bands[bandId];
        changed = true;
        continue;
      }

      const bandRect = getBandRect(band, page);
      memberIds.forEach((componentId, index) => {
        const component = components[componentId];
        const { x, y, width, height } = component.rect;
        const targetId = index === 0 ? bandId : createId();
        const isGlued =
          index === 0 &&
          band.components.length === 1 &&
          x === 0 &&
          y === 0 &&
          width === bandRect.width &&
          height === bandRect.height;
        pageBands.push(targetId);
        if (isGlued) return;

        const next = clampRectToPage({ x: bandRect.x + x, y: bandRect.y + y, width, height }, page);
        // Repetido em todas as folhas: ao mover, decide de novo entre cabeçalho e rodapé
        const isRepeating = band.type === 'pageHeader' || band.type === 'pageFooter';
        bands[targetId] = {
          ...band,
          type: isRepeating ? getRepeatingElementBandType(next, page) : band.type,
          id: targetId,
          bandRect: next,
          height: next.height,
          components: [componentId],
        };
        components[componentId] = {
          ...component,
          parentId: targetId,
          rect: { ...component.rect, x: 0, y: 0, width: next.width, height: next.height },
        };
        changed = true;
      });
    }

    return pageBands.length === page.bands.length &&
      pageBands.every((id, i) => id === page.bands[i])
      ? page
      : { ...page, bands: pageBands };
  });

  return changed ? { ...report, bands, components, pages } : report;
}
