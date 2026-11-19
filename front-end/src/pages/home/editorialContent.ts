import hair from '../../assets/figma/consultoria-cabelo.webp';
import makeup from '../../assets/figma/consultoria-maquiagem.webp';
import bob from '../../assets/figma/cabelo-FotografiaBobReto.jpg';
import coils from '../../assets/figma/cabelo-FotografiaCrespoComForma.jpg';
import curls from '../../assets/figma/cabelo-FotografiaCurtoComCachos.jpg';
import waves from '../../assets/figma/cabelo-FotografiaShagOndulado.jpg';
import evening from '../../assets/editorial/batom-intenso.webp';
import cover from '../../assets/editorial/capa-editorial.webp';
import natural from '../../assets/editorial/acabamento-natural.webp';
import matte from '../../assets/editorial/acabamento-matte.webp';
import luminous from '../../assets/editorial/acabamento-luminoso.webp';

export const editorialPhotos = { hair, makeup, bob, coils, curls, waves, evening, cover, natural, matte, luminous };

export const areas = {
  cabelo: {
    title: 'Cabelo',
    headline: 'Um corte que combina com seu ritmo.',
    description: 'Explore cortes, penteados e cores a partir da sua curvatura, das suas preferências e do tempo que você tem para cuidar do cabelo.',
    summary: 'Cortes, penteados e cores para a sua rotina.',
    portrait: hair,
    alt: 'Pessoa com cachos soltos e volume natural',
    examples: [
      { title: 'Bob reto', description: 'Contorno definido, na altura do queixo.', photo: bob },
      { title: 'Curto com cachos', description: 'Laterais baixas e textura no topo.', photo: curls },
      { title: 'Shag ondulado', description: 'Camadas e franja para dar movimento.', photo: waves },
    ],
  },
  maquiagem: {
    title: 'Maquiagem',
    headline: 'Da pele leve ao olhar marcado.',
    description: 'Explore tons, coberturas e acabamentos para o seu tipo de pele, a ocasião e o jeito que você gosta de se maquiar.',
    summary: 'Tons e acabamentos do dia a dia à noite.',
    portrait: makeup,
    alt: 'Pessoa com maquiagem luminosa e olhos suavemente delineados',
    examples: [
      { title: 'Pele luminosa', description: 'Brilho suave nas maçãs do rosto.', photo: luminous },
      { title: 'Pele natural', description: 'Cobertura leve e textura de pele à vista.', photo: natural },
      { title: 'Boca em destaque', description: 'Batom intenso com olhos mais suaves.', photo: evening },
    ],
  },
} as const;

export type EditorialArea = keyof typeof areas;
