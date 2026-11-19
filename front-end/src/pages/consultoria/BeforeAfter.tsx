import { useId, useState } from 'react';
import './experience.css';

export function BeforeAfter({ before, after, illustrative = false }: { before: string; after: string; illustrative?: boolean }) {
  const [position, setPosition] = useState(50);
  const id = useId();
  return <figure className="before-after">
    <div className="before-after__images">
      <img src={before} alt={illustrative ? 'Retrato genérico de referência' : 'Foto original'} />
      <img className={illustrative ? 'before-after__example' : ''} src={after}
        alt={illustrative ? 'Exemplo ilustrativo de apresentação do resultado' : 'Simulação do estilo na sua foto'} style={{ clipPath: `inset(0 0 0 ${position}%)` }} />
      <span className="before-after__line" style={{ left: `${position}%` }} aria-hidden="true"><span>↔</span></span>
      <span className="before-after__label">{illustrative ? 'Referência' : 'Antes'}</span>
      <span className="before-after__label before-after__label--right">{illustrative ? 'Exemplo' : 'Depois'}</span>
    </div>
    <label htmlFor={id}>Arraste para comparar</label>
    <input id={id} type="range" min="0" max="100" value={position} onChange={event => setPosition(Number(event.target.value))} aria-valuetext={`${position}% da imagem original visível`} />
    <figcaption>{illustrative ? 'Imagem genérica ilustrativa. Não representa uma transformação gerada.' : 'Simulação aproximada. O resultado real pode variar.'}</figcaption>
  </figure>;
}
