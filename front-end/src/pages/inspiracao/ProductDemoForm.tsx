import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiError } from '../../services/api/errors';
import { productCategories, type ProductDemo, type ProductDraft } from '../../services/api/productDemo';
import type { Product } from '../../services/api/products';

export function ProductDemoForm({ demo, onCreated }: { demo: ProductDemo; onCreated: (product: Product) => void }) {
  const request = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<Product | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (request.current || created) return;
    setError('');
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const draft = Object.fromEntries(new FormData(form)) as ProductDraft;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    try {
      const product = await demo.create(draft, controller.signal);
      if (!controller.signal.aborted) {
        setCreated(product);
        onCreated(product);
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        const message = cause instanceof ApiError
          ? cause.kind === 'network'
            ? 'Não foi possível confirmar o cadastro. Confira a conexão e a lista antes de reenviar; o produto pode ter sido salvo.'
            : cause.status === 400 || cause.status === 422
              ? 'A API rejeitou os dados. Confira os campos e tente novamente.'
              : 'Não foi possível confirmar o cadastro. Confira a lista antes de reenviar e verifique a API de teste.'
          : cause instanceof Error ? cause.message : 'Confira os dados e tente novamente.';
        setError(message);
      }
    } finally {
      if (!controller.signal.aborted) { request.current = null; setLoading(false); }
    }
  }

  return <details className="notice product-demo">
    <summary>Cadastrar produto de teste</summary>
    <p>Ambiente de demonstração. Use somente dados fictícios.</p>
    <form onSubmit={submit} noValidate aria-busy={loading}>
      <fieldset disabled={loading || !!created}>
        <legend>Cadastro de produto capilar</legend>
        <label>Categoria<select name="categoria" required defaultValue="Shampoo">
          {productCategories.map(value => <option key={value}>{value}</option>)}
        </select></label>
        <label>Nome<input name="nome" required maxLength={20} defaultValue="Shampoo Demo" /></label>
        <label>Marca<input name="marca" required maxLength={30} defaultValue="Marca Teste" /></label>
        <label>Categoria principal<input name="categoriaPrincipal" required maxLength={30} defaultValue="Hidratação" /></label>
        <label>Preço de referência (R$)<input name="precoReferencia" type="number" required min="0" max="99999999.99" step="0.01" defaultValue="29.90" /></label>
        <label>Avaliação<input name="avaliacao" type="number" required min="-9.99" max="9.99" step="0.01" defaultValue="4.5" /></label>
        <label>Cor (opcional)<input name="cor" maxLength={30} /></label>
        <label>Data e hora (opcional)<input name="data" type="datetime-local" /></label>
      </fieldset>
      <button className="action-link action-link--primary" type="submit" disabled={loading || !!created}>
        {loading ? 'Cadastrando…' : created ? 'Produto cadastrado' : 'Cadastrar produto de teste'}
      </button>
      {error && <p role="alert" className="notice">{error}</p>}
      {created && <p role="status" className="notice">HTTP 201: {created.nome} cadastrado com ID {created.id}. A listagem será consultada novamente.</p>}
    </form>
  </details>;
}
