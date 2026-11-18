import { Link } from 'react-router';
import { paths } from '../../../app/paths';
import logo from '../../../assets/figma/home-FotoFooterLogo.png';
import './footer.css';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__columns">
        <div className="site-footer__brand">
          <Link to={paths.home} aria-label="Espelho Meu, início"><img src={logo} alt="Espelho Meu" width={138} height={109} /></Link>
          <p>Uma plataforma de beleza e tecnologia que usa IA para conectar você aos melhores estilos de cabelo e maquiagem.</p>
        </div>
        <nav aria-label="Suporte">
          <h2>Suporte</h2>
          <Link to={paths.ajuda}>Central de ajuda</Link>
          <p>Contato, privacidade e termos: em preparação.</p>
        </nav>
        <div>
          <h2>Siga o Espelho Meu</h2>
          <p>Perfis oficiais em preparação.</p>
        </div>
      </div>
      <div className="site-footer__bottom">
        <p>© 2026 Espelho Meu. Todos os direitos reservados.</p>
        <p>Cuidado, beleza e tecnologia em um só lugar.</p>
      </div>
    </footer>
  );
}