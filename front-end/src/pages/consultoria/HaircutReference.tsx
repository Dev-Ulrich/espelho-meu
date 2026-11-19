const illustratedCuts = new Set([
  'crew', 'low-taper-franja', 'low-taper-tesoura',
  'buzz', 'french-crop', 'ivy', 'degrade-medio', 'bro-flow', 'frohawk',
  'pixie-texturizado', 'bob-reto', 'french-bob', 'chanel-bico', 'lob-reto',
  'shag-medio', 'butterfly-longo', 'afro-medio-redondo', 'hime-longo',
]);

export function haircutImage(id: string): string | undefined {
  return illustratedCuts.has(id) ? `/assets/referencias-cortes/${id}.webp` : undefined;
}

export function HaircutReference({ id, name }: { id: string; name: string }) {
  const image = haircutImage(id);
  const search = new URLSearchParams({ tbm: 'isch', q: `${name} corte de cabelo` });
  return image
    ? <img src={image} alt={`Referência ilustrativa do corte ${name}`} loading="lazy" />
    : <a className="text-link" href={`https://www.google.com/search?${search}`} target="_blank" rel="noreferrer">
      Ver fotos de referência
    </a>;
}
