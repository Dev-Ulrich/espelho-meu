import { Link, useSearchParams } from 'react-router';
import { paths } from '../../app/paths';
import { ActionLink } from '../../components/ui/ActionLink';
import profile from '../../assets/figma/conta-IconamoonProfileCircleFill.svg';
import consultations from '../../assets/figma/conta-Group.svg';
import favorites from '../../assets/figma/conta-Group1.svg';
import preferences from '../../assets/figma/conta-Group2.svg';
import settings from '../../assets/figma/conta-Group3.svg';
import home from '../../assets/figma/conta-Vector.svg';
import shape from '../../assets/figma/conta-Vector1.svg';
import outline from '../../assets/figma/conta-Vector2.svg';
import '../acesso/access.css';
import './account.css';

const sections = [
  { id: 'perfil', label: 'Perfil', icon: profile, description: 'Seus dados de perfil estarão disponíveis após a autenticação.' },
  { id: 'consultorias', label: 'Minhas consultorias', icon: consultations, description: 'O histórico de consultorias depende do acesso à sua conta.' },
  { id: 'favoritas', label: 'Favoritas', icon: favorites, description: 'Entre para consultar suas referências favoritas quando o serviço estiver disponível.' },
  { id: 'preferencias', label: 'Preferências', icon: preferences, description: 'Suas preferências serão consultadas na sua conta autenticada.' },
  { id: 'configuracoes', label: 'Configurações', icon: settings, description: 'As configurações de conta dependem da integração de autenticação.' },
];
export function AccountPage() {
  const [params] = useSearchParams();
  const current = sections.find(item => item.id === params.get('secao')) ?? sections[0];
  return <div className="access-page account-page">
    <aside className="identity-panel">
      <Link to={paths.home} className="identity-panel__brand">Espelho Meu</Link><p className="identity-panel__tagline">SEU ESTILO, SUAS REGRAS</p>
      <h1>Minha conta</h1><p className="account-description">Gerencie seus dados, consultas e preferências em um só lugar.</p>
      <nav aria-label="Minha conta">{sections.map(item => <Link key={item.id} to={`${paths.conta}?secao=${item.id}`} aria-current={item.id === current.id ? 'page' : undefined}><img src={item.icon} alt="" />{item.label}</Link>)}</nav>
      <Link to={paths.home} className="account-back">Voltar ao início</Link>
    </aside>
    <Link className="home-shortcut" to={paths.home} aria-label="Voltar ao início"><img src={home} alt="" /></Link>
    <section className="account-content" aria-labelledby="account-section-title">
      <div className="account-welcome"><div className="account-welcome__shape"><img src={shape} alt="" /></div><div className="account-welcome__outline"><img src={outline} alt="" /></div><p>Seu espaço de beleza.</p><span>SEU ESTILO • SUAS REGRAS</span></div>
      <h2 id="account-section-title">{current.label}</h2><p>{current.description}</p>
      <p className="notice">Você ainda não está autenticada. O acesso à conta está em preparação; nenhum dado pessoal ou histórico está sendo carregado.</p>
      <div className="flex flex-wrap gap-4"><ActionLink to={paths.entrar}>Entrar</ActionLink><ActionLink to={paths.cadastro} variant="outline">Criar conta</ActionLink></div>
    </section>
  </div>;
}
