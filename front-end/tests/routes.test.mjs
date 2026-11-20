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
    for (const path of ['/consultoria', '/consultoria/cabelo/resultado', '/consultoria/maquiagem/perfil', '/minha-conta', '/admin', '/admin/usuarios', '/admin/produtos', '/admin/penteados', '/admin/cores', '/admin/maquiagem', '/admin/imagens']) {
      assert.match(render(path), /Verificando sua sessão/);
      assert.doesNotMatch(render(path), /Gerar recomendações|Novo registro|Painel administrativo/);
    }
    const { AiHairCatalog } = await server.ssrLoadModule('/src/pages/admin/AiHairCatalog.tsx');
    const { aiHairCatalog } = await server.ssrLoadModule('/src/pages/admin/hairCatalog.ts');
    const catalog = render('/admin/cortes', React.createElement(AiHairCatalog)).replaceAll('<!-- -->', '');
    assert.ok(aiHairCatalog.length > 100);
    assert.equal(new Set(aiHairCatalog.map(cut => cut.id)).size, aiHairCatalog.length);
    assert.match(catalog, /<table.*>ID<\/th>.*>Foto<\/th>.*>Nome<\/th>/s);
    assert.ok(catalog.includes(`${aiHairCatalog.length} de ${aiHairCatalog.length} cortes`));
    assert.match(catalog, /referencias-cortes\/buzz\.webp/);
    assert.ok(aiHairCatalog.find(cut => cut.id === 'crew')?.instructions.includes(','));
    assert.doesNotMatch(render('/admin'), /Navegação principal|Já tenho conta/);
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
    const hairResult = {
      consulta_id: 'saved-hair-result',
      facial: { avisos: [] },
      cabelo: {
        cortes: [{ id: 'buzz', nome: 'Buzz Cut', motivo: 'Prático', como_pedir: 'Na máquina', observacoes: [], penteados: ['Acobreado'] }],
        coloracao: 'Escolha uma cor',
        opcoes_cor: [
          { id: 'cor-1', nome: 'Acobreado', tecnica: 'Coloração global' },
          { id: 'cor-2', nome: 'Buzz Cut', tecnica: 'Coloração global' },
          { id: 'cor-antiga', nome: 'Loiro', tecnica: 'Luzes' },
        ],
        dica_produtos: '',
        produtos: {},
      },
    };
    const hair = render('/consultoria/cabelo/resultado', React.createElement(GuidedResults, {
      area: 'cabelo', result: hairResult,
    })).replaceAll('<!-- -->', '');
    assert.match(hair, /href="#opcoes-coloracao"/);
    assert.match(hair, /Simular Acobreado/);
    assert.doesNotMatch(hair, /Simular Buzz Cut|Simular Loiro/);
    assert.match(hair, /referencias-cortes\/buzz\.webp/);
    const unsavedHair = render('/consultoria/cabelo/resultado', React.createElement(GuidedResults, {
      area: 'cabelo', result: { ...hairResult, consulta_id: undefined },
    }));
    assert.doesNotMatch(unsavedHair, /opcoes-coloracao|Simular Acobreado/);
  } finally {
    await server.close();
  }
});
