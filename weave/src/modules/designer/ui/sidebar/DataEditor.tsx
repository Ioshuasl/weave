import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useDesignerStore } from '../../application/store/DesignerStoreContext';

export const DataEditor = ({ onClose }: { onClose: () => void }) => {
  const data = useDesignerStore(state => state.data);
  const setReportData = useDesignerStore(state => state.setReportData);
  const [jsonString, setJsonString] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setJsonString(JSON.stringify(data, null, 2));
  }, [data]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonString);
      setReportData(parsed);
      onClose();
    } catch {
      setError('JSON inválido. Verifique vírgulas, aspas e chaves.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/50 flex items-center justify-center p-8 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col h-[80vh]">
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Editar dados</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Cada chave do objeto vira uma fonte de dados (ex.: users, pedidos).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-4 flex flex-col min-h-0">
          <p className="text-sm text-neutral-500 mb-2">
            Os valores devem ser <strong className="font-medium text-neutral-700">arrays de objetos</strong>.
            Após salvar, os datasets aparecem em Fontes de dados na barra lateral.
          </p>
          <textarea
            className="flex-1 w-full font-mono text-sm p-4 border border-neutral-300 rounded focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300 outline-none resize-none"
            value={jsonString}
            onChange={(e) => {
              setJsonString(e.target.value);
              setError(null);
            }}
            spellCheck={false}
            aria-label="Editor JSON dos datasets"
          />
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>

        <div className="p-4 border-t border-neutral-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-300 rounded hover:bg-neutral-50 text-sm font-medium text-neutral-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-neutral-900 text-white rounded hover:bg-neutral-800 text-sm font-medium"
          >
            Salvar dados
          </button>
        </div>
      </div>
    </div>
  );
};
