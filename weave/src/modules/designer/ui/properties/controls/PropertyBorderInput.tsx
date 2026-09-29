import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../../../shared/ui/cn';
import {
  formatBorder,
  formatBorderRadius,
  isCustomBorder,
  normalizeBorderColor,
  parseBorder,
  parseBorderRadius,
  replaceBorderColor,
  type BorderStyle,
} from '../../../../../shared/domain/borderUtils';
import { PropertyHint } from './PropertyFields';

const labelClass = 'block text-[11px] font-medium text-neutral-600 mb-1';

const inputClass = cn(
  'min-w-0 text-[13px] text-neutral-900',
  'bg-white border border-neutral-200 rounded-md',
  'transition-[border-color,box-shadow,background-color]',
  'hover:border-neutral-300',
  'focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/8',
  'placeholder:text-neutral-400'
);

const BORDER_STYLES: { value: BorderStyle; label: string }[] = [
  { value: 'solid', label: 'Sólida' },
  { value: 'dashed', label: 'Tracejada' },
  { value: 'dotted', label: 'Pontilhada' },
  { value: 'double', label: 'Dupla' },
];

/** Mantém rascunho local enquanto o valor commitado não atualiza (preview ao vivo). */
function useNumericDraft(committed: number) {
  const [draft, setDraft] = useState(committed);
  const [textDraft, setTextDraft] = useState(String(committed));
  const [dragging, setDragging] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!dragging && !focused) {
      setDraft(committed);
      setTextDraft(String(committed));
    }
  }, [committed, dragging, focused]);

  return {
    draft,
    textDraft,
    setDraft,
    setTextDraft,
    dragging,
    setDragging,
    focused,
    setFocused,
  };
}

function CompactColorInput({
  value,
  onPreview,
  onCommit,
  ariaLabel,
}: {
  value: string;
  onPreview: (color: string) => void;
  onCommit?: (color: string) => void;
  ariaLabel: string;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <input
      type="color"
      value={draft}
      onInput={(e) => {
        const next = normalizeBorderColor(e.currentTarget.value);
        setDraft(next);
        onPreview(next);
      }}
      onChange={(e) => {
        const next = normalizeBorderColor(e.target.value);
        setDraft(next);
        onPreview(next);
      }}
      onBlur={(e) => {
        const next = normalizeBorderColor(e.currentTarget.value);
        (onCommit ?? onPreview)(next);
      }}
      className="w-9 h-9 shrink-0 rounded-md border border-neutral-200 cursor-pointer bg-white p-0.5"
      aria-label={ariaLabel}
    />
  );
}

type BorderEditorMode = 'simple' | 'custom';

export function PropertyBorderInput({
  label,
  value,
  onChange,
  onPreview,
  hint,
  maxWidth = 12,
  defaultColor = '#e5e5e5',
  allowStyle = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Preview sem gravar histórico (commit em blur / pointerup) */
  onPreview?: (value: string) => void;
  hint?: string;
  maxWidth?: number;
  defaultColor?: string;
  allowStyle?: boolean;
}) {
  const id = useId();
  const styleId = useId();
  const parsed = useMemo(() => parseBorder(value), [value]);
  const [mode, setMode] = useState<BorderEditorMode>(() =>
    isCustomBorder(value) ? 'custom' : 'simple'
  );
  const {
    draft: widthDraft,
    textDraft: widthTextDraft,
    setDraft: setWidthDraft,
    setTextDraft: setWidthTextDraft,
    dragging: widthDragging,
    setDragging: setWidthDragging,
    focused: widthFocused,
    setFocused: setWidthFocused,
  } = useNumericDraft(parsed.width);
  const [customDraft, setCustomDraft] = useState(value);
  const customFocusedRef = useRef(false);

  useEffect(() => {
    if (isCustomBorder(value)) setMode('custom');
  }, [value]);

  useEffect(() => {
    if (!customFocusedRef.current) {
      setCustomDraft(value);
    }
  }, [value]);

  const formatSimple = (patch: Partial<{ width: number; style: BorderStyle; color: string }>) => {
    const next = {
      width: patch.width ?? widthDraft,
      style: patch.style ?? parsed.style,
      color: patch.color ?? parsed.color ?? defaultColor,
    };
    return formatBorder(next) ?? '';
  };

  const emitSimple = (
    patch: Partial<{ width: number; style: BorderStyle; color: string }>,
    commit = !onPreview
  ) => {
    const formatted = formatSimple(patch);
    if (onPreview && !commit) {
      onPreview(formatted);
      return;
    }
    onChange(formatted);
  };

  const emitCustom = (nextValue: string, commit = !onPreview) => {
    if (onPreview && !commit) {
      onPreview(nextValue);
      return;
    }
    onChange(nextValue);
  };

  const applyWidth = (width: number, commit: boolean) => {
    const clamped = Math.max(0, Math.min(maxWidth, width));
    setWidthDraft(clamped);
    setWidthTextDraft(String(clamped));
    emitSimple(
      {
        width: clamped,
        color: clamped > 0 ? parsed.color || defaultColor : parsed.color,
      },
      commit
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <label htmlFor={id} className={labelClass + ' mb-0'}>
          {label}
        </label>
        <div className="flex gap-0.5 p-0.5 bg-neutral-100 border border-neutral-200/80 rounded-md shrink-0">
          {(
            [
              { value: 'simple' as const, label: 'Espessura' },
              { value: 'custom' as const, label: 'CSS' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMode(opt.value)}
              className={cn(
                'px-1.5 py-0.5 text-[10px] rounded transition-colors',
                mode === opt.value
                  ? 'bg-white shadow-sm font-medium text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'simple' ? (
        <div className="flex items-center gap-2 min-w-0">
          <CompactColorInput
            value={parsed.color || defaultColor}
            onPreview={(color) =>
              emitSimple({ color, width: Math.max(widthDraft, 1) })
            }
            onCommit={(color) =>
              emitSimple({ color, width: Math.max(widthDraft, 1) }, true)
            }
            ariaLabel={`${label} — cor`}
          />
          <input
            type="range"
            min={0}
            max={maxWidth}
            step={1}
            value={widthDraft}
            onPointerDown={() => {
              setWidthDragging(true);
            }}
            onChange={(e) => {
              applyWidth(Number(e.target.value), false);
            }}
            onPointerUp={(e) => {
              setWidthDragging(false);
              applyWidth(Number((e.target as HTMLInputElement).value), true);
            }}
            onPointerCancel={() => {
              setWidthDragging(false);
              setWidthDraft(parsed.width);
              setWidthTextDraft(String(parsed.width));
            }}
            className="flex-1 min-w-0 h-1.5 accent-neutral-800 cursor-pointer"
            aria-label={`${label} — espessura`}
          />
          <input
            id={id}
            type="text"
            inputMode="numeric"
            value={widthFocused ? widthTextDraft : String(widthDraft)}
            onFocus={() => {
              setWidthFocused(true);
              setWidthTextDraft(String(widthDraft));
            }}
            onChange={(e) => {
              setWidthTextDraft(e.target.value);
              const parsedWidth = Number(e.target.value);
              if (!Number.isNaN(parsedWidth)) {
                applyWidth(parsedWidth, false);
              }
            }}
            onBlur={(e) => {
              setWidthFocused(false);
              const parsedWidth = Number(e.target.value);
              applyWidth(Number.isNaN(parsedWidth) ? widthDraft : parsedWidth, true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            className={cn(inputClass, 'w-11 text-center tabular-nums px-1 py-1.5')}
          />
          {allowStyle && (
            <div className="relative shrink-0 w-[4.5rem]">
              <select
                id={styleId}
                value={parsed.style}
                disabled={widthDraft <= 0}
                onChange={(e) =>
                  emitSimple(
                    {
                      style: e.target.value as BorderStyle,
                      width: Math.max(widthDraft, 1),
                    },
                    true
                  )
                }
                className={cn(
                  inputClass,
                  'w-full appearance-none pr-5 py-1.5 pl-1.5 text-[11px] cursor-pointer disabled:opacity-40'
                )}
              >
                {BORDER_STYLES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400"
                aria-hidden
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 min-w-0">
          <CompactColorInput
            value={normalizeBorderColor(parsed.color || defaultColor)}
            onPreview={(color) => emitCustom(replaceBorderColor(customDraft, color))}
            onCommit={(color) => emitCustom(replaceBorderColor(customDraft, color), true)}
            ariaLabel={`${label} — cor`}
          />
          <input
            id={id}
            type="text"
            value={customDraft}
            onFocus={() => {
              customFocusedRef.current = true;
            }}
            onChange={(e) => {
              setCustomDraft(e.target.value);
              emitCustom(e.target.value);
            }}
            onBlur={(e) => {
              customFocusedRef.current = false;
              emitCustom(e.target.value, true);
            }}
            placeholder="1px solid #e5e5e5"
            className={cn(inputClass, 'flex-1 font-mono text-[12px] px-2 py-1.5')}
          />
        </div>
      )}

      {hint && <PropertyHint className="mt-1">{hint}</PropertyHint>}
    </div>
  );
}

/** Cor + espessura (stroke) — barras/fatias de gráfico, sem estilo CSS */
export function PropertyStrokeInput({
  label,
  color,
  width,
  onColorChange,
  onWidthChange,
  onColorPreview,
  onWidthPreview,
  hint,
  maxWidth = 8,
  defaultColor = '#ffffff',
}: {
  label: string;
  color: string;
  width: number;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  onColorPreview?: (color: string) => void;
  onWidthPreview?: (width: number) => void;
  hint?: string;
  maxWidth?: number;
  defaultColor?: string;
}) {
  const id = useId();
  const {
    draft: widthDraft,
    textDraft: widthTextDraft,
    setDraft: setWidthDraft,
    setTextDraft: setWidthTextDraft,
    dragging: widthDragging,
    setDragging: setWidthDragging,
    focused: widthFocused,
    setFocused: setWidthFocused,
  } = useNumericDraft(width);

  const applyWidth = (next: number, commit: boolean) => {
    const clamped = Math.max(0, Math.min(maxWidth, next));
    setWidthDraft(clamped);
    setWidthTextDraft(String(clamped));
    if (commit || !onWidthPreview) {
      onWidthChange(clamped);
    } else {
      onWidthPreview(clamped);
    }
  };

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="flex items-center gap-2 min-w-0">
        <CompactColorInput
          value={color || defaultColor}
          onPreview={(next) => (onColorPreview ?? onColorChange)(next)}
          onCommit={onColorPreview ? onColorChange : undefined}
          ariaLabel={`${label} — cor`}
        />
        <input
          type="range"
          min={0}
          max={maxWidth}
          step={1}
          value={widthDraft}
          onPointerDown={() => {
            setWidthDragging(true);
          }}
          onChange={(e) => applyWidth(Number(e.target.value), false)}
          onPointerUp={(e) => {
            setWidthDragging(false);
            applyWidth(Number((e.target as HTMLInputElement).value), true);
          }}
          onPointerCancel={() => {
            setWidthDragging(false);
            setWidthDraft(width);
            setWidthTextDraft(String(width));
          }}
          className="flex-1 min-w-0 h-1.5 accent-neutral-800 cursor-pointer"
          aria-label={`${label} — espessura`}
        />
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={widthFocused ? widthTextDraft : String(widthDraft)}
          onFocus={() => {
            setWidthFocused(true);
            setWidthTextDraft(String(widthDraft));
          }}
          onChange={(e) => {
            setWidthTextDraft(e.target.value);
            const parsedWidth = Number(e.target.value);
            if (!Number.isNaN(parsedWidth)) {
              applyWidth(parsedWidth, false);
            }
          }}
          onBlur={(e) => {
            setWidthFocused(false);
            const parsedWidth = Number(e.target.value);
            applyWidth(Number.isNaN(parsedWidth) ? widthDraft : parsedWidth, true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
          className={cn(inputClass, 'w-11 text-center tabular-nums px-1 py-1.5')}
        />
        <span className="text-[10px] text-neutral-400 shrink-0">px</span>
      </div>
      {hint && <PropertyHint className="mt-1">{hint}</PropertyHint>}
    </div>
  );
}

export function PropertyBorderRadiusInput({
  label,
  value,
  onChange,
  onPreview,
  hint,
  max = 32,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onPreview?: (value: string) => void;
  hint?: string;
  max?: number;
}) {
  const id = useId();
  const parsed = useMemo(() => parseBorderRadius(value), [value]);
  const [mode, setMode] = useState<'simple' | 'custom'>(() =>
    parsed.raw ? 'custom' : 'simple'
  );
  const {
    draft: pxDraft,
    textDraft: pxTextDraft,
    setDraft: setPxDraft,
    setTextDraft: setPxTextDraft,
    setDragging: setPxDragging,
    focused: pxFocused,
    setFocused: setPxFocused,
  } = useNumericDraft(parsed.px);
  const [customDraft, setCustomDraft] = useState(value);
  const customFocusedRef = useRef(false);

  useEffect(() => {
    if (parsed.raw) setMode('custom');
  }, [parsed.raw]);

  useEffect(() => {
    if (!customFocusedRef.current) {
      setCustomDraft(value);
    }
  }, [value]);

  const emitPx = (px: number, commit = !onPreview) => {
    const formatted = formatBorderRadius({ px }) ?? '';
    if (onPreview && !commit) {
      onPreview(formatted);
      return;
    }
    onChange(formatted);
  };

  const emitCustom = (nextValue: string, commit = !onPreview) => {
    if (onPreview && !commit) {
      onPreview(nextValue);
      return;
    }
    onChange(nextValue);
  };

  const applyPx = (px: number, commit: boolean) => {
    const clamped = Math.max(0, Math.min(max, px));
    setPxDraft(clamped);
    setPxTextDraft(String(clamped));
    emitPx(clamped, commit);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <label htmlFor={id} className={labelClass + ' mb-0'}>
          {label}
        </label>
        <div className="flex gap-0.5 p-0.5 bg-neutral-100 border border-neutral-200/80 rounded-md shrink-0">
          {(
            [
              { value: 'simple' as const, label: 'Px' },
              { value: 'custom' as const, label: 'CSS' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMode(opt.value)}
              className={cn(
                'px-1.5 py-0.5 text-[10px] rounded transition-colors',
                mode === opt.value
                  ? 'bg-white shadow-sm font-medium text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'simple' ? (
        <div className="flex items-center gap-2 min-w-0">
          <input
            type="range"
            min={0}
            max={max}
            step={1}
            value={pxDraft}
            onPointerDown={() => {
              setPxDragging(true);
            }}
            onChange={(e) => applyPx(Number(e.target.value), false)}
            onPointerUp={(e) => {
              setPxDragging(false);
              applyPx(Number((e.target as HTMLInputElement).value), true);
            }}
            onPointerCancel={() => {
              setPxDragging(false);
              setPxDraft(parsed.px);
              setPxTextDraft(String(parsed.px));
            }}
            className="flex-1 min-w-0 h-1.5 accent-neutral-800 cursor-pointer"
            aria-label={`${label} — raio`}
          />
          <input
            id={id}
            type="text"
            inputMode="numeric"
            value={pxFocused ? pxTextDraft : String(pxDraft)}
            onFocus={() => {
              setPxFocused(true);
              setPxTextDraft(String(pxDraft));
            }}
            onChange={(e) => {
              setPxTextDraft(e.target.value);
              const parsedPx = Number(e.target.value);
              if (!Number.isNaN(parsedPx)) {
                applyPx(parsedPx, false);
              }
            }}
            onBlur={(e) => {
              setPxFocused(false);
              const parsedPx = Number(e.target.value);
              applyPx(Number.isNaN(parsedPx) ? pxDraft : parsedPx, true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            className={cn(inputClass, 'w-14 text-center tabular-nums px-1.5 py-1.5')}
          />
          <span className="text-[10px] text-neutral-400 shrink-0">px</span>
        </div>
      ) : (
        <input
          id={id}
          type="text"
          value={customDraft}
          onFocus={() => {
            customFocusedRef.current = true;
          }}
          onChange={(e) => {
            setCustomDraft(e.target.value);
            emitCustom(e.target.value);
          }}
          onBlur={(e) => {
            customFocusedRef.current = false;
            emitCustom(e.target.value, true);
          }}
          placeholder="8px ou 50%"
          className={cn(inputClass, 'w-full font-mono text-[12px] px-2 py-1.5')}
        />
      )}

      {hint && <PropertyHint className="mt-1">{hint}</PropertyHint>}
    </div>
  );
}
