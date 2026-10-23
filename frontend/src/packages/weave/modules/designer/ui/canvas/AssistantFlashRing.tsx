import { useDesignerStore } from '../../application/store/DesignerStoreContext';

/**
 * Anel sutil que acende por um instante no componente/banda que o assistente de IA acabou de alterar.
 * Cada um só assina o próprio "está destacado?" (o número muda a cada destaque e reinicia a animação).
 */
export function AssistantFlashRing({ id, kind }: { id: string; kind: 'component' | 'band' }) {
  const nonce = useDesignerStore((state) => ((kind === 'component' ? state.flash.components : state.flash.bands).includes(id) ? state.flash.nonce : 0));
  return nonce ? <span key={nonce} data-flash-kind={kind} className="weave-flash" aria-hidden /> : null;
}
