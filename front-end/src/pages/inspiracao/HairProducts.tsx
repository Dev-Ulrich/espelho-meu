import { useEffect, useState } from 'react';
import { listProducts, type Product } from '../../services/api/products';

const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
type State = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; products: Product[] };

export function HairProducts() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    listProducts(controller.signal).then(products => {
      if (!controller.signal.aborted) setState({ status: 'ready', products });
    }).catch(() => {
      if (!controller.signal.aborted) setState({ status: 'error', message: 'Não foi possível carregar os produtos. Confira sua conexão e tente novamente.' });
    });
    return () => controller.abort();
  }, [attempt]);

  return <section aria-labelledby="hair-products-title" aria-busy={state.status === 'loading'}>
    <h2 id="hair-products-title">Produtos capilares</h2>
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
