import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolvedFieldValues } from '../field-values';

test('an undefined form value is omitted on the wire and keeps the declared default', () => {
  assert.equal(
    resolvedFieldValues([{ name: 'ram', default: 15 }], { ram: undefined }).ram,
    15
  );
});

test('a closed ancestor uses gated defaults for nested resource fields', () => {
  const fields = [
    { name: 'ha', default: true },
    {
      name: 'stores',
      default: true,
      visible_by: 'ha',
      visible_when: true,
      gated_default: false
    },
    {
      name: 'replicas',
      default: 3,
      visible_by: 'stores',
      visible_when: true,
      gated_default: 1
    }
  ];
  assert.equal(
    resolvedFieldValues(fields, { ha: false, stores: true, replicas: 4 })
      .replicas,
    1
  );
  assert.equal(
    resolvedFieldValues(fields, { ha: true, stores: true, replicas: 4 })
      .replicas,
    4
  );
});

test('visibility without a gated default preserves the configured resource value', () => {
  assert.equal(
    resolvedFieldValues(
      [
        { name: 'enabled', default: false },
        { name: 'ram', default: 15, visible_by: 'enabled', visible_when: true }
      ],
      { ram: 18 }
    ).ram,
    18
  );
});

test('zero gated defaults and explicit null values do not fall back to normal defaults', () => {
  const fields = [
    { name: 'enabled', default: false },
    {
      name: 'ram',
      default: 15,
      visible_by: 'enabled',
      visible_when: true,
      gated_default: 0
    },
    { name: 'other', default: 3 }
  ];
  assert.deepEqual(resolvedFieldValues(fields, { ram: 18, other: null }), {
    enabled: false,
    ram: 0,
    other: null
  });
});
