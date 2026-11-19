import { useEffect, useState } from 'react';
import { listProducts, type Product } from '../../services/api/products';
import { createProductDemo } from '../../services/api/productDemo';
import { ProductDemoForm } from './ProductDemoForm';

const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
type State = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; products: Product[] };

export function HairProducts() {
  const [configuration] = useState(() => {
    try { return { demo: createProductDemo(), error: '' }; }
    catch (cause) { return { demo: null, error: cause instanceof Error ? cause.message : 'Configuração de teste inválida.' }; }
  });
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    const load = configuration.demo ? configuration.demo.list(controller.signal) : listProducts(controller.signal);
    load.then(products => {
      if (!controller.signal.aborted) setState({ status: 'ready', products });
    }).catch(() => {
      if (!controller.signal.aborted) setState({ status: 'error', message: 'Não foi possível carregar os produtos. Confira sua conexão e tente novamente.' });
    });
    return () => controller.abort();
  }, [attempt, configuration]);

  return <section aria-labelledby="hair-products-title" aria-busy={state.status === 'loading'}>
    <h2 id="hair-products-title">Produtos capilares</h2>
    {import.meta.env.DEV && (configuration.demo
      ? <>
        <p className="notice">Modo de demonstração: cadastro e listagem usam a API de teste configurada.</p>
        <ProductDemoForm demo={configuration.demo} onCreated={product => {
          setCreatedId(product.id);
          setState({ status: 'loading' });
          setAttempt(value => value + 1);
        }} />
      </>
      : <p className="notice">{configuration.error || 'Cadastro de teste desabilitado. Configure VITE_PRODUCT_DEMO_API_URL com a API de desenvolvimento autorizada para habilitar.'}</p>)}
    {createdId !== null && state.status === 'ready' && <p className="notice" role="status">
      {state.products.some(product => product.id === createdId)
        ? `Persistência confirmada: produto ID ${createdId} encontrado no novo GET da API de teste (HTTP 200).`
        : `O GET não retornou o produto ID ${createdId}. Confira a API de teste antes de cadastrar novamente.`}
    </p>}
    {state.status === 'loading' && <p className="notice" role="status">Carregando produtos capilares…</p>}
    {state.status === 'error' && <div className="notice">
      <p role="alert">{state.message}</p>
      <button type="button" className="action-link action-link--outline" onClick={() => {
        setState({ status: 'loading' });
        setAttempt(value => value + 1);
      }}>Tentar novamente</button>
    </div>}
    {state.status === 'ready' && (state.products.length === 0
      ? <p className="notice" role="status">Nenhum produto capilar disponível no momento.</p>
      : <div className="inspiration-grid">
        {state.products.map(product => <article key={product.id} className="inspiration-card">
          <div className="inspiration-card__body">
            <h3>{product.nome}</h3>
            <p>Marca: {product.marca}</p>
            <p>Preço de referência: <strong>{reais.format(product.precoReferencia)}</strong></p>
          </div>
        </article>)}
      </div>)}
  </section>;
}
