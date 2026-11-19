import { Camera } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { paths } from '../../app/paths';
import { ActionLink } from '../../components/ui/ActionLink';
import close from '../../assets/figma/consultoria-IconeClose.svg';
import './consultation.css';
import { HairQuestionnaire } from './HairQuestionnaire';
import { MakeupQuestionnaire } from './MakeupQuestionnaire';

export function ConsultationPage() {
  const [params, setParams] = useSearchParams();
  const journey = params.get('jornada') === 'maquiagem' ? 'maquiagem' : 'cabelo';
  return <section className="consultation-page" aria-labelledby="consultation-title">
    <Link className="consultation-close" to={paths.home} aria-label="Fechar consultoria e voltar ao início"><img src={close} alt="" /></Link>
    <h1 id="consultation-title">Seu próximo visual começa aqui.</h1>
    <p>Escolha sua jornada e envie uma foto para explorar possibilidades.</p>
    <div className="photo-pending"><Camera size={32} aria-hidden="true" /><p>Envio de foto em preparação</p><span>JPG ou PNG • rosto visível e boa iluminação</span></div>
    <fieldset><legend>Escolha sua consultoria</legend><div className="journey-options">
      {(['cabelo', 'maquiagem'] as const).map(value => <label key={value}>
        <input type="radio" name="jornada" value={value} checked={journey === value} onChange={() => setParams({ jornada: value })} />
        <span>{value === 'cabelo' ? 'Consultoria capilar' : 'Maquiagem'}</span>
      </label>)}
    </div></fieldset>
    {journey === 'cabelo' ? <HairQuestionnaire /> : <MakeupQuestionnaire />}
    <p className="notice">Para uma consultoria personalizada, você precisa entrar na sua conta. A autenticação e o envio de fotos ainda não estão disponíveis.</p>
    <div className="flex flex-wrap gap-3"><ActionLink to={`${paths.entrar}?jornada=${journey}`}>Entrar para continuar</ActionLink><ActionLink to={`${paths.cadastro}?jornada=${journey}`} variant="outline">Criar conta</ActionLink></div>
    <Link className="text-link" to={journey === 'cabelo' ? paths.cabelo : paths.maquiagem}>Explorar referências de {journey} sem entrar</Link>
    {/* A seleção, validação e prévia de arquivo ficam em foto/, tarefa do Matheus L. */}
  </section>;
}
