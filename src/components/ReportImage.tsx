import { useEffect, useState } from 'react';
import { ImageOff, Image as ImageIcon } from 'lucide-react';
import type { ImageSizeMode } from '../types/report';
import { cn } from '../utils/cn';
import { objectFitFromImageSizeMode } from '../utils/imagePropsUtils';
import { objectPositionFromCrop } from '../utils/imageCropUtils';
import { useResolvedImageSrc } from '../hooks/useResolvedImageSrc';

export type ReportImageLoadState = 'empty' | 'loading' | 'ok' | 'error';

function ImageFallback({ state }: { state: Exclude<ReportImageLoadState, 'ok'> }) {
  const isError = state === 'error';
  const Icon = isError ? ImageOff : ImageIcon;
  const label =
    state === 'empty' ? 'Sem imagem' : isError ? 'Falha ao carregar' : 'Carregando…';

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-1 bg-neutral-50 text-neutral-400 pointer-events-none select-none"
      aria-hidden
    >
      <Icon className="w-6 h-6 opacity-80 shrink-0" strokeWidth={1.5} />
      <p className="text-[10px] leading-tight text-center text-neutral-500 line-clamp-2">
        {label}
      </p>
    </div>
  );
}

export function ReportImage({
  src,
  sizeMode = 'contain',
  cropX = 50,
  cropY = 50,
  alt = '',
  opacity = 1,
  rotation = 0,
  href = '',
  interactive = false,
  className,
}: {
  src: string;
  sizeMode?: ImageSizeMode;
  cropX?: number;
  cropY?: number;
  alt?: string;
  opacity?: number;
  rotation?: number;
  href?: string;
  interactive?: boolean;
  className?: string;
}) {
  const { src: resolvedSrc, resolving } = useResolvedImageSrc(src);
  const usable = Boolean(resolvedSrc.trim());
  const [status, setStatus] = useState<ReportImageLoadState>(usable ? 'loading' : 'empty');

  useEffect(() => {
    setStatus(usable ? 'loading' : 'empty');
  }, [resolvedSrc, usable]);

  const visualState: ReportImageLoadState = resolving
    ? 'loading'
    : usable
      ? status
      : 'empty';
  const showFallback = visualState !== 'ok';
  const safeHref = interactive ? href.trim() : '';

  const frame = (
    <div
      data-report-image
      data-report-image-state={visualState}
      className={cn('relative w-full h-full min-w-0 min-h-0', className)}
      style={{
        opacity: opacity < 1 ? opacity : undefined,
      }}
    >
      {usable && (
        <img
          src={resolvedSrc}
          alt={alt}
          className={cn(
            'w-full h-full pointer-events-none',
            status !== 'ok' && 'invisible absolute inset-0'
          )}
          style={{
            objectFit: objectFitFromImageSizeMode(sizeMode),
            objectPosition: objectPositionFromCrop(cropX, cropY),
            transform: rotation ? `rotate(${rotation}deg)` : undefined,
            transformOrigin: 'center center',
          }}
          referrerPolicy="no-referrer"
          onLoad={() => setStatus('ok')}
          onError={() => setStatus('error')}
        />
      )}
      {showFallback && (
        <ImageFallback state={visualState === 'ok' ? 'empty' : visualState} />
      )}
    </div>
  );

  if (!safeHref) return frame;

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full h-full min-w-0 min-h-0"
      data-report-image-link
      title={safeHref}
    >
      {frame}
    </a>
  );
}
