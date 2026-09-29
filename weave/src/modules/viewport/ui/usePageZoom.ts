import { useCallback, useEffect, useRef, useState } from 'react';
import { getCanvasHorizontalPadding } from './viewportPadding';
import { applyPageZoomLayout, compensateScrollForZoom, getUnzoomedScrollSize, getViewportCenterFocal, getWheelFocalInScroll } from './pageZoomDom';
import { clampPageZoom, computeFitToWidthZoom, PAGE_WHEEL_ZOOM_SENSITIVITY, PAGE_ZOOM_STEP } from '../domain/pageZoom';

interface UsePageZoomOptions {
  /** Largura natural do conteúdo (px) — fit-to-width e spacer */
  pageWidth: number;
  /** Altura fixa (px); omitir para medir via ResizeObserver no contentRef */
  naturalHeight?: number;
  /** Recalcula fit ao mudar (ex.: painéis / folha ativa / modo de visualização) */
  fitLayoutKey?: string | number;
}

export function usePageZoom({
  pageWidth,
  naturalHeight: naturalHeightProp,
  fitLayoutKey = 0,
}: UsePageZoomOptions) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(1);
  const measuredHeightRef = useRef(0);
  const userZoomOverrideRef = useRef(false);
  const [committedZoom, setCommittedZoom] = useState(1);

  const getNaturalSize = useCallback(() => {
    const content = contentRef.current;
    const width = pageWidth;
    const measured = content
      ? getUnzoomedScrollSize(content, zoomRef.current).height
      : measuredHeightRef.current;
    const height = naturalHeightProp ?? measured;
    return { width, height: Math.max(height, 0) };
  }, [naturalHeightProp, pageWidth]);

  const applyZoomLayout = useCallback(
    (zoom: number) => {
      const { width, height } = getNaturalSize();
      if (width <= 0 || height <= 0) return;
      applyPageZoomLayout(spacerRef.current, contentRef.current, zoom, width, height);
    },
    [getNaturalSize]
  );

  const commitZoom = useCallback(
    (z: number, focal?: { focalX: number; focalY: number }) => {
      const oldZ = zoomRef.current;
      const next = clampPageZoom(z);
      if (next === oldZ && !focal) return;

      zoomRef.current = next;
      applyZoomLayout(next);

      if (focal && scrollRef.current && oldZ !== next) {
        compensateScrollForZoom(
          scrollRef.current,
          focal.focalX,
          focal.focalY,
          oldZ,
          next
        );
      }

      setCommittedZoom(next);
    },
    [applyZoomLayout]
  );

  const changeZoomByDelta = useCallback(
    (delta: number) => {
      userZoomOverrideRef.current = true;
      const scroll = scrollRef.current;
      const spacer = spacerRef.current;
      const focal =
        scroll && spacer ? getViewportCenterFocal(scroll, spacer) : undefined;
      commitZoom(zoomRef.current + delta, focal);
    },
    [commitZoom]
  );

  const zoomIn = useCallback(() => changeZoomByDelta(PAGE_ZOOM_STEP), [changeZoomByDelta]);
  const zoomOut = useCallback(() => changeZoomByDelta(-PAGE_ZOOM_STEP), [changeZoomByDelta]);

  const resetZoom = useCallback(() => {
    userZoomOverrideRef.current = true;
    commitZoom(1);
  }, [commitZoom]);

  const applyFitToWidth = useCallback(() => {
    const el = scrollRef.current;
    if (!el || pageWidth <= 0) return;

    const paddingX = getCanvasHorizontalPadding(el.clientWidth);
    const fitZoom = computeFitToWidthZoom(el.clientWidth, pageWidth, paddingX);

    if (fitZoom < 1) {
      commitZoom(fitZoom);
    } else if (!userZoomOverrideRef.current) {
      commitZoom(1);
    }
  }, [commitZoom, pageWidth]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const syncMeasuredHeight = () => {
      measuredHeightRef.current = getUnzoomedScrollSize(
        content,
        zoomRef.current
      ).height;
      applyZoomLayout(zoomRef.current);
    };

    syncMeasuredHeight();

    const observer = new ResizeObserver(syncMeasuredHeight);
    observer.observe(content);

    return () => observer.disconnect();
  }, [applyZoomLayout, fitLayoutKey, pageWidth, naturalHeightProp]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      if (!userZoomOverrideRef.current) {
        applyFitToWidth();
      }
    });

    observer.observe(el);
    applyFitToWidth();

    return () => observer.disconnect();
  }, [applyFitToWidth]);

  useEffect(() => {
    userZoomOverrideRef.current = false;
    applyFitToWidth();
  }, [fitLayoutKey, pageWidth, applyFitToWidth]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();

      const spacer = spacerRef.current;
      if (!spacer) return;

      const oldZ = zoomRef.current;
      const factor = Math.exp(-e.deltaY * PAGE_WHEEL_ZOOM_SENSITIVITY);
      const newZ = clampPageZoom(oldZ * factor);
      if (newZ === oldZ) return;

      userZoomOverrideRef.current = true;

      const focal = getWheelFocalInScroll(el, e.clientX, e.clientY, spacer);
      zoomRef.current = newZ;
      applyZoomLayout(newZ);
      compensateScrollForZoom(el, focal.focalX, focal.focalY, oldZ, newZ);
      setCommittedZoom(newZ);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [applyZoomLayout]);

  return {
    scrollRef,
    spacerRef,
    contentRef,
    /** @deprecated use contentRef */
    zoomWrapRef: contentRef,
    committedZoom,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}
