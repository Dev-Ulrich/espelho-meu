import { Navigate, Route, Routes } from 'react-router';
import { SiteLayout } from '../components/layout/SiteLayout';
import { AreaEditorialPage } from '../pages/home/AreaEditorialPage';
import { HomePage } from '../pages/home/HomePage';
import { AccessPage } from '../pages/acesso/AccessPage';
import { UserHomePage } from '../pages/authenticated/UserHomePage';
import { GuidedConsultationPage } from '../pages/consultoria/GuidedConsultationPage';
import { ConsultationStartPage } from '../pages/consultoria/ConsultationStartPage';
import { AboutPage, ContactPage, MemberPage, TeamPage } from '../pages/institucional/InstitutionalPages';
import { HelpPage } from '../pages/ajuda/HelpPage';
import { AdminPage } from '../pages/admin/AdminPage';
import { paths } from './paths';
import { RequireSession, SessionProvider } from './session';

export function App() {
  return <SessionProvider><Routes>
    <Route element={<SiteLayout />}>
      <Route index element={<HomePage />} />
      <Route path={paths.sobre} element={<AboutPage />} />
      <Route path={paths.integrantes} element={<TeamPage />} />
      <Route path={paths.integrantes + '/:id'} element={<MemberPage />} />
      <Route path={paths.faq} element={<HelpPage faq />} />
      <Route path={paths.contato} element={<ContactPage />} />
      <Route path={paths.cabelo} element={<AreaEditorialPage area="cabelo" />} />
      <Route path={paths.maquiagem} element={<AreaEditorialPage area="maquiagem" />} />
      <Route element={<RequireSession />}>
        <Route path={paths.conta} element={<UserHomePage />} />
        <Route path={paths.consultoria} element={<ConsultationStartPage />} />
        <Route path="/consultoria/maquiagem" element={<Navigate to="/consultoria/maquiagem/perfil" replace />} />
        <Route path="/consultoria/maquiagem/:etapa" element={<GuidedConsultationPage key="maquiagem" area="maquiagem" />} />
        <Route path="/consultoria/cabelo" element={<Navigate to="/consultoria/cabelo/perfil" replace />} />
        <Route path="/consultoria/cabelo/:etapa" element={<GuidedConsultationPage key="cabelo" area="cabelo" />} />
      </Route>
      <Route element={<RequireSession admin />}>
        <Route path="/admin/:entidade?" element={<AdminPage />} />
      </Route>
    </Route>
    <Route element={<SiteLayout access />}>
      <Route path={paths.entrar} element={<AccessPage key="login" mode="login" />} />
      <Route path={paths.cadastro} element={<AccessPage key="cadastro" mode="cadastro" />} />
    </Route>
    <Route path="*" element={<Navigate to={paths.home} replace />} />
  </Routes></SessionProvider>;
}
