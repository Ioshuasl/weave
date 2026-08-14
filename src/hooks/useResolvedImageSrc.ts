import { useEffect, useState } from 'react';
import { useImageResolver } from '../components/designer/designerHostContext';
import { resolveImageUrlWithHost } from '../utils/imageHostResolver';

export function useResolvedImageSrc(src: string): { src: string; resolving: boolean } {
  const resolver = useImageResolver();
  const [resolved, setResolved] = useState(src);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const skip =
      !resolver ||
      !src.trim() ||
      src.trim().toLowerCase().startsWith('data:') ||
      src.trim().toLowerCase().startsWith('blob:');

    if (skip) {
      setResolved(src);
      setResolving(false);
      return;
    }

    setResolving(true);
    void resolveImageUrlWithHost(src, resolver).then((next) => {
      if (cancelled) return;
      setResolved(next);
      setResolving(false);
    });
    return () => {
      cancelled = true;
    };
  }, [src, resolver]);

  return { src: resolved, resolving };
}
