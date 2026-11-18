import { ApiError } from "./errors";

export function getApiBaseUrl(raw: string | undefined = import.meta.env.VITE_API_BASE_URL): URL {
  if (!raw?.trim()) {
    throw new ApiError('configuration', 'Integração indisponível: configure VITE_API_BASE_URL com a URL confirmada da API Java.');
  }
  let url: URL;
  try { url = new URL(raw.trim()); }
  catch { throw new ApiError('configuration', 'VITE_API_BASE_URL deve ser uma URL absoluta HTTP ou HTTPS.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new ApiError('configuration', 'A URL da API deve usar HTTP/HTTPS e não conter credenciais, consulta ou fragmento.');
  }
  url.pathname = url.pathname.replace(/\/+$/, '') + '/';
  return url;
}

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