import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '../../../../../shared/ui/cn';
import { PropertyHint } from './PropertyFields';

export interface ComboboxOption<T extends string = string> {
  label: string;
  value: T;
  disabled?: boolean;
  description?: string;
  preview?: string;
}

export interface ComboboxGroup<T extends string = string> {
  label: string;
  options: ComboboxOption<T>[];
}

const labelClass = 'block text-[11px] font-medium text-neutral-600 mb-1';

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const index = lower.indexOf(q);
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-amber-100 text-inherit rounded-sm px-0">{text.slice(index, index + q.length)}</mark>
      {text.slice(index + q.length)}
    </>
  );
}

function flattenGroups<T extends string>(groups: ComboboxGroup<T>[]): ComboboxOption<T>[] {
  return groups.flatMap((group) => group.options);
}

function nextSelectableIndex<T extends string>(
  items: ComboboxOption<T>[],
  from: number,
  direction: 1 | -1
): number {
  if (items.length === 0) return 0;
  let index = from;
  for (let step = 0; step < items.length; step += 1) {
    index = (index + direction + items.length) % items.length;
    if (!items[index]?.disabled) return index;
  }
  return from;
}

export function PropertyCombobox<T extends string>({
  label,
  value,
  onChange,
  options,
  groups,
  placeholder = 'Selecione…',
  searchPlaceholder = 'Buscar…',
  hint,
  disabled,
  emptyMessage = 'Nenhum resultado',
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options?: ComboboxOption<T>[];
  groups?: ComboboxGroup<T>[];
  placeholder?: string;
  searchPlaceholder?: string;
  hint?: string;
  disabled?: boolean;
  emptyMessage?: string;
}) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(
    null
  );

  const highlightedIndexRef = useRef(0);
  const filteredFlatRef = useRef<ComboboxOption<T>[]>([]);

  const allGroups = useMemo<ComboboxGroup<T>[]>(() => {
    if (groups) return groups;
    if (options) return [{ label: '', options }];
    return [];
  }, [groups, options]);

  const allOptions = useMemo(() => flattenGroups(allGroups), [allGroups]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allGroups;
    return allGroups
      .map((group) => ({
        ...group,
        options: group.options.filter(
          (opt) =>
            opt.label.toLowerCase().includes(q) || String(opt.value).toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.options.length > 0);
  }, [allGroups, query]);

  const filteredFlat = useMemo(() => flattenGroups(filteredGroups), [filteredGroups]);

  const selected = allOptions.find((opt) => opt.value === value);

  useEffect(() => {
    highlightedIndexRef.current = highlightedIndex;
  }, [highlightedIndex]);

  useEffect(() => {
    filteredFlatRef.current = filteredFlat;
  }, [filteredFlat]);

  const updatePosition = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const selectOption = useCallback(
    (opt: ComboboxOption<T>) => {
      if (opt.disabled) return;
      onChange(opt.value);
      setOpen(false);
      setQuery('');
      requestAnimationFrame(() => triggerRef.current?.focus());
    },
    [onChange]
  );

  const moveHighlight = useCallback((direction: 1 | -1) => {
    const items = filteredFlatRef.current;
    if (items.length === 0) return;
    setHighlightedIndex((current) => nextSelectableIndex(items, current, direction));
  }, []);

  const handleListKeyDown = useCallback(
    (event: React.KeyboardEvent | KeyboardEvent) => {
      const items = filteredFlatRef.current;
      const currentIndex = highlightedIndexRef.current;

      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        close();
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        event.stopPropagation();
        moveHighlight(1);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        event.stopPropagation();
        moveHighlight(-1);
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        const opt = items[currentIndex];
        if (opt && !opt.disabled) selectOption(opt);
      }
    },
    [close, moveHighlight, selectOption]
  );

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      setOpen(false);
      setQuery('');
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    const firstEnabled = filteredFlat.findIndex((opt) => !opt.disabled);
    setHighlightedIndex(firstEnabled >= 0 ? firstEnabled : 0);
  }, [open, query, filteredFlat]);

  useEffect(() => {
    if (!open || !position) return;
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open, position]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as Node | null;
      const inCombobox =
        rootRef.current?.contains(target) || listRef.current?.contains(target);
      if (!inCombobox) return;
      if (
        event.key === 'ArrowDown' ||
        event.key === 'ArrowUp' ||
        event.key === 'Enter' ||
        event.key === 'Escape'
      ) {
        handleListKeyDown(event);
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open, handleListKeyDown]);

  useEffect(() => {
    if (!open) return;
    const active = optionsRef.current?.querySelector<HTMLElement>('[data-combobox-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex, open, filteredFlat]);

  useEffect(() => {
    if (highlightedIndex >= filteredFlat.length) {
      setHighlightedIndex(Math.max(0, filteredFlat.length - 1));
    }
  }, [filteredFlat.length, highlightedIndex]);

  const handleTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    handleListKeyDown(event);
  };

  let flatIndex = -1;

  const dropdown =
    open && position
      ? createPortal(
          <div
            ref={listRef}
            role="listbox"
            aria-labelledby={id}
            className="fixed z-[200] rounded-lg border border-neutral-200 bg-white shadow-lg overflow-hidden"
            style={{ top: position.top, left: position.left, width: position.width }}
          >
            <div className="p-2 border-b border-neutral-100">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400"
                  aria-hidden
                />
                <input
                  ref={inputRef}
                  type="text"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={open}
                  aria-controls={`${id}-listbox`}
                  autoComplete="off"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleListKeyDown}
                  placeholder={searchPlaceholder}
                  className={cn(
                    'w-full text-[13px] pl-8 pr-2 py-1.5 rounded-md border border-neutral-200',
                    'focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/8'
                  )}
                />
              </div>
            </div>
            <div ref={optionsRef} id={`${id}-listbox`} className="max-h-56 overflow-y-auto py-1">
              {filteredFlat.length === 0 ? (
                <p className="px-3 py-2 text-[12px] text-neutral-400">{emptyMessage}</p>
              ) : (
                filteredGroups.map((group) => (
                  <div key={group.label || 'default'}>
                    {group.label && (
                      <div className="sticky top-0 z-10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 bg-neutral-50/95 border-b border-neutral-100">
                        {group.label}
                      </div>
                    )}
                    {group.options.map((opt) => {
                      flatIndex += 1;
                      const index = flatIndex;
                      const active = index === highlightedIndex;
                      return (
                        <button
                          key={`${group.label}-${opt.value}`}
                          type="button"
                          role="option"
                          aria-selected={active}
                          data-combobox-active={active ? 'true' : undefined}
                          disabled={opt.disabled}
                          onMouseEnter={() => !opt.disabled && setHighlightedIndex(index)}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectOption(opt)}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 text-left text-[12px] transition-colors',
                            opt.disabled
                              ? 'opacity-50 cursor-not-allowed text-neutral-400'
                              : active
                                ? 'bg-neutral-100 text-neutral-900'
                                : 'text-neutral-700 hover:bg-neutral-50'
                          )}
                        >
                          <span className="flex-1 min-w-0 truncate">
                            {highlightMatch(opt.label, query)}
                          </span>
                          {opt.preview && (
                            <span className="shrink-0 text-[10px] text-neutral-400 truncate max-w-[40%]">
                              {opt.preview}
                            </span>
                          )}
                          {value === opt.value && (
                            <Check className="w-3.5 h-3.5 shrink-0 text-neutral-600" aria-hidden />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className="min-w-0 max-w-full">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          'w-full min-w-0 flex items-center gap-2 text-left text-[13px] text-neutral-900',
          'bg-white border border-neutral-200 rounded-md px-2.5 py-1.5',
          'hover:border-neutral-300 focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/8',
          'disabled:opacity-50 disabled:pointer-events-none'
        )}
      >
        <span className={cn('flex-1 truncate', !selected && 'text-neutral-400')}>
          {selected?.label ?? (value ? String(value) : placeholder)}
        </span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 shrink-0 text-neutral-400 transition-transform',
            open && 'rotate-180'
          )}
          aria-hidden
        />
      </button>
      {hint && <PropertyHint className="mt-1">{hint}</PropertyHint>}
      {dropdown}
    </div>
  );
}
