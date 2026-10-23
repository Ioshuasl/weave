import { AnimatePresence, motion } from 'framer-motion';
import { Check, Eye, Loader2, Paperclip, SendHorizontal, Sparkles, Undo2, X } from 'lucide-react';
import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type KeyboardEvent } from 'react';
import { createId } from '../../../../shared/domain/id';
import { cn } from '../../../../shared/ui/cn';
import {
  ASSISTANT_IMAGE_DEFAULT_REQUEST,
  ASSISTANT_IMAGE_LIMITS,
  ASSISTANT_IMAGE_PRIVACY_HINT,
  buildAssistantContext,
  diffReportIds,
  hasReportChanges,
  validateAssistantImageFile,
  type AssistantAction,
  type AssistantImage,
  type AssistantResponse,
  type AssistantSender,
  type AssistantUsage,
  type ReportChanges,
} from '../../../assistant/domain';
import type { ReportDefinition } from '../../../report/domain';
import { prepareAssistantImage } from '../../../assistant/infrastructure/prepareAssistantImage';
import { useDataSourceCatalog } from '../../../data-source/ui';
import { useDesignerStore, useDesignerStoreApi } from '../../application/store/DesignerStoreContext';
import { AssistantUsageMeter } from './AssistantUsageMeter';
import { revealFirstChange } from './revealChanges';

interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  /** Posição do histórico logo após aplicar — habilita o "Desfazer" só enquanto for o último passo */
  historyPointer?: number;
  /** Quantos passos de histórico a mensagem criou (um pedido simples = 1; plano = 1 por etapa) */
  undoSteps?: number;
  applied?: number;
  isError?: boolean;
  /** Plano em etapas aguardando confirmação / em execução */
  plan?: { steps: string[]; status: 'pending' | 'running' | 'cancelled'; current: number };
  /** Pergunta da IA (dúvida): respostas sugeridas — clicar envia a opção como próximo pedido */
  options?: string[];
  /** Alterações sensíveis aguardando o "Confirmar" do usuário */
  confirm?: { resumo: string[]; acoes: AssistantAction[] };
  /** Miniaturas (data URL) das imagens anexadas ao pedido */
  thumbs?: string[];
  /** O que a alteração mexeu no relatório: habilita o "Ver onde mudou" */
  changes?: ReportChanges;
}

const toDataUrl = (image: AssistantImage) => `data:${image.tipo};base64,${image.base64}`;

const PANEL_WIDTH = 320;
const SUGGESTIONS = ['Deixe o título em negrito', 'Adicione uma coluna à tabela', 'O que é uma banda?'];

export function AssistantPanel({
  isOpen,
  onClose,
  onSend,
  allowImages = false,
  showUsage = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSend: AssistantSender;
  /** Mostra o anexo de imagem (o backend do host precisa aceitar `imagens`) */
  allowImages?: boolean;
  /** Mostra o consumo de tokens no cabeçalho (o backend do host precisa devolver `uso`) */
  showUsage?: boolean;
}) {
  const store = useDesignerStoreApi();
  const catalog = useDataSourceCatalog();
  const applyAssistantActions = useDesignerStore((state) => state.applyAssistantActions);
  const flashChanges = useDesignerStore((state) => state.flashChanges);
  const undo = useDesignerStore((state) => state.undo);
  const historyPointer = useDesignerStore((state) => state.historyPointer);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [images, setImages] = useState<AssistantImage[]>([]);
  const [imageError, setImageError] = useState('');
  const [usage, setUsage] = useState<AssistantUsage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef(createId());
  const endRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  const handleScroll = () => {
    endRef.current?.scrollIntoView({ block: 'end' });
  };

  useEffect(() => {
    handleScroll();
  }, [messages, isSending]);

  const requestAssistant = async (pedido: string, modo: 'normal' | 'passo', imagens: AssistantImage[] = []): Promise<AssistantResponse | null | undefined> => {
    const { report, data, selectedIds } = store.getState();
    const response = await onSend({
      sessao_id: sessionIdRef.current,
      pedido,
      modo,
      ...(imagens.length ? { imagens } : {}),
      ...buildAssistantContext(report, data, catalog, selectedIds),
    });
    if (response?.uso) setUsage((list) => [...list, response.uso as AssistantUsage]);
    return response;
  };

  /** Acende o anel nos itens alterados e leva o canvas até o primeiro, se estiver fora da tela */
  const showChanges = (changes: ReportChanges) => {
    flashChanges(changes);
    const root: ParentNode = panelRef.current?.closest('[data-weave-root]') ?? document;
    requestAnimationFrame(() => revealFirstChange(root, changes));
  };

  /** Compara o relatório com o estado de antes e destaca o que mudou; devolve o que mudou para o "Ver onde mudou" */
  const highlightChanges = (before: ReportDefinition) => {
    const changes = diffReportIds(before, store.getState().report);
    if (!hasReportChanges(changes)) return undefined;
    showChanges(changes);
    return changes;
  };

  const addMessage = (message: Omit<AssistantMessage, 'id'>) => {
    const id = createId();
    setMessages((list) => [...list, { ...message, id }]);
    return id;
  };

  const executeSend = async (value: string) => {
    const sentImages = images;
    const pedido = value.trim() || (sentImages.length ? ASSISTANT_IMAGE_DEFAULT_REQUEST : '');
    if (!pedido || isSending) return;
    setText('');
    setImages([]);
    setImageError('');
    setIsSending(true);
    addMessage({ role: 'user', text: pedido, thumbs: sentImages.map(toDataUrl) });
    try {
      const before = store.getState().historyPointer;
      const response = await requestAssistant(pedido, 'normal', sentImages);
      if (!response) {
        addMessage({ role: 'assistant', text: 'Não consegui falar com o assistente agora. Tente de novo em instantes.', isError: true });
        return;
      }
      if (response.pergunta) {
        addMessage({ role: 'assistant', text: response.mensagem, options: response.opcoes });
        return;
      }
      if (response.confirmacao) {
        addMessage({ role: 'assistant', text: response.mensagem, confirm: response.confirmacao });
        return;
      }
      if (response.passos?.length) {
        addMessage({ role: 'assistant', text: response.mensagem, plan: { steps: response.passos, status: 'pending', current: 0 } });
        return;
      }
      const reportBefore = store.getState().report;
      const result = response.acoes.length ? applyAssistantActions(response.acoes) : { applied: 0, skipped: 0 };
      const after = store.getState().historyPointer;
      addMessage({
        role: 'assistant',
        text: result.skipped && !result.applied ? 'Não consegui aplicar essa alteração. Tente de outro jeito.' : response.mensagem,
        changes: result.applied ? highlightChanges(reportBefore) : undefined,
        applied: result.applied,
        historyPointer: after,
        undoSteps: after - before,
      });
    } finally {
      setIsSending(false);
    }
  };

  const updatePlan = (id: string, plan: AssistantMessage['plan']) =>
    setMessages((list) => list.map((m) => (m.id === id ? { ...m, plan } : m)));

  /** Executa cada etapa do plano em sequência; o contexto de cada uma parte do relatório já alterado pelas anteriores. */
  const executePlan = async (message: AssistantMessage) => {
    if (!message.plan || isSending) return;
    setIsSending(true);
    const before = store.getState().historyPointer;
    const reportBefore = store.getState().report;
    let applied = 0;
    let failedAt = -1;
    let question: { text: string; options?: string[] } | undefined;
    try {
      for (const [index, step] of message.plan.steps.entries()) {
        updatePlan(message.id, { ...message.plan, status: 'running', current: index });
        const response = await requestAssistant(step, 'passo');
        if (response?.pergunta) {
          question = { text: response.mensagem, options: response.opcoes };
          failedAt = index;
          break;
        }
        const result = response?.acoes.length ? applyAssistantActions(response.acoes) : { applied: 0, skipped: 0 };
        if (!response || (response.acoes.length > 0 && result.applied === 0)) {
          failedAt = index;
          break;
        }
        applied += result.applied;
      }
    } finally {
      setIsSending(false);
      updatePlan(message.id, undefined);
    }
    const after = store.getState().historyPointer;
    const total = message.plan.steps.length;
    addMessage({
      role: 'assistant',
      text:
        failedAt < 0
          ? `Plano concluído: ${applied} ${applied === 1 ? 'alteração aplicada' : 'alterações aplicadas'}.`
          : `${question ? 'Pausei' : 'Parei'} na etapa ${failedAt + 1} de ${total}${question ? ': preciso de uma resposta sua.' : ' (não consegui aplicar).'} ${applied ? `As ${failedAt} anteriores foram aplicadas.` : 'Nada foi alterado.'}`,
      isError: failedAt >= 0 && !question,
      changes: applied ? highlightChanges(reportBefore) : undefined,
      applied,
      historyPointer: after,
      undoSteps: after - before,
    });
    if (question) addMessage({ role: 'assistant', text: question.text, options: question.options });
  };

  const executeConfirm = (message: AssistantMessage) => {
    if (!message.confirm || isSending) return;
    const before = store.getState().historyPointer;
    const reportBefore = store.getState().report;
    const result = applyAssistantActions(message.confirm.acoes);
    const after = store.getState().historyPointer;
    setMessages((list) => list.map((m) => (m.id === message.id ? { ...m, confirm: undefined } : m)));
    addMessage({
      role: 'assistant',
      text: result.applied ? 'Pronto, apliquei.' : 'Não consegui aplicar essa alteração.',
      changes: result.applied ? highlightChanges(reportBefore) : undefined,
      applied: result.applied,
      historyPointer: after,
      undoSteps: after - before,
      isError: !result.applied,
    });
  };

  const cancelConfirm = (id: string) =>
    setMessages((list) => list.map((m) => (m.id === id ? { ...m, confirm: undefined, text: 'Cancelado. Nada foi alterado.' } : m)));

  const handleUndo = (message: AssistantMessage) => {
    for (let i = 0; i < (message.undoSteps ?? 1); i += 1) undo();
  };

  const handleFiles = async (files: File[]) => {
    setImageError('');
    let count = images.length;
    const ready: AssistantImage[] = [];
    for (const file of files) {
      const error = validateAssistantImageFile(file, count);
      if (error) {
        setImageError(error);
        continue;
      }
      try {
        ready.push(await prepareAssistantImage(file));
        count += 1;
      } catch {
        setImageError('Não consegui ler essa imagem. Tente outro arquivo.');
      }
    }
    if (ready.length) setImages((list) => [...list, ...ready]);
  };

  const handlePickFiles = () => {
    const input = fileInputRef.current;
    const files = [...(input?.files ?? [])];
    if (input) input.value = '';
    handleFiles(files);
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = [...event.clipboardData.files].filter((file) => file.type.startsWith('image/'));
    if (!allowImages || !files.length) return;
    event.preventDefault();
    handleFiles(files);
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    if (!allowImages) return;
    event.preventDefault();
    handleFiles([...event.dataTransfer.files].filter((file) => file.type.startsWith('image/')));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    executeSend(text);
  };

  const lastUndoableId = [...messages].reverse().find((m) => m.applied)?.id;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 16, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 16, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
          className="absolute bottom-3 right-3 top-3 z-30 overflow-hidden rounded-xl border border-neutral-200 bg-weave-surface shadow-xl"
        >
          <aside
            ref={panelRef}
            data-tour="assistant"
            aria-label="Assistente de IA"
            style={{ width: PANEL_WIDTH }}
            className="relative flex h-full flex-col"
            onDragOver={allowImages ? (event) => event.preventDefault() : undefined}
            onDrop={allowImages ? handleDrop : undefined}
          >
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-neutral-200 px-3">
              <span className="flex items-center gap-2 text-[13px] font-semibold text-neutral-900">
                <Sparkles className="size-3.5 text-indigo-500" aria-hidden />
                Assistente
              </span>
              <div className="flex items-center">
                {showUsage && usage.length > 0 && <AssistantUsageMeter usage={usage} />}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fechar assistente"
                  title="Fechar"
                  className="flex size-6 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
              {messages.length === 0 && (
                <div className="flex flex-col gap-2 text-[13px] text-neutral-600">
                  <p>Peça o que quer mudar no relatório. Eu aplico e você pode desfazer com um clique.</p>
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => executeSend(suggestion)}
                      className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-left text-neutral-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className={cn('flex flex-col gap-1', message.role === 'user' ? 'items-end' : 'items-start')}>
                  {message.thumbs && message.thumbs.length > 0 && (
                    <div className="flex max-w-[92%] flex-wrap justify-end gap-1">
                      {message.thumbs.map((src, index) => (
                        <img key={index} src={src} alt={`Imagem anexada ${index + 1}`} className="h-14 w-auto max-w-24 rounded-md border border-neutral-200 object-cover" />
                      ))}
                    </div>
                  )}
                  <p
                    className={cn(
                      'max-w-[92%] whitespace-pre-wrap rounded-xl px-2.5 py-1.5 text-[13px]',
                      message.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-800',
                      message.isError && 'bg-red-50 text-red-700'
                    )}
                  >
                    {message.text}
                  </p>
                  {message.plan && (
                    <div className="flex w-full max-w-[92%] flex-col gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/60 p-2">
                      <ol className="flex flex-col gap-1 text-[13px] text-neutral-800">
                        {message.plan.steps.map((step, index) => (
                          <li key={step} className="flex items-start gap-1.5">
                            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-indigo-600">
                              {message.plan?.status === 'running' && index < message.plan.current ? <Check className="size-3" aria-hidden /> : message.plan?.status === 'running' && index === message.plan.current ? <Loader2 className="size-3 animate-spin" aria-hidden /> : index + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                      {message.plan.status === 'pending' && (
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => executePlan(message)}
                            disabled={isSending}
                            className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
                          >
                            Executar plano
                          </button>
                          <button
                            type="button"
                            onClick={() => updatePlan(message.id, undefined)}
                            disabled={isSending}
                            className="rounded-lg px-2.5 py-1 text-xs text-neutral-600 transition-colors hover:bg-white disabled:opacity-40"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {message.options && message.options.length > 0 && (
                    <div className="flex max-w-[92%] flex-wrap gap-1.5">
                      {message.options.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => executeSend(option)}
                          disabled={isSending}
                          className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-left text-xs text-indigo-700 transition-colors hover:bg-indigo-50 disabled:opacity-40"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                  {message.confirm && (
                    <div className="flex w-full max-w-[92%] flex-col gap-1.5 rounded-xl border border-amber-200 bg-amber-50/70 p-2">
                      <ul className="flex flex-col gap-1 text-[13px] text-neutral-800">
                        {message.confirm.resumo.map((line) => (
                          <li key={line} className="flex items-start gap-1.5">
                            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-amber-500" aria-hidden />
                            {line}
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => executeConfirm(message)}
                          disabled={isSending}
                          className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelConfirm(message.id)}
                          disabled={isSending}
                          className="rounded-lg px-2.5 py-1 text-xs text-neutral-600 transition-colors hover:bg-white disabled:opacity-40"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                  {message.id === lastUndoableId && (
                    <button
                      type="button"
                      onClick={() => handleUndo(message)}
                      disabled={historyPointer !== message.historyPointer}
                      className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:pointer-events-none disabled:opacity-40"
                    >
                      <Undo2 className="size-3" aria-hidden />
                      {message.applied === 1 ? '1 alteração aplicada · Desfazer' : `${message.applied} alterações aplicadas · Desfazer`}
                    </button>
                  )}
                  {message.changes && (
                    <button
                      type="button"
                      onClick={() => showChanges(message.changes as ReportChanges)}
                      title="Mostra no relatório onde a alteração foi feita"
                      className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                    >
                      <Eye className="size-3" aria-hidden />
                      Ver onde mudou
                    </button>
                  )}
                </div>
              ))}

              {isSending && (
                <p className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                  Pensando…
                </p>
              )}
              <div ref={endRef} />
            </div>

            <div className="flex shrink-0 flex-col gap-2 border-t border-neutral-200 p-2.5">
              {images.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    {images.map((image, index) => (
                      <div key={`${image.nome}-${index}`} className="relative">
                        <img src={toDataUrl(image)} alt={`Imagem anexada ${index + 1}`} className="h-12 w-auto max-w-20 rounded-md border border-neutral-200 object-cover" />
                        <button
                          type="button"
                          onClick={() => setImages((list) => list.filter((_, i) => i !== index))}
                          aria-label={`Remover imagem ${index + 1}`}
                          title="Remover"
                          className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-neutral-800 text-white transition-colors hover:bg-neutral-600"
                        >
                          <X className="size-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] leading-snug text-amber-700">{ASSISTANT_IMAGE_PRIVACY_HINT}</p>
                </div>
              )}
              {imageError && <p className="text-[11px] text-red-600">{imageError}</p>}
              <div className="flex items-end gap-2">
                {allowImages && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      className="hidden"
                      onChange={handlePickFiles}
                      aria-hidden
                      tabIndex={-1}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSending || images.length >= ASSISTANT_IMAGE_LIMITS.maxCount}
                      aria-label="Anexar imagem"
                      title="Anexar imagem de referência (ou cole / arraste)"
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:pointer-events-none disabled:opacity-40"
                    >
                      <Paperclip className="size-4" />
                    </button>
                  </>
                )}
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  rows={2}
                  maxLength={1000}
                  placeholder={images.length ? 'O que a imagem deve mudar? (opcional)' : 'Ex.: coloque o apresentante no cabeçalho'}
                  aria-label="Pedido ao assistente"
                  className="min-h-0 flex-1 resize-none rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[13px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => executeSend(text)}
                  disabled={isSending || (text.trim().length < 3 && images.length === 0)}
                  aria-label="Enviar"
                  title="Enviar"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:pointer-events-none disabled:opacity-40"
                >
                  <SendHorizontal className="size-4" />
                </button>
              </div>
            </div>
          </aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
