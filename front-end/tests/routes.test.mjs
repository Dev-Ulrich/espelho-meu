import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const require = createRequire(new URL('../package.json', import.meta.url));
const { createServer } = await import(pathToFileURL(require.resolve('vite')));

test('home, galerias e páginas institucionais são públicas; consultorias e administração exigem sessão', async () => {
  const server = await createServer({
    root: fileURLToPath(new URL('..', import.meta.url)),
    server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom',
  });
  try {
    const { App } = await server.ssrLoadModule('/src/app/App.tsx');
    const React = require('react');
    const { renderToString } = require('react-dom/server');
    const { MemoryRouter } = require('react-router');
    const render = (url, element = React.createElement(App)) => renderToString(React.createElement(MemoryRouter,
      { initialEntries: [url] }, element));

    const home = render('/');
    assert.match(home, /Seu estilo,/);
    assert.match(home, /id="como-funciona"/);
    assert.match(home, /href="\/cadastro"[^>]*>Criar conta/);
    assert.match(home, /href="\/entrar"[^>]*>Já tenho conta/);
    assert.doesNotMatch(home, /href="\/(consultoria|catalogo|admin)"/);
    for (const [path, title] of [['/sobre', 'Sobre o Espelho Meu'], ['/integrantes', 'Integrantes'], ['/integrantes/victor', 'Victor Ulrich'], ['/faq', 'Perguntas frequentes'], ['/contato', 'Contato']]) {
      const page = render(path);
      assert.ok(page.includes(title), `${path} deve apresentar seu conteúdo público`);
      assert.doesNotMatch(page, /Verificando sua sessão/);
    }
    for (const [path, example] of [['/cabelo', 'Bob reto'], ['/maquiagem', 'Pele luminosa']]) {
      const page = render(path);
      assert.ok(page.includes(example));
      assert.match(page, /href="\/entrar"[^>]*>Veja como fica em você/);
      assert.doesNotMatch(page, /type="file"|Verificando sua sessão/);
    }
    for (const path of ['/sobre', '/integrantes', '/faq', '/contato']) {
      assert.ok(home.includes(`href="${path}"`));
    }
    assert.match(render('/entrar'), /Bom ter você por aqui/);
    const registration = render('/cadastro');
    assert.match(registration, /Faça parte do Espelho Meu/);
    assert.match(registration, /<input(?=[^>]*name="nascimento")(?=[^>]*type="date")/);
    for (const path of ['/consultoria', '/consultoria/cabelo/resultado', '/consultoria/maquiagem/perfil', '/minha-conta', '/admin/usuarios', '/admin/produtos', '/admin/penteados', '/admin/cores', '/admin/maquiagem', '/admin/imagens']) {
      assert.match(render(path), /Verificando sua sessão/);
      assert.doesNotMatch(render(path), /Gerar recomendações|Novo registro|Painel administrativo/);
    }
    for (const path of ['/catalogo', '/recuperar-senha']) {
      assert.match(render(path), /^<div class="toast-region"[^>]+><\/div>$/);
    }

    const { GuidedResults } = await server.ssrLoadModule('/src/pages/consultoria/GuidedResults.tsx');
    const makeup = render('/consultoria/maquiagem/resultado', React.createElement(GuidedResults, {
      area: 'maquiagem', result: { facial: { avisos: [] }, maquiagem: {
        recomendacao: 'maquiagem luminosa', aplicacao: 'Aplique em camadas finas', pele_dica: '',
        dica_produtos: 'Compare na mandíbula', produtos: { Base: [{ nome: 'Base fluida', preco: 'R$ 42,00',
          ajustes: [], atributos: ['Líquida', 'Cobertura média'], url: 'https://example.com/base' }] },
      } },
    }));
    assert.match(makeup, /maquiagem luminosa.*Base fluida.*R\$ 42,00.*Cobertura média/s);
    assert.match(makeup.replaceAll('<!-- -->', ''), /Comparar \(0\/1\)/);
    assert.doesNotMatch(makeup, /Simular este acabamento/);
    assert.match(makeup, /href="\/consultoria\/maquiagem\/revisao"/);
  } finally {
    await server.close();
  }
});
