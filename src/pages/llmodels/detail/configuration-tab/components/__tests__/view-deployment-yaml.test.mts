import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement } from 'react';

const dom = new JSDOM('<div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
after(() => dom.window.close());
const source =
  '# Server-generated export\napiVersion: example/v1\nname: 模型\nreplicas: 0\nenv:\n  EXPLICIT_NULL: null\n';
let highlighted: any;
mock.module('@gpustack/core-ui', {
  namedExports: {
    icons: { Yaml: null },
    GSDrawer: ({ open, children, onClose }: any) =>
      open
        ? createElement(
            'section',
            { role: 'dialog' },
            children,
            createElement('button', { onClick: onClose }, 'Close')
          )
        : null,
    HighlightCode: (props: any) => {
      highlighted = props;
      return createElement('pre', null, props.code);
    }
  }
});
mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({ formatMessage: ({ id }: any) => id }) }
});
mock.module(
  new URL('../../../../../../hooks/use-user-settings.ts', import.meta.url).href,
  {
    defaultExport: () => ({ isDarkTheme: false })
  }
);
const passthrough = ({ children }: any) => createElement('div', null, children);
mock.module('antd', {
  namedExports: {
    Flex: passthrough,
    Typography: { Text: passthrough },
    Spin: () => createElement('span', null, 'Loading'),
    Button: ({ children, onClick }: any) =>
      createElement('button', { onClick }, children)
  }
});
let tenant = 'tenant-a';
mock.module(
  new URL('../../../hooks/use-monitoring-data.ts', import.meta.url).href,
  {
    namedExports: {
      useMonitoringTenant: () => tenant,
      tenantKey: () => tenant
    }
  }
);
let exportResponse: (params: any, options: any) => Promise<any>;
const exportLookup = mock.fn((params: any, options: any) =>
  exportResponse(params, options)
);
mock.module(new URL('../../../../apis/index.ts', import.meta.url).href, {
  namedExports: { exportModels: exportLookup }
});
const { createRoot } = await import('react-dom/client');
const { default: ViewDeploymentYaml } = await import('../view-deployment-yaml');
const response = (text = source) => ({ data: new Blob([text]), headers: {} });
const click = (label: string) =>
  act(async () => {
    [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent === label)!
      .click();
  });
const mount = async () => {
  tenant = 'tenant-a';
  highlighted = null;
  exportLookup.mock.resetCalls();
  exportResponse = async () => response();
  const root = createRoot(document.getElementById('root')!);
  const render = (id = 7) =>
    act(async () =>
      root.render(
        createElement(ViewDeploymentYaml, {
          model: { id, name: `model-${id}`, owner_principal_id: 'owner' } as any
        })
      )
    );
  await render();
  return { render, unmount: () => act(async () => root.unmount()) };
};

test('view and copy use the export response verbatim and only request it when opened', async (t) => {
  const view = await mount();
  t.after(view.unmount);
  assert.equal(exportLookup.mock.calls.length, 0);
  await click('modelMonitoring.viewYaml');
  assert.deepEqual(exportLookup.mock.calls[0].arguments[0], { ids: [7] });
  assert.ok(
    exportLookup.mock.calls[0].arguments[1].signal instanceof AbortSignal
  );
  assert.equal(document.querySelector('pre')?.textContent, source);
  assert.equal(highlighted.copyValue, source);
  assert.equal(highlighted.lang, 'yaml');
  assert.ok(
    !/save|apply|rollback/i.test(
      [...document.querySelectorAll('button')]
        .map((b) => b.textContent)
        .join(' ')
    )
  );
});

test('closing cancels an export and reopening cannot display its late response', async (t) => {
  const view = await mount();
  t.after(view.unmount);
  let resolve!: (value: any) => void;
  exportResponse = () =>
    new Promise((done) => {
      resolve = done;
    });
  await click('modelMonitoring.viewYaml');
  const signal = exportLookup.mock.calls[0].arguments[1].signal;
  await click('Close');
  assert.equal(signal.aborted, true);
  await act(async () => resolve(response('old-response')));
  assert.equal(document.querySelector('[role="dialog"]'), null);
  exportResponse = async () => response('fresh-response');
  await click('modelMonitoring.viewYaml');
  assert.equal(document.querySelector('pre')?.textContent, 'fresh-response');
});

test('a late export cannot appear after a tenant and deployment switch', async (t) => {
  const view = await mount();
  t.after(view.unmount);
  let resolve!: (value: any) => void;
  exportResponse = () =>
    new Promise((done) => {
      resolve = done;
    });
  await click('modelMonitoring.viewYaml');
  tenant = 'tenant-b';
  await view.render(8);
  await act(async () =>
    resolve(response('other-tenant-private-configuration'))
  );
  assert.equal(document.querySelector('[role="dialog"]'), null);
  assert.ok(
    !document.body.textContent?.includes('other-tenant-private-configuration')
  );
});

test('a revoked export removes the old content and refresh can retry without revealing the error body', async (t) => {
  const view = await mount();
  t.after(view.unmount);
  await click('modelMonitoring.viewYaml');
  exportResponse = async () => {
    throw { response: { status: 403 }, message: 'private-error' };
  };
  await click('modelMonitoring.refresh');
  assert.equal(document.querySelector('pre'), null);
  assert.ok(
    document.body.textContent?.includes('modelMonitoring.metadataUnavailable')
  );
  assert.ok(!document.body.textContent?.includes('private-error'));
  exportResponse = async () => response('authorized-again');
  await click('modelMonitoring.refresh');
  assert.equal(document.querySelector('pre')?.textContent, 'authorized-again');
});
