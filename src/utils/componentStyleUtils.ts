import type { CSSProperties } from 'react';
import type { LiveStylePreview } from '../store/designerStore';

export function mergeLiveStyleOverlay(
  baseStyle: CSSProperties,
  overlay: CSSProperties | null | undefined
): CSSProperties {
  if (!overlay) return baseStyle;
  return { ...baseStyle, ...overlay };
}

export function mergeLiveComponentStyle(
  baseStyle: CSSProperties,
  componentId: string,
  livePreview: LiveStylePreview | null
): CSSProperties {
  if (!livePreview || livePreview.componentId !== componentId) return baseStyle;
  return mergeLiveStyleOverlay(baseStyle, livePreview.style);
}
