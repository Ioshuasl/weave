/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Página de demonstração do "sistema hospedeiro".
 * Lista relatórios mockados e abre o Weave em modo design ou preview.
 */

import React, { useState } from 'react';
import {
  Weave,
  REPORT_AUTO_SAVE_INTERVAL_MS,
  REPORT_HISTORY_PERSIST_INTERVAL_MS,
  type WeaveMode,
} from 'weave';
import { DEMO_DATA_SOURCE_CATALOG } from './mocks/demoHostData';
import { DEMO_HOST_PAGE_PRESETS } from './mocks/demoHostPresets';
import { resolveDemoReportBundle } from './mocks/demoReports';
import { MOCK_HOST_REPORTS, type HostReportTemplate } from './mocks/hostReports';
import { Eye, LayoutTemplate, Pencil, FileText } from 'lucide-react';
import { cn } from './lib/cn';

function StatusBadge({ status }: { status: HostReportTemplate['status'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        status === 'ativo'
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
          : 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
      )}
    >
      {status === 'ativo' ? 'Ativo' : 'Rascunho'}
    </span>
  );
}

interface ActiveReportSession {
  report: HostReportTemplate;
  mode: WeaveMode;
}

export default function App() {
  const [activeSession, setActiveSession] = useState<ActiveReportSession | null>(null);

  if (activeSession) {
    const { report: hostReport, mode } = activeSession;
    const { report, data } = resolveDemoReportBundle(hostReport.id);

    return (
      <div className="fixed inset-0 z-50 bg-neutral-50">
        <Weave
          reportId={hostReport.id}
          reportName={hostReport.name}
          mode={mode}
          report={report}
          data={data}
          dataSources={DEMO_DATA_SOURCE_CATALOG}
          pagePresets={DEMO_HOST_PAGE_PRESETS}
          onClose={() => setActiveSession(null)}
          onSave={async (payload) => {
            // Demo: POST/PUT na API com payload.report (layout JSON)
            console.info('[demo] onSave', payload.source ?? 'manual', payload.reportId);
            await new Promise((resolve) => setTimeout(resolve, 400));
          }}
          autoSaveIntervalMs={REPORT_AUTO_SAVE_INTERVAL_MS.MIN_1}
          onPersistHistory={async (payload) => {
            // Demo: POST versões em /api/reports/:id/history
            console.info(
              '[demo] onPersistHistory',
              payload.entries.length,
              'versões',
              payload.entries.map((e) => e.label)
            );
            await new Promise((resolve) => setTimeout(resolve, 300));
          }}
          historyPersistIntervalMs={REPORT_HISTORY_PERSIST_INTERVAL_MS.MIN_5}
          onPrint={async (payload) => {
            // Demo: host envia printJob para API, PDF ou agente local (Zebra, ESC/POS…)
            console.info('[demo] onPrint', {
              reportId: payload.reportId,
              version: payload.printJob.version,
              sheets: payload.printJob.sheets.length,
            });
            console.debug('[demo] printJob', payload.printJob);
          }}
          className="h-screen w-screen"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-200 flex items-center justify-center">
              <FileText className="w-5 h-5 text-neutral-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-neutral-900">Meu ERP — Relatórios</h1>
              <p className="text-sm text-neutral-500">
                Exemplo de integração: o host escolhe{' '}
                <code className="text-neutral-600 font-mono text-xs">mode=&quot;design&quot;</code> ou{' '}
                <code className="text-neutral-600 font-mono text-xs">mode=&quot;preview&quot;</code> no{' '}
                <code className="text-neutral-600 font-mono text-xs">&lt;Weave /&gt;</code>.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-800">Templates de relatório</h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              {MOCK_HOST_REPORTS.length} registros (dados mockados)
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 bg-white border border-neutral-200 rounded-lg px-3 py-2">
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>
              Integração: <code className="text-neutral-600 font-mono">&lt;Weave mode /&gt;</code>
            </span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/80">
                <th className="text-left font-medium text-neutral-600 px-4 py-3">Nome</th>
                <th className="text-left font-medium text-neutral-600 px-4 py-3 hidden sm:table-cell">
                  Dataset
                </th>
                <th className="text-left font-medium text-neutral-600 px-4 py-3 hidden md:table-cell">
                  Atualizado
                </th>
                <th className="text-left font-medium text-neutral-600 px-4 py-3">Status</th>
                <th className="text-right font-medium text-neutral-600 px-4 py-3 w-52">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {MOCK_HOST_REPORTS.map((report) => (
                <tr key={report.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900">{report.name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{report.description}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <code className="text-xs font-mono bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded">
                      {report.dataset}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 hidden md:table-cell">
                    {new Date(report.updatedAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={report.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveSession({ report, mode: 'preview' })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Visualizar
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSession({ report, mode: 'design' })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 border border-neutral-900 rounded-md hover:bg-neutral-800 transition-colors shadow-sm"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar layout
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-xs text-neutral-400 text-center max-w-2xl mx-auto leading-relaxed">
          O host injeta template e dados reais:{' '}
          <code className="font-mono text-neutral-500">
            {'<Weave report={...} data={...} mode="design" />'}
          </code>
          . Cada linha abre um template diferente (A4, multipágina, A5, cupom 80 mm, etiqueta
          extraprotocolar). O host injeta <code className="font-mono text-neutral-500">pagePresets</code>{' '}
          com &quot;Ofício cartório&quot; e &quot;Etiqueta extraprotocolar 9×5 cm&quot;.
        </p>
      </main>
    </div>
  );
}
