import { Link } from 'react-router';
import { paths } from '../../app/paths';
import { useSession } from '../../app/session';
import { areas, editorialPhotos, type EditorialArea } from './editorialContent';
import './home.css';

export function ConsultationLinks({ area, tryOn = false }: { area?: EditorialArea; tryOn?: boolean }) {
  const { state } = useSession();
  const destination = area ? `${paths.consultoria}/${area}/perfil` : paths.consultoria;
  const signedIn = state.status === 'signed-in';

  if (signedIn && state.user.role === 'ADMIN') {
    return <Link className="action-link action-link--primary" to={paths.admin}>Abrir painel administrativo</Link>;
  }
  if (signedIn) {
    return <Link className="action-link action-link--primary" to={destination}>
      {tryOn ? 'Veja como fica em você' : 'Começar consultoria'}
    </Link>;
  }

  const routeState = { from: destination };
  return <div className="editorial-actions">
    <Link className="action-link action-link--primary" to={tryOn ? paths.entrar : paths.cadastro} state={routeState}>
      {tryOn ? 'Veja como fica em você' : 'Criar conta'}
    </Link>
    <Link className="editorial-text-link" to={tryOn ? paths.cadastro : paths.entrar} state={routeState}>
      {tryOn ? 'Criar conta' : 'Já tenho conta'}
    </Link>
  </div>;
}

const steps = [
  ['Crie sua conta', 'Entre para acessar a consultoria.'],
  ['Escolha uma área', 'Responda perguntas sobre cabelo ou maquiagem.'],
  ['Explore suas recomendações', 'Entenda as sugestões e experimente na sua foto.'],
];

export function HomePage() {
  return <div className="editorial-page">
    <section className="editorial-hero" aria-labelledby="home-title">
      <div className="editorial-hero__inner editorial-container">
        <div className="editorial-hero__copy">
          <p className="editorial-kicker">Consultoria de cabelo e maquiagem</p>
          <h1 id="home-title">Seu estilo,<br /><em>suas regras.</em></h1>
          <p>Descubra cortes, penteados e maquiagens que fazem sentido para seus traços, suas preferências e sua rotina.</p>
          <ConsultationLinks />
        </div>
        <div className="editorial-hero__art">
          <img className="editorial-hero__main" src={editorialPhotos.cover} alt="Retrato ilustrativo com cabelo crespo e volume natural" fetchPriority="high" />
          <img className="editorial-hero__detail" src={editorialPhotos.luminous} alt="Retrato ilustrativo com maquiagem luminosa" />
        </div>
      </div>
    </section>
    <section id="como-funciona" className="editorial-container editorial-section editorial-steps" aria-labelledby="steps-title">
      <h2 id="steps-title">Como funciona</h2>
      <ol>{steps.map(([title, description], index) => <li key={title}>
        <span aria-hidden="true">0{index + 1}</span>
        <div><h3>{title}</h3><p>{description}</p></div>
      </li>)}</ol>
    </section>
    <section className="editorial-container editorial-section editorial-explore" aria-labelledby="explore-title">
      <h2 id="explore-title">Explore as consultorias</h2>
      <div className="editorial-duo">
        {Object.entries(areas).map(([key, area]) => <Link className="editorial-tile" to={paths[key as EditorialArea]} key={key}>
          <img src={area.portrait} alt="" loading="lazy" />
          <div><h3>{area.title}</h3><p>{area.summary}</p><span>Ver inspirações</span></div>
        </Link>)}
      </div>
    </section>
  </div>;
}
