import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const require = createRequire(new URL('../package.json', import.meta.url));
const { createServer } = await import(pathToFileURL(require.resolve('vite')));

test('apenas a home e os formulários de acesso renderizam conteúdo público', async () => {
  const server = await createServer({
    root: fileURLToPath(new URL('..', import.meta.url)),
    server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom',
  });
  try {
    const { App } = await server.ssrLoadModule('/src/app/App.tsx');
    const React = require('react');
    const { renderToString } = require('react-dom/server');
    const { MemoryRouter } = require('react-router');
    const render = url => renderToString(React.createElement(MemoryRouter,
      { initialEntries: [url] }, React.createElement(App)));

    const home = render('/');
    assert.match(home, /Seu estilo,/);
    assert.doesNotMatch(home, /href="\/(maquiagem|catalogo|admin|integrantes)"/);
    assert.match(render('/entrar'), /Acesse sua conta/);
    assert.match(render('/cadastro'), /Data de nascimento/);
    for (const path of ['/consultoria', '/consultoria/cabelo/resultado', '/consultoria/maquiagem/perfil', '/sobre', '/integrantes/victor', '/faq', '/contato', '/minha-conta', '/admin/produtos']) {
      assert.match(render(path), /Verificando sua sessão/);
      assert.doesNotMatch(render(path), /Gerar recomendações|Novo registro|Painel administrativo/);
    }
    for (const path of ['/catalogo', '/recuperar-senha']) {
      assert.equal(render(path), '');
    }
  } finally {
    await server.close();
  }
});
