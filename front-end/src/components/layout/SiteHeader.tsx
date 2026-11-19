import { Link, NavLink, useLocation } from 'react-router';
import { paths } from '../../app/paths';
import logo from '../../assets/logo.png';
import { ActionLink } from '../ui/ActionLink';

import { useSession } from '../../app/session';

export function SiteHeader({ access = false }: { access?: boolean }) {
  const { pathname } = useLocation();
  const { state } = useSession();
  const signedIn = state.status === 'signed-in';
  const publicHome = pathname === paths.home && !signedIn;
  const menu = [
    { to: paths.home, label: 'Início' },
    ...(signedIn ? [
      { to: paths.consultoria, label: 'Consultoria' },
      { to: paths.conta, label: 'Minha conta' },
      ...(state.user.role === 'ADMIN' ? [{ to: '/admin', label: 'Administração' }] : []),
    ] : []),
  ];
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-header__brand" to={paths.home} aria-label="Espelho Meu, início">
          <img src={logo} alt="Espelho Meu" width={208} height={69} />
        </Link>
        {(access || publicHome) && <p className="site-header__tagline">{access ? 'Seu estilo, suas regras' : 'Beleza com autonomia'}</p>}
        {publicHome && <nav className="site-header__actions" aria-label="Navegação principal">
          <a className="action-link action-link--outline" href="#como-funciona">Como funciona</a>
          <ActionLink to={paths.entrar} variant="outline">Entrar</ActionLink>
          <ActionLink to={paths.cadastro}>Criar conta</ActionLink>
        </nav>}
        {!access && !publicHome && <><nav className="site-menu" aria-label="Navegação principal">
          {menu.map(({ to, label }) => (
            <NavLink key={to} to={to} end>{label}</NavLink>
          ))}
        </nav>
        <div className="site-header__actions">
          {!signedIn && <ActionLink to={paths.entrar} variant="outline">Entrar</ActionLink>}
          <ActionLink to={paths.consultoria}>Começar agora</ActionLink>
        </div></>}
      </div>
    </header>
  );
}
