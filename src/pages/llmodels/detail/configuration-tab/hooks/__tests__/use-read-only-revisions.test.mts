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
mock.module(
  new URL('../../../hooks/use-monitoring-data.ts', import.meta.url).href,
  {
    namedExports: {
      tenantKey: () => 'tenant-a',
      useMonitoringTenant: () => 'tenant-a'
    }
  }
);
const revision = (number: number) => ({
  id: number,
  model_id: 7,
  revision: number,
  created_at: '2026-11-10T10:00:00Z',
  created_by: 1
});
let listError: number | null;
let listItems: ReturnType<typeof revision>[];
let respondDetail: (number: number) => Promise<any>;
mock.module(
  new URL('../../services/read-only-revisions.ts', import.meta.url).href,
  {
    namedExports: {
      queryReadOnlyRevisions: async () => {
        if (listError) throw { response: { status: listError } };
        return { items: listItems };
      },
      queryReadOnlyRevision: (_id: number, number: number) =>
        respondDetail(number)
    }
  }
);
const { createRoot } = await import('react-dom/client');
const { default: useReadOnlyRevisions } =
  await import('../use-read-only-revisions');
let history: ReturnType<typeof useReadOnlyRevisions>;
const frames: { error: unknown; selected: number | null; detail: unknown }[] =
  [];
const Probe = ({ updatedAt }: { updatedAt: string }) => {
  history = useReadOnlyRevisions({
    id: 7,
    name: 'model',
    updated_at: updatedAt
  } as any);
  frames.push({
    error: history.list?.error,
    selected: history.selected,
    detail: history.detail?.data
  });
  return createElement(
    'div',
    null,
    history.selected,
    JSON.stringify(history.detail?.data?.spec)
  );
};
let renderModel: (updatedAt: string) => Promise<void>;
const mount = async () => {
  listError = null;
  listItems = [revision(3), revision(2)];
  respondDetail = async (number) => ({
    ...revision(number),
    spec: { backend: `private-v${number}` }
  });
  frames.length = 0;
  const root = createRoot(document.getElementById('root')!);
  renderModel = (updatedAt) =>
    act(async () => root.render(createElement(Probe, { updatedAt })));
  await renderModel('2026-11-10T10:00:00Z');
  await act(async () => history.select(3));
  assert.ok(document.body.textContent?.includes('private-v3'));
  return () => act(async () => root.unmount());
};

for (const status of [401, 403, 404]) {
  test(`an opened revision is synchronously hidden after list ${status} and does not revive on retry`, async (t) => {
    t.after(await mount());
    listError = status;
    await act(async () => history.reload());
    assert.equal(history.selected, null);
    assert.equal(history.detail, null);
    assert.ok(!document.body.textContent?.includes('private-v3'));
    assert.ok(
      frames
        .filter((frame) => frame.error)
        .every((frame) => frame.selected === null && !frame.detail),
      'revoked list renders must never retain the previously opened snapshot'
    );
    listError = null;
    await act(async () => history.reload());
    assert.equal(
      history.selected,
      null,
      'successful retry must not reopen the old selection'
    );
    assert.equal(history.detail, null);
    await act(async () => history.select(3));
    assert.ok(
      document.body.textContent?.includes('private-v3'),
      'an explicit new selection remains available after access returns'
    );
  });
}

test('a pending snapshot cannot republish after list revocation and a later authorized retry', async (t) => {
  t.after(await mount());
  let resolve!: (value: any) => void;
  respondDetail = async () =>
    new Promise((done) => {
      resolve = done;
    });
  await act(async () => history.select(2));
  listError = 403;
  await act(async () => history.reload());
  listError = null;
  await act(async () => history.reload());
  await act(async () =>
    resolve({ ...revision(2), spec: { backend: 'late-private-v2' } })
  );
  assert.equal(history.selected, null);
  assert.equal(history.detail, null);
  assert.ok(!document.body.textContent?.includes('late-private-v2'));
});

test('an updated authorized model revalidates revision metadata while preserving an existing selected revision', async (t) => {
  t.after(await mount());
  listItems = [revision(4), revision(3), revision(2)];
  await renderModel('2026-11-10T11:00:00Z');
  assert.equal(history.list?.data?.items[0].revision, 4);
  assert.equal(history.selected, 3);
  assert.ok(document.body.textContent?.includes('private-v3'));
});

test('a selected revision removed by a successful list refresh is forgotten and cannot revive on retry', async (t) => {
  t.after(await mount());
  listItems = [revision(4), revision(2)];
  await renderModel('2026-11-10T11:00:00Z');
  assert.equal(history.selected, null);
  assert.equal(history.detail, null);
  listItems = [revision(4), revision(3), revision(2)];
  await act(async () => history.reload());
  assert.equal(history.selected, null);
});
