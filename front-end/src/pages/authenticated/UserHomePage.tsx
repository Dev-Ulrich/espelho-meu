import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useSession } from '../../app/session';
import { ActionLink } from '../../components/ui/ActionLink';
import styles from './workspace.module.css';

export function UserHomePage() {
  const { state, logout } = useSession();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (state.status !== 'signed-in') return null;
  return <section className={styles.page}>
    <header className={styles.workspaceHero}>
      <div><h1 className={styles.title}>Minha conta</h1><p>Olá, {state.user.nome}.</p></div>
    </header>
    <div className={styles.panel}>
      <p>{state.user.email}</p>
      <div className={styles.actions}>
        <ActionLink to="/consultoria">Iniciar consultoria</ActionLink>
        <button className="action-link action-link--outline" disabled={busy} onClick={async () => {
          setBusy(true); setError('');
          try { await logout(); navigate('/entrar', { replace: true }); }
          catch { setError('Não foi possível encerrar a sessão. Tente novamente.'); }
          finally { setBusy(false); }
        }}>{busy ? 'Encerrando…' : 'Sair'}</button>
      </div>
      {error && <p role="alert">{error}</p>}
    </div>
  </section>;
}
