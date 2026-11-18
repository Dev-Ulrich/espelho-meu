import { getApiBaseUrl, resolveApiUrl } from './config';
import { ApiError } from './errors';

export function createApiClient(baseUrl?: string, fetcher: typeof fetch = fetch) {
  return {
    async request<T>(path: string, decode: (data: unknown) => T): Promise<T> {
      const response = await fetcher(resolveApiUrl(getApiBaseUrl(baseUrl), path), {
        headers: { Accept: 'application/json' }, credentials: 'omit', redirect: 'error',
      });
      if (!response.ok) throw new ApiError('http', 'Não foi possível concluir a solicitação.', response.status);
      const text = response.status === 204 ? '' : await response.text();
      const data: unknown = text.trim() ? JSON.parse(text) : undefined;
      return decode(data);
    },
  };
}