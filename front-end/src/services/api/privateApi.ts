export class PrivateApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

type Options = { method?: string; body?: FormData | Record<string, unknown>; signal?: AbortSignal };

export async function privateApi<T>(path: string, options: Options = {}): Promise<T> {
  const { method = 'GET', body, signal } = options;
  const headers = new Headers({ Accept: 'application/json' });
  if (method !== 'GET') {
    const response = await fetch('/api/java/auth/csrf', { credentials: 'same-origin', cache: 'no-store', signal });
    if (!response.ok) throw new PrivateApiError(response.status, 'Não foi possível validar a solicitação.');
    const { header, token } = await response.json();
    headers.set(header, token);
  }
  if (body && !(body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const response = await fetch('/api/java' + path, {
    method, headers, signal, credentials: 'same-origin', cache: 'no-store',
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const data = response.status === 204 ? undefined : await response.json().catch(() => undefined);
  if (!response.ok) {
    const detail = data?.detalhe ?? data?.erro ?? data?.mensagem ?? data?.message ?? data?.detalhes;
    throw new PrivateApiError(response.status, typeof detail === 'string' ? detail :
      response.status === 401 ? 'Entre na sua conta ou confira suas credenciais.' :
      response.status === 403 ? 'Você não tem permissão para esta ação.' :
      'Não foi possível concluir a solicitação.');
  }
  if (response.status !== 204 && data === undefined) {
    throw new PrivateApiError(response.status, 'O servidor retornou uma resposta inesperada.');
  }
  return data as T;
}
