import { PrivateApiError, privateApi } from './privateApi';

export type ConsultationArea = 'cabelo' | 'maquiagem';

export type ConsultationQuestion = {
  id: string; titulo: string; opcoes: [string, string][]; ajuda?: string; multipla: boolean;
  quando?: Record<string, string[]>; descricoes?: Record<string, string>;
};

export async function loadQuestionnaire(area: ConsultationArea, signal: AbortSignal, onRetry: () => void): Promise<ConsultationQuestion[]> {
  const path = `/consultoria/${area}/questionario`;
  try {
    return (await privateApi<{ perguntas: ConsultationQuestion[] }>(path, { signal })).perguntas;
  } catch (error) {
    if (!(error instanceof PrivateApiError) || ![502, 503, 504].includes(error.status)) throw error;
    signal.throwIfAborted();
    onRetry();
    return (await privateApi<{ perguntas: ConsultationQuestion[] }>(path, { signal })).perguntas;
  }
}
