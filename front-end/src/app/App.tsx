import { Navigate, Route, Routes } from 'react-router';
import { SiteLayout } from '../components/layout/SiteLayout';
import { HomePage } from '../pages/home/HomePage';
import { AccessPage } from '../pages/acesso/AccessPage';
import { UserHomePage } from '../pages/authenticated/UserHomePage';
import { HairConsultationPage } from '../pages/consultoria/HairConsultationPage';
import { AdminPage } from '../pages/admin/AdminPage';
import { paths } from './paths';
import { RequireSession, SessionProvider } from './session';

export function App() {
  return <SessionProvider><Routes>
    <Route element={<SiteLayout />}>
      <Route index element={<HomePage />} />
      <Route element={<RequireSession />}>
        <Route path={paths.conta} element={<UserHomePage />} />
        <Route path={paths.consultoria} element={<Navigate to="/consultoria/cabelo/perfil" replace />} />
        <Route path={paths.cabelo} element={<Navigate to="/consultoria/cabelo/perfil" replace />} />
        <Route path="/consultoria/cabelo" element={<Navigate to="/consultoria/cabelo/perfil" replace />} />
        <Route path="/consultoria/cabelo/:etapa" element={<HairConsultationPage />} />
      </Route>
      <Route element={<RequireSession admin />}>
        <Route path="/admin/:entidade?" element={<AdminPage />} />
      </Route>
    </Route>
    <Route element={<SiteLayout withHeader={false} />}>
      <Route path={paths.entrar} element={<AccessPage key="login" mode="login" />} />
      <Route path={paths.cadastro} element={<AccessPage key="cadastro" mode="cadastro" />} />
    </Route>
    <Route path="*" element={<Navigate to={paths.home} replace />} />
  </Routes></SessionProvider>;
}
