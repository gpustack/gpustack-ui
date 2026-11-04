import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import type { ReactNode } from 'react';
import { createElement as h } from 'react';

mock.module('@umijs/max', {
  namedExports: {
    useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id })
  }
});
mock.module('ahooks', { namedExports: { useSize: () => undefined } });
mock.module('@gpustack/core-ui', {
  namedExports: {
    IconFont: () => null,
    useOverlayScroller: () => ({ initialize: () => {} })
  }
});

test('duplicate resize events skip rendering while collapsed answers can still reopen', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: 'http://localhost/'
  });
  const keys = [
    'window',
    'document',
    'navigator',
    'IS_REACT_ACT_ENVIRONMENT',
    ...Object.getOwnPropertyNames(dom.window).filter(
      (key) => !(key in globalThis)
    )
  ];
  const descriptors = keys.map((key) =>
    Object.getOwnPropertyDescriptor(globalThis, key)
  );
  for (const key of keys) {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      value:
        key === 'IS_REACT_ACT_ENVIRONMENT' ? true : (dom.window as any)[key]
    });
  }
  try {
    const { act } = await import('react');
    const { createRoot } = await import('react-dom/client');
    const { default: _default, ...antd } = await import('antd');
    let resize: (sizes: number[]) => void;
    let renders = 0;
    // Observe child renders without involving Antd's own drag state or JSDOM layout.
    const Splitter = Object.assign(
      (props: { children: ReactNode; onResize: typeof resize }) => {
        renders += 1;
        resize = props.onResize;
        return h('div', null, props.children);
      },
      {
        Panel: ({ children, size }: { children: ReactNode; size?: number }) =>
          h('div', { 'data-panel-size': size }, children)
      }
    );
    mock.module('antd', { namedExports: { ...antd, Splitter } });
    const { default: DecisionWorkspace } =
      await import('../decision-workspace');
    const container = dom.window.document.getElementById('root')!;
    const root = createRoot(container);
    try {
      await act(async () => {
        root.render(
          h(DecisionWorkspace, {
            children: 'Inputs',
            answers: 'Result',
            answersEmpty: false,
            loading: false,
            runBlockReason: null,
            onRun: () => {},
            onStop: () => {}
          })
        );
      });
      const resizeTo = async (height: number) => {
        await act(async () => resize([600 - height, height]));
      };
      const answerHeight = () =>
        Number(
          container
            .querySelector('[data-panel-size]')
            ?.getAttribute('data-panel-size')
        );

      const initialRenders = renders;
      await resizeTo(120);
      await resizeTo(120);
      assert.equal(
        renders,
        initialRenders,
        'the existing height skips rendering'
      );

      await resizeTo(280);
      assert.equal(
        answerHeight(),
        280,
        'a changed height still updates the panel'
      );
      assert.ok(renders > initialRenders);
      const changedRenders = renders;
      await resizeTo(280);
      assert.equal(
        renders,
        changedRenders,
        'repeated changed heights also skip rendering'
      );

      await resizeTo(100);
      assert.equal(answerHeight(), 120);
      const minimumRenders = renders;
      await resizeTo(90);
      assert.equal(
        renders,
        minimumRenders,
        'different offsets at the minimum skip rendering'
      );

      await act(async () => {
        container
          .querySelector<HTMLButtonElement>('.answers-header button')!
          .click();
      });
      assert.equal(answerHeight(), 40);
      const collapsedRenders = renders;
      await resizeTo(40);
      assert.equal(
        renders,
        collapsedRenders,
        'the collapsed height stays unchanged'
      );
      await resizeTo(120);
      assert.equal(
        answerHeight(),
        120,
        'dragging open works even at the remembered height'
      );
      assert.equal(
        container
          .querySelector('.answers-header button')
          ?.getAttribute('aria-expanded'),
        'true'
      );
    } finally {
      await act(async () => root.unmount());
    }
  } finally {
    keys.forEach((key, index) => {
      const descriptor = descriptors[index];
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    });
    dom.window.close();
  }
});
