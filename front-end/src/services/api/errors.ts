export type ApiErrorKind = 'configuration' | 'http' | 'network' | 'invalid-response' | 'aborted';
export class ApiError extends Error {
  constructor(public readonly kind: ApiErrorKind, message: string, public readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}