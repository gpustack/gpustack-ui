import assert from 'node:assert/strict';
import test from 'node:test';
import { routerCommandSource } from '../pd-router-command';

for (const name of ['vLLM', 'SGLang', 'router-custom']) {
  test(`${name} respects the same command priority`, () => {
    const definition = {
      value: name,
      default_command_version: '1',
      default_run_command: 'default-router',
      versions: [{ value: '1', run_command: 'version-router' }, { value: '2' }]
    };
    assert.equal(
      routerCommandSource({ backend: name }, definition).source,
      'backend_version'
    );
    assert.equal(
      routerCommandSource({ backend: name, backend_version: '2' }, definition)
        .source,
      'backend_default'
    );
    assert.equal(
      routerCommandSource(
        { backend: name, run_command: 'own-router' },
        definition
      ).command,
      'own-router'
    );
    assert.equal(routerCommandSource({}, definition).source, 'recipe');
    assert.equal(
      routerCommandSource(
        { backend: name },
        { ...definition, default_run_command: ' ', versions: [] }
      ).source,
      'recipe'
    );
  });
}
