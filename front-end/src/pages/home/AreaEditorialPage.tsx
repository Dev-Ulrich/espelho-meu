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
    <section className="editorial-invite">
      <div className="editorial-container">
        <h2>Experimente no seu estilo.</h2>
        <p>Entre para responder à consultoria e testar uma sugestão na sua foto.</p>
        <ConsultationLinks area={area} tryOn />
      </div>
    </section>
  </div>;
}
