import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { loadQuestionnaire, type ConsultationArea, type ConsultationQuestion } from '../../services/api/questionnaire';
import { PrivateApiError, privateApi } from '../../services/api/privateApi';
import { PhotoSimulation } from './PhotoSimulation';
import styles from '../authenticated/workspace.module.css';
import guided from './guidedConsultation.module.css';

type Answer = string | string[];
type Cut = { id: string; nome: string; motivo: string; como_pedir: string; observacoes: string[]; penteados: string[] };
type Product = { nome: string; preco?: string | null; ajustes: string[] };
type ProductGroups = Record<string, Product[]>;
type Result = {
  facial: { formato?: string; avisos: string[] };
  maquiagem?: { recomendacao: string; sugestao_modelo?: string | null; aplicacao: string; pele_dica: string; produtos: ProductGroups; dica_produtos: string };
  cabelo?: { cortes: Cut[]; coloracao: string; dica_produtos: string; produtos: ProductGroups };
};
const hairSteps = [
  { id: 'perfil', label: 'Perfil capilar', fields: ['apresentacao', 'textura', 'subtipo', 'espessura', 'volume', 'formato_manual'] },
  { id: 'preferencias', label: 'Preferências', fields: ['comprimento', 'manutencao', 'quer_penteados', 'penteado', 'franja', 'estetica', 'quer_cor', 'tecnica_cor', 'cor', 'base_cor', 'tom', 'subtom'] },
  { id: 'produtos', label: 'Orçamento e produtos', fields: ['orcamento', 'selos'] },
  { id: 'revisao', label: 'Revisão', fields: [] },
  { id: 'resultado', label: 'Resultado', fields: [] },
];

const makeupSteps = [
  { id: 'perfil', label: 'Perfil da pele', fields: ['tipo_pele', 'sensibilidade', 'tom', 'subtom'] },
  { id: 'preferencias', label: 'Preferências', fields: ['ocasiao', 'acabamento', 'cobertura'] },
  { id: 'produtos', label: 'Orçamento e produtos', fields: ['produto', 'formato_base', 'formato_corretivo', 'formato_po', 'cor_po', 'orcamento', 'selos'] },
  ...hairSteps.slice(3),
];

function RecommendedProducts({ products }: { products: ProductGroups }) {
  return Object.entries(products).map(([category, items]) => <section key={category}>
    <h4>{category}</h4>
    {items.length ? <ul>{items.map((product, i) => <li key={i}>
      {[product.nome, product.preco].filter(Boolean).join(' · ')}
      {product.ajustes.length > 0 && <p>{product.ajustes.join(' · ')}</p>}
    </li>)}</ul> : <p>Nenhuma referência compatível com os filtros.</p>}
  </section>);
}

export function GuidedConsultationPage({ area }: { area: ConsultationArea }) {
  const base = `/consultoria/${area}`;
  const steps = area === 'cabelo' ? hairSteps : makeupSteps;
  const { etapa } = useParams();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const editing = search.get('editar') === '1';
  const heading = useRef<HTMLHeadingElement>(null);
  const [questions, setQuestions] = useState<ConsultationQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [photo, setPhoto] = useState<File>();
  const [result, setResult] = useState<Result>();
  const [simulationStyle, setSimulationStyle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [sending, setSending] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    loadQuestionnaire(area, controller.signal, () => setRetrying(true))
      .then(data => { if (!controller.signal.aborted) { setQuestions(data); setLoading(false); } })
      .catch(cause => { if (!controller.signal.aborted) { setError(cause.message); setLoading(false); } });
    return () => controller.abort();
  }, [area, attempt]);

  const index = steps.findIndex(step => step.id === etapa);
  const active = questions.filter(question => {
    if (area === 'cabelo' && (question.id === 'tom' || question.id === 'subtom') && answers.quer_cor !== 'sim') return false;
    return Object.entries(question.quando ?? {}).every(([key, values]) => values.includes(String(answers[key])));
  });
  const sections = steps.map(step => active.filter(question => step.fields.includes(question.id)));
  const fields = sections[index] ?? [];
  const missing = (question: ConsultationQuestion) => !question.multipla && !answers[question.id];
  const needsPhoto = answers.formato_manual === 'foto';
  const incomplete = (question: ConsultationQuestion) => missing(question)
    || (question.id === 'formato_manual' && needsPhoto && !photo);
  const ordered = sections.flat();
  const firstMissing = ordered.find(incomplete);
  const stepFor = (question: ConsultationQuestion) => sections.findIndex(section => section.includes(question));
  const questionUrl = (question: ConsultationQuestion, edit = false) =>
    `${base}/${steps[stepFor(question)].id}?pergunta=${encodeURIComponent(question.id)}${edit ? '&editar=1' : ''}`;
  const requested = fields.find(question => question.id === search.get('pergunta'));
  const question = requested ?? fields[0];
  const position = question ? ordered.indexOf(question) : -1;

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [etapa, question?.id, sending]);

  if (index < 0) return <Navigate to={base + '/perfil'} replace />;
  if (firstMissing && (index > stepFor(firstMissing) ||
    (!editing && question && position > ordered.indexOf(firstMissing)))) {
    return <Navigate to={questionUrl(firstMissing)} replace />;
  }
  if (questions.length && index === 4 && !result) return <Navigate to={base + '/revisao'} replace />;

  function updateAnswer(id: string, value: Answer) {
    setAnswers(previous => ({ ...previous, [id]: value }));
    if (id === 'formato_manual' && value !== 'foto') setPhoto(undefined);
    setResult(undefined);
    setError('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setError('');
    if (question && incomplete(question)) {
      setError(question.id === 'formato_manual' && needsPhoto ? 'Selecione uma foto ou escolha o formato manualmente.' : 'Selecione uma opção para continuar.');
      return;
    }
    if (index < 3) {
      const next = question ? ordered[position + 1] : ordered.find(item => stepFor(item) > index);
      const destination = editing ? firstMissing : next;
      navigate(destination ? questionUrl(destination) : base + '/revisao');
      return;
    }
    const payload = new FormData();
    payload.set('respostas', JSON.stringify(Object.fromEntries(active.map(question =>
      [question.id, answers[question.id] ?? []]))));
    if (needsPhoto && photo) payload.set('foto', photo);
    setSending(true);
    try {
      const recommendations = await privateApi<Result>(base, { method: 'POST', body: payload });
      if (!recommendations[area]) throw new Error('A consultoria retornou um resultado incompleto.');
      setResult(recommendations);
      setSimulationStyle('');
      navigate(base + '/resultado');
    } catch (cause) {
      const unavailable = cause instanceof PrivateApiError && [502, 503, 504].includes(cause.status);
      setError(needsPhoto && unavailable
        ? 'A análise da foto está indisponível agora. Você pode continuar escolhendo o formato do rosto.'
        : cause instanceof Error ? cause.message : 'Não foi possível analisar o questionário.');
    } finally {
      setSending(false);
    }
  }

  const areaLabel = area === 'cabelo' ? 'Cabelo' : 'Maquiagem';
  const previous = ordered[position - 1];

  return <section className={`${styles.page} ${guided.page}`}>
    {loading || sending ? <div role="status" className={guided.loading}>
      <span className={guided.spinner} aria-hidden="true" />
      <h1 className={styles.title}>{sending ? 'Estamos preparando suas recomendações' : 'Carregando questionário'}</h1>
      {retrying && !sending && <p>A consultoria está iniciando. Tentando carregar novamente…</p>}
    </div> : questions.length === 0 ?
      <div className={styles.panel}><p role="alert">{error || 'Questionário indisponível.'}</p>
        <button className="action-link action-link--outline" onClick={() => { setLoading(true); setRetrying(false); setError(''); setAttempt(value => value + 1); }}>Tentar novamente</button></div>
      : index === 4 && result ? <div className={styles.panel}>
        <h1 ref={heading} tabIndex={-1} className={styles.title}>Suas recomendações</h1>
        {result.facial.formato && <p>Formato facial de referência: {result.facial.formato}</p>}
        {result.facial.avisos.map(warning => <p key={warning}>{warning}</p>)}
        {result.cabelo && <>
          <div className={styles.grid}>{result.cabelo.cortes.map(cut => <article className={styles.item} key={cut.id}>
            <h3>{cut.nome}</h3><p>{cut.motivo}</p><p>{cut.como_pedir}</p>
            {[...cut.observacoes, ...cut.penteados].map((text, i) => <p key={i}>{text}</p>)}
            <button type="button" className="action-link action-link--outline" onClick={() => setSimulationStyle(cut.nome)}>Simular este corte</button>
          </article>)}</div>
          {!result.cabelo.cortes.length && <p>Nenhum corte correspondeu às respostas. Revise suas preferências.</p>}
          <div className={styles.panel}><h3>Coloração e cuidados</h3><p>{result.cabelo.coloracao}</p><p>{result.cabelo.dica_produtos}</p>
            <RecommendedProducts products={result.cabelo.produtos} />
          </div>
        </>}
        {result.maquiagem && <div className={styles.panel}>
          <h3>{result.maquiagem.recomendacao}</h3>
          {result.maquiagem.sugestao_modelo && <p>Outra sugestão: {result.maquiagem.sugestao_modelo}</p>}
          <p>{result.maquiagem.aplicacao}</p><p>{result.maquiagem.pele_dica}</p>
          <button type="button" className="action-link action-link--outline"
            onClick={() => setSimulationStyle(result.maquiagem?.recomendacao ?? '')}>Simular este acabamento</button>
          <h3>Produtos e tonalidade</h3><p>{result.maquiagem.dica_produtos}</p>
          <RecommendedProducts products={result.maquiagem.produtos} />
        </div>}
        {simulationStyle && <PhotoSimulation key={simulationStyle} area={area} style={simulationStyle} />}
        <Link className="action-link action-link--outline" to={base + '/revisao'}>Rever respostas</Link>
      </div> : index === 3 ? <form className={guided.review} onSubmit={submit}>
        <p className={guided.eyebrow}>Revisão · Antes de enviar</p>
        <h1 ref={heading} tabIndex={-1} className={styles.title}>Confira suas escolhas</h1>
        <p>Você pode editar qualquer resposta antes de gerar suas recomendações.</p>
        <dl className={guided.answers}>{ordered.map(q => {
          const value = answers[q.id];
          const selected = Array.isArray(value) ? value : [value];
          return <div key={q.id} className={guided.answer}>
            <dt>{q.titulo}</dt>
            <dd>{q.opcoes.filter(([id]) => selected.includes(id)).map(([, label]) => label).join(', ') || 'Sem exigências'}</dd>
            <dd><Link className="action-link action-link--outline" aria-label={`Editar resposta: ${q.titulo}`}
              to={questionUrl(q, true)} onClick={() => setError('')}>Editar</Link></dd>
          </div>;
        })}</dl>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {error && needsPhoto && <Link className="action-link action-link--outline" to={base + '/perfil?pergunta=formato_manual'}
          onClick={() => updateAnswer('formato_manual', '')}>Escolher o formato do rosto</Link>}
        <div className={guided.reviewActions}>
          <button className="action-link action-link--primary">Enviar e ver recomendações →</button>
          <Link className="action-link action-link--outline" to={ordered.length ? questionUrl(ordered[ordered.length - 1]) : '/consultoria'}
            onClick={() => setError('')}>Voltar às perguntas</Link>
        </div>
      </form> : <>
        <p className={guided.eyebrow}>{areaLabel} · Uma escolha de cada vez</p>
        <progress className={guided.progress} max={Math.max(ordered.length, 1)} value={Math.max(position + 1, 0)} aria-label="Progresso da consultoria" />
        <p className={guided.progressNote}>O percurso se adapta às suas escolhas.</p>
        <form className={`${styles.panel} ${guided.question}`} onSubmit={submit}>
          <h1 ref={heading} tabIndex={-1} id="consultation-question" className={styles.title}>{question?.titulo ?? steps[index].label}</h1>
          {question && <fieldset className={guided.options} aria-labelledby="consultation-question">
            {question.ajuda && <p>{question.ajuda}</p>}
            {question.opcoes.map(([id, label]) => {
              const value = answers[question.id];
              const selected = Array.isArray(value) ? value : [];
              const description = question.descricoes?.[id];
              return <label className={guided.option} key={id}>
                <input type={question.multipla ? 'checkbox' : 'radio'} name={question.id} value={id}
                  checked={question.multipla ? selected.includes(id) : value === id}
                  onChange={event => updateAnswer(question.id, question.multipla
                    ? event.currentTarget.checked ? [...selected, id] : selected.filter(item => item !== id)
                    : id)} />
                <span>{label}{description && <small>{description}</small>}</span>
              </label>;
            })}
          </fieldset>}
          {question?.id === 'formato_manual' && needsPhoto && <label className={`${styles.field} ${guided.photo}`}>
            Foto para análise facial
            <small>De frente, sem filtros e com boa luz. Se preferir, escolha o formato manualmente.</small>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => {
              const file = event.currentTarget.files?.[0];
              setResult(undefined);
              if (file && (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
                setPhoto(undefined);
                event.currentTarget.value = '';
                setError('Selecione uma foto JPG, PNG ou WebP de até 5 MB.');
              } else {
                setPhoto(file);
                setError('');
              }
            }} />
            <small>{photo ? `Foto selecionada: ${photo.name}` : 'A foto será enviada para estimar o formato facial quando você confirmar a revisão.'}</small>
          </label>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={guided.actions}>
            <Link className="action-link action-link--outline" onClick={() => setError('')}
              to={editing ? base + '/revisao' : previous ? questionUrl(previous) : '/consultoria'}>← Voltar</Link>
            <button className="action-link action-link--primary">{editing ? 'Voltar à revisão' : 'Continuar →'}</button>
          </div>
        </form>
      </>}
  </section>;
}
