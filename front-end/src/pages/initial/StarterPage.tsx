import { Link } from 'react-router';
import { paths } from '../../app/paths';
import { ActionLink } from '../../components/ui/ActionLink';

interface StarterPageProps {
  title: string;
  withConsultation?: boolean;
  links?: { to: string; label: string }[];
}

export function StarterPage({ title, withConsultation, links }: StarterPageProps) {
  return (
    <section className="starter-page" aria-labelledby="page-title">
      <h1 id="page-title">{title}</h1>
      {title !== 'Página não encontrada' && <p>Esta área está em preparação.</p>}
      <div className="flex flex-wrap items-center gap-4">
        {withConsultation && <ActionLink to={paths.consultoria}>Começar consultoria</ActionLink>}
        {links?.map(({ to, label }) => <ActionLink key={to} to={to}>{label}</ActionLink>)}
        <Link to={paths.home}>Voltar ao início</Link>
      </div>
    </section>
  );
}
