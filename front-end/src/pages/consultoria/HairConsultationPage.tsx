import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { loadHairQuestionnaire, type HairQuestion } from '../../services/api/hairQuestionnaire';
import { privateApi } from '../../services/api/privateApi';
import styles from '../authenticated/workspace.module.css';

type Answer = string | string[];
type Cut = { id: string; nome: string; motivo: string; como_pedir: string; observacoes: string[]; penteados: string[] };
type Product = { nome: string; preco?: string | null; ajustes: string[] };
type Result = {
  facial: { formato?: string; avisos: string[] };
  cabelo: { cortes: Cut[]; coloracao: string; dica_produtos: string; produtos: Record<string, Product[]> };
};
const base = '/consultoria/cabelo';
const steps = [
  { id: 'perfil', label: 'Perfil capilar', fields: ['apresentacao', 'textura', 'subtipo', 'espessura', 'volume', 'formato_manual'] },
  { id: 'preferencias', label: 'Preferências', fields: ['comprimento', 'manutencao', 'quer_penteados', 'penteado', 'franja', 'estetica', 'quer_cor', 'tecnica_cor', 'cor', 'base_cor', 'tom', 'subtom'] },
  { id: 'produtos', label: 'Orçamento e produtos', fields: ['orcamento', 'selos'] },
  { id: 'revisao', label: 'Revisão', fields: [] },
  { id: 'resultado', label: 'Resultado', fields: [] },
];

export function HairConsultationPage() {
  const { etapa } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<HairQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [photo, setPhoto] = useState<File>();
  const [result, setResult] = useState<Result>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [sending, setSending] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    loadHairQuestionnaire(controller.signal, () => setRetrying(true))
      .then(data => { if (!controller.signal.aborted) { setQuestions(data); setLoading(false); } })
      .catch(cause => { if (!controller.signal.aborted) { setError(cause.message); setLoading(false); } });
    return () => controller.abort();
  }, [attempt]);

  const index = steps.findIndex(step => step.id === etapa);
  if (index < 0) return <Navigate to={base + '/perfil'} replace />;
  const active = questions.filter(question => {
    if ((question.id === 'tom' || question.id === 'subtom') && answers.quer_cor !== 'sim') return false;
    return Object.entries(question.quando ?? {}).every(([key, values]) => values.includes(String(answers[key])));
  });
  const fields = active.filter(question => (steps[index].fields as readonly string[]).includes(question.id));
  const missing = (question: HairQuestion) => !question.multipla && !answers[question.id];
  const needsPhoto = answers.formato_manual === 'foto';
  const firstMissing = steps.findIndex(step => active.some(question =>
    (step.fields as readonly string[]).includes(question.id) && (missing(question)
      || (question.id === 'formato_manual' && needsPhoto && !photo))));
  if (questions.length && (index > firstMissing && firstMissing >= 0)) {
    return <Navigate to={base + '/' + steps[firstMissing].id} replace />;
  }
  if (questions.length && index === 4 && !result) return <Navigate to={base + '/revisao'} replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setError('');
    if (fields.some(missing) || (index === 0 && needsPhoto && !photo)) {
      setError('Complete os campos desta etapa antes de continuar.');
      return;
    }
    if (index < 3) {
      navigate(base + '/' + steps[index + 1].id);
      return;
    }
    const payload = new FormData();
    payload.set('respostas', JSON.stringify(Object.fromEntries(active.map(question =>
      [question.id, answers[question.id] ?? []]))));
    if (needsPhoto && photo) payload.set('foto', photo);
    setSending(true);
    try {
      setResult(await privateApi<Result>('/consultoria/cabelo', { method: 'POST', body: payload }));
      navigate(base + '/resultado');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível analisar o questionário.');
    } finally {
      setSending(false);
    }
  }

  return <section className={styles.page}>
    <h1 className={styles.title}>Consultoria de cabelo</h1>
    <ol className={styles.nav} aria-label="Etapas da consultoria">{steps.map((step, position) =>
      <li key={step.id}><span aria-current={position === index ? 'step' : undefined}>{position + 1}. {step.label}</span></li>)}</ol>
    {loading ? <p role="status">{retrying ? 'A consultoria está iniciando. Tentando carregar novamente…' : 'Carregando questionário…'}</p> : questions.length === 0 ?
      <div className={styles.panel}><p role="alert">{error || 'Questionário indisponível.'}</p>
        <button className="action-link action-link--outline" onClick={() => { setLoading(true); setRetrying(false); setError(''); setAttempt(value => value + 1); }}>Tentar novamente</button></div>
      : index === 4 && result ? <div className={styles.panel}>
        <h2 className={styles.title}>Suas recomendações</h2>
        {result.facial.formato && <p>Formato facial de referência: {result.facial.formato}</p>}
        {result.facial.avisos.map(warning => <p key={warning}>{warning}</p>)}
        <div className={styles.grid}>{result.cabelo.cortes.map(cut => <article className={styles.item} key={cut.id}>
          <h3>{cut.nome}</h3><p>{cut.motivo}</p><p>{cut.como_pedir}</p>
          {[...cut.observacoes, ...cut.penteados].map((text, i) => <p key={i}>{text}</p>)}
        </article>)}</div>
        {!result.cabelo.cortes.length && <p>Nenhum corte correspondeu às respostas. Revise suas preferências.</p>}
        <div className={styles.panel}><h3>Coloração e cuidados</h3><p>{result.cabelo.coloracao}</p><p>{result.cabelo.dica_produtos}</p>
          {Object.entries(result.cabelo.produtos).map(([category, products]) => <section key={category}>
            <h4>{category}</h4>
            {products.length ? <ul>{products.map((product, i) => <li key={i}>{[product.nome, product.preco].filter(Boolean).join(' · ')}
                {product.ajustes.length > 0 && <p>{product.ajustes.join(' · ')}</p>}</li>)}</ul>
              : <p>Nenhuma referência compatível com os filtros.</p>}
          </section>)}
        </div>
        <Link className="action-link action-link--outline" to={base + '/revisao'}>Rever respostas</Link>
      </div> : <form className={styles.panel} onSubmit={submit}>
        <h2 className={styles.title}>{steps[index].label}</h2>
        <fieldset className={styles.stack} disabled={sending}>
          {fields.map(q => q.multipla ? <fieldset key={q.id} className={styles.options}>
            <legend>{q.titulo}</legend><small>{q.ajuda}</small>
            {q.opcoes.map(([id, label]) => <label key={id}><input type="checkbox"
              checked={(answers[q.id] as string[] | undefined)?.includes(id) ?? false}
              onChange={event => {
                const checked = event.currentTarget.checked;
                const values = (answers[q.id] as string[] | undefined) ?? [];
                setAnswers(previous => ({ ...previous, [q.id]: checked ? [...values, id] : values.filter(value => value !== id) }));
                setResult(undefined);
              }} />{label}</label>)}
          </fieldset> : <label key={q.id} className={styles.field}>{q.titulo}
            <select value={String(answers[q.id] ?? '')} required onChange={event => {
              const value = event.currentTarget.value;
              setAnswers(previous => ({ ...previous, [q.id]: value }));
              if (q.id === 'formato_manual' && value !== 'foto') setPhoto(undefined);
              setResult(undefined);
            }}>
              <option value="">Selecione uma opção</option>
              {q.opcoes.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
            {q.ajuda && <small>{q.ajuda}</small>}
            {q.descricoes?.[String(answers[q.id])] && <small>{q.descricoes[String(answers[q.id])]}</small>}
          </label>)}
          {index === 0 && needsPhoto && <label className={styles.field}>Foto para análise facial
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => {
              const file = event.currentTarget.files?.[0];
              setResult(undefined);
              if (file && (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
                setPhoto(undefined); event.currentTarget.value = ''; setError('Selecione uma foto JPG, PNG ou WebP de até 5 MB.');
              } else { setPhoto(file); setError(''); }
            }} />
            <small>{photo ? `Foto selecionada: ${photo.name}` : 'A foto será enviada para estimar o formato facial quando você confirmar a revisão.'}</small>
          </label>}
          {index === 3 && <dl>{active.map(q => {
            const selected = Array.isArray(answers[q.id]) ? answers[q.id] : [answers[q.id]];
            return <div key={q.id} className={styles.answer}><dt>{q.titulo}</dt>
              <dd>{q.opcoes.filter(([id]) => selected.includes(id)).map(([, label]) => label).join(', ') || 'Sem exigências'}</dd></div>;
          })}</dl>}
        </fieldset>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.actions}>
          {index > 0 && <Link className="action-link action-link--outline" to={base + '/' + steps[index - 1].id}>Voltar</Link>}
          <button className="action-link action-link--primary" disabled={sending}>
            {sending ? 'Analisando…' : index === 3 ? 'Gerar recomendações' : 'Continuar'}
          </button>
        </div>
      </form>}
  </section>;
}
