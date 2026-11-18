import { ApiError } from "./errors";

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