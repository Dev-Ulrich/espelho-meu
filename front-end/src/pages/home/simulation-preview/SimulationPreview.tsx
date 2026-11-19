import { useId } from 'react';
import { ActionLink } from '../../../components/ui/ActionLink';
import { paths } from '../../../app/paths';
import { examples } from './examples';
import './simulation-preview.css';

export function SimulationPreview() {
  const id = useId();
  const example = examples[0];
  return <section className="simulation-preview" aria-labelledby={`${id}-title`}>
    <div>
      <h2 id={`${id}-title`}>Veja antes de decidir</h2>
      <p>Explore possibilidades de cabelo e maquiagem com referências ilustrativas.</p>
      <p>Esta demonstração não processa sua foto nem gera recomendações personalizadas.</p>
      <ActionLink to={paths.consultoria}>Começar consultoria</ActionLink>
    </div>
    <div className="simulation-preview__panel">
      <h3>{example.title}</h3>
      <div className="simulation-preview__pair">
        <figure><img src={example.before} alt={example.beforeAlt} loading="lazy" /><figcaption>Antes • foto de demonstração</figcaption></figure>
        <figure><img src={example.after} alt={example.afterAlt} loading="lazy" /><figcaption>Depois • prévia ilustrativa</figcaption></figure>
      </div>
    </div>
  </section>;
}
