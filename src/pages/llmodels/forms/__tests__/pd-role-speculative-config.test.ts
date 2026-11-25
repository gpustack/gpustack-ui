import assert from 'node:assert/strict';
import test from 'node:test';
import type { RoleFormItem } from '../../config/types';
import { rolesFormToPayload, rolesSpecToForm } from '../roles/transform';

test('submits different speculative decoding settings for prefill and decode', () => {
  const prefill = { enabled: true, algorithm: 'ngram', num_draft_tokens: 1 };
  const decode = {
    enabled: true,
    algorithm: 'ngram',
    num_draft_tokens: 4,
    ngram_min_match_length: 2,
    ngram_max_match_length: 8
  };
  const roles: RoleFormItem[] = [
    { name: 'prefill', replicas: 1, speculative_config: prefill },
    { name: 'decode', replicas: 1, speculative_config: decode },
    { name: 'router', replicas: 1 }
  ];
  const saved = rolesFormToPayload(roles, {
    speculative_config: { enabled: false }
  })!;

  assert.deepEqual(saved[0].speculative_config, prefill);
  assert.deepEqual(saved[1].speculative_config, decode);
  assert.equal('speculative_config' in saved[2], false);
  assert.deepEqual(rolesSpecToForm(saved)[1].speculative_config, decode);
});

test('preserves saved speculative decoding when editing other role fields', () => {
  const config = {
    enabled: true,
    algorithm: 'eagle3',
    draft_model: 'example/draft',
    num_draft_tokens: 4
  };
  const form = rolesSpecToForm([
    { name: 'decode', replicas: 1, speculative_config: config }
  ]);
  form[0].replicas = 2;
  const saved = rolesFormToPayload(form)!;

  assert.equal(saved[0].replicas, 2);
  assert.deepEqual(saved[0].speculative_config, config);
});

test('distinguishes explicit disable from inheriting speculative decoding', () => {
  const roles = rolesSpecToForm([
    { name: 'prefill', replicas: 1, speculative_config: null },
    { name: 'decode', replicas: 1, speculative_config: { enabled: false } },
    { name: 'router', replicas: 1 }
  ]);
  const saved = rolesFormToPayload(roles, {
    speculative_config: { enabled: true, algorithm: 'ngram' }
  })!;

  assert.equal(saved[0].speculative_config, null);
  assert.deepEqual(saved[1].speculative_config, { enabled: false });
  assert.equal('speculative_config' in saved[2], false);
});

test('does not add a config to an untouched engine role', () => {
  const saved = rolesFormToPayload([{ name: 'decode', replicas: 1 }])!;

  assert.equal('speculative_config' in saved[0], false);
});
