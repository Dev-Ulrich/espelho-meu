import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSession } from '../../app/session';
import { emptyLibrary, readLibrary, writeLibrary, type Library } from './library';

const LibraryContext = createContext<{ data: Library; update: (change: (value: Library) => Library) => void }>({
  data: emptyLibrary(), update() { throw new Error('Entre na sua conta para salvar.'); },
});
export const useLibrary = () => useContext(LibraryContext);
function UserLibrary({ userId, children }: { userId?: number; children: ReactNode }) {
  const [data, setData] = useState(() => userId && typeof window !== 'undefined' ? readLibrary(userId) : emptyLibrary());
  const latest = useRef(data);
  const update = useCallback((change: (value: Library) => Library) => {
    if (!userId) throw new Error('Entre na sua conta para salvar.');
    const next = change(latest.current);
    try { writeLibrary(userId, next); }
    catch { throw new Error('Não foi possível salvar neste navegador. Verifique o espaço disponível e as permissões de armazenamento.'); }
    latest.current = next;
    setData(next);
  }, [userId]);
  useEffect(() => {
    const sync = () => { if (userId) { const next = readLibrary(userId); latest.current = next; setData(next); } };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [userId]);
  useEffect(() => { document.documentElement.toggleAttribute('data-reduced-motion', data.preferences.reducedMotion); }, [data.preferences.reducedMotion]);
  return <LibraryContext.Provider value={{ data, update }}>{children}</LibraryContext.Provider>;
}
export function LibraryProvider({ children }: { children: ReactNode }) {
  const { state } = useSession();
  const id = state.status === 'signed-in' ? state.user.id : undefined;
  return <UserLibrary key={id ?? 'visitor'} userId={id}>{children}</UserLibrary>;
}
