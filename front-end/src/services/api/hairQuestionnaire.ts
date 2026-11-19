import { PrivateApiError, privateApi } from './privateApi';

export type HairQuestion = {
  id: string; titulo: string; opcoes: [string, string][]; ajuda?: string; multipla: boolean;
  quando?: Record<string, string[]>; descricoes?: Record<string, string>;
};

export async function loadHairQuestionnaire(signal: AbortSignal, onRetry: () => void): Promise<HairQuestion[]> {
  const path = '/consultoria/cabelo/questionario';
  try {
    return (await privateApi<{ perguntas: HairQuestion[] }>(path, { signal })).perguntas;
  } catch (error) {
    if (!(error instanceof PrivateApiError) || ![502, 503, 504].includes(error.status)) throw error;
    signal.throwIfAborted();
    onRetry();
    return (await privateApi<{ perguntas: HairQuestion[] }>(path, { signal })).perguntas;
  }
}
