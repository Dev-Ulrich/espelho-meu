import type { ApiClient } from './client';

export interface PostContract<Input, Output> {
  path: string;
  encode: (input: Input) => unknown;
  decode: (data: unknown) => Output;
}

// Os caminhos, DTOs e validadores vêm do contrato Java, não deste modelo.
export function createAuthService<LoginInput, SignupInput, LoginResult, SignupResult>(
  client: ApiClient,
  contract: {
    login: PostContract<LoginInput, LoginResult>;
    signup: PostContract<SignupInput, SignupResult>;
    credentials: RequestCredentials;
  },
) {
  return {
    login(input: LoginInput, signal?: AbortSignal): Promise<LoginResult> {
      return client.request(contract.login.path, {
        method: 'POST', json: contract.login.encode(input), decode: contract.login.decode,
        credentials: contract.credentials, signal,
      });
    },
    signup(input: SignupInput, signal?: AbortSignal): Promise<SignupResult> {
      return client.request(contract.signup.path, {
        method: 'POST', json: contract.signup.encode(input), decode: contract.signup.decode,
        credentials: contract.credentials, signal,
      });
    },
  };
}
