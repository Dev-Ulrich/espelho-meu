import crespo from '../../assets/figma/cabelo-FotografiaCrespoComForma.jpg';
import bob from '../../assets/figma/cabelo-FotografiaBobReto.jpg';
import curto from '../../assets/figma/cabelo-FotografiaCurtoComCachos.jpg';
import shag from '../../assets/figma/cabelo-FotografiaShagOndulado.jpg';
import glow from '../../assets/figma/maquiagem-FotografiaCrespoComForma.png';
import olhos from '../../assets/figma/maquiagem-FotografiaCrespoComForma1.png';
import labios from '../../assets/figma/maquiagem-FotografiaCrespoComForma2.png';
import make from '../../assets/figma/maquiagem-FotografiaCrespoComForma3.png';

export interface Inspiration {
  id: string;
  title: string;
  description: string;
  image: string;
  maintenance?: string;
  texture?: string;
  length?: string;
  category?: string;
}

// Referências editoriais do protótipo, não recomendações personalizadas.
export const hairStyles: Inspiration[] = [
  { id: 'crespo', title: 'Crespo com forma', description: 'Volume natural, contorno leve.', image: crespo, texture: 'Crespa', length: 'Curto', maintenance: 'Baixa • ajuste a cada 8 semanas' },
  { id: 'bob', title: 'Bob reto', description: 'Linhas marcadas, estilo versátil.', image: bob, texture: 'Lisa', length: 'Médio', maintenance: 'Média • ajuste a cada 6 semanas' },
  { id: 'curto', title: 'Curto com cachos', description: 'Textura em destaque e laterais leves.', image: curto, texture: 'Cacheada', length: 'Curto', maintenance: 'Média • ajuste a cada 4 semanas' },
  { id: 'shag', title: 'Shag ondulado', description: 'Camadas que acompanham o movimento.', image: shag, texture: 'Ondulada', length: 'Médio', maintenance: 'Baixa • ajuste a cada 8 semanas' },
];
export const makeupStyles: Inspiration[] = [
  { id: 'glow', title: 'Glow natural', description: 'Pele radiante, leve e com aparência saudável.', image: glow, category: 'Pele' },
  { id: 'olhar', title: 'Olhar marcante', description: 'Realce o olhar com profundidade e elegância.', image: olhos, category: 'Olhos' },
  { id: 'boca', title: 'Boca em destaque', description: 'Lábios intensos que transformam o visual.', image: labios, category: 'Lábios' },
  { id: 'make', title: 'Make sofisticada', description: 'Equilíbrio perfeito entre contemporâneo e elegante.', image: make, category: 'Completa' },
];
