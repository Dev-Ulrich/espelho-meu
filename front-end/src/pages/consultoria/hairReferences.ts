export type Presentation = 'masculino' | 'feminino' | 'ambos' | undefined;

const base = '/assets/formulario-cabelo';
const asset = (path: string) => `${base}/${path}`;

export type HairVisual = { image: string; secondary?: string; alt: string };

function presented(presentation: Presentation, masculino: string, feminino: string, both?: string): string {
  if (presentation === 'masculino') return asset(masculino);
  if (presentation === 'feminino') return asset(feminino);
  if (both) return asset(both);
  return asset(masculino);
}

export function balancedPresentation(questionId: string, optionId: string, presentation: Presentation): Presentation {
  if (presentation !== 'ambos') return presentation;
  const hash = [...`${questionId}:${optionId}`].reduce((value, char) => ((value * 31) + char.charCodeAt(0)) >>> 0, 0);
  return hash % 2 === 0 ? 'masculino' : 'feminino';
}

export function hairVisual(questionId: string, optionId: string, presentation: Presentation, answers: Record<string, unknown>): HairVisual | undefined {
  if (questionId === 'apresentacao') {
    const paths: Record<string, string> = {
      masculino: 'estilo-de-referencia/masculino.webp',
      feminino: 'estilo-de-referencia/feminino.webp',
      ambos: 'estilo-de-referencia/ver-ambos.webp',
    };
    return paths[optionId] ? { image: asset(paths[optionId]), alt: '' } : undefined;
  }

  if (questionId === 'textura') {
    const subtipo: Record<string, string> = { liso: '1b', ondulado: '2b', cacheado: '3b', crespo: '4b' };
    const code = subtipo[optionId];
    if (!code) return undefined;
    return { image: presented(presentation, `curvatura/${code}-masculino.webp`, `curvatura/${code}-feminino.webp`), secondary: asset(`curvatura/${code}-desenho.webp`), alt: '' };
  }

  if (questionId === 'subtipo') {
    const texture = String(answers.textura ?? '');
    const family = { liso: '1', ondulado: '2', cacheado: '3', crespo: '4' }[texture];
    if (!family || optionId === 'nao_sei') return undefined;
    const code = `${family}${optionId}`;
    return { image: presented(presentation, `curvatura/${code}-masculino.webp`, `curvatura/${code}-feminino.webp`), secondary: asset(`curvatura/${code}-desenho.webp`), alt: '' };
  }

  if (questionId === 'espessura') {
    if (optionId === 'nao_sei') return undefined;
    return { image: asset(`espessura/${optionId}.webp`), alt: '' };
  }
  if (questionId === 'volume') {
    if (optionId === 'nao_sei') return undefined;
    return { image: asset(`volume/${optionId}.webp`), alt: '' };
  }
  if (questionId === 'formato_manual') {
    const names: Record<string, string> = { oval: 'oval', redondo: 'redondo', quadrado: 'quadrado', oblongo: 'oblongo', coracao: 'coracao', diamante: 'diamante', triangular: 'triangular', foto: 'analisar-foto' };
    if (!names[optionId]) return undefined;
    return { image: asset(`formatos-faciais/${names[optionId]}.webp`), alt: '' };
  }

  if (questionId === 'comprimento') {
    if (optionId === 'nao_sei') return undefined;
    const map: Record<string, string> = { curtissimo: 'curtissimo', curto: 'curto', medio: 'medio', longo: 'longo', extra_longo: 'extra-longo' };
    const code = map[optionId];
    if (!code) return undefined;
    if (presentation === 'ambos') {
      return { image: asset(`comprimento/${code}-masculino.webp`), secondary: asset(`comprimento/${code}-feminino.webp`), alt: '' };
    }
    return { image: presented(presentation, `comprimento/${code}-masculino.webp`, `comprimento/${code}-feminino.webp`), alt: '' };
  }

  if (questionId === 'penteado') {
    const map: Record<string, string> = { solto: 'solto', preso: 'preso', semipreso: 'semipreso', qualquer: 'quero-comparar' };
    if (!map[optionId]) return undefined;
    if (presentation === 'ambos') {
      return { image: asset(`jeito-de-usar/quero-comparar-misto.webp`), alt: '' };
    }
    return { image: presented(presentation, `jeito-de-usar/${map[optionId]}-masculino.webp`, `jeito-de-usar/${map[optionId]}-feminino.webp`), alt: '' };
  }

  if (questionId === 'franja') {
    const map: Record<string, string> = { com: 'sim', sem: 'nao', qualquer: 'tanto-faz' };
    if (!map[optionId]) return undefined;
    return { image: presented(presentation, `franja/${map[optionId]}-masculino.webp`, `franja/${map[optionId]}-feminino.webp`), alt: '' };
  }

  if (questionId === 'estetica') {
    const files: Record<string, string> = {
      natural: 'natural-esportivo', tradicional: 'tradicional-classico', elegante: 'elegante-refinado',
      romantico: 'romantico', sexy: 'sensual-sedutor', criativo: 'criativo', dramatico: 'dramatico-moderno',
    };
    const file = files[optionId];
    if (!file) return undefined;
    return { image: presented(presentation, `esteticas/${file}-corte-masculino.webp`, `esteticas/${file}-corte-feminino.webp`), secondary: presented(presentation, `esteticas/${file}-penteado-masculino.webp`, `esteticas/${file}-penteado-feminino.webp`), alt: '' };
  }

  if (questionId === 'tecnica_cor') {
    const map: Record<string, string> = { luzes: 'luzes', mechas: 'mechas-localizadas', global: 'coloracao-global' };
    if (!map[optionId]) return undefined;
    return { image: presented(presentation, `tecnicas-de-cor/${map[optionId]}-masculino.webp`, `tecnicas-de-cor/${map[optionId]}-feminino.webp`), alt: '' };
  }

  if (questionId === 'cor') {
    const map: Record<string, string> = { quente: 'quentes-amostras.webp', fria: 'frios-amostras.webp', fantasia: 'fantasia-amostras.webp', sugerir: 'sugestoes-amostras.webp' };
    if (!map[optionId]) return undefined;
    return { image: asset(`familias-de-cor/${map[optionId]}`), alt: '' };
  }

  if (questionId === 'base_cor') {
    const map: Record<string, string> = { clara: 'clara', media: 'media', escura: 'escura', colorida: 'ja-colorido' };
    if (!map[optionId]) return undefined;
    return { image: presented(presentation, `cor-atual/${map[optionId]}-masculino.webp`, `cor-atual/${map[optionId]}-feminino.webp`), alt: '' };
  }

  if (questionId === 'tom') {
    if (optionId === 'nao_sei') return undefined;
    return { image: presented(presentation, `tom-de-pele/${optionId}-masculino.webp`, `tom-de-pele/${optionId}-feminino.webp`), alt: '' };
  }

  if (questionId === 'subtom') {
    const map: Record<string, { masculine: string; feminine: string }> = {
      quente: { masculine: 'quente-dourado-masculino.webp', feminine: 'quente-dourado-feminino.webp' },
      frio: { masculine: 'frio-prateado-masculino.webp', feminine: 'frio-prateado-feminino.webp' },
      neutro: { masculine: 'neutro-dourado-e-prateado-masculino.webp', feminine: 'neutro-dourado-e-prateado-feminino.webp' },
      oliva: { masculine: 'oliva-dourado-masculino.webp', feminine: 'oliva-dourado-feminino.webp' },
      nao_sei: { masculine: 'quente-punho-masculino.webp', feminine: 'quente-punho-feminino.webp' },
    };
    const item = map[optionId];
    if (!item) return undefined;
    return {
      image: presented(presentation, `subtom/${item.masculine}`, `subtom/${item.feminine}`),
      secondary: asset(`subtom/${optionId === 'nao_sei' ? 'quente' : optionId}-punho-desenho.webp`),
      alt: '',
    };
  }

  return undefined;
}
