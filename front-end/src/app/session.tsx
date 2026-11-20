import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router';
import { privateApi, PrivateApiError } from '../services/api/privateApi';
import { paths } from './paths';

type User = { id: number; nome: string; email: string; role: 'USER' | 'ADMIN' };
type State = { status: 'loading' | 'signed-out' | 'error' } | { status: 'signed-in'; user: User };
const SessionContext = createContext<{
  state: State;
  retry: () => void;
  login: (email: string, senha: string) => Promise<User>;
  logout: () => Promise<void>;
} | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    privateApi<User>('/auth/sessao', { signal: controller.signal }).then(user => {
      if (!controller.signal.aborted) setState(current => current.status === 'loading' ? { status: 'signed-in', user } : current);
    }).catch(error => {
      if (!controller.signal.aborted) setState(current => current.status === 'loading'
        ? { status: error instanceof PrivateApiError && error.status === 401 ? 'signed-out' : 'error' }
        : current);
    });
    return () => controller.abort();
  }, [attempt]);
  return <SessionContext.Provider value={{
    state,
    retry() { setState({ status: 'loading' }); setAttempt(value => value + 1); },
    async login(email, senha) {
      const user = await privateApi<User>('/auth/login', { method: 'POST', body: { email, senha } });
      setState({ status: 'signed-in', user });
      return user;
    },
    async logout() {
      try { await privateApi<void>('/auth/logout', { method: 'POST' }); }
      catch (error) {
        if (!(error instanceof PrivateApiError) || error.status !== 401) throw error;
      }
      setState({ status: 'signed-out' });
    },
  }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('Sessão fora do provedor.');
  return value;
}

export function RequireSession({ admin = false }: { admin?: boolean }) {
  const { state, retry } = useSession();
  const location = useLocation();
  if (state.status === 'loading') return <p className="notice" role="status">Verificando sua sessão…</p>;
  if (state.status === 'error') return <div className="notice"><p role="alert">Não foi possível verificar sua sessão.</p>
    <button type="button" className="action-link action-link--outline" onClick={retry}>Tentar novamente</button></div>;
  if (state.status !== 'signed-in') return <Navigate to={paths.entrar}
    state={{ from: location.pathname + location.search }} replace />;
  if (admin && state.user.role !== 'ADMIN') return <section className="notice">
    <h1>Acesso restrito</h1><p>Esta área exige permissão de administrador.</p>
    <Link to={paths.conta}>Voltar à minha conta</Link>
  </section>;
  return <Outlet />;
}
