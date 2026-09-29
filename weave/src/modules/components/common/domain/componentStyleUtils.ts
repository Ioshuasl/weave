import type { StyleDeclaration } from '../../../../shared/domain/style';


export function mergeLiveStyleOverlay(
  baseStyle: StyleDeclaration,
  overlay: StyleDeclaration | null | undefined
): StyleDeclaration {
  if (!overlay) return baseStyle;
  return { ...baseStyle, ...overlay };
}

export function mergeLiveComponentStyle(
  baseStyle: StyleDeclaration,
  componentId: string,
  livePreview: LiveStylePreview | null
): StyleDeclaration {
  if (!livePreview || livePreview.componentId !== componentId) return baseStyle;
  return mergeLiveStyleOverlay(baseStyle, livePreview.style);
}

export interface LiveStylePreview {
  componentId: string;
  style: StyleDeclaration;
}
