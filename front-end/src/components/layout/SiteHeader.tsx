import { Link, NavLink } from 'react-router';
import { paths } from '../../app/paths';
import logo from '../../assets/logo.png';
import { ActionLink } from '../ui/ActionLink';

import { useSession } from '../../app/session';

export function SiteHeader() {
  const { state } = useSession();
  const signedIn = state.status === 'signed-in';
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
          <img src={logo} alt="Espelho Meu" width={258} height={83} />
        </Link>
        <nav className="site-menu" aria-label="Navegação principal">
          {menu.map(({ to, label }) => (
            <NavLink key={to} to={to} end>{label}</NavLink>
          ))}
        </nav>
        <div className="site-header__actions">
          {!signedIn && <ActionLink to={paths.entrar} variant="outline">Entrar</ActionLink>}
          <ActionLink to={paths.consultoria}>Começar agora</ActionLink>
        </div>
      </div>
    </header>
  );
}
