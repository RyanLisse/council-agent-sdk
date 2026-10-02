import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isMainModule } from '../src/is-main.ts';

test('entry detection resolves the module and argv paths', () => {
  const modulePath = fileURLToPath(import.meta.url);
  assert.equal(isMainModule(import.meta.url, resolve(modulePath)), true);
  assert.equal(isMainModule(import.meta.url, undefined), false);
  assert.equal(isMainModule(import.meta.url, resolve('src/agent.ts')), false);
});

test('entry detection compares case-insensitively on Windows', () => {
  const moduleUrl = pathToFileURL(resolve(fileURLToPath(import.meta.url))).href;
  const modulePath = fileURLToPath(moduleUrl);
  assert.equal(isMainModule(moduleUrl, modulePath.toUpperCase(), 'win32'), true);
});
