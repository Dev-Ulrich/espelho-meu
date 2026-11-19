import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, CircleAlert, Sparkles, X } from 'lucide-react';
import './feedback.css';

type Notice = { title: string; message: string; action?: { label: string; run: () => void }; error?: boolean };
const ToastContext = createContext<(notice: Notice) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice>();
  const notify = useCallback((value: Notice) => setNotice(value), []);
  return <ToastContext.Provider value={notify}>{children}
    <div className="toast-region" aria-live="polite" aria-atomic="true">
      {notice && <aside className="feedback-toast">
        <span className="feedback-icon">{notice.error ? <CircleAlert /> : <CheckCircle2 />}</span>
        <div><h2>{notice.title}</h2><p>{notice.message}</p>
          {notice.action && <button type="button" className="text-link" onClick={() => { setNotice(undefined); notice.action?.run(); }}>{notice.action.label}</button>}
        </div>
        <button type="button" className="icon-button" aria-label="Fechar aviso" onClick={() => setNotice(undefined)}><X size={20} /></button>
      </aside>}
    </div>
  </ToastContext.Provider>;
}

export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = dialog.current;
    const overflow = document.body.style.overflow;
    node?.showModal();
    document.body.style.overflow = 'hidden';
    return () => { node?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog ref={dialog} className={`feedback-modal ${wide ? 'feedback-modal--wide' : ''}`} aria-labelledby={id}
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <button type="button" className="icon-button modal-close" aria-label="Fechar janela" onClick={onClose}><X /></button>
    <h2 id={id}>{title}</h2>{children}
  </dialog>;
}

export function AnalysisModal({ photo, onCancel }: { photo: boolean; onCancel: () => void }) {
  return <Modal title={photo ? 'Analisando sua foto…' : 'Preparando suas recomendações…'} onClose={onCancel}>
    <div role="status" className="analysis-status">
      <p>Estamos combinando suas escolhas para personalizar suas recomendações.</p>
      <div className="analysis-orbit" aria-hidden="true"><Sparkles size={42} /></div>
      <p>Isso pode levar alguns segundos.</p>
    </div>
    <button type="button" className="text-link" onClick={onCancel}>Cancelar e voltar à revisão</button>
  </Modal>;
}
