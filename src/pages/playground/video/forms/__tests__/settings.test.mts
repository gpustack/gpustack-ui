import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { act, createElement } from 'react';

mock.module(new URL('../video-size-fields.module.less', import.meta.url).href, {
  defaultExport: {}
});
mock.module(
  new URL('../advanced-parameters-field.module.less', import.meta.url).href,
  { defaultExport: {} }
);

mock.module(
  new URL(
    '../../../../_components/option-radio-group/index.module.less',
    import.meta.url
  ).href,
  { defaultExport: {} }
);

let changeReference: (event: { target: { value: string } }) => void;
let changeAdvanced: (value: string) => void;
let editorProps: import('@gpustack/core-ui/json-editor').JsonEditorProps;
let darkTheme = false;
const mediaChanges: Record<string, (value: string) => void> = {};
let AntForm: (typeof import('antd'))['Form'];
mock.module('@gpustack/core-ui', {
  namedExports: {
    IconFont: () => null,
    LabelInfo: ({ label, required }: any) =>
      createElement(
        'span',
        { className: 'label-text' },
        label,
        required ? '﹡' : ''
      ),
    InputNumber: ({ value, onChange, disabled }: any) =>
      createElement('input', {
        type: 'number',
        value: value ?? '',
        disabled,
        'data-testid': 'seed',
        onChange: (event: any) =>
          onChange(
            event.target.value === '' ? null : Number(event.target.value)
          )
      }),
    CheckboxField: ({ checked, onChange, label }: any) =>
      createElement(
        'label',
        null,
        createElement('input', {
          type: 'checkbox',
          checked,
          onChange,
          'data-testid': 'random-seed'
        }),
        label
      ),
    Select: ({ value, onChange, options = [], label }: any) => {
      const { status } = AntForm.Item.useStatus();
      return createElement(
        'select',
        {
          value,
          'data-testid': 'media-type',
          'aria-label': label,
          'data-validation-status': status,
          onChange: (event: any) => onChange(event.target.value)
        },
        options.map((option: any) =>
          createElement(
            'option',
            { key: option.value, value: option.value },
            option.label
          )
        )
      );
    },
    CollapsePanel: ({ items, activeKey, onChange }: any) =>
      createElement(
        'div',
        {
          'data-testid': 'advanced-settings',
          'data-open': activeKey.includes(items[0].key)
        },
        createElement('button', {
          type: 'button',
          'data-testid': 'toggle-advanced',
          onClick: () =>
            onChange(activeKey.includes(items[0].key) ? [] : [items[0].key])
        }),
        items[0].children
      )
  }
});
mock.module('@gpustack/core-ui/json-editor', {
  namedExports: {
    JsonEditor: (props: typeof editorProps) => {
      editorProps = props;
      changeAdvanced = (value) => props.onChange?.(value, {} as any);
      return createElement('textarea', { value: props.value, readOnly: true });
    }
  }
});
mock.module(new URL('../../../../../atoms/settings.ts', import.meta.url).href, {
  namedExports: { userSettingsHelperAtom: {} }
});
mock.module('jotai', {
  namedExports: { useAtomValue: () => ({ isDarkTheme: darkTheme }) }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: { id: string }, values?: { keys?: string }) =>
        values?.keys ? `${id}: ${values.keys}` : id
    }),
    useSearchParams: () => [new URLSearchParams()]
  }
});
mock.module('ahooks', {
  namedExports: { useMemoizedFn: (fn: (...args: any[]) => any) => fn }
});
mock.module(new URL('../../../../../utils/index.ts', import.meta.url).href, {
  namedExports: { generateRandomNumber: () => 1234 }
});
mock.module(
  new URL('../../../components/model-select.tsx', import.meta.url).href,
  {
    defaultExport: () =>
      createElement(
        AntForm.Item,
        { name: 'model', hidden: true },
        createElement('input', { type: 'hidden' })
      )
  }
);
mock.module(
  new URL('../../../components/params-fields.tsx', import.meta.url).href,
  {
    defaultExport: ({ paramsConfig = [] }: any) =>
      createElement(
        'div',
        { 'data-testid': 'parameter-fields' },
        paramsConfig.map((item: any) =>
          createElement(
            AntForm.Item,
            {
              key: item.name,
              name: item.name,
              rules: item.rules,
              getValueProps: (value: unknown) => ({ value: value ?? '' }),
              extra: item.description?.text
            },
            item.type === 'Select'
              ? createElement(
                  'select',
                  { 'data-testid': item.name, disabled: item.disabled },
                  (item.options || []).map((option: any) =>
                    createElement(
                      'option',
                      { key: option.value, value: option.value },
                      option.label
                    )
                  )
                )
              : createElement('input', {
                  'data-testid': item.name,
                  type: 'number'
                })
          )
        )
      )
  }
);
mock.module(new URL('../reference-media-input.tsx', import.meta.url).href, {
  defaultExport: ({ value, onChange, id, label }: any) => {
    const change = (event: any) => onChange(event.target.value);
    changeReference = change;
    mediaChanges[id || label] = onChange;
    return createElement('input', {
      id,
      'data-testid': id || label,
      value: value ?? '',
      onChange: change
    });
  }
});

test('video settings follow task capabilities, hide single-task selection and validate reference inputs', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    pretendToBeVisual: true
  });
  const values = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    SVGElement: dom.window.SVGElement,
    Element: dom.window.Element,
    ShadowRoot: dom.window.ShadowRoot,
    getComputedStyle: dom.window.getComputedStyle,
    IS_REACT_ACT_ENVIRONMENT: true
  };
  const descriptors = Object.keys(values).map((key) =>
    Object.getOwnPropertyDescriptor(globalThis, key)
  );
  for (const [key, value] of Object.entries(values)) {
    Object.defineProperty(globalThis, key, { configurable: true, value });
  }
  Object.defineProperty(dom.window, 'matchMedia', {
    value: () => ({ matches: false, addListener() {}, removeListener() {} })
  });
  const { createRoot } = await import('react-dom/client');
  AntForm = (await import('antd')).Form;
  const { default: DataForm } = await import('../index');
  const { useInitVideoMeta } =
    await import('../../../hooks/use-init-video-meta');
  const root = createRoot(dom.window.document.getElementById('root')!);
  const modelList = [
    {
      label: 'H3',
      value: 'minimax-h3',
      meta: {
        video: {
          family: 'minimax_h3',
          playground_tasks: ['t2va'],
          default_size: '768x1344',
          resolutions: ['768x1344', '1344x768'],
          duration: { min: 4, max: 15, default: 4 }
        }
      }
    },
    { label: 'Wan', value: 'wan' },
    {
      label: 'First/last-frame H3',
      value: 'fl',
      meta: {
        video: {
          family: 'minimax_h3',
          playground_tasks: ['t2va', 'fl2va'],
          default_task: 't2va',
          media_inputs: { fl2va: { keyframes: true, max_items: 2 } }
        }
      }
    },
    {
      label: 'Reference H3',
      value: 'ref-ready',
      meta: {
        video: {
          family: 'minimax_h3',
          playground_tasks: ['ref2va'],
          default_task: 'ref2va',
          media_inputs: {
            ref2va: {
              image: 9,
              video: 3,
              audio: 3,
              max_items: 12,
              requires_visual: true
            }
          }
        }
      }
    },
    {
      label: 'Multiple task modes',
      value: 'multi',
      meta: {
        video: {
          playground_tasks: ['mode_a', 'mode_b'],
          default_task: 'mode_b'
        }
      }
    },
    {
      label: 'Reference-only H3',
      value: 'ref',
      meta: {
        video: {
          family: 'minimax_h3',
          playground_tasks: [],
          default_task: null
        }
      }
    }
  ];
  let current: ReturnType<typeof useInitVideoMeta>;
  const Harness = () => {
    current = useInitVideoMeta({ modelList }, { type: 'create' });
    return createElement(DataForm, {
      ref: current.form,
      initialValues: current.initialValues,
      paramsConfig: current.paramsConfig,
      modelList,
      meta: current.modelMeta,
      onValuesChange: current.handleOnValuesChange
    });
  };
  const change = async (value: string) => {
    await act(async () => changeReference({ target: { value } }));
  };
  try {
    await act(async () => root.render(createElement(Harness)));
    assert.equal(dom.window.document.querySelector('textarea'), null);
    const toggleAdvanced = dom.window.document.querySelector<HTMLButtonElement>(
      '[data-testid="toggle-advanced"]'
    )!;
    const advancedPanel = toggleAdvanced.parentElement!;
    assert.equal(advancedPanel.dataset.open, 'false');
    await act(async () => toggleAdvanced.click());
    assert.equal(advancedPanel.dataset.open, 'true');
    for (let attempt = 0; attempt < 30; attempt++) {
      if (dom.window.document.querySelector('textarea')) break;
      await act(async () => delay(10));
    }
    assert.ok(dom.window.document.querySelector('textarea'));
    const initialPath = editorProps.path;
    assert.match(initialPath!, /playground-video-.*\.json$/);
    assert.deepEqual(editorProps.schema, { type: ['object', 'null'] });
    assert.equal(editorProps.options?.lineNumbers, 'off');
    assert.equal(editorProps.options?.folding, false);
    assert.equal(editorProps.isDarkTheme, false);
    darkTheme = true;
    await act(async () => root.render(createElement(Harness)));
    assert.equal(editorProps.isDarkTheme, true);
    assert.equal(editorProps.path, initialPath);
    const editorPanel = dom.window.document.querySelector(
      '[role="group"][aria-label="playground.video.extraParams"]'
    )!;
    const format = Array.from(editorPanel.querySelectorAll('button')).find(
      (button) => button.textContent === 'playground.decision.questions.format'
    )!;
    const clear = editorPanel.querySelector<HTMLButtonElement>(
      'button[aria-label="common.button.clear"]'
    )!;
    assert.equal(format.disabled, true);
    assert.equal(clear.disabled, true);
    const minified = '{"sampling":{"steps":[1,null,false]}}';
    await act(async () => changeAdvanced(minified));
    await act(async () => format.click());
    assert.equal(
      current!.parameters.advancedParameters,
      JSON.stringify(JSON.parse(minified), null, 2)
    );
    await act(async () => clear.click());
    assert.equal(current!.parameters.advancedParameters, '');
    for (const invalid of ['{', '[]', 'false', '4', '"text"']) {
      await act(async () => changeAdvanced(invalid));
      await act(async () => {
        await assert.rejects(current!.form.current.validateFields(), {
          errorFields: [
            {
              name: ['advancedParameters'],
              errors: ['playground.video.extraParams.invalid'],
              warnings: []
            }
          ]
        });
      });
    }
    await act(async () => changeAdvanced('{'));
    await act(async () => format.click());
    assert.equal(current!.parameters.advancedParameters, '{');
    for (const optional of ['', '  ', 'null', '{}']) {
      await act(async () => changeAdvanced(optional));
      await act(async () => {
        await current!.form.current.validateFields();
      });
    }
    await act(async () =>
      changeAdvanced(
        JSON.stringify({
          seconds: 8,
          media_1: 'https://example.com/frame.png',
          extra_params: { target: { short_edge: 720 }, frame_indices: [0] }
        })
      )
    );
    await act(async () => format.click());
    await act(async () => toggleAdvanced.click());
    assert.equal(dom.window.document.querySelector('textarea'), null);
    await act(async () => {
      await assert.rejects(current!.form.current.validateFields(), {
        errorFields: [
          {
            name: ['advancedParameters'],
            errors: [
              'playground.video.extraParams.conflict: seconds, media_1, extra_params.frame_indices, extra_params.target.short_edge'
            ],
            warnings: []
          }
        ]
      });
    });
    assert.equal(advancedPanel.dataset.open, 'true');
    const extras = '{"sampling":{"steps":[1,null,false]}}';
    await act(async () => changeAdvanced(extras));
    await act(async () => {
      assert.equal(
        (await current!.form.current.validateFields()).advancedParameters,
        extras
      );
    });
    const singleTaskSelect = dom.window.document.querySelector(
      'select[data-testid="task"]'
    ) as HTMLSelectElement;
    assert.equal(singleTaskSelect, null);
    assert.equal(current!.parameters.task, 't2va');
    const choose = async (value: string) => {
      const input = dom.window.document.querySelector(
        `input[type="radio"][value="${value}"]`
      ) as HTMLInputElement;
      assert.ok(input, `Missing size choice ${value}`);
      await act(async () => input.click());
    };
    await choose('16:9');
    assert.equal(current!.parameters.aspectRatio, '16:9');
    assert.ok(dom.window.document.body.textContent?.includes('4k'));
    await choose('1920x1080');
    assert.equal(current!.parameters.size, '1920x1080');
    await choose('9:16');
    assert.equal(current!.parameters.size, '1080x1920');
    await choose('custom');
    assert.equal(
      dom.window.document.querySelector(
        '[role="radiogroup"][aria-label="playground.params.resolution"]'
      ),
      null
    );
    assert.ok(dom.window.document.querySelector('[data-testid="width"]'));
    assert.ok(dom.window.document.querySelector('[data-testid="height"]'));
    await act(async () => {
      const { buildVideoParameters } = await import('../../media-inputs');
      const values = await current!.form.current.validateFields();
      assert.equal(Object.hasOwn(values, 'size'), false);
      assert.equal(
        buildVideoParameters(values, 'A city').size,
        `${values.width}x${values.height}`
      );
    });

    await act(async () =>
      current!.handleOnValuesChange({ model: 'fl' }, { model: 'fl' })
    );
    assert.equal(current!.parameters.advancedParameters, '');
    assert.equal(dom.window.document.querySelector('textarea')?.value, '');
    const mode = dom.window.document.querySelector(
      'select[data-testid="task"]'
    ) as HTMLSelectElement;
    assert.equal(
      dom.window.document.querySelector('[data-testid="firstFrame"]'),
      null
    );
    await act(async () => {
      mode.value = 'fl2va';
      mode.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    });
    assert.ok(dom.window.document.querySelector('[data-testid="firstFrame"]'));
    assert.ok(
      Array.from(
        dom.window.document.querySelectorAll('input[type="radio"]')
      ).every((input) => !(input as HTMLInputElement).disabled)
    );
    await choose('9:16');
    await choose('720x1280');
    assert.equal(current!.parameters.aspectRatio, '9:16');
    assert.equal(current!.parameters.size, '720x1280');

    assert.ok(dom.window.document.querySelector('[data-testid="lastFrame"]'));
    await act(async () => {
      await assert.rejects(
        current!.form.current.form.validateFields(),
        (error: any) =>
          error.errorFields.some(({ name }: any) => name[0] === 'firstFrame')
      );
    });
    await act(async () =>
      mediaChanges.lastFrame('https://example.com/last.png')
    );
    await act(async () => {
      await current!.form.current.form.validateFields();
    });
    assert.equal(current!.parameters.lastFrame, 'https://example.com/last.png');
    await act(async () => {
      mode.value = 't2va';
      mode.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    });
    assert.equal(current!.parameters.lastFrame, undefined);
    assert.equal(current!.cacheFormData.current.lastFrame, undefined);
    assert.equal(
      dom.window.document.querySelector('[data-testid="lastFrame"]'),
      null
    );
    await act(async () =>
      current!.handleOnValuesChange(
        { model: 'ref-ready' },
        { model: 'ref-ready' }
      )
    );
    assert.equal(
      dom.window.document.querySelector('select[data-testid="task"]'),
      null
    );
    assert.ok(
      dom.window.document.querySelector(
        '[data-testid="playground.video.media.image"]'
      )
    );
    assert.equal(
      dom.window.document.querySelector('[data-testid="add-reference"]'),
      null
    );
    await act(async () => {
      await assert.rejects(
        current!.form.current.form.validateFields(),
        (error: any) =>
          error.errorFields.some(({ name }: any) => name[0] === 'references')
      );
    });
    await act(async () =>
      mediaChanges['playground.video.media.image'](
        'https://example.com/subject.png'
      )
    );
    await act(async () => {
      await current!.form.current.form.validateFields();
    });
    assert.deepEqual(current!.parameters.references, [
      { type: 'image', source: 'https://example.com/subject.png' }
    ]);
    const mediaType = dom.window.document.querySelector(
      '[data-testid="media-type"]'
    ) as HTMLSelectElement;
    assert.equal(
      mediaType.getAttribute('aria-label'),
      'playground.video.references'
    );
    assert.deepEqual(
      Array.from(mediaType.options).map((option) => option.value),
      ['image', 'video']
    );
    await act(async () => {
      mediaType.value = 'video';
      mediaType.dispatchEvent(
        new dom.window.Event('change', { bubbles: true })
      );
    });
    assert.equal(current!.parameters.references[0].source, undefined);
    await act(async () => {
      await assert.rejects(
        current!.form.current.form.validateFields(),
        (error: any) =>
          error.errorFields.some(({ name }: any) => name[0] === 'references')
      );
    });
    assert.equal(mediaType.getAttribute('data-validation-status'), '');
    await act(async () =>
      mediaChanges['playground.video.media.video']('file:///tmp/motion.mp4')
    );
    await act(async () => {
      await assert.rejects(
        current!.form.current.form.validateFields(),
        (error: any) =>
          error.errorFields.some(
            ({ name, errors }: any) =>
              name[0] === 'references' &&
              errors.includes('playground.video.media.invalid')
          )
      );
    });
    await act(async () =>
      mediaChanges['playground.video.media.video'](
        'https://example.com/motion.mp4'
      )
    );
    await act(async () => {
      await current!.form.current.form.validateFields();
    });
    assert.deepEqual(current!.parameters.references, [
      { type: 'video', source: 'https://example.com/motion.mp4' }
    ]);
    await act(async () =>
      current!.handleOnValuesChange(
        { model: 'minimax-h3' },
        { model: 'minimax-h3' }
      )
    );
    assert.deepEqual(current!.parameters.references, []);
    assert.deepEqual(current!.cacheFormData.current.references, []);
    assert.equal(current!.parameters.size, '768x1344');
    assert.equal(current!.parameters.seconds, 4);
    await act(async () => {
      assert.equal(
        (await current!.form.current.form.validateFields()).task,
        't2va'
      );
    });
    await act(async () =>
      current!.handleOnValuesChange({ model: 'multi' }, { model: 'multi' })
    );
    const taskSelect = dom.window.document.querySelector(
      'select[data-testid="task"]'
    ) as HTMLSelectElement;
    assert.ok(taskSelect);
    assert.ok(taskSelect.closest('[data-testid="advanced-settings"]'));
    assert.equal(taskSelect.value, 'mode_b');
    assert.equal(taskSelect.disabled, false);
    await act(async () => {
      taskSelect.value = 'mode_a';
      taskSelect.dispatchEvent(
        new dom.window.Event('change', { bubbles: true })
      );
    });
    assert.equal(current!.parameters.task, 'mode_a');
    assert.equal(current!.parameters.model, 'multi');
    await act(async () =>
      current!.handleOnValuesChange({ model: 'ref' }, { model: 'ref' })
    );
    assert.equal(current!.parameters.task, undefined);
    assert.equal(
      (
        dom.window.document.querySelector(
          'select[data-testid="task"]'
        ) as HTMLSelectElement
      ).disabled,
      true
    );
    assert.ok(
      dom.window.document.body.textContent?.includes(
        'playground.video.taskUnsupported'
      )
    );
    await act(async () => {
      await assert.rejects(
        current!.form.current.form.validateFields(),
        (error: any) =>
          error.errorFields.some(({ name }: any) => name[0] === 'task')
      );
    });
    await act(async () =>
      current!.handleOnValuesChange({ model: 'wan' }, { model: 'wan' })
    );
    assert.equal(current!.parameters.task, undefined);
    assert.ok(
      dom.window.document.querySelector('[data-testid="advanced-settings"]')
    );
    const reference = 'https://example.com/reference.png';
    await change(reference);
    assert.equal(current!.parameters.referenceImage, reference);
    await act(async () => {
      assert.equal(
        (await current!.form.current.form.validateFields()).referenceImage,
        reference
      );
    });

    for (const invalid of ['invalid URL', 'ftp://example.com/reference.png']) {
      await change(invalid);
      await act(async () => {
        await assert.rejects(current!.form.current.form.validateFields(), {
          errorFields: [
            {
              name: ['referenceImage'],
              errors: ['playground.params.refImage.invalid'],
              warnings: []
            }
          ]
        });
      });
    }
    await change(reference);
    await act(async () =>
      current!.handleOnValuesChange(
        { model: 'minimax-h3' },
        { ...current!.parameters, model: 'minimax-h3' }
      )
    );
    assert.equal(current!.parameters.referenceImage, undefined);
    assert.equal(
      current!.form.current.form.getFieldValue('referenceImage'),
      undefined
    );
    assert.equal(current!.parameters.task, 't2va');
  } finally {
    await act(async () => root.unmount());
    Object.keys(values).forEach((key, index) => {
      const descriptor = descriptors[index];
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete (globalThis as any)[key];
    });
    dom.window.close();
  }
});
