import { useId, useState } from 'react';
import { Link } from 'react-router';
import { paths } from '../../../app/paths';
import { useSession } from '../../../app/session';
import { examples } from './examples';
import './simulation-preview.css';

export function SimulationPreview() {
  const id = useId();
  const { state } = useSession();
  const [activeIndex, setActiveIndex] = useState(0);
  const example = examples[activeIndex];
  const signedIn = state.status === 'signed-in';
  function move(offset: number) {
    setActiveIndex(index => (index + offset + examples.length) % examples.length);
  }
  return <section className="simulation-preview" aria-labelledby={`${id}-title`}>
    <div>
      <h2 id={`${id}-title`}>Veja antes de decidir</h2>
      <p>Explore possibilidades de cabelo e maquiagem com referências ilustrativas.</p>
      <p>Esta demonstração não processa sua foto nem gera recomendações personalizadas.</p>
      {signedIn
        ? <Link className="action-link action-link--primary" to={paths.consultoria}>Começar consultoria</Link>
        : <Link className="action-link action-link--primary" to={paths.cadastro} state={{ from: paths.consultoria }}>Começar consultoria</Link>}
    </div>
    <div className="simulation-preview__panel">
      <h3 id={`${id}-example`} aria-live="polite">{example.title}</h3>
      <div className="simulation-preview__pair" aria-labelledby={`${id}-example`}>
        <figure><img src={example.before} alt={example.beforeAlt} loading="lazy" /><figcaption>Antes • foto de demonstração</figcaption></figure>
        <figure><img src={example.after} alt={example.afterAlt} loading="lazy" /><figcaption>Depois • prévia ilustrativa</figcaption></figure>
      </div>
      <div className="simulation-preview__controls" role="group" aria-label="Exemplos da demonstração">
        <button type="button" onClick={() => move(-1)} aria-label="Exemplo anterior">Anterior</button>
        {examples.map((item, index) => <button key={item.id} type="button" aria-pressed={index === activeIndex} onClick={() => setActiveIndex(index)}>{item.title}</button>)}
        <button type="button" onClick={() => move(1)} aria-label="Próximo exemplo">Próximo</button>
      </div>
    </div>
  </section>;
}
