import { Link } from 'react-router';
import { useSession } from '../../../app/session';
import { paths } from '../../../app/paths';
import logo from '../../../assets/editorial/marca-rodape.webp';
import './footer.css';

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  const { state } = useSession();
  const role = state.status === 'signed-in' ? state.user.role : null;

  if (compact && !role) return <footer className="site-footer--compact">
    <p>© 2026 Espelho Meu</p><Link to={paths.faq}>Precisa de ajuda?</Link>
  </footer>;

  return <footer className="site-footer">
    <div className="site-footer__columns">
      <div className="site-footer__brand">
        <Link to={paths.home} aria-label="Espelho Meu, início"><img src={logo} alt="Espelho Meu" width={114} height={90} /></Link>
        <p>Consultoria de cabelo e maquiagem.</p>
      </div>
      <nav aria-label="Inspirações">
        <h2>Explore</h2>
        <Link to={paths.cabelo}>Cabelo</Link>
        <Link to={paths.maquiagem}>Maquiagem</Link>
        <Link to={paths.faq}>Perguntas frequentes</Link>
      </nav>
      <nav aria-label="Sobre o projeto">
        <h2>Projeto</h2>
        <Link to={paths.sobre}>Sobre</Link>
        <Link to={paths.integrantes}>Integrantes</Link>
        <Link to={paths.contato}>Contato</Link>
      </nav>
      <nav aria-label="Acesso">
        <h2>Acesso</h2>
        {role === 'USER' ? <><Link to={paths.conta}>Minha conta</Link><Link to={paths.consultoria}>Consultoria</Link></>
          : role === 'ADMIN' ? <Link to={paths.admin}>Painel administrativo</Link> : <>
            <Link to={paths.entrar}>Entrar</Link>
            <Link to={paths.cadastro} state={{ from: paths.consultoria }}>Criar conta</Link>
          </>}
      </nav>
    </div>
    <div className="site-footer__bottom">
      <p>© 2026 Espelho Meu</p>
      <p>Global Solution · FIAP</p>
    </div>
  </footer>;
}
