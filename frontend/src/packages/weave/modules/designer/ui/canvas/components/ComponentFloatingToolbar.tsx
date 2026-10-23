import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Copy,
  PencilLine,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import React from 'react';
import { cn } from '../../../../../shared/ui/cn';
import { useDesignerStore } from '../../../application/store/DesignerStoreContext';
import type { ReportComponent } from '../../../../components/common/domain';

type TextAlign = 'left' | 'center' | 'right';

const ALIGN_ACTIONS: { value: TextAlign; label: string; icon: LucideIcon }[] = [
  { value: 'left', label: 'Alinhar à esquerda', icon: AlignLeft },
  { value: 'center', label: 'Centralizar', icon: AlignCenter },
  { value: 'right', label: 'Alinhar à direita', icon: AlignRight },
];

function stopBubble(event: React.SyntheticEvent) {
  event.stopPropagation();
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  active = false,
  danger = false,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onPointerDown={stopBubble}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
        danger
          ? 'text-neutral-500 hover:bg-red-50 hover:text-red-600'
          : active
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
    </button>
  );
}

/** Ações rápidas do componente selecionado, logo abaixo dele na folha. */
export function ComponentFloatingToolbar({
  component,
  left,
  top,
}: {
  component: ReportComponent;
  left: number;
  top: number;
}) {
  const updateComponent = useDesignerStore((state) => state.updateComponent);
  const duplicateComponent = useDesignerStore((state) => state.duplicateComponent);
  const removeComponent = useDesignerStore((state) => state.removeComponent);
  const openTextEditorModal = useDesignerStore((state) => state.openTextEditorModal);
  const isText = component.type === 'text';
  const isBold = component.style.fontWeight === 'bold' || Number(component.style.fontWeight) >= 600;
  const patchStyle = (patch: React.CSSProperties) =>
    updateComponent(component.id, { style: { ...component.style, ...patch } });

  return (
    <div
      role="toolbar"
      aria-label="Ações do componente"
      className={cn(
        'no-drag absolute z-50 flex items-center gap-0.5 rounded-lg border border-neutral-200/90 p-0.5',
        'bg-weave-surface/95 shadow-[0_2px_12px_rgba(0,0,0,0.1)] backdrop-blur-sm',
      )}
      style={{ left, top }}
      onPointerDown={stopBubble}
      onMouseDown={stopBubble}
    >
      {isText && (
        <>
          <ActionButton
            icon={PencilLine}
            label="Editar texto"
            onClick={() => openTextEditorModal(component.id)}
          />
          <ActionButton
            icon={Bold}
            label="Negrito no texto inteiro"
            active={isBold}
            onClick={() => patchStyle({ fontWeight: isBold ? undefined : 'bold' })}
          />
          <div className="mx-0.5 h-4 w-px bg-neutral-200" aria-hidden />
          {ALIGN_ACTIONS.map(({ value, label, icon }) => (
            <ActionButton
              key={value}
              icon={icon}
              label={label}
              active={(component.style.textAlign ?? 'left') === value}
              onClick={() => patchStyle({ textAlign: value })}
            />
          ))}
          <div className="mx-0.5 h-4 w-px bg-neutral-200" aria-hidden />
        </>
      )}
      <ActionButton
        icon={Copy}
        label="Duplicar (Ctrl+D)"
        onClick={() => duplicateComponent(component.id)}
      />
      <ActionButton
        icon={Trash2}
        label="Excluir (Delete)"
        danger
        onClick={() => removeComponent(component.id)}
      />
    </div>
  );
}
