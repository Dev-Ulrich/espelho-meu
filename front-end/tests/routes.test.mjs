import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
const require = createRequire(new URL('../package.json', import.meta.url));
const { createServer } = await import(pathToFileURL(require.resolve('vite')));
test('rotas públicas, filtros e destinos renderizam sem sessão simulada', async () => {
const server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
try {
  const { App } = await server.ssrLoadModule('/src/app/App.tsx');
  const React = require('react');
  const { renderToString } = require('react-dom/server');
  const { MemoryRouter } = require('react-router');
  const known = new Set(['/', '/cabelo', '/maquiagem', '/catalogo', '/entrar', '/cadastro', '/recuperar-senha', '/minha-conta', '/consultoria', '/ajuda']);
  const pages = [
    ['/', 'Seu estilo,'], ['/cabelo', 'Crespo com forma'], ['/cabelo?categoria=coloracoes', 'referências de colorações ainda estão em preparação'],
    ['/cabelo?textura=Lisa', 'Bob reto'], ['/cabelo?textura=Lisa&comprimento=Curto', 'Nenhuma referência'],
    ['/maquiagem?categoria=Olhos', 'Olhar marcante'], ['/catalogo', 'Explorar cortes'], ['/entrar', 'Login em preparação'],
    ['/cadastro', 'Confirmar senha'], ['/recuperar-senha', 'Nenhum'], ['/minha-conta?secao=favoritas', 'referências favoritas'],
    ['/consultoria?jornada=maquiagem', 'Entrar para continuar'], ['/ajuda', 'Central de ajuda'], ['/inexistente', 'Página não encontrada'],
  ];
  for (const [url, expected] of pages) {
    const html = renderToString(React.createElement(MemoryRouter, { initialEntries: [url] }, React.createElement(App)));
    if (url === '/recuperar-senha') assert.ok(html.includes('Recuperação de senha'));
    else if (url === '/entrar') assert.ok(html.includes('Login') && html.includes('em preparação'));
    else assert.ok(html.includes(expected), url + ' sem conteúdo esperado');
    assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1, url + ' deve ter um h1');
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
      if (!href.startsWith('/') || href.startsWith('/src/') || href.startsWith('//')) continue;
      assert.ok(known.has(href.split(/[?#]/)[0]), url + ' com destino desconhecido: ' + href);
    }
    if (url === '/cabelo?textura=Lisa') assert.ok(!html.includes('aria-label="Ver detalhes de Crespo'));
    if (url === '/maquiagem?categoria=Olhos') assert.ok(!html.includes('aria-label="Ver detalhes de Glow'));
    if (url === '/consultoria?jornada=maquiagem') assert.ok(html.includes('/entrar?jornada=maquiagem'));

  }
} finally { await server.close(); }
});
