import { createApiClient } from './client';
import { getApiBaseUrl } from './config';
import { decodeProducts } from './products';

export const productCategories = ['Shampoo', 'Condicionador', 'Máscara Capilar', 'Finalizador', 'Modelador', 'Tintura'] as const;
export type ProductDraft = Record<'categoria' | 'nome' | 'marca' | 'categoriaPrincipal' | 'precoReferencia' | 'avaliacao' | 'cor' | 'data', string>;

// Espelha CadastroProduto.java; ID e faixaPreco nunca são enviados.
export function parseProductDraft(draft: ProductDraft) {
  const categoria = draft.categoria;
  if (!productCategories.some(value => value === categoria)) throw new Error('Selecione uma categoria válida.');
  for (const [key, label, max] of [['nome', 'Nome', 20], ['marca', 'Marca', 30], ['categoriaPrincipal', 'Categoria principal', 30]] as const) {
    if (!draft[key].trim() || draft[key].trim().length > max) throw new Error(`${label} é obrigatório e deve ter até ${max} caracteres.`);
  }
  const price = draft.precoReferencia.trim().replace(',', '.');
  const rating = draft.avaliacao.trim().replace(',', '.');
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(price)) throw new Error('Informe um preço de 0 a 99.999.999,99, com até duas casas decimais.');
  if (!/^-?\d(\.\d{1,2})?$/.test(rating)) throw new Error('Informe uma avaliação com até um dígito inteiro e duas casas decimais.');
  if (draft.cor.trim().length > 30) throw new Error('Cor deve ter até 30 caracteres.');
  if (draft.data && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(draft.data) || !Number.isFinite(Date.parse(draft.data)))) {
    throw new Error('Informe uma data e hora válidas.');
  }
  return {
    categoria, nome: draft.nome.trim(), marca: draft.marca.trim(), categoriaPrincipal: draft.categoriaPrincipal.trim(),
    precoReferencia: Number(price), avaliacao: Number(rating),
    ...(draft.cor.trim() ? { cor: draft.cor.trim() } : {}),
    ...(draft.data ? { data: draft.data.length === 16 ? `${draft.data}:00` : draft.data } : {}),
  };
}

export function createProductDemo(
  dev: boolean = import.meta.env.DEV,
  raw: string | undefined = import.meta.env.VITE_PRODUCT_DEMO_API_URL,
  fetcher: typeof fetch = fetch,
) {
  if (!dev || !raw?.trim()) return null;
  const url = getApiBaseUrl(raw);
  const client = createApiClient(url.href, fetcher);
  return {
    list(signal?: AbortSignal) {
      return client.request('/produto', { method: 'GET', expectedStatus: 200, decode: decodeProducts, signal });
    },
    create(draft: ProductDraft, signal?: AbortSignal) {
      return client.request('/produto', {
        method: 'POST', expectedStatus: 201, json: parseProductDraft(draft), signal,
        decode: data => {
          const product = decodeProducts([data])[0];
          if (product.id <= 0) throw new Error('ID de produto inválido.');
          return product;
        },
      });
    },
  };
}

export type ProductDemo = NonNullable<ReturnType<typeof createProductDemo>>;
