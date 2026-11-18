import type { ApiClient } from './client';
import { ApiError } from './errors';

export type SessionAccess =
  | { kind: 'absent' }
  | { kind: 'bearer'; token: string }
  | { kind: 'cookie' };

export function createProfileService<Profile>(
  client: ApiClient,
  contract: { path: string; decode: (data: unknown) => Profile },
) {
  return {
    getProfile(session: SessionAccess, signal?: AbortSignal): Promise<Profile> {
      if (session.kind === 'absent' || (session.kind === 'bearer' && !session.token.trim())) {
        return Promise.reject(new ApiError('http', 'Entre na sua conta para consultar o perfil.', 401));
      }
      return client.request(contract.path, {
        method: 'GET', decode: contract.decode, signal,
        credentials: session.kind === 'cookie' ? 'include' : 'omit',
        headers: session.kind === 'bearer' ? { Authorization: `Bearer ${session.token}` } : undefined,
      });
    },
  };
}
