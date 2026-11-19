import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';

const require = createRequire(new URL('../package.json', import.meta.url));
const { createServer } = await import(pathToFileURL(require.resolve('vite')));

test('validatePhoto rejeita vazios, tipos inválidos e aceita JPEG/PNG no limite', async () => {
  const server = await createServer({
    root: fileURLToPath(new URL('..', import.meta.url)),
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
  });
  try {
    const { validatePhoto } = await server.ssrLoadModule('/src/pages/consultoria/foto/validation.ts');
    const maxBytes = 1024;
    const jpeg = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0])], 'rosto.jpg', { type: 'image/jpeg' });
    const png = new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], 'rosto.png', { type: 'image/png' });
    const empty = new File([], 'vazio.jpg', { type: 'image/jpeg' });
    const wrongExt = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'rosto.gif', { type: 'image/jpeg' });
    const fakeJpeg = new File([new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])], 'falso.jpg', { type: 'image/jpeg' });
    const oversized = new File([new Uint8Array(maxBytes + 1).fill(0xff)], 'grande.jpg', { type: 'image/jpeg' });

    assert.equal(await validatePhoto(jpeg, maxBytes), null);
    assert.equal(await validatePhoto(png, maxBytes), null);
    assert.match(await validatePhoto(empty, maxBytes), /vazio/i);
    assert.match(await validatePhoto(wrongExt, maxBytes), /\.jpg|\.jpeg|\.png/i);
    assert.match(await validatePhoto(fakeJpeg, maxBytes), /não corresponde|nao corresponde/i);
    assert.match(await validatePhoto(oversized, maxBytes), /até|ate/i);
    assert.match(await validatePhoto(jpeg, 0), /limite/i);
  } finally {
    await server.close();
  }
});
