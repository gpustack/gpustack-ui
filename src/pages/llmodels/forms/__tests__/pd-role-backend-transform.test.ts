import assert from 'node:assert/strict';
import test from 'node:test';
import type { RoleFormItem } from '../../config/types';
import { rolesFormToPayload, rolesSpecToForm } from '../roles/transform';

const parent = {
  backend: 'vLLM',
  backend_version: '0.29.0',
  image_name: null,
  run_command: null
};

for (const name of ['prefill', 'decode', 'router']) {
  test(`${name} retains an independent backend even when equal to the parent`, () => {
    const role: RoleFormItem = {
      name,
      replicas: 1,
      ...parent,
      overrides: { backend: true }
    };
    const payload = rolesFormToPayload([role], parent)![0];
    assert.equal(payload.backend, 'vLLM');
    assert.equal(payload.backend_version, '0.29.0');
    assert.equal(rolesSpecToForm([payload])[0].overrides?.backend, true);
  });

  test(`${name} submits its own Auto version and clears inherited launch values`, () => {
    const role: RoleFormItem = {
      name,
      replicas: 1,
      backend: 'SGLang',
      backend_version: null,
      image_name: null,
      run_command: null,
      overrides: { backend: true }
    };
    const payload = rolesFormToPayload([role], parent)![0];
    assert.equal(payload.backend, 'SGLang');
    assert.equal(payload.backend_version, null);
    assert.equal(payload.image_name, null);
    assert.equal(payload.run_command, null);
  });

  test(`${name} disables the entire backend group when inheritance is selected`, () => {
    const role: RoleFormItem = {
      name,
      replicas: 1,
      backend: 'custom',
      image_name: 'old:image',
      run_command: 'old-command',
      overrides: { backend: false }
    };
    const payload = rolesFormToPayload([role], parent)![0];
    for (const field of [
      'backend',
      'backend_version',
      'image_name',
      'run_command'
    ] as const) {
      assert.equal(payload[field], null);
    }
  });
}

test('Router templates survive save and reopen without expanding runtime values', () => {
  const command = `router --host {{worker_ip}} --port {{port}}
{% for p in prefill %}--prompt-peer {{p.url}} {% endfor %}
--decode-endpoints "{{decode_urls | join(',')}}"`;
  const role: RoleFormItem = {
    name: 'router',
    replicas: 1,
    backend: 'Custom',
    image_name: 'upstream:router',
    run_command: command,
    overrides: { backend: true }
  };
  const saved = rolesFormToPayload([role], parent)!;
  assert.equal(saved[0].run_command, command);
  const reopened = rolesSpecToForm(saved);
  assert.equal(reopened[0].run_command, command);
  assert.equal(rolesFormToPayload(reopened, parent)![0].run_command, command);
});
