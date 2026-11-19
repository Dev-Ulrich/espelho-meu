import { useId } from 'react';
import './photo.css';

export function PhotoPicker({ enabled, onFileChange }: {
  enabled: boolean;
  onFileChange: (file: File | null) => void;
}) {
  const id = useId();
  return <div className="photo-picker">
    <label htmlFor={id}>Sua foto para a consultoria</label>
    <p id={`${id}-hint`}>JPG ou PNG • rosto visível e boa iluminação.</p>
    <input id={id} type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png"
      disabled={!enabled} aria-describedby={`${id}-hint`}
      onChange={event => {
        const file = event.currentTarget.files?.[0];
        if (file && enabled) onFileChange(file);
        event.currentTarget.value = '';
      }} />
    {!enabled && <p>Entre na sua conta para selecionar uma foto.</p>}
  </div>;
}
