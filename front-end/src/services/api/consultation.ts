import { ApiError, httpError } from './errors';

export type Journey = 'cabelo' | 'maquiagem';
export interface Recommendation {
  estilo: string;
  justificativa: string;
  cuidados: string;
}

export function consultationUrl(path: string) {
  if (!import.meta.env.PROD) return path;
  const origin = import.meta.env.VITE_IA_BASE_URL?.trim() || 'https://espelho-meu-ia.onrender.com';
  return new URL(path, origin).href;
}

export async function fetchConsultation(path: string, init?: RequestInit) {
  try {
    return await fetch(consultationUrl(path), { credentials: 'omit', ...init });
  } catch {
    if (init?.signal?.aborted) throw new ApiError('aborted', 'Solicitação cancelada.');
    throw new ApiError('network', 'Não foi possível conectar à IA. Confira sua conexão e tente novamente.');
  }
}

function isRecommendation(value: unknown): value is Recommendation {
  return !!value && typeof value === 'object'
    && 'estilo' in value && typeof value.estilo === 'string' && !!value.estilo.trim()
    && 'justificativa' in value && typeof value.justificativa === 'string' && !!value.justificativa.trim()
    && 'cuidados' in value && typeof value.cuidados === 'string' && !!value.cuidados.trim();
}

export async function getRecommendations(area: Journey, profile: object, signal?: AbortSignal) {
  const response = await fetchConsultation(`/api/recomendacoes/${area}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
    signal,
  });
  if (!response.ok) throw httpError(response.status);
  let data: unknown;
  try { data = await response.json(); }
  catch { throw new ApiError('invalid-response', 'Não foi possível ler a resposta da IA. Tente novamente.'); }
  if (!data || typeof data !== 'object' || !('area' in data) || data.area !== area
    || !('recomendacao' in data) || typeof data.recomendacao !== 'string' || !data.recomendacao.trim()) {
    throw new ApiError('invalid-response', 'A IA retornou uma resposta inesperada. Tente novamente.');
  }
  const first = { estilo: data.recomendacao, justificativa: '', cuidados: '' };
  if (!('alternativas' in data) || !Array.isArray(data.alternativas)) return [first];
  const alternatives = data.alternativas.filter(isRecommendation);
  return alternatives[0]?.estilo === first.estilo ? alternatives : [first];
}
