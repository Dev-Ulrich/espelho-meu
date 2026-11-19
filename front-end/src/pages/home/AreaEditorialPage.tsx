import { CompareStyles } from '../consultoria/CompareStyles';
import { areas, type EditorialArea } from './editorialContent';
import { ConsultationLinks } from './HomePage';

export function AreaEditorialPage({ area }: { area: EditorialArea }) {
  const content = areas[area];

  return <div className="editorial-page">
    <section className="editorial-feature" aria-labelledby="area-title">
      <div className="editorial-container editorial-feature__grid">
        <div>
          <p className="editorial-kicker">{content.title}</p>
          <h1 id="area-title">{content.headline}</h1>
          <p>{content.description}</p>
          <a className="editorial-text-link" href="#inspiracoes">Ver galeria</a>
        </div>
        <img src={content.portrait} alt={content.alt} fetchPriority="high" />
      </div>
    </section>
    <section id="inspiracoes" className="editorial-container editorial-section" aria-labelledby="gallery-title">
      <h2 id="gallery-title">Ideias para explorar</h2>
      <ul className="editorial-gallery">
        {content.examples.map(example => <li key={example.title}>
          <div><img src={example.photo} alt={example.title} loading="lazy" /></div>
          <h3>{example.title}</h3>
          <p>{example.description}</p>
        </li>)}
      </ul>
    </section>
    <section className="editorial-container editorial-section">
      <CompareStyles key={area} area={area} items={content.examples.map((example, index) => ({
        id: `${area}-${index}`, name: example.title, image: example.photo,
        details: area === 'cabelo' ? {
          Efeito: example.description,
          Textura: ['Lisa ou alisada', 'Cacheada', 'Ondulada'][index],
          Comprimento: ['Curto', 'Curto', 'Médio'][index],
          Manutenção: ['Aparar para manter a base', 'Finalizar para definir cachos', 'Finalizar para destacar camadas'][index],
        } : {
          Efeito: example.description,
          Acabamento: ['Luminoso', 'Natural', 'Destaque nos lábios'][index],
          Cobertura: ['Leve a média', 'Leve', 'Adaptável à preferência'][index],
          Ocasião: ['Dia ou noite', 'Dia a dia', 'Eventos ou uso diário'][index],
        },
      }))} />
    </section>
    <section className="editorial-invite editorial-invite--rose">
      <div className="editorial-container">
        <h2>Experimente no seu estilo.</h2>
        <p>Entre para responder à consultoria e testar uma sugestão na sua foto.</p>
        <ConsultationLinks area={area} tryOn />
      </div>
    </section>
  </div>;
}
