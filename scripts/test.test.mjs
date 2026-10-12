import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const passingTest = (name, checks = '') => `
  import assert from 'node:assert/strict';
  import test from 'node:test';
  test(${JSON.stringify(name)}, () => { ${checks} });
`;

function createProject(context, files) {
  const directory = mkdtempSync(join(tmpdir(), 'gpustack-test-runner-'));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  mkdirSync(join(directory, 'src'));
  mkdirSync(join(directory, 'scripts'));
  copyFileSync(
    join(projectRoot, 'scripts/test.mjs'),
    join(directory, 'scripts/test.mjs')
  );
  symlinkSync(
    join(projectRoot, 'node_modules'),
    join(directory, 'node_modules'),
    'junction'
  );
  for (const [path, source] of Object.entries(files)) {
    const target = join(directory, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, source);
  }
  // Launch an independent CLI run rather than inheriting the parent test worker.
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  return (...paths) => {
    const result = spawnSync(
      process.execPath,
      [join(directory, 'scripts/test.mjs'), ...paths],
      {
        cwd: directory,
        env,
        encoding: 'utf8',
        timeout: 30_000
      }
    );
    assert.ifError(result.error);
    return result;
  };
}

test('discovers tests automatically and isolates ESM import conditions', (context) => {
  const run = createProject(context, {
    'src/unit.test.ts': passingTest(
      'typescript-fixture',
      "assert(!process.execArgv.includes('--conditions=import'))"
    ),
    'src/component.test.tsx': passingTest('tsx-fixture'),
    'src/mock.test.mts': passingTest(
      'esm-fixture',
      "assert(process.execArgv.includes('--conditions=import')); assert(process.execArgv.includes('--experimental-test-module-mocks'))"
    ),
    'scripts/helper.test.mjs': passingTest('javascript-fixture'),
    'src/ignored.ts': 'throw new Error("ordinary source must not run");'
  });
  const result = run();
  assert.equal(result.status, 0, result.stdout + result.stderr);
  for (const name of [
    'typescript-fixture',
    'tsx-fixture',
    'esm-fixture',
    'javascript-fixture'
  ]) {
    assert.match(result.stdout, new RegExp(`ok \\d+ - ${name}`));
  }
});

test('selects a single file and deduplicates overlapping paths', (context) => {
  const run = createProject(context, {
    'src/selected/one.test.ts': passingTest('selected-fixture'),
    'src/other/two.test.mts': 'throw new Error("unselected test must not run");'
  });
  const single = run('src/selected/one.test.ts');
  assert.equal(single.status, 0, single.stdout + single.stderr);
  assert.match(single.stdout, /# tests 1\b/);
  const result = run('--', './src/selected', 'src/selected/one.test.ts');
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /# tests 1\b/);
  assert.doesNotMatch(result.stdout, /ESM tests/);
});

test('selects a directory without including similarly named siblings', (context) => {
  const run = createProject(context, {
    'src/selected/one.test.ts': passingTest('selected-fixture'),
    'src/selected/nested/two.test.mts': passingTest('nested-fixture'),
    'src/selected-sibling/three.test.ts':
      'throw new Error("sibling must not run");'
  });
  const result = run('src/selected/');
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /selected-fixture/);
  assert.match(result.stdout, /nested-fixture/);
});

test('rejects an unmatched path even when another path matches', (context) => {
  const run = createProject(context, {
    'src/unit.test.ts': passingTest('should-not-run')
  });
  const result = run('src/unit.test.ts', 'src/typo');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /No test files matched: src\/typo/);
  assert.doesNotMatch(result.stdout, /should-not-run/);
});

test('fails when no tests are discovered', (context) => {
  const result = createProject(context, {})();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /No test files found/);
});

for (const failingExtension of ['ts', 'mts']) {
  test(`propagates a failing ${failingExtension} test while still running the other group`, (context) => {
    const passingExtension = failingExtension === 'ts' ? 'mts' : 'ts';
    const run = createProject(context, {
      [`src/failure.test.${failingExtension}`]: passingTest(
        'failing-fixture',
        'assert.fail("intentional fixture failure")'
      ),
      [`src/success.test.${passingExtension}`]: passingTest(
        'other-group-fixture'
      )
    });
    const result = run();
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /not ok \d+ - failing-fixture/);
    assert.match(result.stdout, /ok \d+ - other-group-fixture/);
  });
}
