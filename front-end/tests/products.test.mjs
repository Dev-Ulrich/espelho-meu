import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

test('listagem de produtos usa o contrato Java e permite recuperação', async (t) => {
  const server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  try {
    const { listProducts, decodeProducts } = await server.ssrLoadModule('/src/services/api/products.ts');
    const { createApiClient } = await server.ssrLoadModule('/src/services/api/client.ts');
    // Exemplo observado no GET público; os cards de produção não usam esta fixture.
    const product = { id: 1, nome: 'Shampoo Suave', marca: 'Lola', precoReferencia: 25.9 };
    await t.test('GET sem corpo usa a base Java, preserva dados e sinal de cancelamento', async () => {
      const controller = new AbortController();
      const client = createApiClient('https://espelhomeu-api.onrender.com/', async (url, options) => {
        assert.equal(String(url), 'https://espelhomeu-api.onrender.com/produto');
        assert.equal(options.method, 'GET');
        assert.equal(options.body, undefined);
        assert.equal(options.credentials, 'omit');
        assert.equal(options.signal, controller.signal);
        return Response.json([{ ...product, categoria: 'Shampoo' }]);
      });
      assert.deepEqual(await listProducts(controller.signal, client), [product]);
    });
    await t.test('lista vazia é válida; formato inesperado e preços inválidos são rejeitados', () => {
      assert.deepEqual(decodeProducts([]), []);
      for (const invalid of [null, {}, { content: [product] }, [null], [{ ...product, precoReferencia: '25.90' }], [{ ...product, precoReferencia: -1 }], [{ ...product, nome: '' }]]) {
        assert.throws(() => decodeProducts(invalid));
      }
    });
    await t.test('uma nova chamada recupera os produtos após falha de conexão', async () => {
      let calls = 0;
      const client = createApiClient('https://espelhomeu-api.onrender.com/', async () => {
        if (++calls === 1) throw new TypeError('Failed to fetch');
        return Response.json([product]);
      });
      await assert.rejects(listProducts(undefined, client), error => error.kind === 'network');
      assert.deepEqual(await listProducts(undefined, client), [product]);
      assert.equal(calls, 2);
    });
    await t.test('HTTP indisponível e cancelamento preservam seus erros', async () => {
      const client = createApiClient('https://espelhomeu-api.onrender.com/', async () => new Response('Unavailable', { status: 503 }));
      await assert.rejects(listProducts(undefined, client), error => error.status === 503);
      const controller = new AbortController();
      controller.abort();
      const aborted = createApiClient('https://espelhomeu-api.onrender.com/', async () => { throw new DOMException('Aborted', 'AbortError'); });
      await assert.rejects(listProducts(controller.signal, aborted), error => error.kind === 'aborted');
    });
  } finally { await server.close(); }
});
