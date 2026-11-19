import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { paths } from '../../app/paths';
import homeIcon from '../../assets/figma/cadastro-Vector.svg';
import { validateAccess } from './validation';
import type { AccessErrors, AccessFields, AccessMode } from './validation';
import { useSession } from '../../app/session';
import { privateApi } from '../../services/api/privateApi';
import './access.css';
import styles from './access.module.css';

const copy = {
  cadastro: { eyebrow: 'CADASTRE-SE', title: 'Faça parte do Espelho Meu.', description: 'Crie sua conta para salvar suas preferências, receber recomendações personalizadas e explorar todos os recursos da plataforma.', headline: 'Crie sua conta e viva uma nova experiência de beleza.', action: 'Cadastrar-se' },
  login: { eyebrow: 'ENTRAR', title: 'Bem-vinda ao Espelho Meu.', description: 'Acesse sua conta para continuar sua jornada.', headline: 'Seu estilo, suas regras.', action: 'Entrar' },

};

export function AccessPage({ mode }: { mode: Exclude<AccessMode, 'recuperar'> }) {
  const [fields, setFields] = useState<AccessFields>({ name: '', email: '', phone: '', password: '', confirmation: '', nascimento: '' });
  const [errors, setErrors] = useState<AccessErrors>({});
  const [message, setMessage] = useState('');
  const form = useRef<HTMLFormElement>(null);
  const { state, login } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [sending, setSending] = useState(false);
  const requested = typeof location.state?.from === 'string' ? location.state.from : '';
  const next = /^\/(consultoria(\/|\?|$)|minha-conta(\?|$)|admin(\/|$))/.test(requested) ? requested : '';
  const text = copy[mode];
  if (state.status === 'signed-in') return <Navigate replace to={next || (state.user.role === 'ADMIN' ? '/admin' : paths.conta)} />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateAccess(mode, fields);
    setErrors(nextErrors);
    setMessage('');
    const first = Object.keys(nextErrors)[0];
    if (first) {
      (form.current?.elements.namedItem(first) as HTMLInputElement | null)?.focus();
      return;
    }
    if (sending) return;
    setSending(true);
    try {
      if (mode === 'cadastro') {
        await privateApi('/auth/cadastro', { method: 'POST', body: {
          nome: fields.name.trim(), email: fields.email.trim(), telefone: fields.phone.trim() || null,
          dataNascimento: fields.nascimento, senha: fields.password,
        } });
        navigate(paths.entrar, { replace: true, state: { from: next, registered: true } });
      } else {
        const user = await login(fields.email.trim(), fields.password);
        navigate(next || (user.role === 'ADMIN' ? '/admin' : paths.conta), { replace: true });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível continuar.');
    } finally {
      setSending(false);
    }
  }
  function field(name: keyof AccessFields, label: string, type: string, autoComplete: string, placeholder?: string) {
    return <div className="access-field">
      <label htmlFor={`access-${name}`}>{label}</label>
      <input id={`access-${name}`} name={name} type={type} autoComplete={autoComplete} placeholder={placeholder} value={fields[name]} required={name !== 'phone'} minLength={name === 'password' && mode === 'cadastro' ? 8 : undefined}
        maxLength={name === 'password' || name === 'confirmation' ? 72 : name === 'phone' ? 20 : name === 'nascimento' ? undefined : 100}
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
      {location.state?.registered && <p className="notice" role="status">Conta criada. Entre para continuar.</p>}
      <form ref={form} onSubmit={submit} noValidate aria-busy={sending}>
        {mode === 'cadastro' && field('name', 'Nome completo', 'text', 'name', 'Digite seu nome')}
        <div className={mode === 'cadastro' ? 'access-row' : undefined}>
          {field('email', 'E-mail', 'email', 'email', 'voce@exemplo.com')}
          {mode === 'cadastro' && field('phone', 'Telefone (opcional)', 'tel', 'tel', '(00) 00000-0000')}
        </div>
        {mode === 'cadastro' && <div className={styles.birth}>{field('nascimento', 'Data de nascimento', 'date', 'bday')}</div>}
        {<div className={mode === 'cadastro' ? 'access-row' : undefined}>
          {field('password', 'Senha', 'password', mode === 'cadastro' ? 'new-password' : 'current-password')}
          {mode === 'cadastro' && field('confirmation', 'Confirmar senha', 'password', 'new-password')}
        </div>}
        <button className="action-link action-link--primary access-submit" type="submit" disabled={sending}>{sending ? 'Aguarde…' : text.action}</button>
        <p role="status" className="submission-status">{message}</p>
      </form>
      <div className="access-links">
        {mode === 'cadastro' ? <p>Já tem conta? <Link to={paths.entrar} state={{ from: next }}>Entrar</Link></p> :
          <Link to={paths.cadastro} state={{ from: next }}>Criar conta</Link>}
      </div>
    </section>
  </div>;
}
