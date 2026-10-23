import { motion } from 'framer-motion';
import { Braces, ChevronDown, Minus, Plus } from 'lucide-react';
import React, { useEffect, useId, useRef, useState } from 'react';
import { stylePreviewDebug } from '../../../../../shared/diagnostics/stylePreviewDebug';
import { cn } from '../../../../../shared/ui/cn';
import { useDesignerStore } from '../../../application/store/DesignerStoreContext';

/** Campo preenchido (sem borda até o foco) — mesmo tom da sidebar */
const inputClass = cn(
  'w-full min-w-0 text-[13px] text-neutral-900',
  'bg-neutral-100/70 border border-transparent rounded-lg',
  'px-3 py-2 transition-[border-color,box-shadow,background-color]',
  'hover:bg-neutral-100',
  'focus:outline-none focus:bg-weave-surface focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20',
  'placeholder:text-neutral-400',
  'disabled:opacity-50 disabled:pointer-events-none'
);

const labelClass = 'block text-[12px] font-medium text-neutral-600 mb-1';

export function PropertySection({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3 min-w-0 max-w-full', className)}>
      <h4 className="text-[13px] font-semibold text-neutral-800 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {title}
      </h4>
      {children}
    </div>
  );
}

export function PropertyHint({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-[11px] text-neutral-500 leading-snug', className)}>{children}</p>;
}

export function PropertyFieldGrid({
  children,
  cols = 2,
  className,
}: {
  children: React.ReactNode;
  cols?: 2 | 1;
  className?: string;
}) {
  return (
    <div
      className={cn(cols === 2 ? 'grid grid-cols-2 gap-2 min-w-0' : 'space-y-2 min-w-0', className)}
    >
      {children}
    </div>
  );
}

export function PropertyTextInput({
  label,
  value,
  onChange,
  placeholder,
  hint,
  mono,
  disabled,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  mono?: boolean;
  disabled?: boolean;
  onBlur?: () => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={cn(inputClass, mono && 'font-mono text-[12px]')}
      />
      {hint && <PropertyHint className="mt-1">{hint}</PropertyHint>}
    </div>
  );
}

export function PropertyTextarea({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  rows?: number;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, 'resize-y min-h-[4.5rem]')}
      />
      {hint && <PropertyHint className="mt-1">{hint}</PropertyHint>}
    </div>
  );
}

export function PropertyNumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  hint,
  showSteppers = false,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  hint?: string;
  showSteppers?: boolean;
  disabled?: boolean;
}) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  const clamp = (n: number) => {
    let next = n;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    return next;
  };

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === '' || trimmed === '-') {
      setDraft(String(value));
      return;
    }
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) {
      setDraft(String(value));
      return;
    }
    const next = clamp(parsed);
    onChange(next);
    setDraft(String(next));
  };

  const bump = (delta: number) => {
    const next = clamp(value + delta);
    onChange(next);
    setDraft(String(next));
  };

  return (
    <div>
      {label ? (
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      ) : null}
      <div className="flex items-stretch gap-1">
        <div className="relative flex-1 min-w-0">
          <input
            id={id}
            type="text"
            inputMode="decimal"
            disabled={disabled}
            value={focused ? draft : String(value)}
            onFocus={() => {
              setFocused(true);
              setDraft(String(value));
            }}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              setFocused(false);
              commit(draft);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                bump(step);
              }
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                bump(-step);
              }
            }}
            className={cn(inputClass, 'tabular-nums pr-7')}
          />
          {suffix && (
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400">
              {suffix}
            </span>
          )}
        </div>
        {showSteppers && !disabled && (
          <div className="flex flex-col shrink-0 border border-neutral-200 rounded-md overflow-hidden">
            <button
              type="button"
              tabIndex={-1}
              aria-label={`Aumentar ${label}`}
              onClick={() => bump(step)}
              className="flex items-center justify-center w-7 h-[18px] text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 border-b border-neutral-200"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label={`Diminuir ${label}`}
              onClick={() => bump(-step)}
              className="flex items-center justify-center w-7 h-[18px] text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
            >
              <Minus className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      {hint && <PropertyHint className="mt-1">{hint}</PropertyHint>}
    </div>
  );
}

export function PropertySelect<T extends string>({
  label,
  value,
  onChange,
  options,
  hint,
  disabled,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { label: string; value: T }[];
  hint?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value as T)}
          className={cn(inputClass, 'appearance-none pr-8 cursor-pointer')}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400"
          aria-hidden
        />
      </div>
      {hint && <PropertyHint className="mt-1">{hint}</PropertyHint>}
    </div>
  );
}

/** Select de inserção de campo de dados — largura total, alinhado ao restante do painel */
export function PropertyInsertFieldSelect({
  label = 'Campo de dados',
  options,
  onInsert,
  placeholder = 'Selecione um campo…',
  hint,
  disabled,
}: {
  label?: string;
  options: { label: string; value: string }[];
  onInsert: (value: string) => void;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const [value, setValue] = useState('');

  if (options.length === 0) return null;

  return (
    <div className="min-w-0 max-w-full">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative min-w-0">
        <Braces
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400"
          aria-hidden
        />
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            const token = e.target.value;
            if (!token) return;
            onInsert(token);
            setValue('');
          }}
          className={cn(
            inputClass,
            'appearance-none pl-8 pr-8 cursor-pointer text-neutral-700'
          )}
          title="Inserir campo de dados"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400"
          aria-hidden
        />
      </div>
      {hint && <PropertyHint className="mt-1">{hint}</PropertyHint>}
    </div>
  );
}

function normalizeColorDraft(raw: string): string {
  const trimmed = raw.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  const short = trimmed.match(/^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/);
  if (short) {
    const [, r, g, b] = short;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return '#000000';
}

export function PropertyColorInput({
  label,
  value,
  onChange,
  hint,
  previewComponentId,
  previewStyleKey = 'color',
  onPreview,
  onPreviewCancel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  /** Quando definido, arrastar o seletor atualiza liveStylePreview (sem gravar no relatório) */
  previewComponentId?: string;
  previewStyleKey?: 'color' | 'backgroundColor';
  /** Preview ao vivo sem persistir (ex.: chartProps via liveChartPreview) */
  onPreview?: (value: string) => void;
  onPreviewCancel?: () => void;
}) {
  const id = useId();
  const colorPickerId = useId();
  const committed = normalizeColorDraft(value || '#000000');
  const [draft, setDraft] = useState(committed);
  const draftRef = useRef(committed);
  const lastCommittedRef = useRef(committed);
  const isEditingTextRef = useRef(false);
  const isPickerActiveRef = useRef(false);
  const previewRafRef = useRef<number | null>(null);
  const setLiveStylePreview = useDesignerStore((state) => state.setLiveStylePreview);
  const clearLiveStylePreview = useDesignerStore((state) => state.clearLiveStylePreview);

  useEffect(() => {
    if (!isEditingTextRef.current && !isPickerActiveRef.current) {
      draftRef.current = committed;
      lastCommittedRef.current = committed;
      setDraft(committed);
    }
  }, [committed]);

  useEffect(
    () => () => {
      if (previewRafRef.current != null) {
        cancelAnimationFrame(previewRafRef.current);
      }
    },
    []
  );

  const schedulePreview = (raw: string) => {
    const normalized = normalizeColorDraft(raw);
    draftRef.current = normalized;
    setDraft(normalized);

    if (onPreview) {
      if (previewRafRef.current != null) {
        cancelAnimationFrame(previewRafRef.current);
      }
      previewRafRef.current = requestAnimationFrame(() => {
        previewRafRef.current = null;
        stylePreviewDebug.countAction('previewColor (rAF chart)', normalized);
        onPreview(normalized);
      });
      return;
    }

    if (!previewComponentId) {
      onChange(normalized);
      return;
    }

    if (previewRafRef.current != null) {
      cancelAnimationFrame(previewRafRef.current);
    }
    previewRafRef.current = requestAnimationFrame(() => {
      previewRafRef.current = null;
      stylePreviewDebug.countAction('previewColor (rAF)', normalized);
      stylePreviewDebug.time('previewColor→setLiveStylePreview');
      setLiveStylePreview({
        componentId: previewComponentId,
        style: { [previewStyleKey]: normalized },
      });
      stylePreviewDebug.timeEnd('previewColor→setLiveStylePreview');
    });
  };

  const commitColor = (raw: string) => {
    const normalized = normalizeColorDraft(raw);
    draftRef.current = normalized;
    setDraft(normalized);
    if (previewRafRef.current != null) {
      cancelAnimationFrame(previewRafRef.current);
      previewRafRef.current = null;
    }
    if (onPreview) {
      onPreviewCancel?.();
    } else {
      clearLiveStylePreview();
    }

    if (normalized === lastCommittedRef.current) {
      stylePreviewDebug.log('commitColor ignorado (sem mudança)', normalized);
      return;
    }
    lastCommittedRef.current = normalized;
    stylePreviewDebug.countAction('commitColor', normalized);
    stylePreviewDebug.time('commitColor→onChange');
    onChange(normalized);
    stylePreviewDebug.timeEnd('commitColor→onChange');
  };

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={colorPickerId}
          type="color"
          value={draft}
          onPointerDown={() => {
            isPickerActiveRef.current = true;
          }}
          onFocus={() => {
            isPickerActiveRef.current = true;
          }}
          onInput={(e) => schedulePreview(e.currentTarget.value)}
          onChange={(e) => schedulePreview(e.currentTarget.value)}
          onBlur={(e) => {
            isPickerActiveRef.current = false;
            commitColor(e.currentTarget.value);
          }}
          className="w-9 h-9 shrink-0 rounded-md border border-neutral-200 cursor-pointer bg-weave-surface p-0.5"
          aria-label={`${label} — seletor`}
        />
        <input
          id={id}
          type="text"
          value={draft}
          onFocus={() => {
            isEditingTextRef.current = true;
          }}
          onChange={(e) => {
            const next = e.target.value;
            setDraft(next);
            if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(next.trim())) {
              schedulePreview(next);
            }
          }}
          onBlur={() => {
            isEditingTextRef.current = false;
            commitColor(draft);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitColor(draft);
              (e.target as HTMLInputElement).blur();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              isEditingTextRef.current = false;
              if (onPreviewCancel) {
                onPreviewCancel();
              } else {
                clearLiveStylePreview();
              }
              setDraft(committed);
              (e.target as HTMLInputElement).blur();
            }
          }}
          className={cn(inputClass, 'font-mono text-[12px] flex-1')}
          placeholder="#000000"
        />
      </div>
      {hint && <PropertyHint className="mt-1">{hint}</PropertyHint>}
    </div>
  );
}

export function PropertyAngleInput({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  const commit = (raw: string) => {
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) {
      setDraft(String(value));
      return;
    }
    const next = ((parsed % 360) + 360) % 360;
    onChange(next);
    setDraft(String(next));
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <label htmlFor={id} className={labelClass + ' mb-0'}>
          {label}
        </label>
        <span className="text-[11px] font-medium text-neutral-500 tabular-nums">{value}°</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={360}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-1.5 accent-neutral-800 cursor-pointer"
        />
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={focused ? draft : String(value)}
          onFocus={() => {
            setFocused(true);
            setDraft(String(value));
          }}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setFocused(false);
            commit(draft);
          }}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className={cn(inputClass, 'w-14 text-center tabular-nums px-1.5')}
        />
      </div>
      {hint && <PropertyHint className="mt-1">{hint}</PropertyHint>}
    </div>
  );
}

/** Interruptor (liga/desliga) com rótulo à esquerda */
export function PropertyCheckbox({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  const id = useId();
  return (
    <div>
      <label
        htmlFor={id}
        className="flex cursor-pointer select-none items-center justify-between gap-3 text-[13px] text-neutral-700"
      >
        <span className="min-w-0">{label}</span>
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={cn(
            'relative h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40',
            checked ? 'bg-indigo-600' : 'bg-neutral-300'
          )}
        >
          <motion.span
            className="absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-sm"
            animate={{ x: checked ? 16 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          />
        </button>
      </label>
      {hint && <PropertyHint className="mt-1">{hint}</PropertyHint>}
    </div>
  );
}

export function PropertySegmentedControl<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; icon?: React.ComponentType<{ className?: string }>; title?: string }[];
}) {
  const pillId = useId();
  return (
    <div>
      {label && <span className={labelClass}>{label}</span>}
      <div className="flex gap-0.5 rounded-lg bg-neutral-100 p-0.5">
        {options.map((opt) => {
          const active = value === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              title={opt.title ?? opt.label}
              aria-pressed={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                'relative flex flex-1 items-center justify-center gap-1.5 rounded-md px-1 py-1.5 text-[12px] transition-colors',
                active ? 'font-medium text-neutral-900' : 'text-neutral-500 hover:text-neutral-800'
              )}
            >
              {active && (
                <motion.span
                  layoutId={pillId}
                  className="absolute inset-0 rounded-md bg-weave-surface shadow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                {Icon && <Icon className="size-3.5" />}
                {opt.label && <span>{opt.label}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Controle deslizante com o valor ao lado (ex.: opacidade) */
export function PropertySlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  suffix = '%',
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  const id = useId();
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={id} className={cn(labelClass, 'mb-0')}>
          {label}
        </label>
        <span className="text-[12px] tabular-nums text-neutral-500">
          {value}
          {suffix}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer accent-indigo-600"
      />
    </div>
  );
}
