import type { ConsultationResult } from '../consultoria/GuidedResults';
import type { ConsultationArea } from '../../services/api/questionnaire';

export type SavedConsultation = {
  id: string; area: ConsultationArea; title: string; date: string; favorite: boolean;
  result: ConsultationResult; answers: Record<string, string | string[]>;
  review?: { stars: number; comment: string };
};
export type Preferences = { displayName: string; reducedMotion: boolean; area: ConsultationArea };
export type Library = { version: 1; records: SavedConsultation[]; preferences: Preferences };
export const emptyLibrary = (): Library => ({ version: 1, records: [], preferences: { displayName: '', reducedMotion: false, area: 'cabelo' } });
const key = (userId: number) => `espelho-meu:conta:${userId}:v1`;
export function readLibrary(userId: number, storage: Pick<Storage, 'getItem'> = localStorage): Library {
  try {
    const value = JSON.parse(storage.getItem(key(userId)) ?? 'null');
    if (value?.version !== 1 || !Array.isArray(value.records)) return emptyLibrary();
    const records = value.records.filter((entry: SavedConsultation) => entry && typeof entry.id === 'string'
      && typeof entry.title === 'string' && typeof entry.date === 'string' && Number.isFinite(Date.parse(entry.date))
      && ['cabelo', 'maquiagem'].includes(entry.area) && typeof entry.favorite === 'boolean'
      && entry.result?.facial && Array.isArray(entry.result.facial.avisos) && entry.answers && typeof entry.answers === 'object');
    return { version: 1, records: records.slice(0, 100), preferences: {
      displayName: typeof value.preferences?.displayName === 'string' ? value.preferences.displayName.slice(0, 80) : '',
      reducedMotion: value.preferences?.reducedMotion === true,
      area: value.preferences?.area === 'maquiagem' ? 'maquiagem' : 'cabelo',
    } };
  } catch { return emptyLibrary(); }
}
export function writeLibrary(userId: number, library: Library, storage: Pick<Storage, 'setItem'> = localStorage) {
  storage.setItem(key(userId), JSON.stringify(library));
}
export function upsertConsultation(records: SavedConsultation[], record: SavedConsultation) {
  const previous = records.find(item => item.id === record.id);
  return [{ ...record, favorite: previous?.favorite ?? record.favorite, review: previous?.review ?? record.review },
    ...records.filter(item => item.id !== record.id)].slice(0, 100);
}
export function validateReview(stars: number, comment: string) {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw new Error('Escolha uma nota de 1 a 5 estrelas.');
  if (comment.length > 500) throw new Error('Escreva um comentário com até 500 caracteres.');
  return { stars, comment: comment.trim() };
}
