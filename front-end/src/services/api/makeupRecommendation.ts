import { ApiError, httpError } from './errors';

export interface MakeupProfile {
  tipo_pele: 'seca' | 'mista' | 'oleosa';
  ocasiao: 'dia_a_dia' | 'trabalho' | 'evento';
  acabamento: 'natural' | 'matte' | 'luminoso';
}

// A IA usa o proxy local do Vite, independentemente da configuração da API Java.
export async function recommendMakeup(profile: MakeupProfile, signal?: AbortSignal): Promise<string> {
  let response: Response;
  try {
    response = await fetch('/api/recomendacoes/maquiagem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      body: JSON.stringify(profile),
      signal,
    });
  } catch {
    if (signal?.aborted) throw new ApiError('aborted', 'Solicitação cancelada.');
    throw new ApiError('network', 'Não foi possível conectar à IA. Confira sua conexão e se o Flask está rodando e tente novamente.');
  }
  if (!response.ok) throw httpError(response.status);
  let data: unknown;
  try { data = await response.json(); }
  catch { throw new ApiError('invalid-response', 'Não foi possível ler a resposta da IA. Tente novamente.'); }
  if (!data || typeof data !== 'object' || !('area' in data) || data.area !== 'maquiagem'
    || !('recomendacao' in data) || typeof data.recomendacao !== 'string' || !data.recomendacao.trim()) {
    throw new ApiError('invalid-response', 'A IA retornou uma resposta inesperada. Tente novamente.');
  }
  return data.recomendacao;
}
