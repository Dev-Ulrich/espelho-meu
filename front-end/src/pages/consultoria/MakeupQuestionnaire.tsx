import { useEffect, useRef, useState, type FormEvent } from 'react';
import { recommendMakeup, type MakeupProfile } from '../../services/api/makeupRecommendation';

export function MakeupQuestionnaire() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => { request.current?.abort(); }, []);

  function clearFeedback() {
    setError('');
    setRecommendation('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (request.current) return;
    clearFeedback();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      setError('Selecione o tipo de pele, a ocasião e o acabamento.');
      form.querySelector<HTMLSelectElement>(':invalid')?.focus();
      return;
    }
    const values = new FormData(form);
    const profile: MakeupProfile = {
      tipo_pele: values.get('tipo_pele') as MakeupProfile['tipo_pele'],
      ocasiao: values.get('ocasiao') as MakeupProfile['ocasiao'],
      acabamento: values.get('acabamento') as MakeupProfile['acabamento'],
    };
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    try {
      const result = await recommendMakeup(profile, controller.signal);
      if (!controller.signal.aborted) setRecommendation(result);
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Não foi possível gerar a recomendação. Tente novamente.');
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setLoading(false);
      }
    }
  }

  return <section className="makeup-preview" aria-labelledby="makeup-preview-title">
    <h2 id="makeup-preview-title">Prévia de recomendação de maquiagem</h2>
    <p>Responda ao questionário para receber uma sugestão de estilo da IA. Não precisa de foto nem de conta.</p>
    <form onSubmit={submit} noValidate aria-busy={loading}>
      <fieldset disabled={loading} onChange={clearFeedback}>
        <legend>Todos os campos são obrigatórios</legend>
        <label htmlFor="tipo_pele">Tipo de pele</label>
        <select id="tipo_pele" name="tipo_pele" required defaultValue="">
          <option value="">Selecione o tipo de pele</option>
          <option value="seca">Seca</option><option value="mista">Mista</option><option value="oleosa">Oleosa</option>
        </select>
        <label htmlFor="ocasiao">Ocasião</label>
        <select id="ocasiao" name="ocasiao" required defaultValue="">
          <option value="">Selecione a ocasião</option>
          <option value="dia_a_dia">Dia a dia</option><option value="trabalho">Trabalho</option><option value="evento">Evento</option>
        </select>
        <label htmlFor="acabamento">Acabamento</label>
        <select id="acabamento" name="acabamento" required defaultValue="">
          <option value="">Selecione o acabamento</option>
          <option value="natural">Natural</option><option value="matte">Matte</option><option value="luminoso">Luminoso</option>
        </select>
      </fieldset>
      <button className="action-link action-link--primary" type="submit" disabled={loading}>
        {loading ? 'Gerando recomendação…' : 'Gerar recomendação'}
      </button>
      {error && <p className="notice" role="alert">{error}</p>}
      <div role="status" aria-live="polite">
        {recommendation && <div className="notice"><h3>Sugestão para você</h3><p>{recommendation}</p></div>}
      </div>
    </form>
  </section>;
}
