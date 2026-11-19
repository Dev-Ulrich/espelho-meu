import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { validatePhoto } from './validation';
import './photo.css';

interface PhotoPickerProps {
  enabled: boolean;
  maxBytes: number | null;
  onFileChange: (file: File | null) => void;
}

export function PhotoPicker({ enabled, maxBytes, onFileChange }: PhotoPickerProps) {
  const id = useId();
  const sequence = useRef(0);
  const [error, setError] = useState('');
  const configured = maxBytes !== null && Number.isSafeInteger(maxBytes) && maxBytes > 0;
  const available = enabled && configured;

  useEffect(() => {
    sequence.current += 1;
    setError('');
    return () => { sequence.current += 1; };
  }, [enabled, maxBytes]);

  async function select(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file || !available || maxBytes === null) return;
    const request = ++sequence.current;
    onFileChange(null);
    const message = await validatePhoto(file, maxBytes);
    if (request !== sequence.current) return;
    setError(message ?? '');
    if (!message) onFileChange(file);
  }

  return <div className="photo-picker">
    <label htmlFor={id}>Sua foto para a consultoria</label>
    <p id={`${id}-hint`}>JPG ou PNG • rosto visível e boa iluminação.</p>
    <input id={id} type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png"
      disabled={!available} aria-describedby={`${id}-hint ${id}-status`}
      aria-invalid={Boolean(error)} onChange={select} />
    {!enabled && <p>Entre na sua conta para selecionar uma foto.</p>}
    {!configured && <p>A seleção será liberada quando o limite de tamanho for confirmado.</p>}
    <p id={`${id}-status`} role="status">{error}</p>
  </div>;
}
