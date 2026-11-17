import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { paths } from '../../app/paths';
import homeIcon from '../../assets/figma/cadastro-Vector.svg';
import { validateAccess } from './validation';
import type { AccessErrors, AccessFields, AccessMode } from './validation';
import './access.css';

const copy = {
  cadastro: { eyebrow: 'CADASTRE-SE', title: 'Faça parte do Espelho Meu.', description: 'Crie sua conta para salvar suas preferências, receber recomendações personalizadas e explorar todos os recursos da plataforma.', headline: 'Crie sua conta e viva uma nova experiência de beleza.', action: 'Cadastrar-se' },
  login: { eyebrow: 'ENTRAR', title: 'Bem-vinda ao Espelho Meu.', description: 'Acesse sua conta para continuar sua jornada.', headline: 'Seu estilo, suas regras.', action: 'Entrar' },
  recuperar: { eyebrow: 'RECUPERAR SENHA', title: 'Vamos recuperar seu acesso.', description: 'Informe o e-mail da sua conta.', headline: 'Um novo começo para sua jornada.', action: 'Solicitar recuperação' },
};

export function AccessPage({ mode }: { mode: AccessMode }) {
  const [fields, setFields] = useState<AccessFields>({ name: '', email: '', phone: '', password: '', confirmation: '' });
  const [errors, setErrors] = useState<AccessErrors>({});
  const [message, setMessage] = useState('');
  const form = useRef<HTMLFormElement>(null);
  const [params] = useSearchParams();
  const journey = params.get('jornada');
  const suffix = journey === 'cabelo' || journey === 'maquiagem' ? `?jornada=${journey}` : '';
  const text = copy[mode];
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateAccess(mode, fields);
    setErrors(nextErrors);
    setMessage('');
    const first = Object.keys(nextErrors)[0];
    if (first) {
      (form.current?.elements.namedItem(first) as HTMLInputElement | null)?.focus();
      return;
    }
    setMessage(mode === 'recuperar' ? 'A recuperação por e-mail ainda não está disponível. Nenhum e-mail foi enviado.' : mode === 'cadastro' ? 'O cadastro ainda não está disponível. Nenhuma conta foi criada.' : 'O acesso à conta ainda não está disponível. Você não foi autenticada.');
    setFields(previous => ({ ...previous, password: '', confirmation: '' }));
  }
  function field(name: keyof AccessFields, label: string, type: string, autoComplete: string, placeholder?: string) {
    return <div className="access-field">
      <label htmlFor={`access-${name}`}>{label}</label>
      <input id={`access-${name}`} name={name} type={type} autoComplete={autoComplete} placeholder={placeholder} value={fields[name]} required={name !== 'phone'} minLength={name === 'password' && mode === 'cadastro' ? 8 : undefined}
        aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `error-${name}` : name === 'password' && mode === 'cadastro' ? 'password-hint' : undefined}
        onChange={event => { setFields(previous => ({ ...previous, [name]: event.target.value })); setErrors(previous => ({ ...previous, [name]: undefined })); setMessage(''); }} />
      {name === 'password' && mode === 'cadastro' && <small id="password-hint">Pelo menos 8 caracteres.</small>}
      {errors[name] && <p className="field-error" id={`error-${name}`}>{errors[name]}</p>}
    </div>;
  }
  return <div className="access-page">
    <aside className="identity-panel" aria-label="Espelho Meu">
      <Link to={paths.home} className="identity-panel__brand">Espelho Meu</Link><p className="identity-panel__tagline">SEU ESTILO, SUAS REGRAS</p>
      <div className="identity-panel__copy"><p>{text.headline}</p><span aria-hidden="true" /><p>Consultorias, simulações e dicas personalizadas, em um só lugar.</p></div>
    </aside>
    <Link className="home-shortcut" to={paths.home} aria-label="Voltar ao início"><img src={homeIcon} alt="" /></Link>
    <section className="access-content" aria-labelledby="access-title">
      <p className="eyebrow">{text.eyebrow}</p><h1 id="access-title">{text.title}</h1><p>{text.description}</p>
      <p className="notice">{mode === 'recuperar' ? 'Recuperação de senha' : mode === 'cadastro' ? 'Cadastro' : 'Login'} em preparação. Você pode conferir os campos, mas os dados não serão enviados nem salvos.</p>
      {suffix && <p>Jornada selecionada: {journey}. A consultoria personalizada exige uma conta autenticada.</p>}
      <form ref={form} onSubmit={submit} noValidate>
        {mode === 'cadastro' && field('name', 'Nome completo', 'text', 'name', 'Digite seu nome')}
        <div className={mode === 'cadastro' ? 'access-row' : undefined}>
          {field('email', 'E-mail', 'email', 'email', 'voce@exemplo.com')}
          {mode === 'cadastro' && field('phone', 'Telefone (opcional)', 'tel', 'tel', '(00) 00000-0000')}
        </div>
        {mode !== 'recuperar' && <div className={mode === 'cadastro' ? 'access-row' : undefined}>
          {field('password', 'Senha', 'password', mode === 'cadastro' ? 'new-password' : 'current-password')}
          {mode === 'cadastro' && field('confirmation', 'Confirmar senha', 'password', 'new-password')}
        </div>}
        {mode === 'cadastro' && <div className="terms-pending"><label><input type="checkbox" disabled /> Li e concordo com os Termos de uso e a Política de privacidade.</label><p>Documentos em preparação. O aceite será habilitado quando estiverem disponíveis para leitura.</p></div>}
        {mode === 'login' && <Link to={`${paths.recuperarSenha}${suffix}`}>Esqueci minha senha</Link>}
        <button className="action-link action-link--primary access-submit" type="submit">{text.action}</button>
        <p role="status" className="submission-status">{message}</p>
      </form>
      <div className="access-links">{mode === 'cadastro' ? <p>Já tem conta? <Link to={`${paths.entrar}${suffix}`}>Entrar</Link></p> : <Link to={`${paths.cadastro}${suffix}`}>Criar conta</Link>}{mode === 'recuperar' && <Link to={`${paths.entrar}${suffix}`}>Voltar para entrar</Link>}{suffix && <Link to={`${paths.consultoria}${suffix}`}>Voltar à consultoria</Link>}</div>
    </section>
  </div>;
}
