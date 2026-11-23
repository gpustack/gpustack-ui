import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import messages from '../../../../locales/zh-CN/resources';

const translations: Record<string, string> =
  (messages as any).default ?? messages;
const coreUi = new URL('./lib/', import.meta.resolve('@gpustack/core-ui'));
// Load the installed input directly and bridge its browser-bundler imports.
const styledComponents = await import('styled-components');
mock.module('styled-components', {
  defaultExport: styledComponents.styled
});
mock.module('@ant-design/icons', {
  namedExports: { QuestionCircleOutlined: () => null }
});
mock.module(new URL('utils/index.es.js', coreUi).href, {
  namedExports: { isNotEmptyValue: Boolean }
});
mock.module('ahooks', { namedExports: { useMemoizedFn: (fn: any) => fn } });
const { default: Input } = await import(
  new URL('components/form/input.es.js', coreUi).href
);
const { default: useSubmitLock } = await import(
  new URL('hooks/use-submit-lock.es.js', coreUi).href
);
mock.module('@gpustack/core-ui', {
  namedExports: {
    Input,
    useSubmitLock,
    LabelSelector: () => null,
    ModalFooter: () => null,
    ScrollerModal: ({ children }: { children: React.ReactNode }) => children
  }
});
mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({
      formatMessage: ({ id }: { id: string }) => translations[id] ?? id
    })
  }
});
mock.module('simplebar-react/dist/simplebar.min.css', { defaultExport: {} });
const { default: UpdateLabels } = await import('../update-labels.tsx');

test('the empty, unfocused KV input exposes its localized name', (t) => {
  const dom = new JSDOM(
    renderToStaticMarkup(
      createElement(UpdateLabels, {
        open: true,
        data: { name: 'worker', labels: {} },
        onCancel() {},
        async onOk() {}
      })
    )
  );
  t.after(() => dom.window.close());
  const { document } = dom.window;

  const name = translations['resources.worker.kvTransferInterface'];
  const field = document.querySelector<HTMLInputElement>(
    'input[type="text"]:not([disabled])'
  );
  assert.ok(field);
  assert.equal(field.value, '');
  assert.notEqual(document.activeElement, field);
  assert.ok(document.body.textContent?.includes(name));
  assert.equal(
    document.querySelector(`input[type="text"][aria-label="${name}"]`),
    field,
    'the localized name identifies the KV input'
  );
  assert.ok(
    document.body.textContent?.includes(
      translations['resources.worker.kvTransferInterface.inherit']
    )
  );
});
