import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, NavLink, useLocation, useNavigate, useParams } from 'react-router';
import { paths } from '../../app/paths';
import { useSession } from '../../app/session';
import { privateApi } from '../../services/api/privateApi';
import { productCategories } from '../../services/api/productDemo';
import { AdminTable, type Column } from './AdminTable';
import { AiHairCatalog } from './AiHairCatalog';
import { aiHairCatalog } from './hairCatalog';
import styles from '../authenticated/workspace.module.css';

type Row = { id: number } & Record<string, string | number | null>;
type Field = { key: string; label: string; type?: string; max?: number; optional?: boolean; options?: readonly string[] };
type Entity = { path: string; label: string; description: string; fields: readonly Field[] };
const imageField = { key: 'imagem', label: 'Imagem JPG, PNG ou WebP', type: 'file' };
const priceField = { key: 'precoReferencia', label: 'Preço de referência (R$)', type: 'number' };
const ratingField = { key: 'avaliacao', label: 'Avaliação', type: 'number' };
const entities = {
  produtos: { path: '/produto', label: 'Produtos capilares', description: 'Shampoos, condicionadores, finalizadores e outros produtos de cabelo.', fields: [
    { key: 'nome', label: 'Nome', max: 20 },
    { key: 'categoria', label: 'Categoria', options: productCategories },
    { key: 'marca', label: 'Marca', max: 30 },
    { key: 'categoriaPrincipal', label: 'Categoria principal', max: 30 },
    priceField,
    ratingField,
    { key: 'cor', label: 'Cor', max: 30, optional: true },
    { key: 'data', label: 'Data e hora', type: 'datetime-local', optional: true },
  ] },
  maquiagem: { path: '/maquiagem', label: 'Maquiagem', description: 'Bases, corretivos e pós, com tonalidades e acabamentos.', fields: [
    { key: 'tipo', label: 'Tipo', options: ['Base', 'Corretivo', 'Pó Compacto', 'Pó Solto'] },
    { key: 'marca', label: 'Marca', max: 40 },
    { key: 'linhaProduto', label: 'Linha do produto', max: 50 },
    { key: 'cor', label: 'Cor', max: 30 },
    { key: 'codigoTonalidade', label: 'Código da tonalidade', max: 20 },
    { key: 'tipoCobertura', label: 'Cobertura', max: 50 },
    { key: 'acabamento', label: 'Acabamento', max: 50 },
    priceField,
    ratingField,
  ] },
  usuarios: { path: '/usuario', label: 'Usuários', description: 'Cadastre contas e atualize os dados de usuários.', fields: [
    { key: 'nome', label: 'Nome', max: 100 },
    { key: 'email', label: 'E-mail', type: 'email', max: 100 },
    { key: 'data', label: 'Data de nascimento', type: 'date' },
    { key: 'telefone', label: 'Telefone', type: 'tel', max: 20, optional: true },
  ] },
  cortes: { path: '/corte', label: 'Cortes de cabelo', description: 'Catálogo de recomendações da IA e cadastros do Oracle.', fields: [
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
  cores: { path: '/corcabelo', label: 'Cores de cabelo', description: 'Tonalidades e imagens de referência para coloração.', fields: [
    { key: 'nomeTonalidade', label: 'Tonalidade', max: 30 },
    { key: 'infotmacaoManutencao', label: 'Informações de manutenção', max: 150 },
    imageField,
  ] },
} satisfies Record<string, Entity>;
type EntityKey = keyof typeof entities;

type Summary = Record<EntityKey, number>;

function AdminOverview() {
  const [summary, setSummary] = useState<Summary>();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    privateApi<Summary>('/auth/admin/resumo', { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setSummary(data); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [attempt]);

  const sections: EntityKey[] = ['usuarios', 'cortes', 'penteados', 'cores', 'produtos', 'maquiagem'];
  return <section aria-labelledby="admin-overview">
    <h2 id="admin-overview" className={styles.overviewTitle}>Visão geral</h2>
    {error ? <div className={styles.actions}>
      <p role="status">Os totais estão indisponíveis.</p>
      <button type="button" className={styles.link} onClick={() => { setError(false); setAttempt(value => value + 1); }}>Tentar novamente</button>
    </div> : !summary && <p role="status">Carregando totais…</p>}
    <div className={styles.grid}>
      {sections.map(key => <Link key={key} className={styles.item} to={paths.admin + '/' + key}>
        <h3>{entities[key].label}</h3>
        {key === 'cortes' ? <p className={styles.metric}>{aiHairCatalog.length} <span>cortes na IA</span></p>
          : summary && <p className={styles.metric}>{summary[key]} <span>{summary[key] === 1 ? 'registro' : 'registros'}</span></p>}
        <p>{entities[key].description}</p>
      </Link>)}
    </div>
  </section>;
}

const pageSize = 12;
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function rowName(row: Row) {
  return String(row.nome ?? row.nomeTonalidade ?? row.linhaProduto ?? 'Registro ' + row.id);
}

function roleLabel(role: Row['role']) {
  return role === 'ADMIN' ? 'Administrador' : role === 'USER' ? 'Usuário' : 'Sem credencial';
}

function rowDetails(entity: EntityKey, row: Row) {
  if (entity === 'usuarios') {
    return [row.email, row.status, roleLabel(row.role)];
  }
  const price = typeof row.precoReferencia === 'number' ? currency.format(row.precoReferencia) : null;
  return [row.marca, row.tipo ?? row.categoria, row.cor, price, row.descricao ?? row.infotmacaoManutencao].filter(Boolean);
}

function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR');
}

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

const extraColumns: Record<EntityKey, readonly Field[]> = {
  usuarios: [{ key: 'status', label: 'Status' }, { key: 'role', label: 'Acesso' }],
  produtos: [{ key: 'faixaPreco', label: 'Faixa de preço' }],
  maquiagem: [{ key: 'faixaPreco', label: 'Faixa de preço' }],
  cortes: [],
  penteados: [],
  cores: [],
};

function RecordPhoto({ endpoint, name }: { endpoint: string; name: string }) {
  const element = useRef<HTMLDivElement>(null);
  const [photo, setPhoto] = useState('');
  const [label, setLabel] = useState('–');

  useEffect(() => {
    const controller = new AbortController();
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      privateApi<Row>(endpoint, { signal: controller.signal }).then(row => {
        if (!controller.signal.aborted && typeof row.imagem === 'string' && row.imagem) setPhoto(imageSource(row.imagem));
      }).catch(() => { if (!controller.signal.aborted) setLabel('Indisponível'); });
    });
    if (element.current) observer.observe(element.current);
    return () => { observer.disconnect(); controller.abort(); };
  }, [endpoint]);

  return <div ref={element} className={styles.catalogPhoto}>{photo
    ? <img src={photo} alt={`Referência de ${name}`} />
    : label}</div>;
}

function formatCell(row: Row, field: Field) {
  const value = row[field.key];
  if (field.key === 'role') return roleLabel(value);
  if (value === null || value === undefined || value === '') return '–';
  if (field.key === 'precoReferencia' && typeof value === 'number') return currency.format(value);
  if (field.type === 'date' || field.type === 'datetime-local') {
    const formatted = String(value).slice(0, 10).split('-').reverse().join('/');
    return field.type === 'datetime-local' ? formatted + ' ' + String(value).slice(11, 16) : formatted;
  }
  return value;
}

function EntityCrud({ entity, title }: { entity: EntityKey; title?: string }) {
  const { label, path, fields }: Entity = entities[entity];
  const hasImage = fields.some(field => field.type === 'file');
  const listPath = entity === 'usuarios' ? '/auth/admin/usuarios' : path + (hasImage ? '?incluirImagem=false' : '');
  const [rows, setRows] = useState<Row[]>();
  const [attempt, setAttempt] = useState(0);
  const [editor, setEditor] = useState<Row | 'new'>();
  const [target, setTarget] = useState<Row>();
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => {
    const controller = new AbortController();
    privateApi<Row[]>(listPath, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setRows(data);
    }).catch(cause => { if (!controller.signal.aborted) {
      setRows(undefined);
      setListError(cause instanceof Error ? cause.message : 'Não foi possível carregar os registros.');
    } });
    return () => controller.abort();
  }, [listPath, attempt]);

  async function edit(row: Row) {
    setError('');
    setNotice('');
    if (!hasImage) {
      setEditor(row);
      return;
    }
    setBusy(true);
    try {
      setEditor(await privateApi<Row>(path + '/' + row.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível abrir o registro.');
    } finally {
      setBusy(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const form = new FormData(event.currentTarget);
      const data: Record<string, unknown> = {};
      for (const field of fields) {
        const value = form.get(field.key);
        if (field.type === 'file') {
          if (value instanceof File && value.size) data[field.key] = await encodeImage(value);
          else if (editor !== 'new' && editor[field.key]) data[field.key] = editor[field.key];
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
      if (editor === 'new') { setSearch(''); setPage(1); }
      setRows(undefined); setListError(''); setEditor(undefined); setNotice('Registro salvo.'); setAttempt(value => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar.');
    } finally { setBusy(false); }
  }

  async function remove() {
    if (!target || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await privateApi(path + '/' + target.id, { method: 'DELETE' });
      setRows(undefined); setListError(''); setTarget(undefined); setNotice('Registro excluído.'); setAttempt(value => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível excluir.');
    } finally { setBusy(false); }
  }

  const query = normalizeSearch(search.trim());
  const filtered = rows?.filter(row =>
    normalizeSearch([row.id, rowName(row), ...rowDetails(entity, row)].join(' ')).includes(query)) ?? [];
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const activePage = Math.min(page, pages);
  const visibleRows = filtered.slice((activePage - 1) * pageSize, activePage * pageSize);
  const currentImage = editor && editor !== 'new' && typeof editor.imagem === 'string' ? editor.imagem : '';

  const columns: Column<Row>[] = [{ label: 'ID', cell: row => row.id }];
  if (hasImage) columns.push({ label: 'Foto', cell: row => <RecordPhoto endpoint={path + '/' + row.id} name={rowName(row)} /> });
  const nameFields = ['nome', 'nomeTonalidade', 'linhaProduto'];
  const nameField = fields.find(field => nameFields.includes(field.key));
  const details = fields.filter(field => field !== nameField && field.type !== 'file');
  const listFields = nameField ? [nameField, ...details] : details;
  columns.push(...[...listFields, ...extraColumns[entity]].map(field => ({
    label: field.label,
    heading: field === nameField,
    cell: (row: Row) => formatCell(row, field),
  })), {
    label: 'Ações',
    cell: row => <div className={styles.tableActions}>
      <button type="button" className={styles.link} disabled={busy || !!target} onClick={() => edit(row)}>Editar</button>
      {row.role !== 'ADMIN' && <button type="button" className={styles.link} disabled={busy || !!target}
        onClick={() => { setTarget(row); setError(''); setNotice(''); }}>Excluir</button>}
    </div>,
  });

  return <section className={styles.panel} aria-busy={busy}>
    <h2 className={styles.title}>{title ?? label}</h2>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {editor ? <form onSubmit={save} key={editor === 'new' ? 'new' : editor.id}>
      <h3>{editor === 'new' ? 'Novo registro' : 'Editar ' + rowName(editor)}</h3>
      {currentImage && <img className={styles.adminImage} src={imageSource(currentImage)} alt="Imagem atual" />}
      <fieldset className={styles.stack} disabled={busy}>
        {(fields).map(field => {
          const value = editor === 'new' ? '' : String(editor[field.key] ?? '');
          return <label key={field.key} className={styles.field}>{field.label}
            {field.options ? <select name={field.key} defaultValue={value} required>
              <option value="">Selecione</option>{field.options.map(option => <option key={option}>{option}</option>)}
            </select> : field.type === 'file' ? <input name={field.key} type="file"
              accept="image/jpeg,image/png,image/webp" required={!currentImage} /> :
              <input name={field.key} type={field.type ?? 'text'} maxLength={field.max}
                step={field.type === 'number' ? '0.01' : undefined}
                min={field.key === 'precoReferencia' ? 0 : undefined}
                max={field.key === 'precoReferencia' ? 99999999.99 : field.key === 'avaliacao' ? 9.99 : undefined}
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
      <div className={styles.adminToolbar}>
        <label className={styles.field}>Buscar {label.toLocaleLowerCase('pt-BR')}
          <input type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} />
        </label>
        <button type="button" className="action-link action-link--primary" disabled={busy || !!target}
          onClick={() => { setEditor('new'); setError(''); setNotice(''); }}>
          {entity === 'usuarios' ? 'Novo usuário' : 'Novo registro'}
        </button>
      </div>
      {target && <div className={styles.panel} role="group" aria-label="Confirmação de exclusão">
        <p>Excluir {rowName(target)}?</p><div className={styles.actions}>
          <button type="button" className="action-link action-link--primary" disabled={busy} onClick={remove}>Confirmar exclusão</button>
          <button type="button" className="action-link action-link--outline" disabled={busy} onClick={() => setTarget(undefined)}>Cancelar</button>
        </div>
      </div>}
      {rows === undefined ? listError ? <>
        <p role="alert" className={styles.error}>{listError}</p>
        <button type="button" className={styles.link}
          onClick={() => { setListError(''); setAttempt(value => value + 1); }}>Tentar novamente</button>
      </> : <p role="status">Carregando…</p>
        : rows.length === 0 ? <p>Nenhum registro cadastrado.</p>
        : filtered.length === 0 ? <p>Nenhum registro encontrado para a busca.</p>
        : <>
          <p role="status" className={styles.adminCount}>{filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}</p>
          <AdminTable label={title ?? label} columns={columns} rows={visibleRows} />
          {pages > 1 && <nav className={styles.actions} aria-label="Páginas de registros">
            <button type="button" className={styles.link} disabled={busy || !!target || activePage === 1}
              onClick={() => setPage(activePage - 1)}>Anterior</button>
            <span>Página {activePage} de {pages}</span>
            <button type="button" className={styles.link} disabled={busy || !!target || activePage === pages}
              onClick={() => setPage(activePage + 1)}>Próxima</button>
          </nav>}
        </>}
    </>}
  </section>;
}

function imageSource(value: string) {
  const mime = value.startsWith('/9j/') ? 'jpeg' : value.startsWith('UklGR') ? 'webp' : 'png';
  return `data:image/${mime};base64,${value}`;
}

function HaircutsAdmin() {
  const { search } = useLocation();
  const isOracle = new URLSearchParams(search).get('origem') === 'oracle';
  const route = paths.admin + '/cortes';
  return <section className={styles.panel}>
    <h2 className={styles.title}>Cortes de cabelo</h2>
    <nav className={`${styles.nav} ${styles.adminTabs}`} aria-label="Origem do catálogo de cortes">
      <Link to={route} aria-current={!isOracle ? 'page' : undefined}>Catálogo da IA</Link>
      <Link to={route + '?origem=oracle'} aria-current={isOracle ? 'page' : undefined}>Cadastros do Oracle</Link>
    </nav>
    {isOracle ? <EntityCrud entity="cortes" title="Cadastros do Oracle" /> : <AiHairCatalog />}
  </section>;
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

  return <div className={styles.adminShell}>
    <aside className={styles.adminSidebar}>
      <Link className={styles.adminBrand} to={paths.admin}>Espelho Meu</Link>
      <nav aria-label="Cadastros administrativos">
        <NavLink end to={paths.admin}>Visão geral</NavLink>
        {Object.entries(entities).map(([key, value]) => <NavLink end key={key} to={paths.admin + '/' + key}>{value.label}</NavLink>)}
        <NavLink end to={paths.admin + '/imagens'}>Imagens</NavLink>
      </nav>
    </aside>
    <main className={styles.adminContent}>
      <header className={styles.adminHeader}>
        <div><h1 className={styles.title}>Painel administrativo</h1>
          <p>{state.status === 'signed-in' ? state.user.nome : ''}</p></div>
        <button type="button" className="action-link action-link--outline" onClick={signOut} disabled={signingOut}>
          {signingOut ? 'Saindo…' : 'Sair'}
        </button>
        {signOutError && <p role="alert">{signOutError}</p>}
      </header>
      {isImages ? <section className={styles.panel}>
        <h2 className={styles.title}>Imagens de referência</h2>
        <p>Adicione uma foto ao cadastrar um corte, penteado ou uma cor de cabelo. Para trocar uma foto, abra o registro e escolha “Editar”.</p>
        <div className={styles.actions}>
          <Link className="action-link action-link--primary" to={paths.admin + '/cortes?origem=oracle'}>Imagens de cortes do Oracle</Link>
          <Link className="action-link action-link--outline" to={paths.admin + '/penteados'}>Imagens de penteados</Link>
          <Link className="action-link action-link--outline" to={paths.admin + '/cores'}>Imagens de coloração</Link>
        </div>
      </section> : entidade === 'cortes' ? <HaircutsAdmin /> : entidade ? <EntityCrud key={entidade} entity={entidade as EntityKey} /> :
        <AdminOverview />}
    </main>
  </div>;
}
