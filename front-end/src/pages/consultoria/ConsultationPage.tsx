import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { paths } from '../../app/paths';
import { ActionLink } from '../../components/ui/ActionLink';
import close from '../../assets/figma/consultoria-IconeClose.svg';
import './consultation.css';
import { PhotoPicker } from './foto/PhotoPicker';
import { HairQuestionnaire } from './HairQuestionnaire';
import { MakeupQuestionnaire } from './MakeupQuestionnaire';

export function ConsultationPage() {
  const [params, setParams] = useSearchParams();
  const [photo, setPhoto] = useState<File | null>(null);
  const journey = params.get('jornada') === 'maquiagem' ? 'maquiagem' : 'cabelo';
  return <section className="consultation-page" aria-labelledby="consultation-title">
    <Link className="consultation-close" to={paths.home} aria-label="Fechar consultoria e voltar ao início"><img src={close} alt="" /></Link>
    <h1 id="consultation-title">Seu próximo visual começa aqui.</h1>
    <p>Escolha sua jornada, responda ao questionário e explore as sugestões.</p>
    <fieldset><legend>Escolha sua consultoria</legend><div className="journey-options">
      {(['cabelo', 'maquiagem'] as const).map(value => <label key={value}>
        <input type="radio" name="jornada" value={value} checked={journey === value} onChange={() => setParams({ jornada: value })} />
        <span>{value === 'cabelo' ? 'Consultoria capilar' : 'Maquiagem'}</span>
      </label>)}
    </div></fieldset>
    <PhotoPicker enabled={false} maxBytes={null} file={photo} onFileChange={setPhoto} />
    {journey === 'cabelo' ? <HairQuestionnaire /> : <MakeupQuestionnaire />}
    <p className="notice">As sugestões salvas ficam neste navegador. A sincronização com uma conta está em preparação.</p>
    <div className="flex flex-wrap gap-3"><ActionLink to={`${paths.entrar}?jornada=${journey}`}>Entrar para continuar</ActionLink><ActionLink to={`${paths.cadastro}?jornada=${journey}`} variant="outline">Criar conta</ActionLink></div>
    <div className="flex flex-wrap gap-x-5">
      <Link className="text-link" to={`${paths.conta}?secao=consultorias`}>Ver histórico neste navegador</Link>
      <Link className="text-link" to={journey === 'cabelo' ? paths.cabelo : paths.maquiagem}>Explorar referências de {journey} sem entrar</Link>
    </div>
  </section>;
}
