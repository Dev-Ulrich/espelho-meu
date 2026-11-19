import { getRecommendations } from './consultation';

export interface HairProfile {
  textura: 'liso' | 'ondulado' | 'cacheado' | 'crespo';
  comprimento: 'curto' | 'medio' | 'longo';
  manutencao: 'baixa' | 'media' | 'alta';
}

export function getHairRecommendations(profile: HairProfile, signal?: AbortSignal) {
  return getRecommendations('cabelo', profile, signal);
}

export async function recommendHair(profile: HairProfile, signal?: AbortSignal): Promise<string> {
  const [first] = await getHairRecommendations(profile, signal);
  return first.estilo;
}
