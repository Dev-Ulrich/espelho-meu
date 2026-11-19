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
          <p>Consultoria de cabelo desenvolvida para a Global Solution da FIAP.</p>
        </div>
        <nav aria-label="Acesso">
          <h2>Espelho Meu</h2>
          <Link to={paths.entrar}>Entrar</Link>
          <Link to={paths.cadastro}>Criar conta</Link>
        </nav>
      </div>
      <div className="site-footer__bottom">
        <p>© 2026 Espelho Meu. Todos os direitos reservados.</p>
        <p>Cuidado, beleza e tecnologia em um só lugar.</p>
      </div>
    </footer>
  );
}