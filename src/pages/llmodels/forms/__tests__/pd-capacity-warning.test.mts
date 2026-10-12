import type { FormInstance } from 'antd';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { PDModeResolution } from '../../config/types';

const capacityMessage = '当前可用算力放不下这一组';
const mode = {
  name: 'vllm-nixl',
  transport: 'NIXL',
  backends: ['vLLM'],
  gpu_filters: { vendor: 'nvidia' },
  router: {
    membership_update: 'dynamic' as 'dynamic' | 'restart' | 'manual' | undefined
  },
  roles: { prefill: {}, decode: {} }
};
const context = {
  isGGUF: false,
  clusterList: [{ value: 1, ready_workers: 1, gpus: 1 }],
  flatBackendOptions: [
    { value: 'vLLM', isBuiltIn: true, versions: [{ value: '0.29.0' }] }
  ],
  onValuesChange: mock.fn()
};

mock.module('@gpustack/core-ui', {
  namedExports: {
    LabelInfo: ({ label }: any) => createElement('span', null, label),
    Select: ({ value, onChange, options = [], label, description }: any) =>
      createElement(
        'select',
        {
          'aria-label': label,
          title: description,
          value: value ?? '',
          onChange: (event: any) => onChange?.(event.target.value)
        },
        options.map((option: any) =>
          createElement(
            'option',
            { key: option.value, value: option.value },
            option.label
          )
        )
      ),
    useAppUtils: () => ({ getRuleMessage: () => 'required' })
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: { id: string }, values?: any) =>
        id === 'models.pd.admission.infeasible'
          ? `${capacityMessage}（需要 ${values.required}，可用 ${values.available}）`
          : id
    })
  }
});
mock.module('@/atoms/models', { namedExports: { workerListAtom: {} } });
mock.module('jotai', {
  namedExports: {
    useAtomValue: () => [
      {
        cluster_id: 1,
        status: { gpu_devices: [{ vendor: 'nvidia', type: 'cuda' }] }
      }
    ]
  }
});
mock.module(new URL('../../config/form-context.ts', import.meta.url).href, {
  namedExports: { useFormContext: () => context }
});
mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: {
    resolvePDMode: async (): Promise<PDModeResolution> => ({
      mode: mode.name,
      vendor: 'nvidia',
      candidate_vendors: ['nvidia'],
      cluster_vendors: ['nvidia'],
      options: []
    }),
    queryModelSpanningRoles: async () => ({ roles: [], widest_worker_gpus: 1 })
  }
});
mock.module(
  new URL('../../hooks/use-query-pd-modes.ts', import.meta.url).href,
  {
    defaultExport: Object.assign(
      () => ({
        pdModes: [mode],
        getPDModes: async () => [mode],
        buildOptions: () => [
          { value: mode.name, label: 'NIXL', disabled: false }
        ],
        isCustomMode: (name: string) => name === 'custom',
        findMode: (name: string) => (name === mode.name ? mode : undefined)
      }),
      { transportLabel: () => 'NIXL' }
    )
  }
);

const dom = new JSDOM('<!doctype html><body></body>', {
  url: 'http://localhost/'
});
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  navigator: { configurable: true, value: dom.window.navigator },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  SVGElement: { configurable: true, value: dom.window.SVGElement },
  ShadowRoot: { configurable: true, value: dom.window.ShadowRoot },
  Element: { configurable: true, value: dom.window.Element },
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
Object.defineProperty(globalThis, 'matchMedia', {
  configurable: true,
  value: dom.window.matchMedia
});
after(() => dom.window.close());

const { Form } = await import('antd');
const { default: PDDisaggregation } = await import('../pd-disaggregation.tsx');

const renderPD = async (
  props: { enabled?: boolean; disabledReason?: string } = {}
) => {
  const container = dom.window.document.createElement('div');
  dom.window.document.body.append(container);
  const root = createRoot(container);
  let form!: FormInstance;
  const registeredFields = [
    'backend',
    'backend_version',
    'cluster_id',
    'roles'
  ];
  const Field = () => null;
  await act(async () => {
    root.render(
      createElement(
        Form,
        {
          ref: (instance: FormInstance) => {
            form = instance;
          },
          initialValues: {
            backend: 'vLLM',
            backend_version: '0.29.0',
            cluster_id: 1,
            roles:
              props.enabled === false
                ? null
                : [
                    {
                      name: 'prefill',
                      replicas: 1,
                      backend_parameters: ['--gpu-memory-utilization=0.45']
                    },
                    {
                      name: 'decode',
                      replicas: 1,
                      backend_parameters: ['--gpu-memory-utilization=0.45']
                    }
                  ],
            disaggregation: props.enabled === false ? null : { mode: mode.name }
          }
        },
        ...registeredFields.map((name) =>
          createElement(
            Form.Item,
            { key: name, name, hidden: true },
            createElement(Field)
          )
        ),
        createElement(PDDisaggregation, {
          variant: 'toggle',
          disabledReason: props.disabledReason
        }),
        props.enabled !== false &&
          createElement(PDDisaggregation, { variant: 'body' })
      )
    );
  });
  return {
    container,
    form,
    cleanup: async () => {
      await act(async () => root.unmount());
      container.remove();
    }
  };
};

test('a one-card PD form does not infer a two-card capacity shortfall from inventory', async () => {
  const rendered = await renderPD();
  try {
    assert.ok(rendered.container.querySelector('button[role="switch"]'));
    assert.ok(rendered.container.querySelector('[data-field="pdMode"]'));
    assert.equal(
      rendered.container.textContent?.includes(capacityMessage),
      false
    );
    await act(async () => {
      for (const index of [0, 1]) {
        rendered.form.setFieldValue(
          ['roles', index, 'backend_parameters'],
          ['--gpu-memory-utilization=0.3']
        );
      }
    });
    assert.equal(
      rendered.container.textContent?.includes(capacityMessage),
      false
    );
    assert.equal(
      rendered.container
        .querySelector('button[role="switch"]')
        ?.hasAttribute('disabled'),
      false
    );
    await act(async () => {
      rendered.container
        .querySelector('button[role="switch"]')
        ?.dispatchEvent(
          new dom.window.MouseEvent('mouseover', { bubbles: true })
        );
      await new Promise((resolve) => setTimeout(resolve, 150));
    });
    assert.equal(
      dom.window.document.body.textContent?.includes(capacityMessage),
      false
    );
  } finally {
    await rendered.cleanup();
  }
});

test('a capability restriction still disables enabling PD and explains why', async () => {
  const rendered = await renderPD({
    enabled: false,
    disabledReason: 'unsupported capability'
  });
  try {
    assert.equal(
      rendered.container
        .querySelector('button[role="switch"]')
        ?.hasAttribute('disabled'),
      true
    );
    await act(async () => {
      rendered.container
        .querySelector('button[role="switch"]')
        ?.dispatchEvent(
          new dom.window.MouseEvent('mouseover', { bubbles: true })
        );
      await new Promise((resolve) => setTimeout(resolve, 150));
    });
    assert.ok(
      dom.window.document.body.textContent?.includes('unsupported capability')
    );
  } finally {
    await rendered.cleanup();
  }
});

for (const policy of ['dynamic', 'restart', 'manual', undefined] as const) {
  test(`transport help includes the ${policy ?? 'unknown'} membership policy without a separate notice`, async () => {
    mode.router.membership_update = policy;
    const rendered = await renderPD();
    try {
      const description = rendered.container
        .querySelector('select[aria-label="models.form.pd.mode"]')
        ?.getAttribute('title');
      assert.equal(
        description,
        [
          'models.form.pd.mode.tips',
          policy ? `models.pd.membership.${policy}` : undefined
        ]
          .filter(Boolean)
          .join(' ')
      );
      assert.equal(
        rendered.container.textContent?.includes('models.pd.membership.'),
        false
      );
    } finally {
      await rendered.cleanup();
      mode.router.membership_update = 'dynamic';
    }
  });
}

for (const roles of [undefined, null, []]) {
  test(`membership role conversion accepts ${JSON.stringify(roles)} when PD is disabled`, async () => {
    const { rolesFormToPayload } = await import('../roles/transform.ts');
    assert.equal(rolesFormToPayload(roles, {}), null);
  });
}
