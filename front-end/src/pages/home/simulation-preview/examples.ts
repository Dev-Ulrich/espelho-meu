import hairBefore from '../../../assets/figma/cabelo-ReferenciaCabeloNatural.png';
import hairAfter from '../../../assets/figma/cabelo-ReferenciaCabeloIluminado.png';
import makeupBefore from '../../../assets/figma/maquiagem-ReferenciaCabeloNatural.png';
import makeupAfter from '../../../assets/figma/maquiagem-ReferenciaCabeloIluminado.png';

// Pares originais das páginas de cabelo e maquiagem. Não misturar pessoas.
// A dupla masculina do frame da home ainda precisa ser exportada e adicionada.
export const examples = [
  { id: 'cabelo', title: 'Referência de corte', before: hairBefore, after: hairAfter,
    beforeAlt: 'Referência de cabelo longo e cacheado', afterAlt: 'Prévia ilustrativa de cabelo mais curto' },
  { id: 'maquiagem', title: 'Referência de maquiagem', before: makeupBefore, after: makeupAfter,
    beforeAlt: 'Referência original de maquiagem', afterAlt: 'Prévia ilustrativa de maquiagem' },
];
