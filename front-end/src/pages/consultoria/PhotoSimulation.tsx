import { useEffect, useRef, useState, type FormEvent } from 'react';
import { privateApi } from '../../services/api/privateApi';
import { PhotoPicker } from './PhotoPicker';
import './consultation.css';

type PreviewState = 'QUEUED' | 'RUNNING' | 'READY' | 'RETRYABLE' | 'UNCERTAIN';
type Progress = { used: number; limit: number; photoSaved: boolean; cards: { cardId: string; state: PreviewState }[] };

export function useSimulationProgress(endpoint: string | undefined) {
  const [progress, setProgress] = useState<Progress>();
  const [error, setError] = useState('');
  const revision = useRef(0);

  useEffect(() => {
    if (!endpoint) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      const current = revision.current;
      try {
        const next = await privateApi<Progress>(endpoint!, { signal: controller.signal });
        if (!controller.signal.aborted && revision.current === current) {
          setProgress(next);
          setError('');
        }
      } catch (cause) {
        if (!controller.signal.aborted && revision.current === current) {
          setError(cause instanceof Error ? cause.message : 'Não foi possível consultar o progresso das prévias.');
        }
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(refresh, 3500);
      }
    }
    void refresh();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [endpoint]);

  function apply(next: Progress) {
    revision.current++;
    setProgress(next);
    setError('');
  }
  return { progress, error, apply };
}

export function PhotoSimulation({ endpoint, selected, progress, onAccepted }: {
  endpoint: string;
  selected: string[];
  progress?: Progress;
  onAccepted: (progress: Progress) => void;
}) {
  const [photo, setPhoto] = useState<File>();
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  const pending = selected.filter(id => {
    const state = progress?.cards.find(card => card.cardId === id)?.state;
    return !state || state === 'RETRYABLE';
  });
  const remaining = progress ? progress.limit - progress.used : 0;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (request.current || !progress || !consent || !pending.length || pending.length > remaining) return;
    if (!progress.photoSaved && !photo) return;
    const controller = new AbortController();
    request.current = controller;
    const data = new FormData();
    selected.forEach(id => data.append('cards', id));
    data.set('autoriza', 'true');
    if (!progress.photoSaved && photo) data.set('foto', photo);
    setBusy(true);
    setError('');
    try {
      const next = await privateApi<Progress>(endpoint, { method: 'POST', body: data, signal: controller.signal });
      if (!controller.signal.aborted) onAccepted(next);
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : 'Não foi possível confirmar o envio. Confira o estado das prévias.');
      }
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  return <section className="notice photo-simulation" aria-label="Simulação na foto">
    <h3>Simular na minha foto</h3>
    {!progress && <p role="status">Consultando suas prévias…</p>}
    {progress && remaining === 0 && <p>Todos os espaços de prévia desta consulta foram usados ou reservados.</p>}
    {progress && remaining > 0 && pending.length > remaining && <p role="status">
      Restam {remaining} {remaining === 1 ? 'prévia' : 'prévias'}. Remova da seleção {pending.length - remaining === 1 ? 'uma opção' : 'opções'} sem prévia para continuar.
    </p>}
    {progress && remaining > 0 && pending.length > 0 && pending.length <= remaining && <form onSubmit={submit} aria-busy={busy}>
      <fieldset disabled={busy}>
        {progress.photoSaved ? <p>As novas prévias usam a mesma foto desta consulta.</p>
          : <PhotoPicker photo={photo} onChange={file => { setPhoto(file); setConsent(false); setError(''); }} />}
        <label className="simulation-consent"><input type="checkbox" required checked={consent}
          onChange={event => setConsent(event.currentTarget.checked)} />
          Autorizo o Espelho Meu a guardar a foto para esta consulta e enviá-la à OpenAI para gerar as prévias.
        </label>
      </fieldset>
      <button className="action-link action-link--primary" disabled={busy || !consent || (!progress.photoSaved && !photo)}>
        {busy ? 'Enviando…' : pending.length === 1 ? 'Gerar prévia' : `Gerar ${pending.length} prévias`}
      </button>
    </form>}
    {error && <p role="alert">{error}</p>}
  </section>;
}

export function CardPreview({ endpoint, state, id, name }: {
  endpoint: string; state?: PreviewState; id: string; name: string;
}) {
  const [imageError, setImageError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  if (state === 'READY') return imageError ? <>
    <p role="alert">Não foi possível carregar a prévia salva.</p>
    <button type="button" className="text-link" onClick={() => { setAttempt(value => value + 1); setImageError(false); }}>Recarregar imagem</button>
  </> : <img className="comparison-preview" src={`/api/java${endpoint}/imagem?card=${encodeURIComponent(id)}&v=${attempt}`}
    alt={`Simulação aproximada de ${name}`} onError={() => setImageError(true)} />;
  const label = {
    QUEUED: 'Na fila…',
    RUNNING: 'Gerando prévia…',
    RETRYABLE: 'A edição não foi iniciada. Você pode tentar gerar novamente.',
    UNCERTAIN: 'O resultado da edição não pôde ser confirmado. Este espaço segue reservado.',
  };
  return <span role="status">{state ? label[state] : 'Sem prévia'}</span>;
}
