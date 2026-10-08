import assert from 'node:assert/strict';
import test from 'node:test';
import { getFilterClearPatch, isFilterActive } from './filter-values';
import type { ResponsiveFilterConfig } from './types';

interface Values {
  name: string;
  status?: number;
  enabled?: boolean;
  tags: string[];
  scope: string | null;
}

const values: Values = {
  name: 'name kept in toolbar',
  status: 0,
  enabled: false,
  tags: [],
  scope: null
};

test('counts 0 and false as selected values, but not empty inputs or arrays', () => {
  const filters: ResponsiveFilterConfig<Values>[] = [
    { key: 'status', type: 'select', label: 'Status', options: [] },
    { key: 'enabled', type: 'custom', label: 'Enabled', render: () => null },
    { key: 'tags', type: 'custom', label: 'Tags', render: () => null },
    { key: 'scope', type: 'custom', label: 'Scope', render: () => null }
  ];
  assert.deepEqual(
    filters.map((filter) => isFilterActive(filter, values)),
    [true, true, false, false]
  );
  assert.equal(
    isFilterActive(filters[0], { ...values, status: undefined }),
    false
  );
  assert.equal(
    isFilterActive(filters[2], { ...values, tags: ['team-a'] }),
    true
  );
  assert.equal(
    isFilterActive(
      { key: 'name', type: 'input', label: 'Name' },
      {
        ...values,
        name: ''
      }
    ),
    false
  );
});

test('lets a custom filter define its own active state', () => {
  const filter: ResponsiveFilterConfig<Values> = {
    key: 'enabled',
    type: 'custom',
    label: 'Enabled',
    render: () => null,
    isActive: (value) => value === true
  };
  assert.equal(isFilterActive(filter, values), false);
  assert.equal(isFilterActive(filter, { ...values, enabled: true }), true);
});

test('clears only supplied popover fields in one patch and honors reset values', () => {
  const filters: ResponsiveFilterConfig<Values>[] = [
    { key: 'status', type: 'select', label: 'Status', options: [] },
    {
      key: 'enabled',
      type: 'custom',
      label: 'Enabled',
      render: () => null,
      clearValue: false
    },
    {
      key: 'tags',
      type: 'custom',
      label: 'Tags',
      render: () => null,
      clearValue: []
    },
    {
      key: 'scope',
      type: 'custom',
      label: 'Scope',
      render: () => null,
      clearValue: null
    }
  ];
  const patch = getFilterClearPatch(filters);
  assert.deepEqual(patch, {
    status: undefined,
    enabled: false,
    tags: [],
    scope: null
  });
  assert.equal({ ...values, ...patch }.name, values.name);
  assert.deepEqual(
    getFilterClearPatch([{ key: 'name', type: 'input', label: 'Name' }]),
    { name: '' }
  );
  assert.deepEqual(getFilterClearPatch<Values>([]), {});
});
