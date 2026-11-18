export type ApiErrorKind = 'configuration' | 'http' | 'network' | 'invalid-response' | 'aborted';

export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function httpError(status: number): ApiError {
  const messages: Record<number, string> = {
    400: 'Confira os dados informados.',
    401: 'Entre na sua conta para continuar. Sua sessão pode ter expirado.',
    403: 'Sua conta não tem permissão para esta ação.',
    404: 'O recurso solicitado não foi encontrado.',
    409: 'Os dados entram em conflito com um registro existente.',
    422: 'Alguns dados não foram aceitos. Confira os campos.',
    429: 'Muitas tentativas. Aguarde antes de tentar novamente.',
  };
  return new ApiError('http', status >= 500
    ? 'O serviço está indisponível no momento. Tente novamente mais tarde.'
    : messages[status] ?? 'Não foi possível concluir a solicitação.', status);
}
