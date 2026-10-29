import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';

const models = [
  { id: 12, name: 'decision-running', state: 'running' },
  { id: 13, name: 'decision-partial', state: 'partial' }
];
const queryModelsList = mock.fn(async (params: Record<string, unknown>) => {
  // The API accepts readiness filters, not Model.state resource values.
  if (params.state !== 'ready') {
    throw new Error('422: invalid model state filter');
  }
  return { items: models };
});
mock.module(new URL('../../../llmodels/apis/index.ts', import.meta.url).href, {
  namedExports: { queryModelsList }
});
mock.module(
  new URL('../../../maas-provider/apis/index.ts', import.meta.url).href,
  { namedExports: { queryMaasProviders: async () => ({ items: [] }) } }
);
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id })
  }
});

const dom = new JSDOM('<!doctype html><div id="root"></div>', {
  url: 'http://localhost/'
});
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
after(() => dom.window.close());

const { default: useDecisionServiceProviders } =
  await import('../use-decision-service-providers.ts');

let result: ReturnType<typeof useDecisionServiceProviders>;
const Harness = () => {
  result = useDecisionServiceProviders();
  return null;
};

test('loads local decision models with the ready filter accepted by the API', async () => {
  const root = createRoot(dom.window.document.getElementById('root')!);
  try {
    await act(async () => root.render(createElement(Harness)));

    assert.equal(queryModelsList.mock.callCount(), 1);
    assert.deepEqual(queryModelsList.mock.calls[0].arguments[0], {
      page: -1,
      categories: 'decision',
      state: 'ready'
    });
    const deployments = result.sourceOptions.find(
      (option) => option.value === 'deployments'
    );
    assert.ok(deployments, 'local deployments are available in the picker');
    assert.deepEqual(
      deployments.children?.map((option) => ({
        label: option.label,
        value: option.value,
        modelId: option.data?.model_id
      })),
      models.map((model) => ({
        label: model.name,
        value: model.id,
        modelId: model.id
      }))
    );
  } finally {
    await act(async () => root.unmount());
  }
});
