import { getRecommendations } from './consultation';

export interface MakeupProfile {
  tipo_pele: 'seca' | 'mista' | 'oleosa';
  ocasiao: 'dia_a_dia' | 'trabalho' | 'evento';
  acabamento: 'natural' | 'matte' | 'luminoso';
}

export function getMakeupRecommendations(profile: MakeupProfile, signal?: AbortSignal) {
  return getRecommendations('maquiagem', profile, signal);
}

export async function recommendMakeup(profile: MakeupProfile, signal?: AbortSignal): Promise<string> {
  const [first] = await getMakeupRecommendations(profile, signal);
  return first.estilo;
}
