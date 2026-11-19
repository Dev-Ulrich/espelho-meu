import { PhotoPicker } from './PhotoPicker';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { loadQuestionnaire, type ConsultationArea, type ConsultationQuestion } from '../../services/api/questionnaire';
import { PrivateApiError, privateApi } from '../../services/api/privateApi';
import { GuidedResults, type ConsultationResult } from './GuidedResults';
import { useLibrary } from '../conta/LibraryProvider';
import { upsertConsultation } from '../conta/library';
import { useToast } from '../../components/ui/Feedback';
import { editorialPhotos as photos } from '../home/editorialContent';
import { hairVisual, type HairVisual } from './hairReferences';
import styles from '../authenticated/workspace.module.css';
import guided from './guidedConsultation.module.css';

type Answer = string | string[];
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

// Illustrations are mapped to the questionnaire's stable option IDs.
const references: Partial<Record<string, Record<string, string>>> = {
  apresentacao: { masculino: photos.curls, feminino: photos.waves },
  textura: { liso: photos.bob, ondulado: photos.natural, cacheado: photos.hair, crespo: photos.coils },
  penteado: { solto: photos.waves, preso: photos.luminous, semipreso: photos.makeup },
  acabamento: { matte: photos.matte, natural: photos.natural, luminoso: photos.luminous },
  ocasiao: { evento: photos.evening, dia_a_dia: photos.natural, trabalho: photos.matte },
};

export function GuidedConsultationPage({ area }: { area: ConsultationArea }) {
  const base = `/consultoria/${area}`;
  const steps = area === 'cabelo' ? hairSteps : makeupSteps;
  const { etapa } = useParams();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const resultId = etapa === 'resultado' ? search.get('consulta') : null;
  const { update } = useLibrary();
  const toast = useToast();
  const editing = search.get('editar') === '1';
  const heading = useRef<HTMLHeadingElement>(null);
  const [questions, setQuestions] = useState<ConsultationQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [photo, setPhoto] = useState<File>();
  const pendingResult = useRef<AbortController | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [sending, setSending] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (resultId) return;
    const controller = new AbortController();
    loadQuestionnaire(area, controller.signal, () => setRetrying(true))
      .then(data => { if (!controller.signal.aborted) {
        setQuestions(data);
        setAnswers(previous => {
          const next = { ...previous };
          if (next.formato_manual === 'nao_sei') delete next.formato_manual;
          if (next.tom === 'nao_sei') delete next.tom;
          return next;
        });
        setLoading(false);
      } })
      .catch(cause => { if (!controller.signal.aborted) { setError(cause.message); setLoading(false); } });
    return () => controller.abort();
  }, [area, attempt, resultId]);

  useEffect(() => () => pendingResult.current?.abort(), []);

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
    heading.current?.focus();
  }, [etapa, question?.id, sending]);

  if (resultId) return <ConsultationResultView key={resultId} id={resultId} area={area} />;
  if (index < 0) return <Navigate to={base + '/perfil'} replace />;
  if (firstMissing && (index > stepFor(firstMissing) ||
    (!editing && question && position > ordered.indexOf(firstMissing)))) {
    return <Navigate to={questionUrl(firstMissing)} replace />;
  }
  if (questions.length && index === 4) return <Navigate to={base + '/revisao'} replace />;

  function updateAnswer(id: string, value: Answer) {
    setAnswers(previous => ({ ...previous, [id]: value }));
    if (id === 'formato_manual' && value !== 'foto') setPhoto(undefined);
    setError('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingResult.current) return;
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
    const request = new AbortController();
    pendingResult.current = request;
    const payload = new FormData();
    payload.set('respostas', JSON.stringify(Object.fromEntries(active.map(question =>
      [question.id, answers[question.id] ?? []]))));
    if (needsPhoto && photo) payload.set('foto', photo);
    setSending(true);
    try {
      const recommendations = await privateApi<ConsultationResult>(base, { method: 'POST', body: payload, signal: request.signal });
      if (request.signal.aborted) return;
      const id = recommendations.consulta_id;
      if (!recommendations[area] || !id) throw new Error('A consultoria retornou um resultado incompleto.');
      try {
        update(value => ({
          ...value,
          records: upsertConsultation(value.records, {
            id, area, title: recommendations.cabelo?.cortes[0]?.nome
              ?? recommendations.maquiagem?.recomendacao ?? 'Consultoria capilar',
            date: new Date().toISOString(), favorite: false, result: recommendations, answers,
          }),
        }));
      } catch {
        toast({ title: 'Atalho do histórico indisponível', message: 'Você pode reabrir a consulta pelo endereço do resultado.' });
      }
      navigate(`${base}/resultado?consulta=${encodeURIComponent(id)}`);
    } catch (cause) {
      if (request.signal.aborted) return;
      const unavailable = cause instanceof PrivateApiError && [502, 503, 504].includes(cause.status);
      setError(needsPhoto && unavailable
        ? `${cause.message} Suas respostas foram mantidas. Tente novamente ou continue escolhendo o formato do rosto.`
        : cause instanceof Error ? cause.message : 'Não foi possível analisar o questionário.');
    } finally {
      pendingResult.current = null;
      if (!request.signal.aborted) setSending(false);
    }
  }

  const areaLabel = area === 'cabelo' ? 'Cabelo' : 'Maquiagem';
  const presentationPreference = answers.apresentacao === 'masculino' || answers.apresentacao === 'feminino' || answers.apresentacao === 'ambos'
    ? answers.apresentacao
    : undefined;
  const previous = ordered[position - 1];
  const questionLabel = (field: ConsultationQuestion, id: string, label: string) => {
    if (field.id !== 'subtipo' || id === 'nao_sei') return label;
    const type = ['liso', 'ondulado', 'cacheado', 'crespo'].indexOf(String(answers.textura)) + 1;
    return type ? `${type}${label}` : label;
  };

  return <section className={`${styles.page} ${guided.page}`}>
    {loading || sending ? <div role="status" className={guided.loading}>
      <span className={guided.spinner} aria-hidden="true" />
      <h1 className={styles.title}>{sending ? 'Estamos preparando suas recomendações' : 'Carregando questionário'}</h1>
      {retrying && !sending && <p>A consultoria está iniciando. Tentando carregar novamente…</p>}
    </div> : questions.length === 0 ?
      <div className={styles.panel}><p role="alert">{error || 'Questionário indisponível.'}</p>
        <button className="action-link action-link--outline" onClick={() => { setLoading(true); setRetrying(false); setError(''); setAttempt(value => value + 1); }}>Tentar novamente</button></div>
      : index === 3 ? <form className={guided.review} onSubmit={submit}>
        <p className={guided.eyebrow}>Revisão · Antes de enviar</p>
        <h1 ref={heading} tabIndex={-1} className={styles.title}>Confira suas escolhas</h1>
        <p>Você pode editar qualquer resposta antes de gerar suas recomendações.</p>
        <dl className={guided.answers}>{ordered.map(q => {
          const value = answers[q.id];
          const selected = Array.isArray(value) ? value : [value];
          return <div key={q.id} className={guided.answer}>
            <dt>{q.titulo}</dt>
            <dd>{q.opcoes.filter(([id]) => selected.includes(id)).map(([id, label]) => questionLabel(q, id, label)).join(', ') || 'Sem exigências'}</dd>
            <dd><Link className="action-link action-link--outline" aria-label={`Editar resposta: ${q.titulo}`}
              to={questionUrl(q, true)} onClick={() => setError('')}>Editar</Link></dd>
          </div>;
        })}</dl>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {error && needsPhoto && <Link className="action-link action-link--outline" to={base + '/perfil?pergunta=formato_manual'}
          onClick={() => updateAnswer('formato_manual', '')}>Escolher o formato do rosto</Link>}
        <div className={guided.reviewActions}>
          <button className="action-link action-link--primary">Enviar e ver recomendações</button>
          <Link className="action-link action-link--outline" to={ordered.length ? questionUrl(ordered[ordered.length - 1]) : '/consultoria'}
            onClick={() => setError('')}>Voltar às perguntas</Link>
        </div>
      </form> : <>
        <p className={guided.eyebrow}>{areaLabel} · Uma escolha de cada vez</p>
        <progress className={guided.progress} max={Math.max(ordered.length, 1)} value={Math.max(position + 1, 0)} aria-label="Progresso da consultoria" />
        <p className={guided.progressNote}>O percurso se adapta às suas escolhas.</p>
        <form className={`${styles.panel} ${guided.question}`} key={question?.id ?? etapa} onSubmit={submit}>
          <h1 ref={heading} tabIndex={-1} id="consultation-question" className={styles.title}>{question?.titulo ?? steps[index].label}</h1>
          {question && <fieldset className={guided.options} aria-labelledby="consultation-question">
            {question.ajuda && (question.passos?.length ? <details className={guided.guide}>
              <summary>Como identificar meu subtom?</summary>
              <p>{question.ajuda}</p>
              <ol>{question.passos.map(step => <li key={step}>{step}</li>)}</ol>
              {question.id === 'subtom' && <div className={guided.subtomGuide} aria-label="Exemplos para observar veias e metais">
                {(['quente','frio','neutro','oliva'] as const).map(optionId => {
                  const visual = hairVisual('subtom', optionId, presentationPreference, answers);
                  return visual ? <figure key={optionId}><img src={visual.image} alt="" /><img src={visual.secondary} alt="" /><figcaption>{optionId[0].toUpperCase() + optionId.slice(1)}</figcaption></figure> : null;
                })}
              </div>}
              {question.nota_guia && <p>{question.nota_guia}</p>}
            </details> : <p>{question.ajuda}</p>)}
            <div className={references[question.id] ? guided.visualOptions : guided.optionList}>
            {question.opcoes.map(([id, label]) => {
              const value = answers[question.id];
              const selected = Array.isArray(value) ? value : [];
              const description = question.descricoes?.[id];
              const presentation = answers.apresentacao;
              const lengths = question.reguas && (presentation === 'ambos'
                ? [['Masculino', question.reguas.masculino[id]], ['Feminino', question.reguas.feminino[id]]]
                : [['', question.reguas[presentation === 'masculino' ? 'masculino' : 'feminino'][id]]]);
              const legacyReference = references[question.id]?.[id];
              const visual: HairVisual | undefined = area === 'cabelo'
                ? hairVisual(question.id, id, presentationPreference, answers)
                : undefined;
              const reference = visual?.image ?? legacyReference;
              return <label className={reference ? `${guided.option} ${guided.visualOption}` : guided.option} key={id}>
                {reference && <span className={guided.visualReference}><img src={reference} alt="" decoding="async" />{visual?.secondary && <img src={visual.secondary} alt="" decoding="async" />}</span>}
                <input type={question.multipla ? 'checkbox' : 'radio'} name={question.id} value={id}
                  checked={question.multipla ? selected.includes(id) : value === id}
                  onChange={event => updateAnswer(question.id, question.multipla
                    ? event.currentTarget.checked ? [...selected, id] : selected.filter(item => item !== id)
                    : id)} />
                <span>{questionLabel(question, id, label)}{description && <small>{description}</small>}
                  {lengths?.map(([name, length]) => length && <small key={name}>{name ? `${name}: ` : ''}{length}</small>)}
                </span>
              </label>;
            })}</div>
          </fieldset>}
          {question?.id === 'formato_manual' && needsPhoto && <div className={`${styles.field} ${guided.photo}`}>
            <strong>Uma foto pode ajudar</strong>
            <small>De frente, sem filtros e com boa luz. Afaste o cabelo do rosto e evite acessórios que escondam as laterais. Você também pode escolher o formato manualmente.</small>
            <PhotoPicker photo={photo} onChange={file => { setPhoto(file); setError(''); }} />
            <small>A foto será enviada para estimar o formato facial quando você confirmar a revisão.</small>
          </div>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={guided.actions}>
            <Link className="action-link action-link--outline" onClick={() => setError('')}
              to={editing ? base + '/revisao' : previous ? questionUrl(previous) : '/consultoria'}>Voltar</Link>
            <button className="action-link action-link--primary">{editing ? 'Voltar à revisão' : 'Continuar'}</button>
          </div>
        </form>
      </>}
  </section>;
}

function ConsultationResultView({ area, id }: { area: ConsultationArea; id: string }) {
  const [result, setResult] = useState<ConsultationResult>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    privateApi<ConsultationResult>(`/consultoria/${area}/resultados/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(value => { if (!controller.signal.aborted) setResult(value); })
      .catch(cause => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a consulta.');
      });
    return () => controller.abort();
  }, [area, id, attempt]);

  return <section className={`${styles.page} ${guided.page}`}>
    {result ? <GuidedResults result={result} area={area} /> : error ? <div className={styles.panel}>
      <p role="alert">{error}</p>
      <button type="button" className="action-link action-link--outline"
        onClick={() => { setError(''); setAttempt(value => value + 1); }}>Tentar novamente</button>
    </div> : <p role="status">Carregando seu resultado…</p>}
  </section>;
}
