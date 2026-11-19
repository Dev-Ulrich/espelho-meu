import { Link, NavLink } from 'react-router';
import { paths } from '../../app/paths';
import logo from '../../assets/editorial/marca.webp';
import { ActionLink } from '../ui/ActionLink';
import { useSession } from '../../app/session';

const publicMenu = [
  { to: paths.cabelo, label: 'Cabelo' },
  { to: paths.maquiagem, label: 'Maquiagem' },
  { to: paths.sobre, label: 'Sobre' },
];

export function SiteHeader({ access = false }: { access?: boolean }) {
  const { state } = useSession();
  const role = state.status === 'signed-in' ? state.user.role : null;
  const menu = role === 'USER' ? [...publicMenu, { to: paths.consultoria, label: 'Consultoria' }] : publicMenu;
  return <header className="site-header">
    <div className="site-header__inner">
      <Link className="site-header__brand" to={paths.home} aria-label="Espelho Meu, início">
        <img src={logo} alt="Espelho Meu" width={208} height={69} />
      </Link>
      {!access && <>
        <nav className="site-menu site-menu--public" aria-label="Navegação principal">
          {menu.map(({ to, label }) => <NavLink key={to} to={to}>{label}</NavLink>)}
        </nav>
        <div className="site-header__actions">
          {role === 'ADMIN' ? <ActionLink to={paths.admin}>Administração</ActionLink>
            : role === 'USER' ? <ActionLink to={paths.conta} variant="outline">Minha conta</ActionLink>
              : <ActionLink to={paths.entrar} variant="outline">Entrar</ActionLink>}
        </div>
      </>}
    </div>
  </header>;
}
