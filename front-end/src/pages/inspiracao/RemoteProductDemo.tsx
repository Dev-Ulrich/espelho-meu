import { useEffect, useState } from 'react';
import { fetchConsultation } from '../../services/api/consultation';
import { parseProductDraft, type ProductDraft } from '../../services/api/productDemo';
import { decodeProducts } from '../../services/api/products';
import { ProductDemoForm } from './ProductDemoForm';

export function RemoteProductDemo({ onCreated }: { onCreated: () => void }) {
  const [available, setAvailable] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetchConsultation('/api/produtos-demo/status', { signal: controller.signal })
      .then(async response => {
        if (response.ok && (await response.json()).disponivel === true && !controller.signal.aborted) {
          setAvailable(true);
        }
      })
      .catch(() => { /* O catálogo permanece disponível se a demonstração estiver desligada. */ });
    return () => controller.abort();
  }, []);

  async function create(draft: ProductDraft, signal?: AbortSignal, code?: string) {
    setConfirmation('');
    if (!code) throw new Error('Informe o código de demonstração.');
    const response = await fetchConsultation('/api/produtos-demo/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Produto-Demo-Codigo': code },
      body: JSON.stringify(parseProductDraft(draft)),
      signal,
    });
    const result = await response.json().catch(() => null);
    if (response.status !== 201) throw new Error(result?.erro || 'Não foi possível confirmar o cadastro. Confira a lista antes de reenviar.');
    const [product] = decodeProducts([result?.produto]);
    if (!signal?.aborted) {
      setConfirmation(result.confirmado === true
        ? `Persistência confirmada: produto ID ${product.id} retornado pelo GET da API Java (HTTP 200).`
        : `O Java criou o produto ID ${product.id}, mas a consulta imediata não confirmou a leitura.`);
    }
    return product;
  }

  if (!available) return null;
  return <>
    <ProductDemoForm demo={{ create }} onCreated={onCreated} remote />
    {confirmation && <p className="notice" role="status">{confirmation}</p>}
  </>;
}
