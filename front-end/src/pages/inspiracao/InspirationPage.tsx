import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { paths } from '../../app/paths';
import { ActionLink } from '../../components/ui/ActionLink';
import { hairStyles, makeupStyles } from './catalog-data';
import type { Inspiration } from './catalog-data';
import hairHero from '../../assets/figma/cabelo-Image1.png';
import makeupHero from '../../assets/figma/maquiagem-Image1.png';
import hairPurple from '../../assets/figma/cabelo-FormaOrganicaLilas.svg';
import hairLilac from '../../assets/figma/cabelo-FormaOrganicaLilas1.svg';
import hairOutline from '../../assets/figma/cabelo-Vector.svg';
import makeupPurple from '../../assets/figma/maquiagem-FormaOrganicaLilas.svg';
import makeupLilac from '../../assets/figma/maquiagem-FormaOrganicaLilas1.svg';
import makeupOutline from '../../assets/figma/maquiagem-Vector.svg';
import hairBefore from '../../assets/figma/cabelo-ReferenciaCabeloNatural.png';
import hairAfter from '../../assets/figma/cabelo-ReferenciaCabeloIluminado.png';
import makeupBefore from '../../assets/figma/maquiagem-ReferenciaCabeloNatural.png';
import makeupAfter from '../../assets/figma/maquiagem-ReferenciaCabeloIluminado.png';
import thumbBob from '../../assets/figma/cabelo-MiniaturaDeEstilo2.jpg';
import thumbCurto from '../../assets/figma/cabelo-MiniaturaDeEstilo3.jpg';
import thumbShag from '../../assets/figma/cabelo-MiniaturaDeEstilo4.jpg';
import base from '../../assets/figma/maquiagem-Image4.png';
import brushes from '../../assets/figma/maquiagem-Image5.png';
import spray from '../../assets/figma/maquiagem-Image3.png';
import sparkle from '../../assets/figma/maquiagem-CodiconSparkleFilled.svg';
import './inspiration.css';

function StyleDetails({ item, onClose, journey }: { item: Inspiration | null; onClose: () => void; journey: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (item && !dialog.current?.open) dialog.current?.showModal();
    if (!item && dialog.current?.open) dialog.current.close();
  }, [item]);
  return <dialog ref={dialog} className="style-details" aria-labelledby="detail-title" onClose={onClose}>
    {item && <>
      <button type="button" className="action-link action-link--outline" onClick={() => dialog.current?.close()} autoFocus>Fechar detalhes</button>
      <img className="style-details__image" src={item.image} alt={item.title} />
      <h2 id="detail-title">{item.title}</h2>
      <p>{item.description}</p>
      {item.maintenance && <p>Manutenção: {item.maintenance}</p>}
      {item.texture && <p>Textura: {item.texture} · Comprimento: {item.length}</p>}
      <p className="notice">Referência de demonstração. As recomendações personalizadas dependem da consultoria autenticada.</p>
      <ActionLink to={`${paths.consultoria}?jornada=${journey}`}>Explorar minha consultoria</ActionLink>
    </>}
  </dialog>;
}

export function InspirationPage({ kind }: { kind: 'cabelo' | 'maquiagem' }) {
  const isHair = kind === 'cabelo';
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<Inspiration | null>(null);
  const category = isHair ? (params.get('categoria') === 'coloracoes' ? 'coloracoes' : 'cortes') : (params.get('categoria') ?? 'Todos');
  const texture = params.get('textura') ?? 'Todas';
  const length = params.get('comprimento') ?? 'Todos';
  const items = (isHair ? hairStyles : makeupStyles).filter(item => isHair
    ? category === 'cortes' && (texture === 'Todas' || item.texture === texture) && (length === 'Todos' || item.length === length)
    : category === 'Todos' || item.category === category);
  function changeFilter(name: string, value: string) {
    setParams(previous => { const next = new URLSearchParams(previous); next.set(name, value); return next; });
  }
  const journey = `${paths.consultoria}?jornada=${kind}`;
  const care = isHair ? [
    ['Finalização', 'Valorize sua textura com produtos leves e proteção térmica antes de usar calor.'],
    ['Hidratação', 'Inclua uma pausa de cuidado na semana. Ajuste a frequência à necessidade dos fios.'],
    ['Manutenção da cor', 'Prefira produtos para cabelos coloridos e combine os retoques com um profissional.'],
  ] : [
    ['Base ideal', 'Encontre o acabamento e a cobertura certa para o seu tipo de pele.'],
    ['Pincéis essenciais', 'Saiba quais pincéis usar para um resultado mais preciso e natural.'],
    ['Fixação prolongada', 'Dicas de produtos e técnicas para manter sua maquiagem impecável por mais tempo.'],
  ];
  return <div className={`inspiration-page inspiration-page--${kind}`}>
    <section className="category-hero" aria-labelledby="category-title">
      <div className="category-hero__art" aria-hidden="true">
        <div className="category-hero__purple"><img src={isHair ? hairPurple : makeupPurple} alt="" /></div>
        <div className="category-hero__lilac"><img src={isHair ? hairLilac : makeupLilac} alt="" /></div>
        <div className="category-hero__outline"><img src={isHair ? hairOutline : makeupOutline} alt="" /></div>
        <img className="category-hero__portrait" src={isHair ? hairHero : makeupHero} alt="" fetchPriority="high" />
      </div>
      <h1 id="category-title">{isHair ? <>Seu cabelo,<br />novas possibilidades.</> : <>Sua beleza em evidência.<br />Sua maquiagem,<br />sem limites.</>}</h1>
    </section>
    <div className="category-content">
      <section aria-labelledby="inspiration-title">
        <h2 id="inspiration-title">Encontre sua próxima inspiração</h2>
        <div className="filter-buttons" role="group" aria-label={isHair ? 'Categoria de cabelo' : 'Categoria de maquiagem'}>
          {(isHair ? [['cortes', 'Cortes'], ['coloracoes', 'Colorações']] : ['Todos', 'Pele', 'Olhos', 'Lábios'].map(v => [v, v])).map(([value, label]) =>
            <button key={value} type="button" className="filter-button" aria-pressed={category === value} onClick={() => changeFilter('categoria', value)}>{label}</button>)}
        </div>
        {isHair && category === 'cortes' && <div className="filter-selects">
          <label>Textura <select value={texture} onChange={e => changeFilter('textura', e.target.value)}>{['Todas', 'Lisa', 'Ondulada', 'Cacheada', 'Crespa'].map(v => <option key={v}>{v}</option>)}</select></label>
          <label>Comprimento <select value={length} onChange={e => changeFilter('comprimento', e.target.value)}>{['Todos', 'Curto', 'Médio', 'Longo'].map(v => <option key={v}>{v}</option>)}</select></label>
        </div>}
        <p className="result-count" role="status">{items.length} referências encontradas</p>
        {items.length > 0 ? <div className="inspiration-grid">
          {items.map(item => <article key={item.id} className={`inspiration-card inspiration-card--${item.id}`}>
            <div className="inspiration-card__photo"><img src={item.image} alt={item.title} loading="lazy" /></div>
            <div className="inspiration-card__body">
              <h3>{item.title}</h3><p>{item.description}</p>{item.maintenance && <p>{item.maintenance}</p>}
              <button type="button" className="action-link action-link--primary" aria-label={`Ver detalhes de ${item.title}`} onClick={() => setSelected(item)}>Ver detalhes</button>
            </div>
          </article>)}
        </div> : <div className="notice">
          <p>{isHair && category === 'coloracoes' ? 'As referências de colorações ainda estão em preparação. Você já pode explorar os cortes disponíveis.' : 'Nenhuma referência disponível para esta combinação de filtros.'}</p>
          <button type="button" className="action-link action-link--outline" onClick={() => setParams({})}>Mostrar {isHair ? 'todos os cortes' : 'todas as maquiagens'}</button>
        </div>}
      </section>
      <section className="consultation-banner" aria-labelledby="personal-title">
        <div><h2 id="personal-title">Inspiração que considera você.</h2><p>{isHair ? 'Sua textura, seus desejos e sua rotina orientam cada recomendação.' : 'Descubra estilos de maquiagem que valorizam seus traços e combinam com a ocasião.'}</p></div>
        <ActionLink to={journey}>Encontrar minhas sugestões</ActionLink>
      </section>
      <section className="reference-preview" aria-labelledby="preview-title">
        <div>
          {!isHair && <span className="simulation-tag"><img src={sparkle} alt="" /> SIMULAÇÃO DE MAQUIAGEM</span>}
          <h2 id="preview-title">Veja possibilidades antes de mudar</h2>
          <p>{isHair ? 'Explore referências de corte e cor. A escolha final continua sendo sua.' : 'Simule estilos de maquiagem e veja o que mais valoriza a sua beleza.'}</p>
          {isHair ? <>
            <p className="reference-note">Exemplo de corte. Prévia de cor e combinação ainda indisponíveis.</p>
            <div className="reference-thumbnails" aria-label="Explorar referências de cortes">
              {hairStyles.map((item, index) => <button key={item.id} type="button" aria-label={`Ver referência de ${item.title}`} onClick={() => setSelected(item)}><img src={[item.image, thumbBob, thumbCurto, thumbShag][index]} alt="" loading="lazy" /></button>)}
            </div>
          </> : <ActionLink to={journey}>Fazer simulação de maquiagem</ActionLink>}
        </div>
        <div className="comparison">
          <p className="comparison__label">Referências de demonstração • sem simulação em tempo real</p>
          <div className="comparison__pair">
            <figure><div className="comparison__photo comparison__photo--before"><img src={isHair ? hairBefore : makeupBefore} alt={isHair ? 'Referência original com cabelo longo e cacheado' : 'Referência original de maquiagem'} loading="lazy" /></div><figcaption>Original • foto de demonstração</figcaption></figure>
            <figure><div className="comparison__photo comparison__photo--after"><img src={isHair ? hairAfter : makeupAfter} alt={isHair ? 'Prévia ilustrativa de corte mais curto' : 'Prévia ilustrativa de maquiagem'} loading="lazy" /></div><figcaption>Prévia ilustrativa • {isHair ? 'corte' : 'maquiagem'}</figcaption></figure>
          </div>
        </div>
      </section>
      <section aria-labelledby="care-title"><h2 id="care-title">Cuidado que acompanha seu novo visual</h2>
        <div className="care-grid">{care.map(([title, description], i) => <article key={title}>
          {isHair ? <span aria-hidden="true">0{i + 1}</span> : <img src={[base, brushes, spray][i]} alt="" loading="lazy" />}
          <div><h3>{title}</h3><p>{description}</p></div>
        </article>)}</div>
      </section>
      {/* Faixa final e rodapé serão integrados pela Yasmin, conforme o guia. */}
    </div>
    <StyleDetails item={selected} onClose={() => setSelected(null)} journey={kind} />
  </div>;
}
