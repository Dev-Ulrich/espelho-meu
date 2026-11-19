import { createApiClient, type ApiClient } from './client';

// Campos utilizados da lista JSON retornada por GET /produto.
export interface Product {
  id: number;
  nome: string;
  marca: string;
  precoReferencia: number;
}

export function decodeProducts(data: unknown): Product[] {
  if (!Array.isArray(data)) throw new Error('Lista de produtos inválida.');
  return data.map(item => {
    if (!item || typeof item !== 'object'
      || !Number.isSafeInteger(item.id)
      || typeof item.nome !== 'string' || !item.nome.trim()
      || typeof item.marca !== 'string' || !item.marca.trim()
      || typeof item.precoReferencia !== 'number' || !Number.isFinite(item.precoReferencia) || item.precoReferencia < 0) {
      throw new Error('Produto inválido.');
    }
    return { id: item.id, nome: item.nome, marca: item.marca, precoReferencia: item.precoReferencia };
  });
}

export function listProducts(signal?: AbortSignal, client: ApiClient = createApiClient()): Promise<Product[]> {
  return client.request('/produto', { method: 'GET', decode: decodeProducts, signal });
}
