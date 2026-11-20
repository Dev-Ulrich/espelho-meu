import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { UserRound, Heart, History, SlidersHorizontal, Settings, LogOut, ChevronRight, Star, Scissors, Sparkles, Home, ShieldCheck } from 'lucide-react';
import { useSession } from '../../app/session';
import { Modal, useToast } from '../../components/ui/Feedback';
import { useLibrary } from './LibraryProvider';
import { validateReview, type SavedConsultation } from './library';
import { GuidedResults } from '../consultoria/GuidedResults';
import './account.css';

const sections = [
  { id: 'perfil', label: 'Perfil', icon: UserRound },
  { id: 'consultorias', label: 'Minhas consultorias', icon: History },
  { id: 'favoritas', label: 'Favoritas', icon: Heart },
  { id: 'preferencias', label: 'Preferências', icon: SlidersHorizontal },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
];
const date = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

export function AccountPage() {
  const { state, logout } = useSession();
  const { data, update } = useLibrary();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const current = sections.find(item => item.id === params.get('secao')) ?? sections[0];
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [clear, setClear] = useState(false);
  const [reviewId, setReviewId] = useState<string>();
  const [viewId, setViewId] = useState<string>();
  if (state.status !== 'signed-in') return null;
  const user = state.user;
  const name = data.preferences.displayName || user.nome;
  const favorites = data.records.filter(item => item.favorite);
  const records = current.id === 'favoritas' ? favorites : data.records;
  const viewing = data.records.find(item => item.id === viewId);
  const reviewing = data.records.find(item => item.id === reviewId);
  function fail(error: unknown) { toast({ title: 'Não foi possível salvar', message: error instanceof Error ? error.message : 'Tente novamente.', error: true }); }
  function favorite(record: SavedConsultation) {
    try {
      update(value => ({ ...value, records: value.records.map(item => item.id === record.id ? { ...item, favorite: !record.favorite } : item) }));
      toast(record.favorite ? { title: 'Favorito removido!', message: 'A consulta de origem continua no histórico.', action: { label: 'Desfazer', run: () => {
        try { update(value => ({ ...value, records: value.records.map(item => item.id === record.id ? { ...item, favorite: true } : item) })); }
        catch (error) { fail(error); }
      } } } : { title: 'Favorito salvo!', message: 'Você pode encontrá-lo na aba Favoritas.' });
    } catch (error) { fail(error); }
  }
  async function signOut() {
    setBusy(true);
    try { await logout(); navigate('/entrar', { replace: true }); }
    catch { toast({ title: 'Não foi possível sair', message: 'Tente novamente.', error: true }); }
    finally { setBusy(false); }
  }
  return <div className="account-workspace">
    <aside className="account-sidebar">
      <Link className="account-brand" to="/">Espelho Meu<span>SEU ESTILO, SUAS REGRAS</span></Link>
      <h1>Minha conta</h1><p>Suas escolhas, consultas e inspirações em um só lugar.</p>
      <nav aria-label="Minha conta">{sections.map(({ id, label, icon: Icon }) => <Link key={id} to={`/minha-conta?secao=${id}`} aria-current={current.id === id ? 'page' : undefined}><Icon size={18} />{label}</Link>)}</nav>
      {user.role === 'ADMIN' && <nav aria-label="Área administrativa"><Link to="/admin"><ShieldCheck size={18} />Painel administrativo</Link></nav>}
      <button type="button" onClick={signOut} disabled={busy}><LogOut size={18} />{busy ? 'Saindo…' : 'Sair'}</button>
    </aside>
    <section className="account-main">
      <Link className="account-home icon-button" to="/" aria-label="Voltar ao início"><Home size={22} /></Link>
      <p className="experience-eyebrow">Seu estilo, sua conta</p>
      <h2>{current.id === 'perfil' ? `Olá, ${name.split(' ')[0]}!` : current.id === 'consultorias' ? 'Meu histórico' : current.label}</h2>
      <p className="account-intro">{current.id === 'perfil' ? 'Aqui você organiza suas escolhas e descobre novas possibilidades.' : 'Um espaço para revisitar o que combina com você.'}</p>
      {current.id === 'perfil' && <>
        <article className="account-profile-card"><div className="account-avatar" aria-hidden="true"><UserRound size={46} /></div>
          <dl><dt>Nome</dt><dd>{user.nome}</dd><dt>E-mail</dt><dd>{user.email}</dd>{data.preferences.displayName && <><dt>Nome de exibição</dt><dd>{data.preferences.displayName}</dd></>}</dl>
          <button type="button" className="action-link action-link--outline" onClick={() => setEditing(true)}>Personalizar perfil</button>
        </article>
        <div className="account-shortcuts">{sections.slice(1, 4).map(({ id, label, icon: Icon }) => <Link key={id} to={`/minha-conta?secao=${id}`}><Icon size={18} /><span>{label}</span><ChevronRight size={18} /></Link>)}</div>
      </>}
      {(current.id === 'consultorias' || current.id === 'favoritas') && <>
        <div className="account-summary"><div><p className="experience-eyebrow">Seu momento</p><strong>{data.records.length} {data.records.length === 1 ? 'consulta salva' : 'consultas salvas'}</strong><p>Revisite ideias no seu tempo.</p></div>
          <dl><div><dt>Favoritas</dt><dd>{favorites.length}</dd></div><div><dt>Avaliações</dt><dd>{data.records.filter(item => item.review).length}</dd></div></dl>
          <Link className="action-link action-link--primary" to="/consultoria">Nova consulta</Link>
        </div>
        <nav className="account-tabs" aria-label="Consultas salvas"><Link aria-current={current.id === 'consultorias' ? 'page' : undefined} to="/minha-conta?secao=consultorias">Histórico</Link><Link aria-current={current.id === 'favoritas' ? 'page' : undefined} to="/minha-conta?secao=favoritas">Favoritos</Link></nav>
        {records.length ? <ul className="account-records">{records.map(record => <li key={record.id}>
          <span className="account-record-icon">{record.area === 'cabelo' ? <Scissors size={22} /> : <Sparkles size={22} />}</span>
          <button type="button" className="account-record-title" onClick={() => {
            if (record.result.consulta_id) {
              navigate(`/consultoria/${record.area}/resultado?consulta=${encodeURIComponent(record.result.consulta_id)}`);
            } else setViewId(record.id);
          }}><strong>{record.title}</strong><time dateTime={record.date}>{date(record.date)}</time><span>Consultoria de {record.area}</span></button>
          <div className="account-record-actions"><button type="button" className="text-link" onClick={() => setReviewId(record.id)}>{record.review ? `${'★'.repeat(record.review.stars)} · Editar avaliação` : '☆ Avaliar'}</button>
            <button type="button" className="icon-button" aria-label={record.favorite ? `Remover ${record.title} dos favoritos` : `Favoritar ${record.title}`} aria-pressed={record.favorite} onClick={() => favorite(record)}><Heart size={20} fill={record.favorite ? 'currentColor' : 'none'} /></button>
          </div>
        </li>)}</ul> : <div className="experience-empty"><Heart size={28} /><h3>{current.id === 'favoritas' ? 'Suas inspirações favoritas ficam aqui.' : 'Sua próxima descoberta começa aqui.'}</h3><p>Salve o resultado de uma consultoria para revisitar depois.</p><Link className="action-link action-link--primary" to="/consultoria">Fazer consultoria</Link></div>}
      </>}
      {current.id === 'preferencias' && <form className="account-form" onSubmit={event => {
        event.preventDefault(); const form = new FormData(event.currentTarget);
        try { update(value => ({ ...value, preferences: { ...value.preferences, area: form.get('area') === 'maquiagem' ? 'maquiagem' : 'cabelo', reducedMotion: form.has('motion') } })); toast({ title: 'Preferências salvas!', message: 'Suas escolhas foram atualizadas neste navegador.' }); }
        catch (error) { fail(error); }
      }}>
        <label>Minha área preferida<select name="area" defaultValue={data.preferences.area}><option value="cabelo">Cabelo</option><option value="maquiagem">Maquiagem</option></select></label>
        <label className="account-check"><input name="motion" type="checkbox" defaultChecked={data.preferences.reducedMotion} /> Reduzir animações e movimentos</label>
        <button className="action-link action-link--primary">Salvar preferências</button>
        <Link className="text-link" to={`/consultoria/${data.preferences.area}`}>Iniciar minha consultoria preferida</Link>
      </form>}
      {current.id === 'configuracoes' && <div className="account-settings"><article><h3>Seus dados neste dispositivo</h3><p>O histórico, os favoritos, as avaliações e as preferências são armazenados neste navegador, separados por conta. Fotos não são guardadas no histórico.</p><button type="button" className="action-link action-link--outline" onClick={() => setClear(true)}>Limpar meu histórico local</button></article><article><h3>Sessão</h3><p>Encerre sua sessão ao usar um dispositivo compartilhado.</p><button type="button" className="text-link" disabled={busy} onClick={signOut}>Sair da conta</button></article></div>}
      <p className="account-storage-note">Salvo neste navegador · sem sincronização entre dispositivos.</p>
    </section>
    {editing && <Modal title="Personalizar meu perfil" onClose={() => setEditing(false)}><form className="account-form" onSubmit={event => {
      event.preventDefault(); const form = new FormData(event.currentTarget);
      try { update(value => ({ ...value, preferences: { ...value.preferences, displayName: String(form.get('name') ?? '').trim() } })); setEditing(false); toast({ title: 'Perfil atualizado!', message: 'Seu nome de exibição foi salvo neste navegador.' }); }
      catch (error) { fail(error); }
    }}><label>Como você prefere ser chamado?<input name="name" maxLength={80} defaultValue={data.preferences.displayName || user.nome} required autoComplete="nickname" /></label><p>Isso personaliza sua experiência aqui. Seu nome e e-mail de cadastro permanecem os mesmos.</p><div className="modal-actions"><button className="action-link action-link--primary">Salvar</button><button type="button" className="action-link action-link--outline" onClick={() => setEditing(false)}>Cancelar</button></div></form></Modal>}
    {reviewing && <ReviewModal key={reviewing.id} record={reviewing} onClose={() => setReviewId(undefined)} />}
    {viewing && <Modal wide title="Sua consulta salva" onClose={() => setViewId(undefined)}><GuidedResults result={viewing.result} area={viewing.area} /></Modal>}
    {clear && <Modal title="Limpar meu histórico?" onClose={() => setClear(false)}><p>As consultas salvas, os favoritos e suas avaliações serão removidos deste navegador. Seus dados de cadastro e preferências serão mantidos.</p><div className="modal-actions"><button type="button" className="action-link action-link--outline" onClick={() => setClear(false)}>Cancelar</button><button type="button" className="action-link action-link--primary" onClick={() => { try { update(value => ({ ...value, records: [] })); setClear(false); toast({ title: 'Histórico limpo', message: 'Você pode começar uma nova consultoria quando quiser.' }); } catch (error) { fail(error); } }}>Limpar histórico</button></div></Modal>}
  </div>;
}

function ReviewModal({ record, onClose }: { record: SavedConsultation; onClose: () => void }) {
  const { update } = useLibrary();
  const toast = useToast();
  const [stars, setStars] = useState(record.review?.stars ?? 0);
  const [comment, setComment] = useState(record.review?.comment ?? '');
  const [error, setError] = useState('');
  function submit(event: FormEvent) {
    event.preventDefault();
    try { const review = validateReview(stars, comment); update(value => ({ ...value, records: value.records.map(item => item.id === record.id ? { ...item, review } : item) })); onClose(); toast({ title: 'Avaliação salva!', message: 'Obrigada pelo feedback! Você pode editar ou excluir quando quiser. Avaliação salva neste navegador.' }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar.'); }
  }
  return <Modal title="Avalie sua consultoria" onClose={onClose}><p>{record.title}</p><form className="account-form" onSubmit={submit}>
    <fieldset className="rating-stars"><legend>Deixe sua nota</legend>{[1, 2, 3, 4, 5].map(value => <label key={value}><input type="radio" name="rating" value={value} checked={stars === value} onChange={() => setStars(value)} aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`} /><Star size={30} fill={value <= stars ? 'currentColor' : 'none'} aria-hidden="true" /></label>)}</fieldset>
    <label>Seu comentário (opcional)<textarea value={comment} onChange={event => setComment(event.target.value)} maxLength={500} rows={4} /></label><small>{comment.length}/500</small>
    {error && <p role="alert">{error}</p>}<div className="modal-actions"><button className="action-link action-link--primary">Salvar avaliação</button><button type="button" className="action-link action-link--outline" onClick={onClose}>Cancelar</button></div>
    {record.review && <button type="button" className="text-link" onClick={() => { try { update(value => ({ ...value, records: value.records.map(item => item.id === record.id ? { ...item, review: undefined } : item) })); onClose(); toast({ title: 'Avaliação excluída', message: 'A consulta permanece no histórico.' }); } catch { setError('Não foi possível excluir a avaliação.'); } }}>Excluir avaliação</button>}
  </form></Modal>;
}
