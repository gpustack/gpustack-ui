import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement } from 'react';
const dom = new JSDOM('<!doctype html><div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
after(() => dom.window.close());
mock.module('@gpustack/core-ui', {
  namedExports: {
    GSDrawer: ({ open, children, onClose }: any) =>
      open
        ? createElement(
            'section',
            { role: 'dialog' },
            children,
            createElement('button', { onClick: onClose }, 'Close')
          )
        : null
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: any, values?: any) =>
        id === 'models.revisions.target' ? `v${values.revision}` : id
    })
  }
});
const passthrough = ({ children }: any) => createElement('div', null, children);
mock.module('antd', {
  namedExports: {
    Flex: passthrough,
    Tooltip: passthrough,
    Typography: { Text: passthrough },
    Spin: () => createElement('span', null, 'Loading'),
    Button: ({ children, onClick, disabled }: any) =>
      createElement('button', { onClick, disabled }, children),
    Descriptions: ({ items }: any) =>
      createElement(
        'dl',
        null,
        items.map((item: any) =>
          createElement('div', { key: item.key }, item.label, item.children)
        )
      ),
    Select: ({ value, options, onChange }: any) =>
      createElement(
        'select',
        {
          value,
          onChange: (event: any) => onChange(Number(event.target.value))
        },
        options.map((option: any) =>
          createElement(
            'option',
            { key: option.value, value: option.value },
            option.label
          )
        )
      )
  }
});
let tenant = 'tenant-a';
mock.module(
  new URL('../../../hooks/use-monitoring-data.ts', import.meta.url).href,
  {
    namedExports: {
      tenantKey: () => tenant,
      useMonitoringTenant: () => tenant
    }
  }
);
mock.module(
  new URL('../../../../utils/deployment-yaml.ts', import.meta.url).href,
  { namedExports: { dumpDeploymentConfig: JSON.stringify } }
);
const item = (id: number, revision: number) => ({
  id: revision,
  model_id: id,
  revision,
  created_at: '2026-11-10T10:00:00Z',
  created_by: 1
});
let detailResponse: (id: number, revision: number) => Promise<any>;
let listResponse: (id: number) => Promise<any>;
const listLookup = mock.fn((id: number) => listResponse(id));
const detailLookup = mock.fn((id: number, revision: number) =>
  detailResponse(id, revision)
);
mock.module(
  new URL('../../services/read-only-revisions.ts', import.meta.url).href,
  {
    namedExports: {
      queryReadOnlyRevisions: listLookup,
      queryReadOnlyRevision: detailLookup
    }
  }
);
const { createRoot } = await import('react-dom/client');
const { default: ReadOnlyRevisions } = await import('../read-only-revisions');
const mount = async () => {
  tenant = 'tenant-a';
  listResponse = async (id) => ({ items: [item(id, 3), item(id, 2)] });
  detailResponse = async (id, revision) => ({
    ...item(id, revision),
    spec: { backend: `safe-config-${id}-v${revision}` }
  });
  const root = createRoot(document.getElementById('root')!);
  const render = (id = 7) =>
    act(async () =>
      root.render(
        createElement(ReadOnlyRevisions, {
          model: { id, name: `model-${id}` } as any
        })
      )
    );
  await render();
  return {
    render,
    unmount: () => act(async () => root.unmount()),
    open: () =>
      act(async () =>
        [...document.querySelectorAll<HTMLButtonElement>('button')]
          .find((button) =>
            button.textContent?.includes('models.revisions.title')
          )!
          .click()
      )
  };
};
test('read-only history displays real revision metadata and snapshots without mutation actions', async (t) => {
  const view = await mount();
  t.after(view.unmount);
  assert.ok(document.body.textContent?.includes('v3'));
  assert.ok(
    document.body.textContent?.includes('modelMonitoring.revisionCreated')
  );
  await view.open();
  assert.ok(
    document
      .querySelector('[role="dialog"] pre')
      ?.textContent?.includes('safe-config-7-v3')
  );
  const actions = [...document.querySelectorAll('button')]
    .map((button) => button.textContent)
    .join(' ');
  assert.ok(!/rollback|delete|restart/i.test(actions));
});
test('a late revision snapshot cannot appear after switching tenant and model', async (t) => {
  const view = await mount();
  t.after(view.unmount);
  let resolve!: (value: any) => void;
  detailResponse = async () =>
    new Promise((done) => {
      resolve = done;
    });
  await view.open();
  tenant = 'tenant-b';
  await view.render(8);
  await act(async () =>
    resolve({ ...item(7, 3), spec: { secret: 'old-tenant-snapshot' } })
  );
  assert.equal(document.querySelector('[role="dialog"]'), null);
  assert.ok(!document.body.textContent?.includes('old-tenant-snapshot'));
});
test('a denied revision request shows only a local unavailable state', async (t) => {
  const view = await mount();
  t.after(view.unmount);
  detailResponse = async () => {
    throw { response: { status: 403 }, message: 'private-error-body' };
  };
  await view.open();
  assert.ok(
    document
      .querySelector('[role="dialog"]')
      ?.textContent?.includes('modelMonitoring.metadataUnavailable')
  );
  assert.ok(!document.body.textContent?.includes('private-error-body'));
  assert.equal(document.querySelector('pre'), null);
});

test('read-only refresh remains available in an opened drawer and labels retained metadata stale after a 500', async (t) => {
  const view = await mount();
  t.after(view.unmount);
  await view.open();
  listResponse = async () => {
    throw { response: { status: 500 } };
  };
  const refresh = [
    ...document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')
  ].find((button) => button.textContent === 'modelMonitoring.refresh');
  assert.ok(
    refresh,
    'an opened history must have an explicit read-only refresh action'
  );
  await act(async () => refresh.click());
  assert.ok(document.body.textContent?.includes('modelMonitoring.stale'));
  assert.ok(
    document
      .querySelector('[role="dialog"] pre')
      ?.textContent?.includes('safe-config-7-v3')
  );
});
