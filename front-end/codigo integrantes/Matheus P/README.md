# Matheus P. — Integração HTTP no navegador

Responsável por `src/services/api/`, conforme [PLANO-DE-COMMITS.md](../../PLANO-DE-COMMITS.md). Este material contém **código de preparação**, fora da aplicação. Não há chamadas de API habilitadas nem sessão simulada.

Referências de interface: [login](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=27-98), [cadastro](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=35-379), [Minha conta](https://www.figma.com/design/MBJ63zN0jlITf2nwYWabqb/Espelho-Meu?node-id=150-1400). O Figma orienta as telas, **não define o contrato HTTP**.

Em 18/11/2026, `java/` ainda contém apenas um README. Falta confirmar com a equipe Java: URL/prefixo, métodos e caminhos, DTOs, campos obrigatórios, formato de erros, resposta do cadastro (JSON ou 204), mecanismo de sessão (cookie ou Bearer), consulta de perfil, expiração e CORS. Nenhum caminho como `/login` ou `/usuarios` foi presumido neste código.

## Arquivos completos para copiar

Os caminhos na coluna de destino são relativos a `front-end/`. Os arquivos em `codigo/` representam a **versão final de referência das cinco etapas**, não cinco commits já realizados. Copie por etapa e revise com Victor antes de registrar cada entrega.

| Código preparado | Destino |
| --- | --- |
| [`.env.example`](codigo/.env.example) | `.env.example` (mesclar se já existir) |
| [`config.ts`](codigo/src/services/api/config.ts) | `src/services/api/config.ts` |
| [`errors.ts`](codigo/src/services/api/errors.ts) | `src/services/api/errors.ts` |
| [`client.ts`](codigo/src/services/api/client.ts) | `src/services/api/client.ts` |
| [`auth.ts`](codigo/src/services/api/auth.ts) | `src/services/api/auth.ts` |
| [`profile.ts`](codigo/src/services/api/profile.ts) | `src/services/api/profile.ts` |

Use Fetch API nativa; não instalar Axios. `createApiClient` aceita um `fetcher` injetado para conferir casos controlados sem chamar um serviço real. Os adaptadores de autenticação/perfil recebem caminhos, conversores de entrada e validadores de resposta explicitamente. Eles não estão prontos para integração até o contrato ser confirmado.

## 1. URL por ambiente

Criar `.env.example` com:

```dotenv
# URL pública confirmada da API Java, incluindo o prefixo se houver.
# Não colocar senhas, tokens ou segredos em variáveis VITE_.
VITE_API_BASE_URL=
```

Copiar `config.ts`. Nesta primeira etapa, criar somente a base de `errors.ts` (a normalização completa entra na terceira):

```ts
export type ApiErrorKind = 'configuration' | 'http' | 'network' | 'invalid-response' | 'aborted';
export class ApiError extends Error {
  constructor(public readonly kind: ApiErrorKind, message: string, public readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}
```

Trecho real do configurador:

```ts
export function resolveApiUrl(base: URL, path: string): URL {
  if (!path.trim() || /^[a-z][a-z\d+.-]*:/i.test(path) || path.startsWith('//') || path.includes('\\')) {
    throw new ApiError('configuration', 'O endpoint deve ser um caminho relativo à API configurada.');
  }
  const url = new URL(path.replace(/^\/+/, ''), base);
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname) || url.hash) {
    throw new ApiError('configuration', 'O endpoint não pode sair do prefixo da API nem conter fragmento.');
  }
  return url;
}
```

A base preserva o prefixo: uma base terminada em `/api/` e o caminho `/perfil` resultam em `/api/perfil`. URLs absolutas de endpoint, credenciais na base e caminhos que escapem do prefixo são rejeitados. A configuração só é lida quando há requisição, mantendo a home utilizável sem API.

Commit sugerido: `feat: configura URL da API Java por ambiente`.

Conferir: URL ausente produz `ApiError` com `kind === 'configuration'`; HTTP/HTTPS válidos são aceitos; protocolo inválido e `../` que saia do prefixo são rejeitados. Reiniciar o Vite após alterar `.env.local`. Não colocar tokens em variáveis `VITE_`.

## 2. Cliente tipado com Fetch API

Para uma primeira versão, criar `src/services/api/client.ts` com este núcleo (substituído pelo arquivo completo na terceira etapa):

```ts
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
```

Esse núcleo trata GET e corpo vazio. A assinatura final adiciona opções, métodos e tratamento de erros na próxima etapa; não conectar os formulários nessa versão intermediária. O `decode` é necessário: `as Perfil` não verifica dados recebidos.

Commit sugerido: `feat: adiciona cliente HTTP tipado com Fetch API`.

Conferir: base com e sem barra final; GET com JSON válido; 204 e 200 vazio chegam ao validador como `undefined`; uma resposta sem perfil deve ser rejeitada pelo validador de perfil. Nunca executar `response.json()` cegamente em 204.

## 3. Normalizar falhas

Substituir `client.ts` e `errors.ts` pelas versões completas de `codigo/src/services/api/`. O cliente final adiciona POST/PUT/PATCH/DELETE, JSON, headers, `AbortSignal`, credenciais explícitas e validação de formato/resposta.

Trecho real da normalização:

```ts
if (!response.ok) throw httpError(response.status);
// Após ler o corpo e analisar o JSON:
try { return options.decode(data); }
catch { throw new ApiError('invalid-response', 'A resposta não corresponde ao contrato esperado.', response.status); }
```

| Situação | Resultado esperado |
| --- | --- |
| 400 / 401 / 500, inclusive com corpo HTML | `kind: 'http'`, mantendo o status original |
| Falha de Fetch / conexão interrompida | `kind: 'network'` |
| Cancelamento pelo `AbortSignal` | `kind: 'aborted'` |
| 200 com HTML, JSON quebrado ou esquema inesperado | `kind: 'invalid-response'` |
| 204 | `decode(undefined)`; o contrato decide se é válido |

O navegador não permite distinguir com segurança falha de conexão de bloqueio CORS pelo erro de Fetch. Conferir CORS no servidor e no painel Network; não apresentar um diagnóstico inventado. Mensagens internas do servidor não são despejadas na tela.

Commit sugerido: `feat: normaliza erros HTTP e respostas inválidas`.

Conferir com respostas controladas: os três status da tabela, JSON malformado, esquema errado, 204, rejeição do Fetch e abort. Validar que uma falha nunca retorna um objeto de sucesso. Verificar `Content-Type` JSON somente nas requisições com corpo JSON.

## 4. Adaptadores de login e cadastro

Copiar [`auth.ts`](codigo/src/services/api/auth.ts). Este é o contrato genérico real do código:

```ts
export interface PostContract<Input, Output> {
  path: string;
  encode: (input: Input) => unknown;
  decode: (data: unknown) => Output;
}
```

`createAuthService` retorna `login(input, signal)` e `signup(input, signal)`. Ambos fazem POST, mas os **caminhos e formatos ainda precisam ser confirmados**. Se a API documentar outro método, ajustar o adaptador antes de conectá-lo. `encode` deve montar apenas os campos combinados: não enviar confirmação de senha ou aceite indisponível por conveniência. `decode` deve validar os campos reais da resposta e lançar erro em formato inesperado. Um cadastro 204 pode usar um validador que aceite `undefined`; login não deve inventar token.

Em `src/pages/acesso/AccessPage.tsx`, Victor integra o serviço depois de `validateAccess`, controla carregamento, evita envio duplicado, usa `try/catch/finally` e limpa senhas. Trecho de apresentação compatível com a tela atual, a adicionar **depois** de instalar `errors.ts`:

```tsx
import { ApiError } from '../../services/api/errors';

function RequestFeedback({ error }: { error: unknown }) {
  if (!error || (error instanceof ApiError && error.kind === 'aborted')) return null;
  return <p className="notice" role="alert">
    {error instanceof ApiError ? error.message : 'Não foi possível concluir a solicitação.'}
  </p>;
}
```

`.notice` já existe em `src/styles/global.css` e usa `--line`, `--rose` e `--paper`. Não adicionar uma mensagem de “login realizado” enquanto contrato, sessão e resposta não estiverem integrados. O cadastro continua bloqueado para uso real até termos e privacidade estarem publicados.

Commit sugerido: `feat: cria serviço de login e cadastro no frontend`.

Conferir: comparar método, caminho, payload e resposta com o contrato Java; invalidar campos no navegador antes de fazer Fetch; erro de credenciais não cria sessão; cancelamento não exibe erro de servidor. **A integração real desta entrega depende do contrato e não está concluída pelo modelo genérico.**

## 5. Perfil autenticado

Copiar [`profile.ts`](codigo/src/services/api/profile.ts). O modelo recebe a sessão explicitamente:

```ts
export type SessionAccess =
  | { kind: 'absent' }
  | { kind: 'bearer'; token: string }
  | { kind: 'cookie' };
```

`getProfile` rejeita sessão ausente/token vazio sem chamar Fetch. Com Bearer, envia `Authorization`; com cookie, usa `credentials: 'include'`. A opção cookie representa o mecanismo contratado, não uma prova de autenticação: o servidor confirma a sessão e pode retornar 401. Não ler token de uma chave de `localStorage` inventada. Para cookie, alinhar CORS e proteção CSRF das operações de escrita com o backend.

Integração em `src/pages/conta/AccountPage.tsx`: depois de autenticar, consultar o perfil usando seu caminho/validador confirmados. Tratar carregamento, erro e ausência de sessão. Em 401, invalidar a sessão no estado compartilhado e retornar ao acesso; em 500 ou falha de rede, apresentar erro sem fingir logout/sucesso. Usar `AbortController` e cancelar a consulta ao desmontar a tela. Não colocar a foto/nome do protótipo como usuário real.

Commit sugerido: `feat: cria serviço de consulta do perfil no frontend`.

Conferir: sessão ausente faz zero requisições; Bearer só vai para a base configurada; perfil exige esquema válido; 401 limpa estado autenticado; 500/rede têm mensagens diferentes de sessão expirada. Consultoria e upload do Matheus L. somente são liberados pelo estado autenticado real.

## Antes de entregar

Após copiar as etapas aplicáveis: `npm run typecheck`, `npm test` e `npm run build`. O build atual não compila automaticamente esta pasta de exemplos: os arquivos só entram no projeto quando copiados para os destinos. Os testes atuais de `tests/` também não testam estes modelos automaticamente. Acrescentar testes de Fetch controlado na integração.

Preservar os outros integrantes e o histórico: não copiar todos os exemplos e registrar cinco commits artificiais. As mensagens são sugestões para cada entrega implementada e conferida pelo próprio autor, após revisão. Nenhum commit ou push foi executado nesta preparação.
