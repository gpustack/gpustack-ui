import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test, type TestContext } from 'node:test';
import { isDeepStrictEqual } from 'node:util';
import { act, createElement } from 'react';

type Kind = 'routes' | 'users' | 'api_keys';
type Item = {
  label: string;
  deleted: boolean;
  identity: {
    value: Record<string, any>;
    current: Record<string, any> | null;
  };
};
const kinds: Kind[] = ['routes', 'users', 'api_keys'];
const idField = {
  routes: 'route_id',
  users: 'user_id',
  api_keys: 'api_key_id'
};
const clone = <T,>(value: T): T => structuredClone(value);
const entry = (
  kind: Kind,
  name: string,
  id: string | number | null,
  deleted = false
): Item => ({
  label: name,
  deleted,
  identity: {
    value:
      kind === 'api_keys'
        ? {
            user_name: 'alice',
            api_key_name: name,
            access_key: 'access-key',
            api_key_is_custom: true
          }
        : { [kind === 'routes' ? 'route_name' : 'user_name']: name },
    current:
      id === null
        ? null
        : {
            [idField[kind]]: id,
            ...(kind === 'api_keys' ? { user_id: 7 } : {})
          }
  }
});
const fixture = (filters: Partial<Record<Kind, Item[]>> = {}) => ({
  filters: { routes: [], users: [], api_keys: [], ...filters }
});
let response = fixture();
const queryMeta = mock.fn(async () => clone(response));
const queryUsage = mock.fn(async (_params: any) => ({}));

// Match the @/ alias without loading the request hook's runtime dependencies.
mock.module(
  new URL('../../../../hooks/use-query-data-list.ts', import.meta.url).href,
  {
    namedExports: {
      useQueryData: ({ fetchDetail }: any) => ({
        detailData: {},
        loading: false,
        cancelRequest() {},
        fetchData: fetchDetail
      })
    }
  }
);
mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    queryUsageMetaData: queryMeta,
    queryUsageTimeSeriesData: queryUsage
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: any) => id }),
    useModel: () => ({ initialState: { currentUser: { id: 7 } } })
  }
});
mock.module('@gpustack/core-ui/excel', {
  namedExports: { exportJsonToExcel() {} }
});

const dom = new JSDOM('<!doctype html><div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
after(() => dom.window.close());
const { createRoot } = await import('react-dom/client');
const { default: useQueryUsageMetaData } =
  await import('../use-query-meta-data.ts');
const { useUsageFilters } = await import('../../hooks/use-usage-filters.ts');
type MetaOptions = ReturnType<typeof useQueryUsageMetaData>['detailData'];
const optionsFor = (data: MetaOptions, kind: Kind) =>
  kind === 'api_keys'
    ? data.api_keys.flatMap((group) => group.children)
    : data[kind];

async function mount(t: TestContext, data: ReturnType<typeof fixture>) {
  response = data;
  queryMeta.mock.resetCalls();
  queryUsage.mock.resetCalls();
  let metadata!: ReturnType<typeof useQueryUsageMetaData>;
  let usage!: ReturnType<typeof useUsageFilters>;
  const Harness = () => {
    metadata = useQueryUsageMetaData();
    usage = useUsageFilters({
      initialScope: 'all',
      metaData: metadata.detailData,
      chartFilters: {
        metric: 'total_tokens',
        group_by: null,
        granularity: 'day'
      },
      summaryColumns: []
    });
    return null;
  };
  const root = createRoot(document.getElementById('root')!);
  t.after(async () => act(async () => root.unmount()));
  await act(async () => root.render(createElement(Harness)));
  const refresh = async (next = response) => {
    response = next;
    await act(async () => metadata.fetchData());
  };
  await refresh();
  return {
    get data() {
      return metadata.detailData;
    },
    get usage() {
      return usage;
    },
    refresh
  };
}

for (const kind of kinds) {
  test(`${kind}: historical names of one entity remain independently selectable`, async (t) => {
    const historical = [
      entry(kind, 'before-rename', 7),
      entry(kind, 'after-rename', 7)
    ];
    const view = await mount(t, fixture({ [kind]: historical }));
    const options = optionsFor(view.data, kind);
    assert.equal(options.length, 2);
    assert.equal(new Set(options.map((option) => option.value)).size, 2);

    const onChange = {
      routes: view.usage.filterBar.onRoutesChange,
      users: view.usage.filterBar.onUsersChange,
      api_keys: view.usage.filterBar.onApiKeysChange
    }[kind];
    await act(async () => onChange([options[0].value]));
    const submitted = queryUsage.mock.calls.at(-1)!.arguments[0];
    assert.deepEqual(submitted.filters[kind], [
      { identity: historical[0].identity }
    ]);
  });

  test(`${kind}: same labels with different IDs and legacy identities have unique values`, async (t) => {
    const items = [
      entry(kind, 'same-name', 11),
      entry(kind, 'same-name', 12),
      entry(kind, 'same-name', null, true),
      entry(kind, 'other-legacy-name', null, true)
    ];
    const view = await mount(t, fixture({ [kind]: items }));
    const options = optionsFor(view.data, kind);
    assert.equal(options.length, items.length);
    assert.equal(
      new Set(options.map((option) => option.value)).size,
      items.length
    );
    assert.deepEqual(
      options.map((option) => option.identity),
      items.map((item) => item.identity)
    );
  });

  test(`${kind}: repeated equivalent identities produce one option`, async (t) => {
    const first = entry(kind, 'legacy', null, true);
    if (kind === 'api_keys') {
      first.identity.value.access_key = undefined;
      first.identity.value.api_key_is_custom = undefined;
    }
    const equivalent = clone(first);
    equivalent.identity.current = {
      [idField[kind]]: null,
      ...(kind === 'api_keys' ? { user_id: undefined } : {})
    };
    if (kind === 'api_keys') {
      equivalent.identity.value.access_key = null;
      equivalent.identity.value.api_key_is_custom = null;
    }
    const view = await mount(
      t,
      fixture({ [kind]: [first, clone(first), equivalent] })
    );
    assert.equal(optionsFor(view.data, kind).length, 1);
  });
}

test('API-key owner, access-key and custom-key snapshots remain independently selectable across groups', async (t) => {
  const original = entry('api_keys', 'same-key-name', 'key-7');
  const snapshots = Array.from({ length: 6 }, () => clone(original));
  snapshots[1].identity.current!.user_id = 8;
  snapshots[2].identity.value.user_name = 'bob';
  snapshots[3].identity.value.access_key = 'rotated-access-key';
  snapshots[4].identity.value.api_key_is_custom = false;
  snapshots[5].identity.value.api_key_is_custom = null;
  const view = await mount(t, fixture({ api_keys: snapshots }));
  const options = optionsFor(view.data, 'api_keys');
  assert.equal(options.length, snapshots.length);
  assert.equal(
    new Set(options.map((option) => option.value)).size,
    snapshots.length
  );
  for (const snapshot of snapshots) {
    const selected = options.find((option) =>
      isDeepStrictEqual(option.identity, snapshot.identity)
    )!;
    await act(async () =>
      view.usage.filterBar.onApiKeysChange([selected.value])
    );
    assert.deepEqual(
      queryUsage.mock.calls.at(-1)!.arguments[0].filters.api_keys,
      [{ identity: snapshot.identity }]
    );
  }
});

test('values remain stable when metadata is reordered and absent fields become null', async (t) => {
  const filters = Object.fromEntries(
    kinds.map((kind) => [
      kind,
      [
        entry(kind, 'before', 7),
        entry(kind, 'after', 7),
        entry(kind, 'legacy-a', null, true),
        entry(kind, 'legacy-b', null, true)
      ]
    ])
  ) as Record<Kind, Item[]>;
  filters.api_keys[2].identity.value.access_key = undefined;
  filters.api_keys[2].identity.value.api_key_is_custom = undefined;
  const view = await mount(t, fixture(filters));
  const valuesByLabel = (kind: Kind) =>
    Object.fromEntries(
      optionsFor(view.data, kind).map((option) => [option.label, option.value])
    );
  const before = Object.fromEntries(
    kinds.map((kind) => [kind, valuesByLabel(kind)])
  );
  const reordered = clone(filters);
  for (const kind of kinds) {
    reordered[kind].reverse();
    for (const item of reordered[kind]) {
      if (item.identity.current === null) {
        item.identity.current = {
          [idField[kind]]: undefined,
          ...(kind === 'api_keys' ? { user_id: null } : {})
        };
      }
    }
  }
  const legacyKey = reordered.api_keys.find(
    (item) => item.label === 'legacy-a'
  )!;
  legacyKey.identity.value.access_key = null;
  legacyKey.identity.value.api_key_is_custom = null;
  await view.refresh(fixture(reordered));
  for (const kind of kinds) {
    assert.deepEqual(valuesByLabel(kind), before[kind], kind);
  }
});

test('identity property order, display labels and deletion state do not change option values', async (t) => {
  const filters = Object.fromEntries(
    kinds.map((kind) => [
      kind,
      [entry(kind, 'before', 7), entry(kind, 'after', 7)]
    ])
  ) as Record<Kind, Item[]>;
  const view = await mount(t, fixture(filters));
  const original = kinds.flatMap((kind) =>
    optionsFor(view.data, kind).map(({ identity, value }) => ({
      kind,
      identity: clone(identity),
      value
    }))
  );
  const reverseFields = (value: Record<string, any>) =>
    Object.fromEntries(Object.entries(value).reverse());
  const updated = clone(filters);
  for (const kind of kinds) {
    updated[kind].reverse();
    for (const item of updated[kind]) {
      item.label = `Updated display: ${item.label}`;
      item.deleted = true;
      item.identity = {
        current: reverseFields(item.identity.current!),
        value: reverseFields(item.identity.value)
      };
    }
  }
  await view.refresh(fixture(updated));
  for (const { kind, identity, value } of original) {
    const current = optionsFor(view.data, kind).find((option) =>
      isDeepStrictEqual(option.identity, identity)
    );
    assert.ok(current, `${kind}: historical identity is retained`);
    assert.equal(current.value, value, kind);
  }
});

test('current-user ordering, deleted ordering, API-key groups and display labels are preserved', async (t) => {
  const bobDeleted = entry('api_keys', 'bob-old', 'bob-old', true);
  const bobLive = entry('api_keys', 'bob-live', 'bob-live');
  for (const item of [bobDeleted, bobLive]) {
    item.identity.value.user_name = 'bob';
    item.identity.value.api_key_is_custom = false;
  }
  const view = await mount(
    t,
    fixture({
      routes: [
        entry('routes', 'deleted-model', 10, true),
        entry('routes', 'live-model', 11)
      ],
      users: [
        entry('users', 'deleted-user', 10, true),
        entry('users', 'other-user', 11),
        entry('users', 'current-user', 7)
      ],
      api_keys: [
        bobDeleted,
        entry('api_keys', 'alice-live', 'alice-live'),
        bobLive,
        entry('api_keys', 'alice-old', 'alice-old', true)
      ]
    })
  );
  assert.deepEqual(
    view.data.routes.map((option) => option.label),
    ['live-model', 'deleted-model']
  );
  assert.deepEqual(
    view.data.users.map((option) => option.label),
    ['current-user', 'other-user', 'deleted-user']
  );
  assert.equal(Reflect.get(view.data.users[0], 'isCurrent'), true);
  assert.deepEqual(
    view.data.api_keys.map(({ children, ...group }) => ({
      ...group,
      labels: children.map((option) => option.label)
    })),
    [
      {
        value: 'bob',
        label: 'bob',
        type: 'default',
        isParent: true,
        labels: ['bob-live', 'bob-old']
      },
      {
        value: 'alice',
        label: 'alice',
        type: 'custom',
        isParent: true,
        labels: ['alice-live', 'alice-old']
      }
    ]
  );
});
