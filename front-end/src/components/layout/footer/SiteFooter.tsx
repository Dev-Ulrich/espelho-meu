import { Link } from 'react-router';
import { useSession } from '../../../app/session';
import { paths } from '../../../app/paths';
import logo from '../../../assets/figma/home-FotoFooterLogo.png';
import './footer.css';

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  const { state } = useSession();
  const signedIn = state.status === 'signed-in';
  if (compact && !signedIn) return <footer className="site-footer--compact">
    <p>Espelho Meu · © 2026 · Cuidado, beleza e tecnologia em um só lugar.</p>
  </footer>;
  return (
    <footer className="site-footer">
      <div className="site-footer__columns">
        <div className="site-footer__brand">
          <Link to={paths.home} aria-label="Espelho Meu, início"><img src={logo} alt="Espelho Meu" width={138} height={109} /></Link>
          <p>Consultoria de cabelo e maquiagem desenvolvida para a Global Solution da FIAP.</p>
        </div>
        <nav aria-label="Acesso">
          <h2>Espelho Meu</h2>
          {signedIn ? <Link to={paths.conta}>Minha conta</Link> : <>
            <Link to={paths.entrar}>Entrar</Link>
            <Link to={paths.cadastro}>Criar conta</Link>
          </>}
        </nav>
        {signedIn && <nav aria-label="Sobre o projeto">
          <h2>Projeto</h2>
          <Link to={paths.sobre}>Sobre</Link>
          <Link to={paths.integrantes}>Integrantes</Link>
          <Link to={paths.faq}>Perguntas frequentes</Link>
          <Link to={paths.contato}>Contato</Link>
        </nav>}
      </div>
      <div className="site-footer__bottom">
        <p>© 2026 Espelho Meu. Todos os direitos reservados.</p>
        <p>Cuidado, beleza e tecnologia em um só lugar.</p>
      </div>
    </footer>
  );
}