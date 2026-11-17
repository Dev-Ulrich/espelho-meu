import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// Transpila o módulo puro para rodar também no Node 20, sem runner adicional.
const source = await readFile(new URL('../src/pages/acesso/validation.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { validateAccess } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const valid = { name: 'Pessoa Teste', email: 'teste@example.com', phone: '(11) 99999-9999', password: 'exemplo123', confirmation: 'exemplo123' };

test('cadastro aceita os campos válidos e telefone opcional', () => {
  assert.deepEqual(validateAccess('cadastro', valid), {});
  assert.deepEqual(validateAccess('cadastro', { ...valid, phone: '' }), {});
});
test('cadastro rejeita campos vazios, senha curta e confirmação divergente', () => {
  const errors = validateAccess('cadastro', { name: '  ', email: 'sem-arroba', phone: '', password: '123', confirmation: '321' });
  assert.deepEqual(Object.keys(errors).sort(), ['confirmation', 'email', 'name', 'password']);
  assert.ok(validateAccess('cadastro', { ...valid, confirmation: '' }).confirmation);
});
test('telefone deve ter DDD e não aceitar letras', () => {
  assert.ok(validateAccess('cadastro', { ...valid, phone: '123' }).phone);
  assert.ok(validateAccess('cadastro', { ...valid, phone: 'abc11999999999' }).phone);
});
test('login não aplica a regra de nova senha a credenciais existentes', () => {
  assert.deepEqual(validateAccess('login', { ...valid, name: '', phone: 'x', password: '123', confirmation: '' }), {});
  assert.ok(validateAccess('login', { ...valid, password: '' }).password);
});
test('recuperação exige apenas um e-mail válido, sem exigir senha', () => {
  assert.deepEqual(validateAccess('recuperar', { ...valid, password: '', confirmation: '', name: '' }), {});
  for (const email of ['', '  ', 'teste@', 'teste @example.com', 'teste@example']) {
    assert.ok(validateAccess('recuperar', { ...valid, email }).email);
  }
});
