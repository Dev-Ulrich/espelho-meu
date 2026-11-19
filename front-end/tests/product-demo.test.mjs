import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

test('cadastro de demonstração: isolamento, DTO e persistência', async (t) => {
  const server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { createProductDemo, parseProductDraft } = await server.ssrLoadModule('/src/services/api/productDemo.ts');
    const draft = { categoria: 'Shampoo', nome: 'Shampoo Demo', marca: 'Marca Teste', categoriaPrincipal: 'Hidratação', precoReferencia: '29.90', avaliacao: '4.5', cor: '', data: '' };
    await t.test('produção e URL vazia desabilitam cadastro; URL inválida é rejeitada', () => {
      assert.equal(createProductDemo(false, 'http://localhost:8080/'), null);
      assert.equal(createProductDemo(true, ''), null);
      assert.throws(() => createProductDemo(true, 'javascript:alert(1)'));
      assert.throws(() => createProductDemo(true, 'https://user:password@example.test/'));
    });
    await t.test('valida limites do DTO, sem inventar campos calculados', () => {
      assert.deepEqual(parseProductDraft(draft), { categoria: 'Shampoo', nome: 'Shampoo Demo', marca: 'Marca Teste', categoriaPrincipal: 'Hidratação', precoReferencia: 29.9, avaliacao: 4.5 });
      for (const override of [{ categoria: 'Outro' }, { nome: ' ' }, { nome: 'x'.repeat(21) }, { marca: 'x'.repeat(31) }, { categoriaPrincipal: '' }, { precoReferencia: '-1' }, { precoReferencia: '100000000' }, { precoReferencia: '1.001' }, { precoReferencia: '' }, { avaliacao: '' }, { avaliacao: '10' }, { avaliacao: '4.555' }, { cor: 'x'.repeat(31) }, { data: 'inválida' }]) {
        assert.throws(() => parseProductDraft({ ...draft, ...override }));
      }
      assert.equal(parseProductDraft({ ...draft, precoReferencia: '0', avaliacao: '-9.99' }).precoReferencia, 0);
      assert.equal(parseProductDraft({ ...draft, data: '2026-11-18T12:30' }).data, '2026-11-18T12:30:00');
    });
    await t.test('POST 201 usa ID do servidor; novo GET e reload usam a mesma base de teste', async () => {
      const calls = [];
      const saved = { id: 321, nome: draft.nome, marca: draft.marca, precoReferencia: 29.9, faixaPreco: 'Custo-beneficio' };
      const signal = new AbortController().signal;
      const fetcher = async (url, options) => {
        calls.push([String(url), options.method]);
        if (options.method === 'POST') {
          assert.equal(options.signal, signal);
          assert.equal(options.headers.get('Content-Type'), 'application/json');
          assert.deepEqual(JSON.parse(options.body), parseProductDraft(draft));
          return Response.json(saved, { status: 201 });
        }
        return Response.json([saved]);
      };
      const demo = createProductDemo(true, 'http://localhost:8080/test/', fetcher);
      const product = await demo.create(draft, signal);
      assert.equal(product.id, 321);
      assert.equal((await demo.list())[0].id, product.id);
      const reloaded = createProductDemo(true, 'http://localhost:8080/test/', fetcher);
      assert.equal((await reloaded.list())[0].id, product.id);
      assert.deepEqual(calls, Array.from(['POST', 'GET', 'GET'], method => ['http://localhost:8080/test/produto', method]));
    });
    await t.test('não trata 200 como criação e preserva falhas HTTP', async () => {
      for (const status of [200, 400, 422, 500]) {
        const demo = createProductDemo(true, 'http://localhost:8080/', async () => Response.json({}, { status }));
        await assert.rejects(demo.create(draft), error => error.status === status);
      }
      const demo = createProductDemo(true, 'http://localhost:8080/', async () => { throw new TypeError('Failed to fetch'); });
      await assert.rejects(demo.create(draft), error => error.kind === 'network');
    });
  } finally { await server.close(); }
});
