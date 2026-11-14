import { Route, Routes } from 'react-router';
import { SiteLayout } from '../components/layout/SiteLayout';
import { HomePage } from '../pages/home/HomePage';
import { StarterPage } from '../pages/initial/StarterPage';
import { paths } from './paths';

export function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path={paths.cabelo} element={<StarterPage title="Cabelo" withConsultation />} />
        <Route path={paths.maquiagem} element={<StarterPage title="Maquiagem" withConsultation />} />
        <Route path={paths.catalogo} element={<StarterPage title="Catálogo" />} />
        <Route path={paths.entrar} element={<StarterPage title="Entrar" links={[
          { to: paths.cadastro, label: 'Criar conta' },
          { to: paths.recuperarSenha, label: 'Esqueci minha senha' },
        ]} />} />
        <Route path={paths.cadastro} element={<StarterPage title="Criar conta" />} />
        <Route path={paths.recuperarSenha} element={<StarterPage title="Recuperar senha" />} />
        <Route path={paths.conta} element={<StarterPage title="Minha conta" links={[
          { to: paths.entrar, label: 'Entrar' },
        ]} />} />
        <Route path={paths.consultoria} element={<StarterPage title="Nova consultoria" links={[
          { to: paths.entrar, label: 'Entrar' },
          { to: paths.cadastro, label: 'Criar conta' },
        ]} />} />
        <Route path="*" element={<StarterPage title="Página não encontrada" />} />
      </Route>
    </Routes>
  );
}
