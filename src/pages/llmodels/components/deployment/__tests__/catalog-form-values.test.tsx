import type { FormInstance } from 'antd';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import test from 'node:test';
import { getCatalogFormValues } from '../catalog-form-values';

for (const hasInitialValues of [false, true]) {
  test(`catalog PD payload clears unmounted fields (initial values: ${hasInitialValues})`, async () => {
    const initialValues = hasInitialValues
      ? {
          backend_parameters: ['--max-seq-len=32768'],
          env: { MINDIE_LOG_LEVEL: 'INFO' },
          worker_selector: { pool: 'ascend' },
          lora_list: [{ lora_name: 'adapter' }],
          extended_kv_cache: { enabled: true }
        }
      : {};
    const dom = new JSDOM('<!doctype html><div id="root"></div>', {
      url: 'http://localhost/'
    });
    const { window } = dom;
    Object.defineProperties(globalThis, {
      window: { configurable: true, value: window },
      document: { configurable: true, value: window.document },
      navigator: { configurable: true, value: window.navigator },
      HTMLElement: { configurable: true, value: window.HTMLElement },
      Element: { configurable: true, value: window.Element },
      Node: { configurable: true, value: window.Node },
      MutationObserver: { configurable: true, value: window.MutationObserver },
      getComputedStyle: { configurable: true, value: window.getComputedStyle },
      IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
    });
    window.matchMedia = (media) => ({
      matches: false,
      media,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => false
    });

    const React = await import('react');
    const { act } = React;
    const { createRoot } = await import('react-dom/client');
    const { Form } = await import('antd');
    const root = createRoot(window.document.getElementById('root')!);
    let form!: FormInstance;
    const Field = () => null;
    const Harness = ({ pd }: { pd: boolean }) => {
      [form] = Form.useForm();
      return (
        <Form
          form={form}
          preserve={false}
          clearOnDestroy
          initialValues={initialValues}
        >
          <Form.Item name="backend">
            <Field />
          </Form.Item>
          {!pd &&
            [
              'backend_parameters',
              'env',
              'worker_selector',
              'lora_list',
              ['extended_kv_cache', 'enabled']
            ].map((name) => (
              <Form.Item key={String(name)} name={name}>
                <Field />
              </Form.Item>
            ))}
        </Form>
      );
    };

    try {
      await act(async () => root.render(<Harness pd={false} />));
      await act(async () => {
        form.setFieldsValue({
          source: 'model_scope',
          model_scope_model_id: 'vllm-ascend/Qwen3-8B-W8A8',
          backend: 'MindIE',
          backend_parameters: ['--max-seq-len=32768'],
          env: { MINDIE_LOG_LEVEL: 'INFO' },
          worker_selector: { pool: 'ascend' }
        });
        form.setFieldsValue({ backend: 'vLLM', backend_parameters: [] });
      });
      const beforePD = form.getFieldsValue();
      await act(async () => {
        form.setFieldValue('backend_parameters', []);
        form.setFieldValue('env', {});
        form.setFieldValue('worker_selector', {});
        form.setFieldValue('lora_list', []);
        form.setFieldValue('extended_kv_cache', { enabled: false });
        form.setFieldValue('roles', [
          { name: 'prefill', backend_parameters: null },
          { name: 'decode', backend_parameters: null }
        ]);
        root.render(<Harness pd={true} />);
      });

      const submitted = await form.validateFields();
      assert.equal(Object.hasOwn(submitted, 'backend_parameters'), false);
      assert.deepEqual(
        form.getFieldValue('backend_parameters'),
        initialValues.backend_parameters
      );
      const payload = getCatalogFormValues(form, submitted);
      assert.equal(payload.backend, 'vLLM');
      assert.deepEqual(payload.backend_parameters, []);
      assert.deepEqual(payload.env, {});
      assert.deepEqual(payload.worker_selector, {});
      assert.deepEqual(payload.lora_list, []);
      assert.equal(payload.extended_kv_cache?.enabled, false);
      assert.equal(payload.gpu_selector, null);
      assert.equal(payload.gpu_type_selector, null);
      assert.equal(payload.source, 'model_scope');
      assert.equal(payload.model_scope_model_id, 'vllm-ascend/Qwen3-8B-W8A8');
      assert.deepEqual(
        getCatalogFormValues(form, form.getFieldsValue()),
        payload
      );

      await act(async () => {
        form.setFieldsValue({ ...beforePD, roles: null });
        root.render(<Harness pd={false} />);
      });
      assert.deepEqual(
        getCatalogFormValues(form, await form.validateFields())
          .backend_parameters,
        []
      );

      await act(async () => {
        form.setFieldsValue({
          model_scope_model_id: 'Qwen/Qwen3-8B',
          backend: 'MindIE',
          backend_parameters: ['--max-seq-len=32768']
        });
      });
      const changedMode = getCatalogFormValues(
        form,
        await form.validateFields()
      );
      assert.equal(changedMode.model_scope_model_id, 'Qwen/Qwen3-8B');
      assert.deepEqual(changedMode.backend_parameters, ['--max-seq-len=32768']);
    } finally {
      await act(async () => root.unmount());
      dom.window.close();
    }
  });
}

test('normalized submit values override raw form roles and selectors', () => {
  const form = {
    getFieldsValue: () => ({
      backend: 'vLLM',
      roles: [
        { name: 'prefill', __injected: { backend_parameters: ['managed'] } }
      ],
      gpu_selector: { gpu_ids: [['worker', 'gpu']] },
      scheduleType: 'manual',
      manualGpuMode: 'full',
      pdMode: 'managed',
      cpu_offloading: false,
      backend_parameters: [],
      env: {}
    })
  };
  const values = {
    roles: [
      { name: 'prefill', backend_parameters: ['--max-model-len=32768'] },
      { name: 'decode', backend_parameters: ['--max-model-len=16384'] }
    ],
    gpu_selector: null,
    scaling_schedule: null
  };
  const result = getCatalogFormValues(form, values as any);
  assert.deepEqual(result.roles, values.roles);
  assert.equal(result.gpu_selector, null);
  assert.equal(result.scaling_schedule, null);
  assert.equal(result.cpu_offloading, false);
  for (const key of ['scheduleType', 'manualGpuMode', 'pdMode']) {
    assert.equal(Object.hasOwn(result, key), false);
  }
});

for (const form of [null, undefined, {}]) {
  test(`catalog values tolerate an unavailable form (${String(form)})`, () => {
    const values = {
      backend: 'vLLM',
      backend_parameters: ['--max-model-len=32768']
    };
    assert.deepEqual(getCatalogFormValues(form, values), values);
  });
}

for (const roles of [null, []]) {
  test(`disabling PD preserves restored model values (${JSON.stringify(roles)})`, () => {
    const parameters = ['--max-model-len=32768'];
    const form = {
      getFieldsValue: () => ({
        roles: [{ name: 'prefill' }, { name: 'decode' }],
        backend_parameters: parameters,
        env: { VLLM_LOGGING_LEVEL: 'INFO' },
        worker_selector: { pool: 'ascend' }
      })
    };
    const values = getCatalogFormValues(form, { roles });
    assert.deepEqual(values.roles, roles);
    assert.deepEqual(values.backend_parameters, parameters);
    assert.deepEqual(values.env, { VLLM_LOGGING_LEVEL: 'INFO' });
    assert.deepEqual(values.worker_selector, { pool: 'ascend' });
  });
}
