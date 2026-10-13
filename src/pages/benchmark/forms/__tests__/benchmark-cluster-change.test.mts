import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const empty = () => null;
const InputField = ({ value }: any) =>
  createElement('span', null, String(value ?? ''));
let clusterSelector: any;
let changeOrganization: (value: number) => void;
const fetchClusters = mock.fn(async () => []);
const scopedClusters = [
  { value: 2, label: 'cluster-two', state: 'ready', owner_principal_id: 2 }
];
const handoff = {};
mock.module('@gpustack/core-ui', {
  namedExports: {
    Input: { Input: InputField, TextArea: InputField },
    Select: (props: any) => {
      clusterSelector = props;
      return createElement(InputField, props);
    },
    useAppUtils: () => ({ getRuleMessage: (_: string, id: string) => id })
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: any) => id })
  }
});
mock.module(new URL('../../../../config/index.ts', import.meta.url).href, {
  namedExports: {
    PageAction: { CREATE: 'create', EDIT: 'edit' },
    modelNameReg: /.+/
  }
});
mock.module(
  new URL('../../../cluster-management/config/index.ts', import.meta.url).href,
  { namedExports: { ClusterStatusValueMap: { Ready: 'ready' } } }
);
mock.module(
  new URL(
    '../../../cluster-management/services/use-query-cluster-list.tsx',
    import.meta.url
  ).href,
  {
    namedExports: {
      useQueryClusterList: () => ({
        clusterList: scopedClusters,
        fetchClusterList: fetchClusters
      })
    }
  }
);
mock.module(
  new URL('../../../llmodels/hooks/use-run-benchmark.ts', import.meta.url).href,
  {
    namedExports: {
      useBenchmarkTargetInstance: () => ({ benchmarkTargetInstance: handoff })
    }
  }
);
// Cluster actions must clear the form themselves, without the target picker's
// initialization effect performing cleanup on a subsequent render.
mock.module(new URL('../model-instance.tsx', import.meta.url).href, {
  defaultExport: empty
});
mock.module(
  new URL('../../../../components/plugin-extra-fields.tsx', import.meta.url)
    .href,
  {
    defaultExport: ({ context }: any) => {
      changeOrganization = context.onChange;
      return createElement(
        Form.Item,
        { name: 'organization_id', hidden: true },
        createElement(InputField)
      );
    }
  }
);

const dom = new JSDOM('<div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  Element: { configurable: true, value: dom.window.Element },
  SVGElement: { configurable: true, value: dom.window.SVGElement },
  Node: { configurable: true, value: dom.window.Node },
  MutationObserver: { configurable: true, value: dom.window.MutationObserver },
  ShadowRoot: { configurable: true, value: dom.window.ShadowRoot },
  getComputedStyle: { configurable: true, value: dom.window.getComputedStyle },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
dom.window.matchMedia = (media) => ({
  matches: false,
  media,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false
});
after(() => dom.window.close());
const { Form } = await import('antd');
const { default: FormContext } = await import('../../config/form-context.ts');
const { default: Basic } = await import('../basic.tsx');

const initialTarget = {
  route_name: 'source-route',
  model_id: 22,
  model_name: 'source-model',
  model_instance_name: 'source-instance',
  model_instance: ['source-model', 'source-instance'],
  dataset_worker_id: 202,
  dataset_worker_name: 'source-worker'
};
const clusters = [
  { value: 1, label: 'cluster-one', state: 'ready' },
  { value: 2, label: 'cluster-two', state: 'ready' }
];
let form: any;
const expectClearedTarget = () => {
  for (const name of Object.keys(initialTarget)) {
    assert.equal(
      form.getFieldValue(name),
      undefined,
      `${name} must clear synchronously`
    );
  }
  assert.equal(form.getFieldValue('name'), 'user-benchmark');
};
const Harness = ({ clusterList }: any) => {
  const [instance] = Form.useForm();
  useEffect(() => {
    form = instance;
  }, [instance]);
  return createElement(
    FormContext.Provider,
    {
      value: {
        action: 'create',
        open: true,
        clusterList,
        profilesOptions: [],
        datasetList: [],
        groupKeys: [],
        onGroupChange() {}
      }
    },
    createElement(
      Form,
      {
        form: instance,
        initialValues: {
          ...initialTarget,
          cluster_id: 1,
          name: 'user-benchmark'
        }
      },
      createElement(Basic)
    )
  );
};
const renderForm = async () => {
  const root = createRoot(dom.window.document.getElementById('root')!);
  const render = async (clusterList: any[] = clusters) => {
    await act(async () => root.render(createElement(Harness, { clusterList })));
  };
  await render();
  for (const [name, value] of Object.entries(initialTarget)) {
    assert.deepEqual(form.getFieldValue(name), value);
  }
  return {
    render,
    unmount: async () => {
      await act(async () => root.unmount());
    }
  };
};

test('the cluster Select clears both target modes and workers before effects flush', async () => {
  const view = await renderForm();
  try {
    await act(async () => {
      clusterSelector.onChange(2);
      assert.equal(form.getFieldValue('cluster_id'), 2);
      expectClearedTarget();
    });
  } finally {
    await view.unmount();
  }
});

test('the organization action clears both target modes and workers before effects flush', async () => {
  const view = await renderForm();
  try {
    await act(async () => {
      form.setFieldValue('organization_id', 2);
      changeOrganization(2);
      expectClearedTarget();
    });
  } finally {
    await view.unmount();
  }
});

test('automatically replacing an invalid cluster clears its target before selecting the replacement', async () => {
  const view = await renderForm();
  try {
    const setFieldValue = form.setFieldValue;
    const replacements = mock.method(
      form,
      'setFieldValue',
      (name: string, value: any) => {
        if (name === 'cluster_id') {
          assert.equal(value, 2);
          expectClearedTarget();
        }
        return setFieldValue(name, value);
      }
    );
    await view.render([{ ...clusters[1], is_default: true }]);
    assert.equal(replacements.mock.callCount(), 1);
    assert.equal(form.getFieldValue('cluster_id'), 2);
    expectClearedTarget();
  } finally {
    await view.unmount();
  }
});
