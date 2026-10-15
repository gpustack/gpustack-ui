import type { FormInstance } from 'antd';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, Fragment } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

const empty = () => null;
const InputField = ({ value }: any) =>
  createElement('span', null, String(value ?? ''));
mock.module('@gpustack/core-ui', {
  namedExports: {
    AutoTooltip: ({ children }: any) => createElement(Fragment, null, children),
    Input: {
      Input: InputField,
      Number: InputField,
      TextArea: InputField
    },
    Select: InputField,
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
mock.module(new URL('../../../../config/settings.ts', import.meta.url).href, {
  namedExports: { OPENAI_COMPATIBLE: 'v1' }
});
mock.module(
  new URL('../../../cluster-management/config/index.ts', import.meta.url).href,
  {
    namedExports: {
      ClusterStatusLabelMap: {},
      ClusterStatusValueMap: { Ready: 'ready' }
    }
  }
);
mock.module(new URL('../../config/index.ts', import.meta.url).href, {
  namedExports: {
    DeployFormKeyMap: { CATALOG: 'catalog' },
    sourceOptions: []
  }
});
mock.module(
  new URL('../../style/cluster-option.module.less', import.meta.url).href,
  { defaultExport: {} }
);
mock.module(
  new URL('../../../../components/plugin-extra-fields.tsx', import.meta.url)
    .href,
  { defaultExport: empty }
);
for (const file of [
  'backend',
  'catalog',
  'custom-backend',
  'local-path-source',
  'mode-field',
  'online-source'
]) {
  mock.module(new URL(`../${file}.tsx`, import.meta.url).href, {
    defaultExport: empty
  });
}

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
const { FormContext } = await import('../../config/form-context.ts');
const { default: BasicForm } = await import('../basic.tsx');

for (const ordinaryReplicas of [9, 0]) {
  test(`the real BasicForm preserves replicas ${ordinaryReplicas} across its PD field swap`, async () => {
    const root = createRoot(dom.window.document.getElementById('root')!);
    let form!: FormInstance;
    const Harness = ({ pdActive }: { pdActive: boolean }) => {
      [form] = Form.useForm();
      return createElement(
        Form,
        {
          form,
          preserve: false,
          initialValues: {
            replicas: 7,
            name: 'model',
            source: 'local_path',
            cluster_id: 1,
            unrelated: 'initial'
          }
        },
        createElement(
          FormContext.Provider,
          { value: { action: 'edit', formKey: 'catalog' } as any },
          createElement(BasicForm, {
            pdActive,
            clusterList: [],
            handleClusterChange: empty,
            onClusterSeed: empty
          })
        ),
        !pdActive &&
          createElement(
            Form.Item,
            { name: 'unrelated', hidden: true },
            createElement(InputField)
          )
      );
    };
    try {
      await act(async () =>
        root.render(createElement(Harness, { pdActive: false }))
      );
      await act(async () => {
        form.setFieldValue('replicas', ordinaryReplicas);
        form.setFieldValue('unrelated', 'edited');
      });
      // Match the PD action: the owner writes the count before flushSync
      // commits BasicForm's visible/hidden replica-field registrations.
      await act(async () => {
        flushSync(() => {
          form.setFieldValue('replicas', 1);
          root.render(createElement(Harness, { pdActive: true }));
        });
      });
      assert.equal(form.getFieldValue('replicas'), 1);
      assert.equal(form.getFieldValue('unrelated'), 'initial');

      await act(async () => {
        flushSync(() => {
          form.setFieldValue('replicas', ordinaryReplicas);
          root.render(createElement(Harness, { pdActive: false }));
        });
      });
      assert.equal(form.getFieldValue('replicas'), ordinaryReplicas);
      await act(async () => {
        assert.equal(
          (await form.validateFields(['replicas'])).replicas,
          ordinaryReplicas
        );
      });
    } finally {
      await act(async () => root.unmount());
    }
  });
}
