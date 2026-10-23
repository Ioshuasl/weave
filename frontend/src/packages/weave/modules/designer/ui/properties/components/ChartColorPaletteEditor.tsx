import { Plus, Trash2 } from 'lucide-react';
import React from 'react';
import { DEFAULT_CHART_COLOR_PALETTE } from '../../../../components/chart/domain';
import { PropertyColorInput } from '../controls/PropertyFields';

export function ChartColorPaletteEditor({
  colors,
  onChange,
  onPreview,
  onPreviewCancel,
}: {
  colors: string[];
  onChange: (colors: string[]) => void;
  onPreview?: (colors: string[]) => void;
  onPreviewCancel?: () => void;
}) {
  const palette = colors.length > 0 ? colors : [...DEFAULT_CHART_COLOR_PALETTE];

  const updateColor = (index: number, color: string) => {
    const next = [...palette];
    next[index] = color;
    onChange(next);
  };

  const removeColor = (index: number) => {
    if (palette.length <= 1) return;
    onChange(palette.filter((_, i) => i !== index));
  };

  const addColor = () => {
    const nextIndex = palette.length % DEFAULT_CHART_COLOR_PALETTE.length;
    onChange([...palette, DEFAULT_CHART_COLOR_PALETTE[nextIndex]]);
  };

  return (
    <div className="space-y-2">
      <span className="block text-[12px] font-medium text-neutral-600">Cores das fatias</span>
      <div className="space-y-2">
        {palette.map((color, index) => (
          <div key={`${index}-${color}`} className="flex items-end gap-2">
            <div className="flex-1 min-w-0">
              <PropertyColorInput
                label={`Cor ${index + 1}`}
                value={color}
                onPreview={
                  onPreview
                    ? (value) => {
                        const next = [...palette];
                        next[index] = value;
                        onPreview(next);
                      }
                    : undefined
                }
                onPreviewCancel={onPreviewCancel}
                onChange={(value) => updateColor(index, value)}
              />
            </div>
            <button
              type="button"
              onClick={() => removeColor(index)}
              disabled={palette.length <= 1}
              className="mb-0.5 rounded-lg p-2 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
              title="Remover cor"
              aria-label={`Remover cor ${index + 1}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addColor}
        className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-3 py-1.5 text-[12px] font-medium text-neutral-700 transition-colors hover:bg-neutral-200/70"
      >
        <Plus className="w-3.5 h-3.5" />
        Adicionar cor
      </button>
    </div>
  );
}
