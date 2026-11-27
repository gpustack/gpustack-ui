import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import {
  act,
  createElement,
  createRef,
  forwardRef,
  useImperativeHandle,
  useRef,
  type ReactNode
} from 'react';

const formValues = {
  model: 'wan',
  seed: 42,
  random_seed: true,
  advancedParameters: '{'
};
const validateFields = mock.fn(async () => {
  if (formValues.advancedParameters === '{') throw new Error('Invalid JSON');
  return formValues;
});
const submitMessage = mock.fn();
const empty = () => null;
const childrenOnly = ({ children }: { children: ReactNode }) => children;
const mockLocal = (path: string, exports: Parameters<typeof mock.module>[1]) =>
  mock.module(new URL(path, import.meta.url).href, exports);

mock.module('@ant-design/icons', { namedExports: { HistoryOutlined: empty } });
mock.module('@gpustack/core-ui', {
  namedExports: {
    AlertInfo: empty,
    DeleteModal: forwardRef(empty),
    IconFont: empty
  }
});
mock.module('@umijs/max', {
  namedExports: { useIntl: () => ({ formatMessage: () => '' }) }
});
mock.module('antd', {
  namedExports: { Button: empty, Flex: childrenOnly, Tooltip: childrenOnly }
});
mock.module('jotai', { namedExports: { useAtomValue: () => ({ id: 1 }) } });
mockLocal('../../../../atoms/user.ts', { namedExports: { userAtom: {} } });
mockLocal('../../apis/index.ts', {
  namedExports: { CREATE_VIDEO_API: '/videos' }
});
mockLocal('../../config/index.ts', { namedExports: { videoPromptList: [] } });
mockLocal('../../hooks/use-init-video-meta.ts', {
  namedExports: {
    useInitVideoMeta: () => ({
      form: useRef(null),
      parameters: { model: 'wan' },
      prepareParameters: (values: typeof formValues) => ({
        ...values,
        seed: 77
      }),
      modelMeta: {}
    })
  }
});
mockLocal('../../hooks/use-text-video.ts', {
  defaultExport: () => ({ currentPrompt: 'A city', submitMessage })
});
mockLocal('../../components/message-input.tsx', {
  defaultExport: forwardRef<HTMLButtonElement, { handleSubmit: () => void }>(
    ({ handleSubmit }, ref) =>
      createElement('button', { ref, onClick: handleSubmit }, 'Submit')
  )
});
mockLocal('../../components/right-container.tsx', {
  defaultExport: childrenOnly
});
mockLocal('../../components/view-common-code.tsx', {
  defaultExport: ({
    open,
    viewCodeContent
  }: {
    open: boolean;
    viewCodeContent: { curlCode: string };
  }) => (open ? createElement('pre', null, viewCodeContent.curlCode) : null)
});
mockLocal('../../view-code/video.ts', {
  namedExports: {
    generateCode: ({
      parameters
    }: {
      parameters: Record<string, unknown>;
    }) => ({ curlCode: JSON.stringify(parameters) })
  }
});
mockLocal('../forms/index.tsx', {
  defaultExport: forwardRef((_props, ref) => {
    useImperativeHandle(ref, () => ({
      getFieldsValue: () => formValues,
      validateFields
    }));
    return null;
  })
});
mockLocal('../video-result.tsx', { defaultExport: empty });
for (const style of [
  '../video.module.less',
  '../../style/ground-llm.less',
  '../../style/system-message-wrap.less'
])
  mockLocal(style, { defaultExport: {} });

test('video code preview reads draft values without validating, and submission validates', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>');
  const globals = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    IS_REACT_ACT_ENVIRONMENT: true
  };
  const previous = new Map(
    Object.keys(globals).map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key)
    ])
  );
  for (const [key, value] of Object.entries(globals))
    Object.defineProperty(globalThis, key, { configurable: true, value });

  const { default: GroundVideo } = await import('../page');
  const { createRoot } = await import('react-dom/client');
  const document = dom.window.document;
  const root = createRoot(document.getElementById('root')!);
  const ref = createRef<{
    viewCode: () => void;
    setCollapse: () => void;
    collapse: boolean;
  }>();
  try {
    await act(async () =>
      root.render(createElement(GroundVideo, { modelList: [], ref }))
    );
    await act(async () => ref.current!.setCollapse());
    await act(async () => ref.current!.viewCode());
    assert.equal(validateFields.mock.callCount(), 0);
    assert.equal(ref.current!.collapse, true);
    assert.deepEqual(JSON.parse(document.querySelector('pre')!.textContent!), {
      model: 'wan',
      seed: 42,
      prompt: 'A city'
    });

    const submit = document.querySelector('button')!;
    await act(async () => submit.click());
    assert.equal(validateFields.mock.callCount(), 1);
    assert.equal(ref.current!.collapse, false);
    assert.equal(submitMessage.mock.callCount(), 0);

    formValues.advancedParameters = '{"guidance_scale":7}';
    await act(async () => submit.click());
    assert.equal(validateFields.mock.callCount(), 2);
    assert.deepEqual(submitMessage.mock.calls[0].arguments, [
      { guidance_scale: 7, model: 'wan', seed: 42, prompt: 'A city' }
    ]);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
