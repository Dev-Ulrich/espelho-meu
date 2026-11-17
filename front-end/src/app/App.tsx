import { Route, Routes } from 'react-router';
import { SiteLayout } from '../components/layout/SiteLayout';
import { HomePage } from '../pages/home/HomePage';
import { StarterPage } from '../pages/initial/StarterPage';
import { InspirationPage } from '../pages/inspiracao/InspirationPage';
import { AccessPage } from '../pages/acesso/AccessPage';
import { AccountPage } from '../pages/conta/AccountPage';
import { ConsultationPage } from '../pages/consultoria/ConsultationPage';
import { CatalogPage } from '../pages/catalogo/CatalogPage';
import { HelpPage } from '../pages/ajuda/HelpPage';
import { paths } from './paths';

export function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path={paths.cabelo} element={<InspirationPage key="cabelo" kind="cabelo" />} />
        <Route path={paths.maquiagem} element={<InspirationPage key="maquiagem" kind="maquiagem" />} />
        <Route path={paths.catalogo} element={<CatalogPage />} />
        <Route path={paths.consultoria} element={<ConsultationPage />} />
        <Route path={paths.ajuda} element={<HelpPage />} />
        <Route path="*" element={<StarterPage title="Página não encontrada" />} />
      </Route>
      <Route element={<SiteLayout withHeader={false} />}>
        <Route path={paths.entrar} element={<AccessPage key="login" mode="login" />} />
        <Route path={paths.cadastro} element={<AccessPage key="cadastro" mode="cadastro" />} />
        <Route path={paths.recuperarSenha} element={<AccessPage key="recuperar" mode="recuperar" />} />
        <Route path={paths.conta} element={<AccountPage />} />
      </Route>
    </Routes>
  );
}
