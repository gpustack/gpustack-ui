import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, beforeEach, mock, test } from 'node:test';
import { act, createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

mock.module(new URL('../../../config/index.ts', import.meta.url).href, {
  namedExports: {
    topologyLayerLabel: (_intl: unknown, layer: { name: string }) => layer.name
  }
});

const { default: useColumnPrefs } =
  await import('../hooks/use-column-prefs.ts');
const { shownByDefault } = await import('../location.ts');
type LocationField = import('../location.ts').LocationField;
type UseColumnPrefs = import('../hooks/use-column-prefs.ts').UseColumnPrefs;

const storage = new Map<string, string>();
const originalStorage = Object.getOwnPropertyDescriptor(
  globalThis,
  'localStorage'
);
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value)
  }
});
beforeEach(() => storage.clear());
after(() => {
  if (originalStorage) {
    Object.defineProperty(globalThis, 'localStorage', originalStorage);
  } else {
    Reflect.deleteProperty(globalThis, 'localStorage');
  }
});

const field = (id: string, active = false): LocationField => ({
  id,
  name:
    id === 'builtin-zone' ? 'zone' : id === 'builtin-rack' ? 'rack' : 'zone',
  label: id,
  builtin: id.startsWith('builtin-'),
  active,
  primaryKey: null,
  labelKeys: []
});

const visibleColumns = (clusterId?: number) => {
  let visible: string[] = [];
  const Probe = () => {
    const prefs = useColumnPrefs(clusterId);
    visible = [
      field('builtin-zone'),
      field('builtin-rack'),
      field('custom-zone', true)
    ]
      .filter(prefs.isShown)
      .map((column) => column.id);
    return null;
  };
  renderToStaticMarkup(createElement(Probe));
  return visible;
};

test('availability zone and rack are visible by default even before labels are filled', () => {
  assert.deepEqual(visibleColumns(1), ['builtin-zone', 'builtin-rack']);
});

test('populated custom layers and other built-ins do not automatically become columns', () => {
  assert.equal(shownByDefault(field('custom-zone', true)), false);
  assert.equal(
    shownByDefault({
      ...field('builtin-domain', true),
      name: 'accelerator_domain'
    }),
    false
  );
});

test('saved column choices can hide defaults and show a custom layer', () => {
  const saved = JSON.stringify({
    fields: {
      'builtin-zone': false,
      'builtin-rack': false,
      'custom-zone': true
    },
    gpus: false,
    source: true
  });
  storage.set('gpustack.topology.columns.1', saved);

  assert.deepEqual(visibleColumns(1), ['custom-zone']);
  assert.equal(storage.get('gpustack.topology.columns.1'), saved);
  assert.deepEqual(visibleColumns(2), ['builtin-zone', 'builtin-rack']);
});

test('new layers preserve existing choices and reset restores persisted defaults for only the current cluster', async (t) => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>');
  const globals = [
    'window',
    'document',
    'navigator',
    'IS_REACT_ACT_ENVIRONMENT'
  ];
  const descriptors = globals.map((key) =>
    Object.getOwnPropertyDescriptor(globalThis, key)
  );
  Object.defineProperties(globalThis, {
    window: { configurable: true, value: dom.window },
    document: { configurable: true, value: dom.window.document },
    navigator: { configurable: true, value: dom.window.navigator },
    IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
  });
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(document.getElementById('root')!);
  t.after(async () => {
    await act(async () => root.unmount());
    dom.window.close();
    globals.forEach((key, index) => {
      const descriptor = descriptors[index];
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor);
      } else {
        Reflect.deleteProperty(globalThis, key);
      }
    });
  });

  const existing = {
    fields: {
      'builtin-zone': false,
      'builtin-rack': false,
      'custom-zone': false,
      'custom-visible': true
    },
    gpus: false,
    source: true
  };
  const otherCluster = JSON.stringify({ fields: { 'custom-zone': true } });
  storage.set('gpustack.topology.columns.1', JSON.stringify(existing));
  storage.set('gpustack.topology.columns.2', otherCluster);

  let prefs: UseColumnPrefs;
  const Probe = ({ clusterId = 1 }: { clusterId?: number }) => {
    prefs = useColumnPrefs(clusterId);
    return null;
  };
  await act(async () => root.render(createElement(Probe)));
  await act(async () => prefs.showFields(['custom-new-a', 'custom-new-b']));

  assert.equal(prefs!.isShown(field('custom-new-a')), true);
  assert.equal(prefs!.isShown(field('custom-new-b')), true);
  assert.equal(prefs!.isShown(field('builtin-zone')), false);
  assert.equal(prefs!.isShown(field('custom-zone')), false);
  assert.equal(prefs!.isShown(field('builtin-rack')), false);
  assert.equal(prefs!.isShown(field('custom-visible')), true);
  const saved = storage.get('gpustack.topology.columns.1')!;
  assert.deepEqual(JSON.parse(saved), {
    ...existing,
    fields: {
      ...existing.fields,
      'custom-new-a': true,
      'custom-new-b': true
    }
  });
  assert.equal(storage.get('gpustack.topology.columns.2'), otherCluster);

  await act(async () => prefs.showFields([]));
  assert.equal(storage.get('gpustack.topology.columns.1'), saved);

  const assertDefaults = () => {
    assert.equal(prefs!.isShown(field('builtin-zone')), true);
    assert.equal(prefs!.isShown(field('builtin-rack')), true);
    ['custom-zone', 'custom-visible', 'custom-new-a', 'custom-new-b'].forEach(
      (id) => assert.equal(prefs!.isShown(field(id)), false)
    );
    assert.equal(prefs!.gpus, true);
    assert.equal(prefs!.source, false);
  };
  await act(async () => prefs.reset());
  assertDefaults();
  assert.deepEqual(JSON.parse(storage.get('gpustack.topology.columns.1')!), {
    fields: {},
    gpus: true,
    source: false
  });

  await act(async () => root.render(createElement(Probe, { key: 'reloaded' })));
  assertDefaults();
  assert.equal(storage.get('gpustack.topology.columns.2'), otherCluster);
  await act(async () =>
    root.render(createElement(Probe, { key: 'cluster-2', clusterId: 2 }))
  );
  assert.equal(prefs!.isShown(field('custom-zone')), true);
  assert.equal(storage.get('gpustack.topology.columns.2'), otherCluster);
});
