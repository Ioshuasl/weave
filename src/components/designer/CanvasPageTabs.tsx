import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, MoreHorizontal, Plus, Trash2, X } from 'lucide-react';
import type { ReportPage } from '../../types/report';
import { cn } from '../../utils/cn';

const MENU_WIDTH_PX = 160;

interface PageTabActionsMenuProps {
  pageId: string;
  pageName: string;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  canRemove: boolean;
  onDuplicate: () => void;
  onRemove: () => void;
  onClose: () => void;
}

function PageTabActionsMenu({
  pageId,
  pageName,
  anchorRef,
  canRemove,
  onDuplicate,
  onRemove,
  onClose,
}: PageTabActionsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 4,
      left: Math.min(
        Math.max(8, rect.right - MENU_WIDTH_PX),
        window.innerWidth - MENU_WIDTH_PX - 8
      ),
    });
  }, [anchorRef]);

  useEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [updatePosition]);

  useEffect(() => {
    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };

    document.addEventListener('mousedown', closeOnOutside);
    return () => document.removeEventListener('mousedown', closeOnOutside);
  }, [anchorRef, onClose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (!position) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={`Ações da página ${pageName}`}
      className="fixed w-40 rounded-lg border border-neutral-200 bg-white shadow-lg py-1 z-[200]"
      style={{ top: position.top, left: position.left }}
      data-page-tab-menu={pageId}
    >
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onDuplicate();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-neutral-700 hover:bg-neutral-50"
      >
        <Copy className="w-3.5 h-3.5 text-neutral-500" />
        Duplicar
      </button>
      <button
        type="button"
        role="menuitem"
        disabled={!canRemove}
        onClick={() => {
          onRemove();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:pointer-events-none"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Excluir
      </button>
    </div>,
    document.body
  );
}

interface CanvasPageTabsProps {
  pages: ReportPage[];
  activePageId: string | null;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onDuplicatePage: (pageId: string) => void;
  onRemovePage: (pageId: string) => void;
  onRenamePage: (pageId: string, name: string) => void;
}

export function CanvasPageTabs({
  pages,
  activePageId,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onRemovePage,
  onRenamePage,
}: CanvasPageTabsProps) {
  const resolvedActiveId = activePageId ?? pages[0]?.id ?? '';
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [menuPageId, setMenuPageId] = useState<string | null>(null);
  const menuAnchorRef = useRef<HTMLButtonElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const menuPage = menuPageId
    ? pages.find((page) => page.id === menuPageId)
    : undefined;

  const commitRename = useCallback(
    (pageId: string) => {
      const trimmed = draftName.trim();
      if (trimmed) {
        onRenamePage(pageId, trimmed);
      }
      setRenamingId(null);
    },
    [draftName, onRenamePage]
  );

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  if (pages.length === 0) return null;

  return (
    <>
      <div className="relative shrink-0 border-b border-neutral-200/80 bg-[#fbfbfa] min-h-[40px] z-20">
        <div
          className="flex items-stretch overflow-x-auto hide-scrollbar"
          role="tablist"
          aria-label="Páginas do relatório"
        >
          {pages.map((page, index) => {
            const isActive = page.id === resolvedActiveId;
            const isRenaming = renamingId === page.id;
            const canRemove = pages.length > 1;

            return (
              <div
                key={page.id}
                className={cn(
                  'group relative flex items-center shrink-0 border-r border-neutral-200/60',
                  isActive ? 'bg-white' : 'bg-transparent hover:bg-white/70'
                )}
              >
                {isRenaming ? (
                  <input
                    ref={renameInputRef}
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={() => commitRename(page.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        commitRename(page.id);
                      }
                      if (e.key === 'Escape') {
                        setRenamingId(null);
                      }
                    }}
                    className="mx-2 my-1.5 w-[7.5rem] text-[12px] px-2 py-1 border border-sky-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                    aria-label="Renomear página"
                  />
                ) : (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    title={`${page.name} — duplo clique para renomear`}
                    onClick={() => onSelectPage(page.id)}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      setRenamingId(page.id);
                      setDraftName(page.name);
                    }}
                    className={cn(
                      'flex items-center gap-1.5 pl-3 pr-1.5 py-2 text-[12px] max-w-[11rem] transition-colors',
                      isActive
                        ? 'text-neutral-900 font-medium'
                        : 'text-neutral-600 hover:text-neutral-900'
                    )}
                  >
                    <span className="tabular-nums text-neutral-400 font-normal shrink-0">
                      {index + 1}
                    </span>
                    <span className="truncate">{page.name}</span>
                  </button>
                )}

                {!isRenaming && (
                  <div className="flex items-center pr-1 gap-0.5">
                    {canRemove && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemovePage(page.id);
                          setMenuPageId(null);
                        }}
                        className={cn(
                          'p-1 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-opacity',
                          isActive
                            ? 'opacity-70 hover:opacity-100'
                            : 'opacity-0 group-hover:opacity-70'
                        )}
                        title="Excluir página"
                        aria-label={`Excluir ${page.name}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}

                    {isActive && (
                      <button
                        ref={menuPageId === page.id ? menuAnchorRef : undefined}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuPageId((current) =>
                            current === page.id ? null : page.id
                          );
                        }}
                        className="p-1 rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                        title="Ações da página"
                        aria-label="Ações da página"
                        aria-expanded={menuPageId === page.id}
                        aria-haspopup="menu"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {isActive && (
                  <span
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-sky-500"
                    aria-hidden
                  />
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={onAddPage}
            className="shrink-0 inline-flex items-center justify-center self-center w-8 h-8 mx-2 my-1.5 rounded-md border border-dashed border-neutral-300 text-neutral-500 hover:text-neutral-900 hover:bg-white hover:border-neutral-400 transition-colors"
            title="Nova página"
            aria-label="Nova página"
          >
            <Plus className="w-4 h-4" strokeWidth={2.25} />
          </button>
        </div>
      </div>

      {menuPage && menuPageId && (
        <PageTabActionsMenu
          pageId={menuPageId}
          pageName={menuPage.name}
          anchorRef={menuAnchorRef}
          canRemove={pages.length > 1}
          onDuplicate={() => onDuplicatePage(menuPageId)}
          onRemove={() => onRemovePage(menuPageId)}
          onClose={() => setMenuPageId(null)}
        />
      )}
    </>
  );
}
