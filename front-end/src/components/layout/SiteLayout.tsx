import { Outlet, useLocation } from 'react-router';
import { useEffect } from 'react';
import { SiteFooter } from './footer/SiteFooter';
import { SiteHeader } from './SiteHeader';

export function SiteLayout({ access = false }: { access?: boolean }) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);


  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <SiteHeader access={access} />
      <main id="conteudo" tabIndex={-1}>
        <Outlet />
      </main>
      <SiteFooter compact={access} />
    </>
  );
}
