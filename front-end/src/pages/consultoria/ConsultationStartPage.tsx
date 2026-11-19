import { useState } from 'react';
import { useSession } from '../../app/session';
import { ActionLink } from '../../components/ui/ActionLink';
import hairPortrait from '../../assets/figma/consultoria-cabelo.webp';
import makeupPortrait from '../../assets/figma/consultoria-maquiagem.webp';
import styles from '../authenticated/workspace.module.css';
import guided from './guidedConsultation.module.css';

const journeys = [
  { area: 'cabelo', title: 'Cabelo', portrait: hairPortrait, description: 'Cortes, comprimentos, penteados e possibilidades de cor.' },
  { area: 'maquiagem', title: 'Maquiagem', portrait: makeupPortrait, description: 'Tom, acabamento e produtos que fazem sentido para a sua rotina.' },
];

export function ConsultationStartPage() {
  const { state } = useSession();
  const [reducedMotion, setReducedMotion] = useState(() => typeof document !== 'undefined'
    && document.documentElement.hasAttribute('data-reduced-motion'));
  const firstName = state.status === 'signed-in' ? state.user.nome.trim().split(/\s+/)[0] : '';

  return <section className={`${styles.page} ${guided.page} ${guided.journeys}`}>
    <p className={guided.eyebrow}>{firstName ? `Olá, ${firstName} · Sua consultoria` : 'Sua consultoria'}</p>
    <h1 className={styles.title}>O que você quer experimentar?</h1>
    <p>Escolha uma jornada para começar. Uma pergunta por vez, no seu ritmo.</p>
    <div className={guided.journeyGrid}>
      {journeys.map(({ area, title, portrait, description }) => <article key={area} className={guided.journeyCard}>
        <img src={portrait} alt="" />
        <h2>{title}</h2><p>{description}</p>
        <ActionLink to={`/consultoria/${area}/perfil`}>Começar {area}</ActionLink>
      </article>)}
    </div>
    <button type="button" className="action-link action-link--outline" aria-pressed={reducedMotion} onClick={() => {
      const enabled = !reducedMotion;
      sessionStorage.setItem('espelho-reduced-motion', String(enabled));
      document.documentElement.toggleAttribute('data-reduced-motion', enabled);
      setReducedMotion(enabled);
    }}>Usar movimento reduzido</button>
  </section>;
}
