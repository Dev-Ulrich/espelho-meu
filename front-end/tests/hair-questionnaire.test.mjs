import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

test('questionário capilar protegido durante a inicialização da IA', async t => {
  const server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  const originalFetch = globalThis.fetch;
  try {
    const { loadHairQuestionnaire } = await server.ssrLoadModule('/src/services/api/hairQuestionnaire.ts');
    await t.test('refaz o GET autenticado uma vez após HTTP 502', async () => {
      const { signal } = new AbortController();
      const questions = [{ id: 'textura', titulo: 'Curvatura', opcoes: [['liso', 'Liso']], multipla: false }];
      let requests = 0;
      let retries = 0;
      globalThis.fetch = async (url, options) => {
        assert.equal(url, '/api/java/consultoria/cabelo/questionario');
        assert.equal(options.credentials, 'same-origin');
        assert.equal(options.method, 'GET');
        assert.equal(options.signal, signal);
        if (++requests === 1) return new Response(null, { status: 502 });
        return Response.json({ perguntas: questions });
      };
      assert.deepEqual(await loadHairQuestionnaire(signal, () => retries++), questions);
      assert.equal(requests, 2);
      assert.equal(retries, 1);
    });

    await t.test('limita a tentativa e preserva erros de autorização', async () => {
      for (const [status, expectedRequests] of [[401, 1], [403, 1], [504, 2]]) {
        let requests = 0;
        globalThis.fetch = async () => {
          requests++;
          return new Response(null, { status });
        };
        await assert.rejects(loadHairQuestionnaire(new AbortController().signal, () => {}), { status });
        assert.equal(requests, expectedRequests);
      }
    });

    await t.test('cancela a segunda chamada ao sair da tela', async () => {
      const controller = new AbortController();
      let requests = 0;
      globalThis.fetch = async () => {
        requests++;
        controller.abort();
        return new Response(null, { status: 503 });
      };
      await assert.rejects(loadHairQuestionnaire(controller.signal, () => assert.fail()), { name: 'AbortError' });
      assert.equal(requests, 1);
    });
  } finally {
    globalThis.fetch = originalFetch;
    await server.close();
  }
});
