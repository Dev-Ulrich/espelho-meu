import { PhotoPicker } from './PhotoPicker';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { type Journey } from '../../services/api/consultation';
import { privateApi, privateResponse } from '../../services/api/privateApi';
import './consultation.css';

export function PhotoSimulation({ area, style }: { area: Journey; style: string }) {
  const endpoint = `/consultoria/${area}/simulacao`;
  const [availability, setAvailability] = useState<'checking' | 'ready' | 'off' | 'error'>('checking');
  const [photo, setPhoto] = useState<File>();
  const [busy, setBusy] = useState(false);
  const [picture, setPicture] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    privateApi<{ disponivel: boolean }>(endpoint, { signal: controller.signal })
      .then(value => {
        if (!controller.signal.aborted) setAvailability(value.disponivel === true ? 'ready' : 'off');
      })
      .catch(() => { if (!controller.signal.aborted) setAvailability('error'); });
    return () => {
      controller.abort();
      request.current?.abort();
    };
  }, [endpoint]);

  useEffect(() => {
    if (!picture) return;
    const url = URL.createObjectURL(picture);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [picture]);

  async function simulate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (request.current) return;
    const data = new FormData(event.currentTarget);
    if (!(photo instanceof File) || !['image/jpeg', 'image/png', 'image/webp'].includes(photo.type) || photo.size > 5 * 1024 * 1024) {
      setError('Selecione uma foto JPG, PNG ou WebP de até 5 MB.');
      return;
    }
    const code = String(data.get('codigo') ?? '').trim();
    if (!code) {
      setError('Informe o código de demonstração.');
      return;
    }
    if (!data.has('autoriza')) {
      setError('Confirme a autorização de envio da foto.');
      return;
    }
    data.set('foto', photo);
    data.delete('codigo');
    data.delete('autoriza');
    data.set('estilo', style);
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError('');
    setImageUrl('');
    setPicture(null);
    try {
      const response = await privateResponse(endpoint, {
        method: 'POST', headers: { Accept: 'image/jpeg, application/json', 'X-Simulacao-Codigo': code }, body: data, signal: controller.signal,
      });
      const blob = await response.blob();
      if (blob.type !== 'image/jpeg') throw new Error('O serviço retornou um resultado inesperado.');
      if (!controller.signal.aborted) setPicture(blob);
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Falha ao gerar a simulação.');
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setBusy(false);
      }
    }
  }

  return <section className="notice photo-simulation" aria-label="Simulação na foto">
    <h4>Simular {style}</h4>
    {availability === 'checking' && <p role="status">Conferindo disponibilidade…</p>}
    {availability === 'off' && <p role="status">A edição de fotos ainda não foi ativada neste servidor.</p>}
    {availability === 'error' && <p role="alert">Não foi possível verificar a disponibilidade da edição de fotos.</p>}
    {availability === 'ready' && <form onSubmit={simulate} aria-busy={busy}>
      <fieldset disabled={busy}>
        <PhotoPicker photo={photo} onChange={file => { setPhoto(file); setError(''); }} />
        <label>Código de demonstração<input type="password" name="codigo" required autoComplete="off" /></label>
        <label className="simulation-consent"><input type="checkbox" name="autoriza" required /> Autorizo o envio desta foto ao serviço de edição da OpenAI para gerar esta simulação.</label>
      </fieldset>
      <button className="action-link action-link--primary" disabled={busy}>{busy ? 'Gerando simulação…' : 'Gerar simulação'}</button>
    </form>}
    {error && <p role="alert">{error}</p>}
    {imageUrl && <figure><img src={imageUrl} alt={`Simulação aproximada de ${style}`} /><figcaption>Simulação aproximada do estilo.</figcaption></figure>}
  </section>;
}
