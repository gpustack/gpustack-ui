import assert from 'node:assert/strict';
import { test } from 'node:test';
import dockerSchema from '../worker-config.docker.json';
import kubernetesSchema from '../worker-config.kubernetes.json';
import { dockerConfig, kubernetesConfig } from '../yaml-template';

test('Docker and Kubernetes put the interface example in Worker Configuration networking', () => {
  for (const template of [dockerConfig, kubernetesConfig]) {
    const networking = template
      .split('# ========= service & networking ===========')[1]
      .split('# ========= resources ===========')[0];
    assert.match(networking, /^# kv_transfer_ifname: "ens5f0"$/m);
  }
});

test('both Worker Configuration editors accept and complete the KV interface setting', () => {
  for (const schema of [dockerSchema, kubernetesSchema]) {
    const properties = schema.properties as Record<string, { type: unknown }>;
    assert.deepEqual(properties.kv_transfer_ifname?.type, ['string', 'null']);
  }
});
