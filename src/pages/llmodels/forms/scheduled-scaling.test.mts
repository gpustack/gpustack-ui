import { atom } from 'jotai';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';

const numberInputs = new Map<string, any>();
const Field = ({ label, value }: any) =>
  createElement('span', { 'data-field': label }, String(value ?? ''));
mock.module('@gpustack/core-ui', {
  namedExports: {
    Input: { Input: Field },
    InputNumber: (props: any) => {
      numberInputs.set(props.label, props);
      return createElement(Field, props);
    },
    LabelInfo: Field,
    MultipleSelect: Field,
    Select: Field,
    TimePicker: ({ label, value }: any) =>
      createElement(Field, { label, value: value?.format('HH:mm') })
  }
});
mock.module('@umijs/max', {
  namedExports: {
    getLocale: () => 'en-US',
    useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id })
  }
});
mock.module(new URL('../../../atoms/system.ts', import.meta.url).href, {
  namedExports: { systemConfigAtom: atom({ timezone: 'Asia/Shanghai' }) }
});
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});

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
const { Form } = await import('antd');
const { FormContext } = await import('../config/form-context.ts');
const { default: ScheduledScalingForm } =
  await import('./scheduled-scaling.tsx');
const { getDeploymentFormReplicas } =
  await import('../utils/deployment-lifecycle.ts');
const { getScalingSchedulePayload } = await import('./scaling-schedule.ts');

test('schedule details show only while enabled and hidden configuration survives submission', async () => {
  const container = dom.window.document.getElementById('root')!;
  const root = createRoot(container);
  let formInstance!: ReturnType<typeof Form.useForm>[0];
  const schedule = {
    enabled: false,
    baseline_replicas: 2,
    rules: [
      {
        start_cron: '0 9 * * *',
        duration_seconds: 28800,
        replicas: 3,
        name: 'daytime'
      }
    ]
  };
  const Harness = ({ initialValues }: any) => {
    const [form] = Form.useForm();
    formInstance = form;
    return createElement(
      FormContext.Provider,
      { value: { initialValues } as any },
      createElement(
        Form,
        {
          form,
          preserve: false,
          initialValues: {
            ...initialValues,
            replicas: getDeploymentFormReplicas(initialValues)
          }
        },
        createElement(
          Form.Item,
          { name: 'replicas' },
          createElement('input', { type: 'number' })
        ),
        createElement(ScheduledScalingForm)
      )
    );
  };
  const toggle = () =>
    (container.querySelector('[role="switch"]') as HTMLElement).click();
  const baselineText = () =>
    container.querySelector('.baseline-summary .value')?.textContent;
  const payload = async () => {
    let fields: any;
    await act(async () => {
      fields = await formInstance.validateFields();
    });
    return getScalingSchedulePayload(fields.scaling_schedule, fields.replicas);
  };

  try {
    await act(async () =>
      root.render(
        createElement(Harness, {
          initialValues: { replicas: 0, scaling_schedule: schedule }
        })
      )
    );
    assert.equal(
      container.querySelector('[role="switch"]')?.getAttribute('aria-checked'),
      'false'
    );
    assert.equal(
      container
        .querySelector('[data-field="scaling_schedule.config"]')
        ?.hasAttribute('hidden'),
      true
    );
    assert.equal(baselineText(), '2');
    assert.ok(
      container.querySelector(
        '[data-field="models.form.scaling.windowReplicas"]'
      )
    );
    assert.equal(
      container.querySelector('[data-field="models.form.scaling.startTime"]')
        ?.textContent,
      '09:00'
    );
    assert.deepEqual(await payload(), schedule);

    await act(async () => toggle());
    assert.equal(
      container
        .querySelector('[data-field="scaling_schedule.config"]')
        ?.hasAttribute('hidden'),
      false
    );
    await act(async () =>
      numberInputs.get('models.form.scaling.windowReplicas').onChange(4)
    );
    const edited = await payload();
    assert.equal(edited?.rules[0].replicas, 4);
    assert.equal(edited?.rules[0].name, 'daytime');
    assert.equal(edited?.enabled, true);
    await act(async () => toggle());
    assert.equal(
      container
        .querySelector('[data-field="scaling_schedule.config"]')
        ?.hasAttribute('hidden'),
      true
    );
    assert.equal((await payload())?.rules[0].replicas, 4);

    await act(async () => toggle());
    assert.equal(formInstance.getFieldValue('replicas'), 2);
    await act(async () => formInstance.setFieldValue('replicas', 5));
    await act(async () => toggle());
    assert.equal(formInstance.getFieldValue('replicas'), 0);
    assert.equal(baselineText(), '5');
    await act(async () => formInstance.setFieldValue('replicas', 7));
    assert.equal(baselineText(), '5');
    assert.equal((await payload())?.baseline_replicas, 5);
    await act(async () => toggle());
    assert.equal(formInstance.getFieldValue('replicas'), 5);
    await act(async () => toggle());
    assert.equal(formInstance.getFieldValue('replicas'), 7);

    await act(async () =>
      formInstance.setFieldValue(['scaling_schedule', 'rules'], [])
    );
    assert.equal(container.querySelector('.rules-error'), null);
    assert.deepEqual((await payload())?.rules, []);

    await act(async () =>
      root.render(
        createElement(Harness, {
          key: 'enabled',
          initialValues: {
            replicas: 3,
            scaling_schedule: { ...schedule, enabled: true }
          }
        })
      )
    );
    assert.equal(formInstance.getFieldValue('replicas'), 2);
    await act(async () => toggle());
    assert.equal(formInstance.getFieldValue('replicas'), 3);
    assert.equal((await payload())?.baseline_replicas, 2);
    await act(async () => toggle());
    await act(async () =>
      formInstance.setFieldValue(['scaling_schedule', 'rules'], [])
    );
    await act(async () => {
      await assert.rejects(formInstance.validateFields());
    });

    await act(async () =>
      root.render(
        createElement(Harness, {
          key: 'zero-baseline',
          initialValues: {
            replicas: 5,
            scaling_schedule: { ...schedule, baseline_replicas: 0 }
          }
        })
      )
    );
    await act(async () => toggle());
    assert.equal(formInstance.getFieldValue('replicas'), 0);
    await act(async () => toggle());
    assert.equal(formInstance.getFieldValue('replicas'), 5);
    assert.equal((await payload())?.baseline_replicas, 0);

    await act(async () =>
      root.render(
        createElement(Harness, {
          key: 'paused-manual',
          initialValues: {
            replicas: 0,
            scaling_schedule: schedule
          }
        })
      )
    );
    assert.equal(formInstance.getFieldValue('replicas'), 0);
    assert.deepEqual(await payload(), schedule);
    await act(async () => toggle());
    assert.equal(formInstance.getFieldValue('replicas'), 2);
    await act(async () => toggle());
    assert.equal(formInstance.getFieldValue('replicas'), 0);

    await act(async () =>
      root.render(
        createElement(Harness, {
          key: 'paused-scheduled',
          initialValues: {
            replicas: 0,
            scaling_schedule: { ...schedule, enabled: true, paused: true }
          }
        })
      )
    );
    assert.equal(formInstance.getFieldValue('replicas'), 2);
    await act(async () => toggle());
    assert.equal(formInstance.getFieldValue('replicas'), 0);
    assert.equal((await payload())?.enabled, false);

    await act(async () => toggle());
    await act(async () => {
      numberInputs.get('models.form.scaling.windowReplicas').onChange(null);
      formInstance.setFieldValue(
        ['scaling_schedule', 'rules', 0, 'start_cron'],
        'invalid cron'
      );
      formInstance.setFieldValue(
        ['scaling_schedule', 'rules', 0, 'duration_seconds'],
        0
      );
    });
    await act(async () => toggle());
    const disabledDraft = await payload();
    assert.equal(disabledDraft?.enabled, false);
    assert.equal(disabledDraft?.baseline_replicas, 2);
    assert.equal(disabledDraft?.rules[0].name, 'daytime');
    assert.equal(disabledDraft?.rules[0].start_cron, '');
    assert.equal(disabledDraft?.rules[0].replicas, 0);
    assert.equal(disabledDraft?.rules[0].duration_seconds, null);

    await act(async () =>
      root.render(
        createElement(Harness, {
          key: 'empty',
          initialValues: {
            replicas: 1,
            scaling_schedule: { enabled: false, rules: [] }
          }
        })
      )
    );
    assert.equal(container.querySelector('.baseline-summary'), null);
    assert.equal(await payload(), null);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});
