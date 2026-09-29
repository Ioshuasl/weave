import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode } from 'lucide-react';
import type { QrProps } from '../../common/domain';
import { cn } from '../../../../shared/ui/cn';
import {
  getQrBackground,
  getQrErrorCorrection,
  getQrForeground,
  getQrMargin,
} from '../domain/qrPropsUtils';

export function ReportQr({
  value,
  width,
  height,
  qrProps,
  className,
}: {
  value: string;
  width: number;
  height: number;
  qrProps?: QrProps;
  className?: string;
}) {
  const payload = value.trim();
  const [dataUrl, setDataUrl] = useState('');
  const [failed, setFailed] = useState(false);
  const size = Math.max(128, Math.round(Math.max(width, height) * 2));
  const foreground = getQrForeground(qrProps);
  const background = getQrBackground(qrProps);
  const margin = getQrMargin(qrProps);
  const errorCorrection = getQrErrorCorrection(qrProps);

  useEffect(() => {
    if (!payload) {
      setDataUrl('');
      setFailed(false);
      return;
    }

    let cancelled = false;
    setFailed(false);
    void QRCode.toDataURL(payload, {
      width: size,
      margin,
      errorCorrectionLevel: errorCorrection,
      color: { dark: foreground, light: background },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl('');
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [payload, size, margin, errorCorrection, foreground, background]);

  if (!payload || failed || !dataUrl) {
    return (
      <div
        data-report-qr
        data-report-qr-state={!payload ? 'empty' : failed ? 'error' : 'loading'}
        className={cn(
          'relative w-full h-full min-w-0 min-h-0 flex-1 self-stretch',
          'flex flex-col items-center justify-center gap-1 px-1 bg-neutral-50 text-neutral-400 pointer-events-none select-none',
          className
        )}
      >
        <QrCode className="w-6 h-6 opacity-80" strokeWidth={1.5} />
        <p className="text-[10px] leading-tight text-center text-neutral-500">
          {!payload ? 'Sem conteúdo' : failed ? 'Falha ao gerar QR' : 'Gerando…'}
        </p>
      </div>
    );
  }

  return (
    <div
      data-report-qr
      data-report-qr-state="ok"
      className={cn(
        'relative w-full h-full min-w-0 min-h-0 flex-1 self-stretch',
        className
      )}
    >
      <img
        src={dataUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-contain object-center pointer-events-none block max-w-none"
      />
    </div>
  );
}
