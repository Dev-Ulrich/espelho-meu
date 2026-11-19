import { ArrowRight, Scissors } from 'lucide-react';
import { paths } from '../../app/paths';
import brilhos from '../../assets/brilhos.svg';
import contorno from '../../assets/contorno.svg';
import formaLilas from '../../assets/forma-lilas.svg';
import formaRoxa from '../../assets/forma-roxa.svg';
import pincel from '../../assets/pincel.svg';
import retrato from '../../assets/retrato-capa.png';
import { ActionLink } from '../../components/ui/ActionLink';
import { HowItWorks } from './how-it-works/HowItWorks';
import './home.css';

export function HomePage() {
  return (
    <>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__copy">
          <h1 id="home-title">Seu estilo,<br />suas regras.</h1>
          <p>Recomendações personalizadas de cabelo, para você explorar, experimentar e realçar sua beleza única.</p>
          <div className="flex flex-wrap gap-4">
            <ActionLink to={paths.consultoria}>Começar consultoria <ArrowRight size={16} aria-hidden="true" /></ActionLink>
            <ActionLink to="#como-funciona" variant="outline">Como funciona</ActionLink>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-art__shape hero-art__shape--purple"><img src={formaRoxa} alt="" /></div>
          <div className="hero-art__shape hero-art__shape--lilac"><img src={formaLilas} alt="" /></div>
          <img className="hero-art__portrait" src={retrato} alt="" fetchPriority="high" />
          <div className="hero-art__outline"><img src={contorno} alt="" /></div>
          <ul className="hero-art__highlights" aria-label="O que você pode explorar">
            <li><Scissors size={38} aria-hidden="true" />Explore opções de corte</li>
            <li><img src={pincel} alt="" /><span>Explore opções de coloração</span></li>
            <li><img src={brilhos} alt="" /><span>Recomendações com IA</span></li>
          </ul>
        </div>
      </section>
      <HowItWorks />
    </>
  );
}
