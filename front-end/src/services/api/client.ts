import { getApiBaseUrl, resolveApiUrl } from './config';
import { ApiError, httpError } from './errors';

export interface RequestOptions<T> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  json?: unknown;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
  expectedStatus?: number;
  // Valida dados recebidos: TypeScript sozinho não valida o JSON da rede.
  // Respostas vazias (incluindo 204) chegam como undefined.
  decode: (data: unknown) => T;
}

export function createApiClient(baseUrl?: string, fetcher: typeof fetch = fetch) {
  return {
    async request<T>(path: string, options: RequestOptions<T>): Promise<T> {
      const url = resolveApiUrl(getApiBaseUrl(baseUrl), path);
      const headers = new Headers(options.headers);
      headers.set('Accept', 'application/json');
      if (options.json !== undefined) headers.set('Content-Type', 'application/json');
      const method = options.method ?? 'GET';
      if (method === 'GET' && options.json !== undefined) {
        throw new ApiError('configuration', 'Requisições GET não devem enviar corpo JSON.');
      }
      let body: string | undefined;
      try { body = options.json === undefined ? undefined : JSON.stringify(options.json); }
      catch { throw new ApiError('configuration', 'Não foi possível preparar o corpo JSON da requisição.'); }
      let response: Response;
      try {
        response = await fetcher(url, {
          method, headers, body, signal: options.signal,
          credentials: options.credentials ?? 'omit', redirect: 'error',
        });
      } catch {
        if (options.signal?.aborted) throw new ApiError('aborted', 'Solicitação cancelada.');
        throw new ApiError('network', 'Não foi possível acessar o serviço. Confira a conexão e tente novamente.');
      }
      // Preserva o status HTTP mesmo quando o servidor retorna HTML ou texto de erro.
      if (!response.ok) throw httpError(response.status);
      if (options.expectedStatus !== undefined && response.status !== options.expectedStatus) {
        throw new ApiError('invalid-response', `Status inesperado: HTTP ${response.status}; esperado ${options.expectedStatus}.`, response.status);
      }
      let text: string;
      try { text = response.status === 204 ? '' : await response.text(); }
      catch {
        if (options.signal?.aborted) throw new ApiError('aborted', 'Solicitação cancelada.');
        throw new ApiError('network', 'A conexão foi interrompida durante a resposta.');
      }
      let data: unknown = undefined;
      if (text.trim()) {
        const mime = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
        if (mime !== 'application/json' && !mime?.endsWith('+json')) {
          throw new ApiError('invalid-response', 'O serviço retornou um formato inesperado.', response.status);
        }
        try { data = JSON.parse(text); }
        catch { throw new ApiError('invalid-response', 'O serviço retornou JSON inválido.', response.status); }
      }
      try { return options.decode(data); }
      catch { throw new ApiError('invalid-response', 'A resposta não corresponde ao contrato esperado.', response.status); }
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
