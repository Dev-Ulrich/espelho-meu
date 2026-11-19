import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { validatePhoto } from './validation';
import './photo.css';

interface PhotoPickerProps {
  enabled: boolean;
  maxBytes: number | null;
  // O pai mantém a foto apenas em memória e a limpa quando a sessão termina.
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export function PhotoPicker({ enabled, maxBytes, file, onFileChange }: PhotoPickerProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const sequence = useRef(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  const configured = maxBytes !== null && Number.isSafeInteger(maxBytes) && maxBytes > 0;
  const available = enabled && configured;
  useEffect(() => {
    // Invalida leituras antigas ao bloquear, alterar o limite ou desmontar.
    sequence.current += 1;
    setBusy(false);
    setError('');
    return () => { sequence.current += 1; };
  }, [enabled, maxBytes]);
  useEffect(() => {
    if (!file || !available) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview({ file, url });
    return () => URL.revokeObjectURL(url);
  }, [file, available]);
  async function select(event: ChangeEvent<HTMLInputElement>) {
    const candidate = event.currentTarget.files?.[0];
    event.currentTarget.value = ''; // Permite escolher o mesmo arquivo novamente.
    if (!candidate || !available || maxBytes === null) return;
    const request = ++sequence.current;
    setBusy(true);
    setError('');
    onFileChange(null);
    const nextError = await validatePhoto(candidate, maxBytes);
    if (request !== sequence.current) return;
    setBusy(false);
    setError(nextError ?? '');
    if (!nextError) onFileChange(candidate);
  }
  function remove() {
    sequence.current += 1;
    setBusy(false);
    setError('');
    onFileChange(null);
    input.current?.focus();
  }
  return <div className="photo-picker" aria-busy={busy}>
    <label htmlFor={id}>Sua foto para a consultoria</label>
    <p id={`${id}-hint`}>JPG ou PNG • rosto visível e boa iluminação.</p>
    <input ref={input} id={id} type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" disabled={!available}
      aria-describedby={`${id}-hint ${id}-status`} aria-invalid={Boolean(error)} onChange={select} />
    {!enabled && <p>Entre na sua conta para selecionar uma foto.</p>}
    {!configured && <p>A seleção será liberada quando o limite de tamanho for confirmado.</p>}
    {configured && <p>Limite: {(maxBytes! / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} MB.</p>}
    <p id={`${id}-status`} role="status">{error || (busy ? 'Conferindo arquivo…' : available && file ? `Foto selecionada: ${file.name}` : '')}</p>
    {available && file && preview?.file === file && <figure>
      <img src={preview.url} alt="Prévia da foto selecionada para a consultoria" onError={() => {
        onFileChange(null); setError('Não foi possível exibir esta imagem. Escolha outra foto.');
      }} />
      <figcaption>Prévia local • nenhuma foto foi enviada.</figcaption>
    </figure>}
    {available && file && <div className="photo-picker__actions">
      <button type="button" className="action-link action-link--outline" onClick={() => input.current?.click()}>Trocar foto</button>
      <button type="button" className="action-link action-link--outline" onClick={remove}>Remover foto</button>
    </div>}
  </div>;
}
