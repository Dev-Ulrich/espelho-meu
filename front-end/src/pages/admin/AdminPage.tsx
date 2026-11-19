import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, NavLink, useNavigate, useParams } from 'react-router';
import { paths } from '../../app/paths';
import { useSession } from '../../app/session';
import { privateApi } from '../../services/api/privateApi';
import { productCategories } from '../../services/api/productDemo';
import styles from '../authenticated/workspace.module.css';

type Row = { id: number; nome: string } & Record<string, string | number | null>;
type Field = { key: string; label: string; type?: string; max?: number; optional?: boolean; options?: readonly string[] };
const imageField = { key: 'imagem', label: 'Imagem JPG, PNG ou WebP', type: 'file' };
const entities = {
  produtos: { path: '/produto', label: 'Produtos', description: 'Itens, marcas, preços e categorias.', fields: [
    { key: 'nome', label: 'Nome', max: 20 },
    { key: 'categoria', label: 'Categoria', options: productCategories },
    { key: 'marca', label: 'Marca', max: 30 },
    { key: 'categoriaPrincipal', label: 'Categoria principal', max: 30 },
    { key: 'precoReferencia', label: 'Preço de referência', type: 'number' },
    { key: 'avaliacao', label: 'Avaliação', type: 'number' },
    { key: 'cor', label: 'Cor', max: 30, optional: true },
    { key: 'data', label: 'Data e hora', type: 'datetime-local', optional: true },
  ] },
  usuarios: { path: '/usuario', label: 'Usuários', description: 'Cadastre contas e atualize os dados de usuários.', fields: [
    { key: 'nome', label: 'Nome', max: 100 },
    { key: 'email', label: 'E-mail', type: 'email', max: 100 },
    { key: 'data', label: 'Data de nascimento', type: 'date' },
    { key: 'telefone', label: 'Telefone', type: 'tel', max: 20, optional: true },
  ] },
  cortes: { path: '/corte', label: 'Cortes de cabelo', description: 'Cortes, orientações de manutenção e imagens.', fields: [
    { key: 'nome', label: 'Nome', max: 40 },
    { key: 'descricao', label: 'Descrição', max: 100 },
    { key: 'informacaoManutencao', label: 'Informações de manutenção', max: 150 },
    imageField,
  ] },
  penteados: { path: '/penteado', label: 'Penteados', description: 'Penteados, orientações de manutenção e imagens.', fields: [
    { key: 'nome', label: 'Nome', max: 30 },
    { key: 'descricao', label: 'Descrição', max: 100 },
    { key: 'informacaoManutencao', label: 'Informações de manutenção', max: 150 },
    imageField,
  ] },
} satisfies Record<string, { path: string; label: string; description: string; fields: Field[] }>;
type EntityKey = keyof typeof entities;

function encodeImage(file: File) {
  if (file.size > 2 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Selecione uma imagem JPG, PNG ou WebP de até 2 MB.');
  }
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.readAsDataURL(file);
  });
}

function EntityCrud({ entity }: { entity: EntityKey }) {
  const { label, path, fields } = entities[entity];
  const [rows, setRows] = useState<Row[]>();
  const [attempt, setAttempt] = useState(0);
  const [editor, setEditor] = useState<Row | 'new'>();
  const [target, setTarget] = useState<Row>();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    privateApi<Row[]>(path, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setRows(data);
    }).catch(cause => { if (!controller.signal.aborted) setError(cause.message); });
    return () => controller.abort();
  }, [path, attempt]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const form = new FormData(event.currentTarget);
      const data: Record<string, unknown> = {};
      for (const field of fields as Field[]) {
        const value = form.get(field.key);
        if (field.type === 'file') {
          if (value instanceof File && value.size) data[field.key] = await encodeImage(value);
          else if (editor !== 'new') data[field.key] = editor[field.key];
          else throw new Error('Adicione uma imagem ao registro.');
        } else if (field.type === 'number') data[field.key] = Number(value);
        else data[field.key] = String(value ?? '').trim() || null;
      }
      if (entity === 'usuarios' && editor === 'new') {
        await privateApi('/auth/admin/usuarios', { method: 'POST', body: {
          nome: data.nome, email: data.email, telefone: data.telefone,
          dataNascimento: data.data, senha: String(form.get('senha') ?? ''),
        } });
      } else {
        await privateApi(editor === 'new' ? path : path + '/' + editor.id, {
          method: editor === 'new' ? 'POST' : 'PUT', body: data,
        });
      }
      setEditor(undefined); setNotice('Registro salvo.'); setAttempt(value => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar.');
    } finally { setBusy(false); }
  }

  async function remove() {
    if (!target || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await privateApi(path + '/' + target.id, { method: 'DELETE' });
      setTarget(undefined); setNotice('Registro excluído.'); setAttempt(value => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível excluir.');
    } finally { setBusy(false); }
  }

  return <section className={styles.panel}>
    <h2 className={styles.title}>{label}</h2>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {editor ? <form onSubmit={save} key={editor === 'new' ? 'new' : editor.id}>
      <h3>{editor === 'new' ? 'Novo registro' : 'Editar ' + editor.nome}</h3>
      <fieldset className={styles.stack} disabled={busy}>
        {(fields as Field[]).map(field => {
          const value = editor === 'new' ? '' : String(editor[field.key] ?? '');
          return <label key={field.key} className={styles.field}>{field.label}
            {field.options ? <select name={field.key} defaultValue={value} required>
              <option value="">Selecione</option>{field.options.map(option => <option key={option}>{option}</option>)}
            </select> : field.type === 'file' ? <input name={field.key} type="file"
              accept="image/jpeg,image/png,image/webp" required={editor === 'new'} /> :
              <input name={field.key} type={field.type ?? 'text'} maxLength={field.max}
                step={field.type === 'number' ? '0.01' : undefined}
                min={field.key === 'precoReferencia' ? '0' : undefined}
                defaultValue={field.type === 'datetime-local' ? value.slice(0, 16) : value} required={!field.optional} />}
          </label>;
        })}
        {entity === 'usuarios' && editor === 'new' && <label className={styles.field}>Senha inicial
          <input name="senha" type="password" autoComplete="new-password" required minLength={8} maxLength={72} /></label>}
      </fieldset>
      <div className={styles.actions}>
        <button className="action-link action-link--primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</button>
        <button type="button" className="action-link action-link--outline" disabled={busy} onClick={() => setEditor(undefined)}>Cancelar</button>
      </div>
    </form> : <>
      <button type="button" className="action-link action-link--primary" disabled={!!target}
        onClick={() => { setEditor('new'); setError(''); setNotice(''); }}>Novo registro</button>
      {target && <div className={styles.panel} role="group" aria-label="Confirmação de exclusão">
        <p>Excluir {target.nome}?</p><div className={styles.actions}>
          <button type="button" className="action-link action-link--primary" disabled={busy} onClick={remove}>Confirmar exclusão</button>
          <button type="button" className="action-link action-link--outline" disabled={busy} onClick={() => setTarget(undefined)}>Cancelar</button>
        </div>
      </div>}
      {rows === undefined ? error ? <button className={styles.link}
        onClick={() => { setError(''); setAttempt(value => value + 1); }}>Tentar novamente</button> : <p role="status">Carregando…</p>
        : rows.length === 0 ? <p>Nenhum registro cadastrado.</p> : <ul className={styles.grid}>
          {rows.map(row => <li key={row.id} className={styles.item}>
            <h3>{row.nome}</h3>
            {typeof row.imagem === 'string' && row.imagem && <img className={styles.adminImage}
              src={imageSource(row.imagem)} alt={`Referência de ${row.nome}`} loading="lazy" />}
            <p>{String(row.email ?? row.marca ?? row.descricao ?? '')}</p>
            <div className={styles.actions}>
              <button className={styles.link} disabled={!!target} onClick={() => { setEditor(row); setError(''); }}>Editar</button>
              <button className={styles.link} disabled={!!target} onClick={() => { setTarget(row); setError(''); }}>Excluir</button>
            </div>
          </li>)}
        </ul>}
    </>}
  </section>;
}

function imageSource(value: string) {
  const mime = value.startsWith('/9j/') ? 'jpeg' : value.startsWith('UklGR') ? 'webp' : 'png';
  return `data:image/${mime};base64,${value}`;
}

export function AdminPage() {
  const { entidade } = useParams();
  const { state, logout } = useSession();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const isImages = entidade === 'imagens';
  if (entidade && !isImages && !Object.hasOwn(entities, entidade)) return <Navigate to={paths.admin} replace />;

  async function signOut() {
    setSigningOut(true);
    setSignOutError('');
    try {
      await logout();
      navigate(paths.entrar, { replace: true });
    } catch {
      setSignOutError('Não foi possível encerrar a sessão. Tente novamente.');
      setSigningOut(false);
    }
  }

  return <section className={styles.page}>
    <header className={styles.workspaceHero}>
      <div><h1 className={styles.title}>Painel administrativo</h1>
        <p>{state.status === 'signed-in' ? state.user.nome + ' · ' : ''}Administração do Espelho Meu</p></div>
      <button type="button" className="action-link action-link--outline" onClick={signOut} disabled={signingOut}>
        {signingOut ? 'Saindo…' : 'Sair'}
      </button>
      {signOutError && <p role="alert">{signOutError}</p>}
    </header>
    <nav className={`${styles.nav} ${styles.adminTabs}`} aria-label="Cadastros administrativos">
      <NavLink end to={paths.admin}>Visão geral</NavLink>
      {Object.entries(entities).map(([key, value]) => <NavLink end key={key} to={paths.admin + '/' + key}>{value.label}</NavLink>)}
      <NavLink end to={paths.admin + '/imagens'}>Imagens</NavLink>
    </nav>
    {isImages ? <section className={styles.panel}>
      <h2 className={styles.title}>Imagens de referência</h2>
      <p>Adicione uma foto ao cadastrar um corte ou penteado. Para trocar uma foto, abra o registro e escolha “Editar”.</p>
      <div className={styles.actions}>
        <Link className="action-link action-link--primary" to={paths.admin + '/cortes'}>Imagens de cortes</Link>
        <Link className="action-link action-link--outline" to={paths.admin + '/penteados'}>Imagens de penteados</Link>
      </div>
    </section> : entidade ? <EntityCrud key={entidade} entity={entidade as EntityKey} /> :
      <div className={styles.grid}>
        {Object.entries(entities).map(([key, value]) => <Link key={key} className={styles.item} to={paths.admin + '/' + key}>
          <h2>{value.label}</h2><p>{value.description}</p>
        </Link>)}
      </div>}
  </section>;
}
