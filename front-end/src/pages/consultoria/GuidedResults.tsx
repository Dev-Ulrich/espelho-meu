import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { ConsultationArea } from '../../services/api/questionnaire';
import hairPortrait from '../../assets/figma/consultoria-cabelo.webp';
import makeupPortrait from '../../assets/figma/consultoria-maquiagem.webp';
import { PhotoSimulation } from './PhotoSimulation';
import styles from '../authenticated/workspace.module.css';
import guided from './guidedConsultation.module.css';

type Cut = { id: string; nome: string; motivo: string; como_pedir: string; observacoes: string[]; penteados: string[] };
type Product = { nome: string; preco?: string | null; atributos?: string[]; ajustes: string[]; url?: string };
type ProductGroups = Record<string, Product[]>;
export type ConsultationResult = {
  facial: { formato?: string | null; avisos: string[]; origem?: 'foto' | 'manual'; dica?: string | null };
  maquiagem?: { recomendacao: string; sugestao_modelo?: string | null; aplicacao: string; pele_dica: string; produtos: ProductGroups; dica_produtos: string };
  cabelo?: { cortes: Cut[]; coloracao: string; dica_produtos: string; produtos: ProductGroups };
};

function RecommendedProducts({ products }: { products: ProductGroups }) {
  return <div className={guided.productGroups}>{Object.entries(products).map(([category, items]) => <section key={category}>
    <h3>{category}</h3>
    {items.length ? <ul>{items.map(product => <li key={`${product.nome}-${product.url ?? ''}`}>
      <strong>{product.nome}</strong>{product.preco && <span> · {product.preco}</span>}
      {!!product.atributos?.length && <p>{product.atributos.join(' · ')}</p>}
      {!!product.ajustes.length && <p>{product.ajustes.join(' · ')}</p>}
      {product.url?.startsWith('https://') && <a className={styles.link} href={product.url} target="_blank" rel="noreferrer">Ver produto</a>}
    </li>)}</ul> : <p>Nenhuma referência compatível com os filtros.</p>}
  </section>)}</div>;
}

type GuidedResultsProps = {
  result: ConsultationResult;
  area: ConsultationArea;
  answers?: Record<string, string | string[]>;
  resultId?: string;
  fromHistory?: boolean;
};

export function GuidedResults({ result, area }: GuidedResultsProps) {
  const { cabelo, maquiagem, facial } = result;
  const [simulationStyle, setSimulationStyle] = useState('');
  const title = useRef<HTMLHeadingElement>(null);
  const simulation = useRef<HTMLHeadingElement>(null);
  const leadCut = cabelo?.cortes[0];
  const lead = area === 'cabelo' ? leadCut?.nome : maquiagem?.recomendacao;

  useEffect(() => { title.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => { if (simulationStyle) simulation.current?.focus(); }, [simulationStyle]);

  return <div className={guided.results}>
    <header>
      <p className={guided.eyebrow}>Seu resultado · {area}</p>
      <h1 ref={title} tabIndex={-1} className={styles.title}>Seu próximo visual começa aqui.</h1>
      <p>Explore possibilidades, entenda cada indicação e escolha o que combina com você.</p>
    </header>
    {lead && <article className={guided.resultLead}>
      <img src={area === 'cabelo' ? hairPortrait : makeupPortrait} alt="" />
      <div><h2>{lead}</h2><p>{leadCut?.motivo ?? maquiagem?.aplicacao}</p>
        <small>Retrato ilustrativo. A simulação usa a foto que você enviar.</small>
      </div>
    </article>}
    {(facial.formato || facial.avisos.length > 0) && <section className={guided.resultCard}>
      {facial.formato && <><h2>{facial.origem === 'foto' ? 'Estimativa do formato facial' : 'Formato facial de referência'}</h2>
        <p>{facial.formato}</p>{facial.dica && <p>{facial.dica}</p>}</>}
      {facial.avisos.map(warning => <p key={warning}>{warning}</p>)}
    </section>}
    {cabelo && <>
      {!cabelo.cortes.length && <p role="status" className={guided.resultCard}>Nenhum corte correspondeu às respostas. Revise suas preferências.</p>}
      {cabelo.cortes.map(cut => <article className={guided.resultCard} key={cut.id}>
        <h2>{cut.nome}</h2>
        {cut !== leadCut && <p>{cut.motivo}</p>}
        <p>{cut.como_pedir}</p>
        {cut.observacoes.map((value, index) => <p key={index}>{value}</p>)}
        {!!cut.penteados.length && <div><h3>Penteados</h3><ul>{cut.penteados.map((value, index) => <li key={index}>{value}</li>)}</ul></div>}
        <button type="button" className="action-link action-link--outline" onClick={() => setSimulationStyle(cut.nome)}>Simular este corte</button>
      </article>)}
      <section className={guided.resultCard}>
        <h2>Coloração e cuidados</h2><p>{cabelo.coloracao}</p><p>{cabelo.dica_produtos}</p>
        <RecommendedProducts products={cabelo.produtos} />
      </section>
    </>}
    {maquiagem && <>
      <section className={guided.resultCard}>
        <h2>Aplicação e acabamento</h2><p>{maquiagem.pele_dica}</p>
        {maquiagem.sugestao_modelo && <p>Outra sugestão: {maquiagem.sugestao_modelo}.</p>}
        <button type="button" className="action-link action-link--outline" onClick={() => setSimulationStyle(maquiagem.recomendacao)}>Simular este acabamento</button>
      </section>
      <section className={guided.resultCard}>
        <h2>Produtos e tonalidade</h2><p>{maquiagem.dica_produtos}</p>
        <RecommendedProducts products={maquiagem.produtos} />
      </section>
    </>}
    {simulationStyle && <div className={guided.resultCard}>
      <h2 ref={simulation} tabIndex={-1}>Simulação na sua foto</h2>
      <PhotoSimulation key={simulationStyle} area={area} style={simulationStyle} />
    </div>}
    <div className={guided.reviewActions}>
      <Link className="action-link action-link--primary" to={`/consultoria/${area}/revisao`}>Rever minhas preferências</Link>
      <Link className="action-link action-link--outline" to="/consultoria">Explorar outra consultoria</Link>
    </div>
  </div>;
}
