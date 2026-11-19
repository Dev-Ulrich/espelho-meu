import type { Journey, Recommendation } from '../../services/api/consultation';

const storageKey = 'espelho-meu-resultados';

export interface SavedRecommendation extends Recommendation {
  id: string;
  area: Journey;
  date: string;
  favorite: boolean;
}

export function readSaved(): SavedRecommendation[] {
  if (typeof window === 'undefined') return [];
  try {
    const records: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    return Array.isArray(records) ? records.filter(record =>
      record && typeof record.id === 'string' && typeof record.estilo === 'string'
      && (record.area === 'cabelo' || record.area === 'maquiagem') && typeof record.date === 'string'
      && typeof record.favorite === 'boolean'
    ) : [];
  } catch {
    return [];
  }
}

export function saveRecommendation(area: Journey, recommendation: Recommendation, favorite: boolean) {
  const entries = readSaved();
  const id = `${area}:${recommendation.estilo}`;
  const existing = entries.find(entry => entry.id === id);
  const record = { ...recommendation, id, area, date: new Date().toISOString(), favorite: favorite || !!existing?.favorite };
  localStorage.setItem(storageKey, JSON.stringify([record, ...entries.filter(entry => entry.id !== id)].slice(0, 100)));
}

export function removeRecommendation(id: string, favoriteOnly: boolean) {
  const entries = readSaved();
  const next = favoriteOnly
    ? entries.map(entry => entry.id === id ? { ...entry, favorite: false } : entry)
    : entries.filter(entry => entry.id !== id);
  localStorage.setItem(storageKey, JSON.stringify(next));
  return next;
}
