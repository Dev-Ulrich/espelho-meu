import { useState } from 'react';

const illustratedCuts = new Set([
  'afro-assimetrico-curto', 'afro-medio-alto', 'afro-medio-assimetrico', 'afro-medio-redondo',
  'bixie', 'blunt-clavicula', 'bob-cacheado-afunilado', 'bob-curto-camadas', 'bob-empilhado',
  'bob-italiano', 'bob-reto', 'bottleneck-bob', 'bro-flow', 'burr', 'butterfly-longo', 'buzz',
  'buzz-feminino', 'cacheado-abaixo-ombros', 'cacheado-medio-alongado', 'cacheado-medio-camadas',
  'caesar', 'camadas-medio-baixas', 'camadas-medio-moldura', 'chanel-bico',
  'crespo-medio-angular', 'crew', 'crop-cacheado', 'crop-com-risca', 'curtains-medio',
  'curto-cacheado-frente', 'curto-tesoura', 'degrade-medio', 'extra-assimetrico', 'extra-camadas',
  'extra-franja-lateral', 'extra-reto', 'extra-u', 'flat-top', 'flow-longo', 'flow-longo-camadas',
  'franja-cheia-medio', 'franja-cortina-medio', 'franja-lateral-medio', 'french-bob',
  'french-crop', 'frohawk', 'garconne', 'hime-longo', 'ivy', 'lob-angulado', 'lob-camadas',
  'lob-franja-curva', 'lob-reto', 'longo-afro', 'longo-afro-alto', 'longo-arredondado',
  'longo-assimetrico', 'longo-base-u', 'longo-base-v', 'longo-camadas-baixas',
  'longo-camadas-internas', 'longo-camadas-ombro', 'longo-cascata', 'longo-crespo-frente',
  'longo-face-frame', 'longo-franja-cortina', 'longo-franja-lateral', 'longo-franja-reta',
  'longo-mullet', 'longo-repicado-cacheado', 'longo-reto', 'longo-reto-angular', 'longo-shag',
  'longo-taper', 'longo-undercut', 'longo-wolf', 'low-taper-franja', 'low-taper-tesoura',
  'medio-base-u', 'micro-bob', 'mid-taper-cacheado', 'mop-cacheado', 'mullet-medio',
  'octopus-longo', 'pixie-classico', 'pixie-long-fringe', 'pixie-texturizado', 'pompadour',
  'quiff-curto', 'shag-curto', 'shag-longo-aberto', 'shag-medio', 'slick-taper',
  'social-contorno', 'taper-curto', 'taper-medio', 'taper-penteado-medio', 'topete-medio', 'twa',
  'twa-masculino-rente', 'undercut-curto', 'undercut-medio', 'wolf-medio',
]);

export function haircutImage(id: string): string | undefined {
  return illustratedCuts.has(id) ? `/assets/referencias-cortes/${id}.webp` : undefined;
}

export function HaircutReference({ id, name, thumbnail = false }: { id: string; name: string; thumbnail?: boolean }) {
  const [failedImage, setFailedImage] = useState<string>();
  const image = haircutImage(id);
  if (image && failedImage !== image) {
    return <img src={image} alt={thumbnail ? '' : `Referência ilustrativa do corte ${name}`}
      loading="lazy" onError={() => setFailedImage(image)} />;
  }
  if (thumbnail) return null;
  const search = new URLSearchParams({ tbm: 'isch', q: `${name} corte de cabelo` });
  return <a className="text-link" href={`https://www.google.com/search?${search}`} target="_blank" rel="noreferrer">
    Ver fotos de referência
  </a>;
}
