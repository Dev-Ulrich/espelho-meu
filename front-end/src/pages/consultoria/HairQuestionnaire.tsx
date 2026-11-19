import { useEffect, useRef, useState, type FormEvent } from 'react';
import { getHairRecommendations, type HairProfile } from '../../services/api/hairRecommendation';

import type { Recommendation } from '../../services/api/consultation';
import { RecommendationResults } from './RecommendationResults';

export function HairQuestionnaire() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recommendation, setRecommendation] = useState<Recommendation[]>([]);
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => { request.current?.abort(); }, []);

  function clearFeedback() {
    setError('');
    setRecommendation([]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (request.current) return;
    clearFeedback();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      setError('Selecione a textura, o comprimento desejado e a disponibilidade para manutenção.');
      form.querySelector<HTMLSelectElement>(':invalid')?.focus();
      return;
    }
    const values = new FormData(form);
    const profile: HairProfile = {
      textura: values.get('textura') as HairProfile['textura'],
      comprimento: values.get('comprimento') as HairProfile['comprimento'],
      manutencao: values.get('manutencao') as HairProfile['manutencao'],
    };
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    try {
      const result = await getHairRecommendations(profile, controller.signal);
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

  return <section className="hair-preview" aria-labelledby="hair-preview-title">
    <h2 id="hair-preview-title">Prévia de recomendação capilar</h2>
    <p>Responda ao questionário para receber sugestões da IA. Não precisa de foto nem de conta.</p>
    <form onSubmit={submit} noValidate aria-busy={loading}>
      <fieldset disabled={loading} onChange={clearFeedback}>
        <legend>Todos os campos são obrigatórios</legend>
        <label htmlFor="textura">Textura</label>
        <select id="textura" name="textura" required defaultValue="">
          <option value="">Selecione a textura</option>
          <option value="liso">Liso</option><option value="ondulado">Ondulado</option>
          <option value="cacheado">Cacheado</option><option value="crespo">Crespo</option>
        </select>
        <label htmlFor="comprimento">Comprimento desejado</label>
        <select id="comprimento" name="comprimento" required defaultValue="">
          <option value="">Selecione o comprimento</option>
          <option value="curto">Curto</option><option value="medio">Médio</option><option value="longo">Longo</option>
        </select>
        <label htmlFor="manutencao">Disponibilidade para manutenção</label>
        <select id="manutencao" name="manutencao" required defaultValue="">
          <option value="">Selecione a disponibilidade</option>
          <option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option>
        </select>
      </fieldset>
      <button className="action-link action-link--primary" type="submit" disabled={loading}>
        {loading ? 'Gerando recomendação…' : 'Gerar recomendação'}
      </button>
      {error && <p className="notice" role="alert">{error}</p>}
    </form>
    {recommendation.length > 0 && <RecommendationResults area="cabelo" results={recommendation} />}
  </section>;
}
