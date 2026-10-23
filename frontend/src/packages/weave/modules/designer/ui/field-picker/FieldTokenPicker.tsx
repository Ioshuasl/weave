import { Braces, Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { cn } from '../../../../shared/ui/cn';
import { type DataFieldOption, SYSTEM_DATE_TIME_FIELD_OPTIONS, SYSTEM_VARIABLE_FIELD_OPTIONS } from '../../../expression/domain';
import { PropertyAccordion } from '../properties/controls/PropertyAccordion';
import { PropertyHint } from '../properties/controls/PropertyFields';

interface FieldOption {
  label: string;
  value: string;
}

interface FieldGroup {
  id: string;
  title: string;
  options: FieldOption[];
  hint?: string;
  defaultOpen?: boolean;
}

function filterOptions(options: FieldOption[], query: string): FieldOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(q) ||
      opt.value.toLowerCase().includes(q)
  );
}

const FieldGroupList: React.FC<{
  group: FieldGroup;
  query: string;
  onInsert: (token: string) => void;
  reportId?: string;
  fullHeight?: boolean;
}> = ({ group, query, onInsert, reportId, fullHeight = false }) => {
  const filtered = filterOptions(group.options, query);
  if (filtered.length === 0) return null;

  return (
    <PropertyAccordion
      title={group.title}
      badge={filtered.length}
      sectionId={`field-picker.${group.id}`}
      reportId={reportId}
      defaultOpen={fullHeight || (group.defaultOpen ?? false)}
      headingClassName="py-0.5"
    >
      {group.hint && <PropertyHint>{group.hint}</PropertyHint>}
      <ul className={cn('space-y-0.5', !fullHeight && 'max-h-40 overflow-y-auto')}>
        {filtered.map((opt) => (
          <li key={opt.value}>
            <button
              type="button"
              onClick={() => onInsert(opt.value)}
              className={cn(
                'w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-md text-[12px]',
                'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors'
              )}
            >
              <Braces className="w-3 h-3 shrink-0 text-neutral-400" aria-hidden />
              <span className="truncate">{opt.label}</span>
              <span className="ml-auto shrink-0 font-mono text-[10px] text-neutral-400 truncate max-w-[45%]">
                {opt.value}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </PropertyAccordion>
  );
};

const SYSTEM_PAGE_FIELD_OPTIONS = SYSTEM_VARIABLE_FIELD_OPTIONS.filter(
  (opt) => !SYSTEM_DATE_TIME_FIELD_OPTIONS.some((dt) => dt.value === opt.value)
);

export function FieldTokenPicker({
  singletons,
  lists,
  onInsert,
  reportId,
  insertHint = 'Clique em um campo para inserir na posição do cursor no editor.',
  variant = 'accordion',
}: {
  singletons: DataFieldOption[];
  lists: DataFieldOption[];
  onInsert: (token: string) => void;
  reportId?: string;
  insertHint?: string;
  /** `sidebar` = coluna fixa ao lado do editor, grupos abertos e lista em altura total */
  variant?: 'accordion' | 'sidebar';
}) {
  const isSidebar = variant === 'sidebar';
  const [query, setQuery] = useState('');

  const groups = useMemo<FieldGroup[]>(() => {
    const result: FieldGroup[] = [];
    if (singletons.length > 0) {
      result.push({
        id: 'config',
        title: 'Configuração',
        options: singletons,
        hint: 'Dados únicos do host (nome, CNPJ, contato) — não se repetem por linha.',
        defaultOpen: true,
      });
    }
    if (lists.length > 0) {
      result.push({
        id: 'lists',
        title: 'Listas',
        options: lists,
        defaultOpen: false,
      });
    }
    if (SYSTEM_DATE_TIME_FIELD_OPTIONS.length > 0) {
      result.push({
        id: 'datetime',
        title: 'Data e hora',
        options: SYSTEM_DATE_TIME_FIELD_OPTIONS,
        hint: 'Refletem o momento da geração do relatório.',
        defaultOpen: false,
      });
    }
    if (SYSTEM_PAGE_FIELD_OPTIONS.length > 0) {
      result.push({
        id: 'system',
        title: 'Sistema',
        options: SYSTEM_PAGE_FIELD_OPTIONS,
        defaultOpen: false,
      });
    }
    return result;
  }, [singletons, lists]);

  const totalCount = groups.reduce((sum, group) => sum + group.options.length, 0);
  const visibleCount = groups.reduce(
    (sum, group) => sum + filterOptions(group.options, query).length,
    0
  );

  if (totalCount === 0) return null;

  const searchInput = (
    <div className="relative min-w-0 shrink-0">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400"
        aria-hidden
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar campos…"
        aria-label="Buscar campos"
        className={cn(
          'w-full min-w-0 text-[13px] text-neutral-900 pl-8 pr-2.5 py-1.5',
          'bg-weave-surface border border-neutral-200 rounded-md',
          'hover:border-neutral-300 focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/8',
          'placeholder:text-neutral-400'
        )}
      />
    </div>
  );

  const groupList =
    visibleCount === 0 ? (
      <PropertyHint>Nenhum campo para &ldquo;{query.trim()}&rdquo;</PropertyHint>
    ) : (
      <div className={cn('space-y-2', isSidebar && 'min-h-0 flex-1 overflow-y-auto pr-1')}>
        {groups.map((group) => (
          <FieldGroupList
            key={group.id}
            group={group}
            query={query}
            onInsert={onInsert}
            reportId={isSidebar ? undefined : reportId}
            fullHeight={isSidebar}
          />
        ))}
      </div>
    );

  if (isSidebar) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {searchInput}
        {groupList}
        <PropertyHint className="shrink-0">{insertHint}</PropertyHint>
      </div>
    );
  }

  return (
    <PropertyAccordion
      title="Campos disponíveis"
      badge={query ? visibleCount : totalCount}
      sectionId="field-picker"
      reportId={reportId}
      defaultOpen={false}
      className="pt-2 border-t border-neutral-100"
    >
      {searchInput}
      {groupList}
      <PropertyHint>{insertHint}</PropertyHint>
    </PropertyAccordion>
  );
}
