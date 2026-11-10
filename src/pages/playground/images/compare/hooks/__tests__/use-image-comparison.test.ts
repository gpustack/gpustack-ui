import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import test from 'node:test';
import { act, createElement } from 'react';
import { PreparedImageRun } from '../../config/types';
import useImageComparison from '../use-image-comparison';

type Comparison = ReturnType<typeof useImageComparison>;
const models = ['a', 'b', 'c', 'd'].map((value) => ({ label: value, value }));

async function mountComparison(modelList = models) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>');
  const keys = ['window', 'document', 'navigator', 'IS_REACT_ACT_ENVIRONMENT'];
  const descriptors = keys.map((key) =>
    Object.getOwnPropertyDescriptor(globalThis, key)
  );
  keys.forEach((key) => {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      value:
        key === 'IS_REACT_ACT_ENVIRONMENT' ? true : (dom.window as any)[key]
    });
  });
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(dom.window.document.getElementById('root')!);
  let current: Comparison;
  const Harness = ({ list }: { list: typeof models }) => {
    current = useImageComparison(list);
    return null;
  };
  const render = async (list: typeof models) => {
    await act(async () => root.render(createElement(Harness, { list })));
  };
  await render(modelList);
  return {
    get current() {
      return current!;
    },
    render,
    async unmount() {
      await act(async () => root.unmount());
      keys.forEach((key, index) => {
        const descriptor = descriptors[index];
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete (globalThis as any)[key];
      });
      dom.window.close();
    }
  };
}

function createPanel() {
  const messages: string[] = [];
  let aborts = 0;
  let clears = 0;
  return {
    messages,
    get aborts() {
      return aborts;
    },
    get clears() {
      return clears;
    },
    instanceId: Symbol('panel'),
    prepare: async () => null,
    getParameters: () => ({ model: 'a' }),
    validateParameters: () => [],
    applyParameters() {},
    submit(run: PreparedImageRun) {
      messages.push(run.parameters.prompt);
    },
    abortFetch() {
      aborts += 1;
    },
    clear() {
      clears += 1;
    }
  };
}

function submit(comparison: Comparison, prompt: string) {
  comparison.forEachPanel((panel) =>
    panel.submit({ parameters: { prompt }, revision: 0 })
  );
}

test('shrinking the layout cancels removed panels and ignores their late loading updates', async () => {
  const harness = await mountComparison();
  try {
    await act(async () => harness.current.updateLayout({ span: 8, count: 6 }));
    const selections = harness.current.modelSelections;
    const panels = selections.map(() => createPanel());
    selections.forEach(({ instanceId }, index) => {
      harness.current.setModelRef(instanceId, panels[index]);
    });
    assert.deepEqual(
      selections.map(({ value }) => value),
      ['a', 'b', 'c', 'd', '', '']
    );
    submit(harness.current, 'first prompt');
    panels.forEach((panel) =>
      assert.deepEqual(panel.messages, ['first prompt'])
    );
    await act(async () =>
      harness.current.setLoadingStatus(selections[5].instanceId, true)
    );
    assert.equal(harness.current.isLoading, true);

    await act(async () => harness.current.updateLayout({ span: 12, count: 2 }));
    assert.deepEqual(harness.current.modelSelections, selections.slice(0, 2));
    assert.equal(harness.current.isLoading, false);
    panels.slice(2).forEach((panel) => assert.equal(panel.aborts, 1));
    await act(async () =>
      harness.current.setLoadingStatus(selections[5].instanceId, true)
    );
    // A late ref callback must not register a removed panel again either.
    harness.current.setModelRef(selections[5].instanceId, panels[5]);
    assert.equal(harness.current.isLoading, false);
    submit(harness.current, 'second prompt');
    harness.current.handleClearAll();
    harness.current.handleAbortFetch();
    panels.slice(0, 2).forEach((panel) => {
      assert.deepEqual(panel.messages, ['first prompt', 'second prompt']);
      assert.equal(panel.clears, 1);
      assert.equal(panel.aborts, 1);
    });
    panels.slice(2).forEach((panel) => {
      assert.deepEqual(panel.messages, ['first prompt']);
      assert.equal(panel.clears, 0);
      assert.equal(panel.aborts, 1);
    });
  } finally {
    await harness.unmount();
  }
});

test('deleting panels keeps the remaining layout and instance identities consistent', async () => {
  const harness = await mountComparison();
  try {
    await act(async () => harness.current.updateLayout({ span: 8, count: 6 }));
    const firstId = harness.current.modelSelections[0].instanceId;
    for (const count of [5, 4, 3, 2]) {
      const removed = harness.current.modelSelections.at(-1)!;
      const panel = createPanel();
      harness.current.setModelRef(removed.instanceId, panel);
      await act(async () =>
        harness.current.handleDeleteModel(removed.instanceId)
      );
      assert.equal(panel.aborts, 1);
      assert.equal(harness.current.modelSelections[0].instanceId, firstId);
      assert.deepEqual(harness.current.layout, {
        span: count % 2 === 0 ? 12 : 8,
        count
      });
    }
    await act(async () => harness.current.handleDeleteModel(firstId));
    assert.equal(harness.current.modelSelections.length, 2);
    await harness.render([models[0], models[0]]);
    const [first, duplicate] = harness.current.modelSelections;
    assert.equal(duplicate.value, 'a');
    assert.notEqual(duplicate.instanceId, first.instanceId);
    assert.notEqual(duplicate.uid, first.uid);
  } finally {
    await harness.unmount();
  }
});

test('reloading the model list discards old panel handles and preserves the empty state', async () => {
  const harness = await mountComparison();
  try {
    const previousId = harness.current.modelSelections[0].instanceId;
    const panel = createPanel();
    harness.current.setModelRef(previousId, panel);
    await act(async () => harness.current.setLoadingStatus(previousId, true));
    await harness.render([...models]);
    assert.equal(panel.aborts, 1);
    assert.equal(harness.current.isLoading, false);
    assert.notEqual(harness.current.modelSelections[0].instanceId, previousId);
    submit(harness.current, 'new prompt');
    assert.deepEqual(panel.messages, []);
    await harness.render([]);
    await act(async () => harness.current.updateLayout({ span: 8, count: 6 }));
    assert.deepEqual(harness.current.modelSelections, []);
    assert.equal(harness.current.isLoading, false);
  } finally {
    await harness.unmount();
  }
});
