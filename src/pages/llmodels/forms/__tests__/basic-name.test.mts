import type { FormInstance } from 'antd';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement, Fragment } from 'react';
import { createRoot } from 'react-dom/client';

const empty = () => null;
const InputField = ({ value, onChange, label, description }: any) =>
  createElement(
    'label',
    null,
    createElement('span', { 'data-description': label }, description),
    createElement('input', {
      'aria-label': label,
      value: value ?? '',
      onChange
    })
  );
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

const routeNameMessage = 'models.form.rules.nameWithRoute';
const ordinaryNameMessage = 'models.form.rules.name';

const renderForm = async ({
  name = '31231213',
  enableModelRoute = true,
  action = 'create',
  realAction = action,
  formKey = 'deployment'
} = {}) => {
  const container = dom.window.document.getElementById('root')!;
  const root = createRoot(container);
  let form!: FormInstance;
  const Harness = () => {
    [form] = Form.useForm();
    return createElement(
      Form,
      {
        form,
        initialValues: {
          name,
          enable_model_route: enableModelRoute,
          source: 'local_path',
          cluster_id: 1,
          replicas: 1
        }
      },
      createElement(
        FormContext.Provider,
        { value: { action, realAction, formKey } as any },
        createElement(BasicForm, {
          clusterList: [],
          handleClusterChange: empty,
          onClusterSeed: empty
        })
      ),
      createElement(
        Form.Item,
        { name: 'enable_model_route', valuePropName: 'checked' },
        createElement('input', { type: 'checkbox', 'aria-label': 'route' })
      )
    );
  };
  await act(async () => root.render(createElement(Harness)));
  return {
    form,
    description: () =>
      container.querySelector('[data-description="common.table.name"]')
        ?.textContent,
    toggleRoute: async () => {
      await act(async () => {
        container
          .querySelector<HTMLInputElement>('[aria-label="route"]')!
          .click();
      });
      // Ant Form schedules dependency validation after a frame. Wait for
      // that validation rather than invoking validateFields ourselves.
      await act(async () => {
        for (let attempt = 0; attempt < 50; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          if (!form.isFieldValidating('name')) return;
        }
        assert.fail('Name dependency validation did not finish');
      });
    },
    unmount: async () => {
      await act(async () => root.unmount());
    }
  };
};

const expectValidName = async (form: FormInstance, name: string) => {
  await act(async () => {
    assert.equal((await form.validateFields(['name'])).name, name);
  });
};

const expectInvalidName = async (form: FormInstance, message: string) => {
  await act(async () => {
    await assert.rejects(form.validateFields(['name']), (error: any) => {
      assert.deepEqual(error.errorFields[0].name, ['name']);
      assert.deepEqual(error.errorFields[0].errors, [message]);
      return true;
    });
  });
};

for (const formKey of ['deployment', 'catalog']) {
  test(`${formKey}: switching automatic routing updates the name hint and validation immediately`, async () => {
    const rendered = await renderForm({ formKey });
    const { form, description, toggleRoute, unmount } = rendered;
    try {
      assert.equal(description(), routeNameMessage);
      await expectInvalidName(form, routeNameMessage);

      await toggleRoute();
      assert.equal(form.getFieldValue('enable_model_route'), false);
      assert.equal(description(), ordinaryNameMessage);
      assert.deepEqual(form.getFieldError('name'), []);
      await expectValidName(form, '31231213');

      await toggleRoute();
      assert.equal(form.getFieldValue('enable_model_route'), true);
      assert.equal(description(), routeNameMessage);
      assert.deepEqual(form.getFieldError('name'), [routeNameMessage]);

      await toggleRoute();
      assert.deepEqual(form.getFieldError('name'), []);
      await expectValidName(form, '31231213');
    } finally {
      await unmount();
    }
  });
}

test('turning on routing validates an initially unedited numeric deployment name', async () => {
  const { form, toggleRoute, unmount } = await renderForm({
    enableModelRoute: false
  });
  try {
    assert.deepEqual(form.getFieldError('name'), []);
    await toggleRoute();
    assert.deepEqual(form.getFieldError('name'), [routeNameMessage]);
  } finally {
    await unmount();
  }
});

test('copying a deployment enforces the route rule, while editing keeps existing numeric names valid', async () => {
  for (const realAction of ['copy', 'edit']) {
    const { form, description, unmount } = await renderForm({
      action: 'edit',
      realAction
    });
    try {
      if (realAction === 'copy') {
        assert.equal(description(), routeNameMessage);
        await expectInvalidName(form, routeNameMessage);
      } else {
        assert.equal(description(), ordinaryNameMessage);
        await expectValidName(form, '31231213');
      }
    } finally {
      await unmount();
    }
  }
});

test('automatic routes accept letter-prefixed names and retain other deployment name constraints', async () => {
  const { form, unmount } = await renderForm();
  try {
    for (const name of ['Q', 'Qwen3-0.6B', 'qwen_3', `Q${'a'.repeat(61)}3`]) {
      await act(async () => form.setFieldValue('name', name));
      await expectValidName(form, name);
    }
    for (const name of [
      '3-model',
      '31231213',
      '_model',
      '-model',
      'Qwen/model',
      'Qwen_',
      'Q'.repeat(64)
    ]) {
      await act(async () => form.setFieldValue('name', name));
      await expectInvalidName(form, routeNameMessage);
    }
  } finally {
    await unmount();
  }
});

test('disabling automatic routing preserves numeric names without relaxing other model name rules', async () => {
  const { form, unmount } = await renderForm({ enableModelRoute: false });
  try {
    for (const name of ['1', '31231213', '3-model', 'Qwen3-0.6B']) {
      await act(async () => form.setFieldValue('name', name));
      await expectValidName(form, name);
    }
    for (const name of ['Qwen/model', '_model', 'model-', '3'.repeat(64)]) {
      await act(async () => form.setFieldValue('name', name));
      await expectInvalidName(form, ordinaryNameMessage);
    }
  } finally {
    await unmount();
  }
});

test('switching routing also refreshes errors for generally invalid deployment names', async () => {
  const { form, description, toggleRoute, unmount } = await renderForm({
    name: 'Qwen/model'
  });
  try {
    await expectInvalidName(form, routeNameMessage);
    await toggleRoute();
    assert.equal(description(), ordinaryNameMessage);
    assert.deepEqual(form.getFieldError('name'), [ordinaryNameMessage]);
    await toggleRoute();
    assert.equal(description(), routeNameMessage);
    assert.deepEqual(form.getFieldError('name'), [routeNameMessage]);
  } finally {
    await unmount();
  }
});
