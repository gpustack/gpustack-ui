import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { PDMode } from '../../config/types';

let listProps: any;
let locale = 'en-US';
const externalBackendLinks: Record<string, string> = {
  vLLM: 'https://docs.vllm.ai/en/stable/cli/serve.html',
  SGLang: 'https://docs.sglang.io/docs/advanced_features/server_arguments',
  'llama-box': 'https://github.com/gpustack/llama-box?tab=readme-ov-file#usage',
  operator:
    'https://docs.gpustack.ai/gpustack-operator/main/docs/operate/migration/'
};
mock.module('@gpustack/core-ui', {
  namedExports: {
    AutoComplete: (props: any) =>
      createElement('input', {
        value: props.value,
        'data-status': Form.Item.useStatus().status,
        onChange: props.onInput
      }),
    ListInput: (props: any) => {
      listProps = props;
      return createElement(
        'div',
        null,
        props.description,
        ...(props.value || []).map((value: string, index: number) =>
          createElement(
            'div',
            { key: index },
            props.renderItem?.(
              { value },
              {
                onChange: (next: string) =>
                  props.onChange(
                    props.value.map((v: string, i: number) =>
                      i === index ? next : v
                    )
                  )
              }
            )
          )
        )
      );
    }
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      locale,
      formatMessage: ({ id }: { id: string }, values?: any) =>
        values ? `${values.backend} <a href="${values.link}">docs</a>` : id
    })
  }
});
mock.module(new URL('../../config/index.ts', import.meta.url).href, {
  namedExports: {
    backendParamsHolderTips: {
      vLLM: { holder: 'models.form.backend_parameters.vllm.placeholder' },
      SGLang: { holder: 'models.form.backend_parameters.sglang.placeholder' }
    },
    getBackendParamsTips: (backend: string) =>
      backend === 'Ascend MindIE'
        ? {
            backend,
            documentationPath:
              'user-guide/built-in-inference-backends/?h=parameters+reference#parameters-reference_2'
          }
        : { backend, link: externalBackendLinks[backend] }
  }
});

const dom = new JSDOM('<div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  getComputedStyle: { configurable: true, value: dom.window.getComputedStyle },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  Element: { configurable: true, value: dom.window.Element },
  navigator: { configurable: true, value: dom.window.navigator },
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
const { FormContext } = await import('../../config/form-context.ts');
const { default: BackendParametersList } =
  await import('../backend-parameters-list.tsx');

test('parameter hints follow the router executable while engine roles retain engine hints', async () => {
  const container = dom.window.document.getElementById('root')!;
  const root = createRoot(container);
  const onValuesChange = mock.fn();
  let currentForm: any;
  const commonParameter = '--engine-only-parameter';
  const render = async (backend: string, router?: PDMode['router']) => {
    await act(async () => {
      root.render(
        createElement(
          FormContext.Provider,
          {
            value: {
              flatBackendOptions: [
                { value: backend, common_parameters: [commonParameter] }
              ],
              onValuesChange
            } as any
          },
          createElement(
            Form,
            {
              key: backend,
              initialValues: { backend },
              ref: (instance: any) => {
                currentForm = instance;
              }
            },
            createElement(
              Form.Item,
              { name: 'backend', hidden: true },
              createElement('input')
            ),
            createElement(BackendParametersList, {
              namePrefix: ['roles', 0],
              router
            })
          )
        )
      );
    });
  };
  const option = (flag: string) =>
    listProps.options.find((item: any) => item.value === flag);
  const choices = (flag: string) =>
    option(flag)?.opts?.map((item: any) => item.value);

  try {
    await render('vLLM', { entrypoint: ['vllm-router'] });
    assert.match(container.innerHTML, /vLLM Router/);
    assert.match(
      container.innerHTML,
      /https:\/\/github.com\/vllm-project\/router\//
    );
    assert.equal(
      listProps.placeholder,
      'models.form.backend_parameters.router.placeholder'
    );
    assert.ok(option('--request-timeout-secs'));
    assert.ok(option('--vllm-pd-disaggregation'));
    assert.ok(choices('--prefill-policy').includes('consistent_hash'));
    assert.equal(option('--max-model-len'), undefined);
    assert.equal(option(commonParameter), undefined);
    assert.equal(option('--prefill'), undefined);
    assert.equal(option('--decode'), undefined);
    listProps.onBlur();
    assert.equal(onValuesChange.mock.callCount(), 1);

    // The executable determines the hints even when the model backend differs.
    await render('vLLM', {
      entrypoint: ['python3', '-m', 'sglang_router.launch_router'],
      tunable_args: [
        { flag: '--prefill-policy', options: ['random', 'bucket'] },
        { flag: '--recipe-option', options: ['enabled'] }
      ]
    });
    assert.match(container.innerHTML, /SGLang Router/);
    assert.match(container.innerHTML, /sgl_model_gateway/);
    assert.ok(option('--pd-disaggregation'));
    assert.ok(option('--dp-aware'));
    assert.deepEqual(choices('--prefill-policy'), ['random', 'bucket']);
    assert.deepEqual(choices('--recipe-option'), ['enabled']);
    assert.equal(option('--vllm-pd-disaggregation'), undefined);
    assert.equal(option('--context-length'), undefined);
    assert.equal(option(commonParameter), undefined);

    for (const router of [
      null,
      { protocol: 'user_provided' },
      { entrypoint: ['other-router'] }
    ]) {
      await render('SGLang', router);
      assert.deepEqual(listProps.options, []);
      assert.equal(listProps.placeholder, '');
      assert.equal(container.querySelector('a'), null);
    }

    for (const [backend, flag, placeholder] of [
      ['vLLM', '--max-model-len', 'vllm'],
      ['SGLang', '--context-length', 'sglang']
    ]) {
      await render(backend);
      assert.ok(option(flag));
      assert.ok(option(commonParameter));
      assert.equal(
        listProps.placeholder,
        `models.form.backend_parameters.${placeholder}.placeholder`
      );
      assert.equal(
        container.querySelector('a')?.getAttribute('href'),
        externalBackendLinks[backend]
      );
    }

    await render('vLLM');
    await act(async () => {
      listProps.onChange([
        '--data-parallel-external-lb',
        '--data-parallel-multi-port-external-lb',
        '--max-model-len=4096'
      ]);
    });
    await act(async () => {
      await assert.rejects(currentForm.validateFields(), (error: any) => {
        assert.deepEqual(error.errorFields[0].errors, [
          'models.form.external.conflict'
        ]);
        return true;
      });
    });
    const statuses = [...container.querySelectorAll('input[data-status]')].map(
      (input) => input.getAttribute('data-status')
    );
    assert.deepEqual(statuses, ['error', 'error', '']);
    assert.doesNotMatch(
      container.textContent!,
      /models.form.external.help|models.form.smg.policy.help/
    );
    await act(async () => {
      listProps.onChange(['--data-parallel-size=4']);
    });
    await currentForm.validateFields();

    for (const [language, prefix] of [
      ['en-US', ''],
      ['zh-CN', 'zh/'],
      ['ja-JP', 'ja/'],
      ['ru-RU', 'ru/'],
      ['tr-TR', 'tr/'],
      ['fr-FR', '']
    ]) {
      locale = language;
      await render('Ascend MindIE');
      assert.equal(
        container.querySelector('a')?.getAttribute('href'),
        `/help/${prefix}user-guide/built-in-inference-backends/?h=parameters+reference#parameters-reference_2`
      );

      for (const [backend, link] of Object.entries(externalBackendLinks)) {
        await render(backend);
        assert.equal(container.querySelector('a')?.getAttribute('href'), link);
      }

      await render('Ascend MindIE', { entrypoint: ['vllm-router'] });
      assert.equal(
        container.querySelector('a')?.getAttribute('href'),
        'https://github.com/vllm-project/router/'
      );
    }
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
  }
});

test('external modes are mutually exclusive with either CLI argument spelling', async () => {
  const { hasConflictingExternalLB } =
    await import('../../constants/backend-parameters/vllm.ts');
  assert.equal(hasConflictingExternalLB(['--data-parallel-size=4']), false);
  assert.equal(
    hasConflictingExternalLB(['--data-parallel-external-lb']),
    false
  );
  assert.equal(
    hasConflictingExternalLB([
      '--data-parallel-external-lb',
      '--data-parallel-multi-port-external-lb'
    ]),
    true
  );
  assert.equal(
    hasConflictingExternalLB([
      '--data-parallel-external-lb=true --data-parallel-multi-port-external-lb'
    ]),
    true
  );
});

test('external aliases conflict only as independent flags, including mixed spellings', async () => {
  const { hasConflictingExternalLB } =
    await import('../../constants/backend-parameters/vllm.ts');
  for (const parameters of [
    ['-dpe', '-dpm'],
    ['-dpe --data-parallel-multi-port-external-lb'],
    ['--data-parallel-external-lb', '-dpm'],
    ['-dpe=true', '-dpm=true']
  ])
    assert.equal(
      hasConflictingExternalLB(parameters),
      true,
      JSON.stringify(parameters)
    );
  for (const parameters of [
    [
      '--data-parallel-external-lb',
      '--chat-template="example --data-parallel-multi-port-external-lb"'
    ],
    [
      '--data-parallel-external-lb',
      '--chat-template "example --data-parallel-multi-port-external-lb"'
    ],
    ['-dpe', '--metadata={"description":"example -dpm"}'],
    ['-dpe', 'opaque value -dpm'],
    ['-dpn=0', '-dpr=0', '--data-parallel-size=4']
  ])
    assert.equal(
      hasConflictingExternalLB(parameters),
      false,
      JSON.stringify(parameters)
    );
});
