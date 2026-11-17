import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const compile = (source: string) =>
  ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES5,
      module: ts.ModuleKind.CommonJS
    }
  }).outputText;

test('capacity utilities initialize and preserve bytes after exponentiation is lowered for browser targets', () => {
  const source = readFileSync(
    new URL('../artifact-capacity.ts', import.meta.url),
    'utf8'
  );
  const exported: Record<string, (...args: any[]) => any> = {};
  runInNewContext(compile(source), { exports: exported });
  for (const bytes of [1, 37, 107374182, Number.MAX_SAFE_INTEGER]) {
    assert.equal(
      exported.capacityLimitBytes(false, exported.capacityGiBValue(bytes)),
      bytes
    );
  }
  assert.equal(exported.capacityLimitBytes(true, null), 0);
  assert.equal(exported.capacityLimitBytes(false, '0.1'), 107374182);
  assert.equal(exported.formatCapacityBytes(1024), '1 KiB');
});

test('the browser-target regression guard rejects Math.pow with BigInt operands', () => {
  assert.throws(
    () => runInNewContext(compile('const scale = 10n ** 30n;')),
    /Cannot convert a BigInt value to a number/
  );
});
