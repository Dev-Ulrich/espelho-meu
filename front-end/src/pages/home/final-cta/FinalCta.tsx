import { ArrowRight } from 'lucide-react';
import { ActionLink } from '../../../components/ui/ActionLink';
import { paths } from '../../../app/paths';
import curves from '../../../assets/figma/home-CourbesDecorativesRose.svg';
import './final-cta.css';

export function FinalCta() {
  return (
    <section className="final-cta" aria-labelledby="final-cta-title">
      <div className="final-cta__decoration" aria-hidden="true"><img src={curves} alt="" /></div>
      <h2 id="final-cta-title">Pronto para descobrir novas possibilidades?</h2>
      <ActionLink to={paths.consultoria} variant="outline">Começar agora <ArrowRight size={16} aria-hidden="true" /></ActionLink>
    </section>
  );
}