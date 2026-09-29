import React from 'react';
import { LayoutTemplate, MousePointerClick, Database, Eye } from 'lucide-react';
import { DESIGNER_SHORTCUTS_HINT, DESIGNER_STEPS } from '../onboarding/designerOnboarding';
import { cn } from '../../../../shared/ui/cn';
import { useMediaQuery } from '../../../../shared/hooks/useMediaQuery';

const STEP_ICONS = [LayoutTemplate, Database, MousePointerClick, Eye] as const;

interface DesignerEmptyStateProps {
  variant?: 'canvas' | 'panel';
  className?: string;
}

export const DesignerEmptyState: React.FC<DesignerEmptyStateProps> = ({
  variant = 'canvas',
  className,
}) => {
  const isCanvas = variant === 'canvas';
  const isNarrowViewport = useMediaQuery('(max-width: 1279px)');
  const steps =
    isCanvas || !isNarrowViewport ? DESIGNER_STEPS : DESIGNER_STEPS.slice(0, 2);

  return (
    <div
      className={cn(
        'text-neutral-500',
        isCanvas ? 'flex flex-col items-center justify-center px-8 py-12 max-w-md mx-auto' : 'px-4 py-6',
        className
      )}
    >
      <div className={cn('text-center', isCanvas && 'mb-8')}>
        <div
          className={cn(
            'inline-flex items-center justify-center rounded-xl bg-neutral-100 text-neutral-400 mb-3',
            isCanvas ? 'w-12 h-12' : 'w-10 h-10 mb-2'
          )}
        >
          <LayoutTemplate className={isCanvas ? 'w-6 h-6' : 'w-5 h-5'} />
        </div>
        <h3
          className={cn(
            'font-semibold text-neutral-700',
            isCanvas ? 'text-base' : 'text-[13px]'
          )}
        >
          {isCanvas ? 'Comece seu relatório' : 'Nenhum elemento selecionado'}
        </h3>
        <p className={cn('text-neutral-400 mt-1', isCanvas ? 'text-sm' : 'text-[12px]')}>
          {isCanvas
            ? 'Siga os passos abaixo para montar o layout da forma mais simples.'
            : 'Clique em uma banda, componente ou em área vazia da folha para editar as propriedades.'}
        </p>
      </div>

      <ol className={cn('space-y-3 w-full', isCanvas ? 'text-left' : 'mt-4')}>
        {steps.map((item, index) => {
          const Icon = STEP_ICONS[index] ?? LayoutTemplate;
          return (
            <li
              key={item.step}
              className={cn(
                'flex gap-3 rounded-lg border border-neutral-200/80 bg-white/80',
                isCanvas ? 'p-3.5 shadow-sm' : 'p-2.5 bg-neutral-50/80'
              )}
            >
              <div className="flex flex-col items-center shrink-0">
                <span
                  className={cn(
                    'flex items-center justify-center rounded-full bg-neutral-900 text-white font-semibold',
                    isCanvas ? 'w-6 h-6 text-[11px]' : 'w-5 h-5 text-[10px]'
                  )}
                >
                  {item.step}
                </span>
              </div>
              <div className="min-w-0 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span
                    className={cn(
                      'font-medium text-neutral-800',
                      isCanvas ? 'text-sm' : 'text-[12px]'
                    )}
                  >
                    {item.title}
                  </span>
                </div>
                <p
                  className={cn(
                    'text-neutral-500 mt-0.5 leading-snug',
                    isCanvas ? 'text-xs' : 'text-[11px]'
                  )}
                >
                  {item.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {isCanvas && (
        <p className="mt-6 text-[11px] text-neutral-400 text-center leading-relaxed max-w-sm">
          {DESIGNER_SHORTCUTS_HINT}
        </p>
      )}
    </div>
  );
};
