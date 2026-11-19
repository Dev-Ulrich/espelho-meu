import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

test('contrato da recomendação de maquiagem e falhas recuperáveis', async (t) => {
  const server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  const originalFetch = globalThis.fetch;
  try {
    const { recommendMakeup } = await server.ssrLoadModule('/src/services/api/makeupRecommendation.ts');
    const profile = { tipo_pele: 'mista', ocasiao: 'trabalho', acabamento: 'natural' };
    await t.test('envia os valores do Flask sem depender da API Java e lê a resposta', async () => {
      globalThis.fetch = async (url, options) => {
        assert.equal(url, '/api/recomendacoes/maquiagem');
        assert.equal(options.method, 'POST');
        assert.equal(options.headers['Content-Type'], 'application/json');
        assert.equal(options.credentials, 'omit');
        assert.deepEqual(JSON.parse(options.body), profile);
        return Response.json({ area: 'maquiagem', recomendacao: 'maquiagem natural' });
      };
      assert.equal(await recommendMakeup(profile), 'maquiagem natural');
    });
    for (const status of [422, 500, 503]) {
      await t.test(`preserva HTTP ${status} mesmo com corpo não JSON`, async () => {
        globalThis.fetch = async () => new Response('Falha', { status });
        await assert.rejects(recommendMakeup(profile), error => error.status === status && /Confira|Tente novamente/.test(error.message));
      });
    }
    await t.test('falha de rede permite nova tentativa', async () => {
      globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
      await assert.rejects(recommendMakeup(profile), error => error.kind === 'network' && /tente novamente/.test(error.message));
    });
    await t.test('cancelamento repassa o sinal', async () => {
      const controller = new AbortController();
      controller.abort();
      globalThis.fetch = async (_url, options) => {
        assert.equal(options.signal, controller.signal);
        throw new DOMException('Aborted', 'AbortError');
      };
      await assert.rejects(recommendMakeup(profile, controller.signal), error => error.kind === 'aborted');
    });
    await t.test('rejeita respostas fora do contrato', async () => {
      for (const body of [{ area: 'cabelo', recomendacao: 'teste' }, { area: 'maquiagem', recomendacao: '' }, null]) {
        globalThis.fetch = async () => Response.json(body);
        await assert.rejects(recommendMakeup(profile), error => error.kind === 'invalid-response');
      }
    });
  } finally {
    globalThis.fetch = originalFetch;
    await server.close();
  }
});
