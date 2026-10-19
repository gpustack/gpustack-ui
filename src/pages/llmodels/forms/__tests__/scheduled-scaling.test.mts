import { atom } from 'jotai';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';

const numberInputs = new Map<string, any>();
const textInputs = new Map<string, any>();
const selectInputs = new Map<string, any>();
let useRealTimePicker = false;
const Field = ({ label, value }: any) =>
  createElement('span', { 'data-field': label }, String(value ?? ''));
mock.module('@gpustack/core-ui', {
  namedExports: {
    Input: {
      Input: (props: any) => {
        textInputs.set(props.label, props);
        return createElement(Field, props);
      }
    },
    InputNumber: (props: any) => {
      numberInputs.set(props.label, props);
      return createElement(Field, props);
    },
    LabelInfo: Field,
    MultipleSelect: Field,
    Select: (props: any) => {
      selectInputs.set(props.label, props);
      return createElement(Field, props);
    },
    TimePicker: ({ label, value, ...props }: any) =>
      useRealTimePicker
        ? createElement(
            'div',
            { 'data-field': label },
            createElement(AntdTimePicker, { ...props, value })
          )
        : createElement(Field, { label, value: value?.format('HH:mm') })
  }
});
mock.module('@umijs/max', {
  namedExports: {
    getLocale: () => 'en-US',
    useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id })
  }
});
mock.module(new URL('../../../../atoms/system.ts', import.meta.url).href, {
  namedExports: { systemConfigAtom: atom({ timezone: 'Asia/Shanghai' }) }
});
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});

const dom = new JSDOM('<div id="root"></div>');
const getStyle = dom.window.getComputedStyle.bind(dom.window);
dom.window.getComputedStyle = (element) => getStyle(element);
// react-dom initializes before JSDOM and uses its legacy input-event fallback.
Object.assign(dom.window.HTMLElement.prototype, {
  attachEvent() {},
  detachEvent() {}
});
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  Element: { configurable: true, value: dom.window.Element },
  SVGElement: { configurable: true, value: dom.window.SVGElement },
  Node: { configurable: true, value: dom.window.Node },
  MutationObserver: { configurable: true, value: dom.window.MutationObserver },
  ResizeObserver: {
    configurable: true,
    value: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  },
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
const {
  Form,
  ConfigProvider,
  TimePicker: AntdTimePicker
} = await import('antd');
after(() => dom.window.close());
const { FormContext } = await import('../../config/form-context.ts');
const { default: ScheduledScalingForm } =
  await import('../scheduled-scaling.tsx');
const { getDeploymentFormReplicas } =
  await import('../../utils/deployment-lifecycle.ts');
const { getScalingSchedulePayload } = await import('../scaling-schedule.ts');

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
      { value: { initialValues, realAction: 'edit' } as any },
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
    assert.equal(
      formInstance.getFieldValue(['scaling_schedule', 'enabled']),
      true
    );
    assert.equal(
      formInstance.getFieldValue([
        'scaling_schedule',
        'rules',
        0,
        'start_cron'
      ]),
      'invalid cron'
    );
    const discard = [
      ...dom.window.document.querySelectorAll('.ant-modal-confirm button')
    ].find(
      (button) => button.textContent === 'common.button.discardChange'
    ) as HTMLElement;
    assert.ok(discard);
    await act(async () => discard.click());
    assert.deepEqual(await payload(), schedule);

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
    assert.equal(
      container
        .querySelector('[data-field="scaling_schedule.config"]')
        ?.hasAttribute('hidden'),
      true
    );
    assert.equal(await payload(), null);
  } finally {
    await act(async () => root.unmount());
  }
});

const savedSchedule = (cron: string) => ({
  enabled: false,
  baseline_replicas: 2,
  rules: [
    { start_cron: cron, duration_seconds: 28800, replicas: 3, name: 'daytime' }
  ]
});

const renderSchedule = async (initialValues: any, realAction = 'edit') => {
  const container = dom.window.document.createElement('div');
  dom.window.document.body.appendChild(container);
  const root = createRoot(container);
  let formInstance!: ReturnType<typeof Form.useForm>[0];
  const Harness = () => {
    const [form] = Form.useForm();
    formInstance = form;
    return createElement(
      ConfigProvider,
      { theme: { token: { motion: false } } },
      createElement(
        FormContext.Provider,
        { value: { initialValues, realAction } as any },
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
      )
    );
  };
  await act(async () => root.render(createElement(Harness)));
  return {
    container,
    get form() {
      return formInstance;
    },
    async toggle() {
      await act(async () =>
        (container.querySelector('[role="switch"]') as HTMLElement).click()
      );
    },
    async payload() {
      let values: any;
      await act(async () => {
        values = await formInstance.validateFields();
      });
      const config = getScalingSchedulePayload(
        values.scaling_schedule,
        values.replicas
      );
      return getScalingSchedulePayload(config, values.replicas);
    },
    async close() {
      await act(async () => root.unmount());
      container.remove();
    }
  };
};

const chooseDraftAction = async (label: string) => {
  const button = [
    ...dom.window.document.querySelectorAll('.ant-modal-confirm button')
  ].find((item) => item.textContent === label) as HTMLElement;
  assert.ok(button, `missing confirmation action: ${label}`);
  await act(async () => button.click());
};

for (const cron of ['0 9 * * * 30', '0 9 * * L5', '@daily']) {
  test(`the form preserves a saved cron without edits and through disable/enable (${cron})`, async () => {
    const original = savedSchedule(cron);
    const view = await renderSchedule({
      replicas: 7,
      scaling_schedule: original
    });
    try {
      assert.deepEqual(await view.payload(), original);
      await view.toggle();
      assert.equal(textInputs.get('models.form.scaling.cron').value, cron);
      assert.equal(
        view.container.textContent?.includes(
          'models.form.scaling.preview.unavailable'
        ),
        cron === '@daily'
      );
      if (cron.endsWith(' 30'))
        assert.ok(view.container.textContent?.includes('09:00:30'));
      assert.deepEqual((await view.payload())?.rules, original.rules);
      await view.toggle();
      assert.deepEqual(await view.payload(), original);
      await view.toggle();
      assert.deepEqual((await view.payload())?.rules, original.rules);
      assert.equal(
        dom.window.document.querySelector('.ant-modal-confirm'),
        null
      );
    } finally {
      await view.close();
    }
  });
}

for (const seconds of [0, 30]) {
  test(`conflict detection uses backend trailing seconds without rewriting rules (${seconds})`, async () => {
    const original = savedSchedule('0 9 * * *');
    original.rules.push({
      ...original.rules[0],
      start_cron: `0 9 * * * ${seconds}`,
      replicas: 4
    });
    const view = await renderSchedule({
      replicas: 5,
      scaling_schedule: original
    });
    try {
      await view.toggle();
      if (seconds === 0) {
        await act(async () => {
          await assert.rejects(view.form.validateFields());
        });
      } else {
        assert.deepEqual((await view.payload())?.rules, original.rules);
      }
      await view.toggle();
      assert.deepEqual(await view.payload(), original);
    } finally {
      await view.close();
    }
  });
}

for (const original of [null, savedSchedule('@daily')]) {
  for (const invalid of ['cron', 'hashedCron', 'replicas']) {
    test(`unconfirmed ${invalid} drafts can be edited or explicitly discarded (${original ? 'saved plan' : 'new plan'})`, async () => {
      const view = await renderSchedule(
        { replicas: 5, scaling_schedule: original },
        original ? 'edit' : 'create'
      );
      try {
        await view.toggle();
        await act(async () => {
          if (invalid === 'replicas') {
            numberInputs
              .get('models.form.scaling.windowReplicas')
              .onChange(null);
          } else {
            selectInputs.get('models.form.scaling.repeat').onChange('cron');
          }
        });
        if (invalid === 'cron' || invalid === 'hashedCron') {
          await act(async () =>
            textInputs.get('models.form.scaling.cron').onChange({
              target: {
                value: invalid === 'hashedCron' ? 'H 9 * * *' : 'invalid cron'
              }
            })
          );
        }
        await view.toggle();
        assert.equal(
          view.form.getFieldValue(['scaling_schedule', 'enabled']),
          true
        );
        const draft = structuredClone(
          view.form.getFieldValue('scaling_schedule')
        );
        await chooseDraftAction('models.form.scaling.draft.edit');
        assert.deepEqual(view.form.getFieldValue('scaling_schedule'), draft);
        await view.toggle();
        await chooseDraftAction('common.button.discardChange');
        assert.equal(view.form.getFieldValue('replicas'), 5);
        assert.deepEqual(await view.payload(), original);
        await view.toggle();
        assert.equal(
          view.form.getFieldValue(['scaling_schedule', 'enabled']),
          true
        );
        if (original)
          assert.deepEqual((await view.payload())?.rules, original.rules);
        const displayedReplicas = numberInputs.get(
          'models.form.scaling.windowReplicas'
        ).value;
        assert.equal(
          displayedReplicas,
          view.form.getFieldValue(['scaling_schedule', 'rules', 0, 'replicas'])
        );
        if (original)
          assert.equal(displayedReplicas, original.rules[0].replicas);
        else assert.equal(displayedReplicas, 1);
        if (original) {
          assert.equal(
            textInputs.get('models.form.scaling.cron').value,
            original.rules[0].start_cron
          );
          assert.equal(
            numberInputs.get('models.form.scaling.duration').value,
            8
          );
        }
      } finally {
        await view.close();
      }
    });
  }
}

test('an unconfirmed disabled draft exposes edit/discard actions and cannot be silently submitted', async () => {
  const draft = savedSchedule('invalid cron');
  const view = await renderSchedule(
    { replicas: 5, scaling_schedule: draft },
    'create'
  );
  try {
    assert.ok(
      view.container.textContent?.includes('models.form.scaling.draft.title')
    );
    await act(async () => {
      await assert.rejects(view.form.validateFields());
    });
    const edit = [...view.container.querySelectorAll('button')].find(
      (button) => button.textContent === 'models.form.scaling.draft.edit'
    ) as HTMLElement;
    await act(async () => edit.click());
    assert.equal(
      view.form.getFieldValue(['scaling_schedule', 'enabled']),
      true
    );
    await view.toggle();
    await chooseDraftAction('common.button.discardChange');
    assert.equal(await view.payload(), null);
  } finally {
    await view.close();
  }
});

test('an incomplete draft stays visible and fails validation until the replicas input is repaired', async () => {
  const view = await renderSchedule({
    replicas: 5,
    scaling_schedule: savedSchedule('0 9 * * *')
  });
  try {
    await view.toggle();
    await act(async () =>
      numberInputs.get('models.form.scaling.windowReplicas').onChange(null)
    );
    await view.toggle();
    await chooseDraftAction('models.form.scaling.draft.edit');
    assert.equal(
      numberInputs.get('models.form.scaling.windowReplicas').value,
      null
    );
    assert.equal(
      view.form.getFieldValue(['scaling_schedule', 'rules', 0, 'replicas']),
      null
    );
    await act(async () => {
      await assert.rejects(view.form.validateFields());
    });
    await act(async () => new Promise((resolve) => setTimeout(resolve, 50)));
    assert.ok(
      view.container.textContent?.includes('models.form.scaling.rules.invalid')
    );
    await act(async () =>
      numberInputs.get('models.form.scaling.windowReplicas').onChange(4)
    );
    assert.equal((await view.payload())?.rules[0].replicas, 4);
    assert.equal(
      numberInputs.get('models.form.scaling.windowReplicas').value,
      4
    );
  } finally {
    await view.close();
  }
});

test('new backend-supported aliases save even when the preview is unavailable', async () => {
  const view = await renderSchedule(
    { replicas: 5, scaling_schedule: null },
    'create'
  );
  try {
    await view.toggle();
    await act(async () =>
      selectInputs.get('models.form.scaling.repeat').onChange('cron')
    );
    await act(async () =>
      textInputs
        .get('models.form.scaling.cron')
        .onChange({ target: { value: '@daily' } })
    );
    assert.ok(
      view.container.textContent?.includes(
        'models.form.scaling.preview.unavailable'
      )
    );
    assert.equal((await view.payload())?.rules[0].start_cron, '@daily');
    await view.toggle();
    assert.equal(dom.window.document.querySelector('.ant-modal-confirm'), null);
    assert.equal((await view.payload())?.rules[0].start_cron, '@daily');
    await view.toggle();
    assert.equal((await view.payload())?.rules[0].start_cron, '@daily');
  } finally {
    await view.close();
  }
});

for (const { repeat, initialCron, expectedCron } of [
  { repeat: 'daily', initialCron: '0 9 * * *', expectedCron: '35 22 * * *' },
  {
    repeat: 'weekly',
    initialCron: '0 9 * * 1,3',
    expectedCron: '35 22 * * 1,3'
  },
  {
    repeat: 'monthly',
    initialCron: '0 9 1,15 * *',
    expectedCron: '35 22 1,15 * *'
  }
]) {
  test(`${repeat} time selections survive closing the picker without confirmation`, async () => {
    useRealTimePicker = true;
    const original = { ...savedSchedule(initialCron), enabled: true };
    const view = await renderSchedule({
      replicas: 2,
      scaling_schedule: original
    });
    const input = (field: string) => {
      const element = view.container.querySelector(
        `[data-field="models.form.scaling.${field}"] input`
      ) as HTMLInputElement;
      assert.ok(element, `missing ${field} input`);
      return element;
    };
    const openPopup = () =>
      dom.window.document.querySelector(
        '.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)'
      ) as HTMLElement | null;
    const selectTime = async (field: string, hour: number, minute: number) => {
      await act(async () => input(field).click());
      const popup = openPopup();
      assert.ok(popup, `missing ${field} popup`);
      assert.ok(
        !popup.querySelector('.ant-picker-ok'),
        'no OK button is required'
      );
      assert.ok(popup.textContent?.includes('models.form.scaling.time.hour'));
      assert.ok(popup.textContent?.includes('models.form.scaling.time.minute'));
      for (const [type, value] of [
        ['hour', hour],
        ['minute', minute]
      ] as const) {
        const option = popup.querySelector(
          `[data-type="${type}"] [data-value="${value}"]`
        ) as HTMLElement;
        assert.ok(option, `missing ${type} ${value}`);
        await act(async () => option.click());
        assert.ok(openPopup(), 'selecting a column must leave the picker open');
      }
      await act(async () => {
        view.container.dispatchEvent(
          new dom.window.MouseEvent('pointerdown', { bubbles: true })
        );
        view.container.dispatchEvent(
          new dom.window.MouseEvent('mousedown', { bubbles: true })
        );
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      assert.ok(!openPopup(), 'clicking outside must close the picker');
    };
    try {
      await selectTime('startTime', 22, 35);
      assert.equal(input('startTime').value, '22:35');
      assert.equal(
        view.form.getFieldValue(['scaling_schedule', 'rules', 0, 'start_cron']),
        expectedCron
      );
      await selectTime('endTime', 3, 20);
      assert.equal(input('startTime').value, '22:35');
      assert.equal(input('endTime').value, '03:20');
      const payload = await view.payload();
      assert.deepEqual(payload, {
        ...original,
        rules: [
          {
            ...original.rules[0],
            start_cron: expectedCron,
            duration_seconds: 17100
          }
        ]
      });
      assert.ok(
        view.container
          .querySelector('.meaning')
          ?.textContent?.includes('22:35 → 03:20')
      );
      assert.ok(
        view.container
          .querySelector('.meaning')
          ?.textContent?.includes('models.form.scaling.nextDayBadge')
      );
      assert.ok(view.container.querySelector('.next-day-badge'));
      assert.match(
        view.container.querySelector('.next-item')?.textContent ?? '',
        /22:35 → .*03:20/
      );
      await act(async () => input('startTime').click());
      assert.equal(
        input('startTime').value,
        '22:35',
        'reopening must retain the selected time'
      );
      assert.ok(
        openPopup()?.querySelector(
          '[data-type="hour"] [data-value="22"].ant-picker-time-panel-cell-selected'
        )
      );
      assert.ok(
        openPopup()?.querySelector(
          '[data-type="minute"] [data-value="35"].ant-picker-time-panel-cell-selected'
        )
      );
    } finally {
      await view.close();
      useRealTimePicker = false;
    }
  });
}
