import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import test from 'node:test';
import type { BenchmarkFilterValues } from '../config/types';

test('moving a pending edit preserves its draft and clearing cancels the old search', async (context) => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>');
  const globals = [
    'window',
    'document',
    'navigator',
    'IS_REACT_ACT_ENVIRONMENT'
  ];
  const descriptors = globals.map((key) =>
    Object.getOwnPropertyDescriptor(globalThis, key)
  );
  Object.defineProperties(globalThis, {
    window: { configurable: true, value: dom.window },
    document: { configurable: true, value: dom.window.document },
    navigator: { configurable: true, value: dom.window.navigator },
    IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
  });
  context.mock.timers.enable({ apis: ['setTimeout', 'Date'] });

  const { act } = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { default: useBenchmarkFilters } =
    await import('./use-benchmark-filters');
  const requests: Array<Partial<BenchmarkFilterValues> & { page: number }> = [];
  const container = dom.window.document.getElementById('root')!;
  const root = createRoot(container);
  let controls!: ReturnType<typeof useBenchmarkFilters>;
  const Harness = ({ location }: { location: string }) => {
    controls = useBenchmarkFilters({
      initialValues: { search: 'run-a,run-b' },
      onChange: (values) => requests.push(values)
    });
    return (
      <input
        key={location}
        value={controls.values.profile}
        onChange={() => {}}
      />
    );
  };

  try {
    await act(async () => root.render(<Harness location="toolbar" />));
    await act(async () => {
      controls.changeValues({ profile: 'draft profile' }, true);
    });
    await act(async () => root.render(<Harness location="popover" />));
    assert.equal(container.querySelector('input')!.value, 'draft profile');
    assert.equal(controls.values.search, 'run-a,run-b');
    assert.equal(requests.length, 0);

    await act(async () => context.mock.timers.tick(350));
    assert.deepEqual(requests, [{ page: 1, profile: 'draft profile' }]);

    await act(async () => {
      controls.changeValues({ profile: 'obsolete edit' }, true);
      controls.changeValues({ profile: '', target_mode: undefined });
    });
    await act(async () => context.mock.timers.tick(1000));
    assert.equal(container.querySelector('input')!.value, '');
    assert.equal(requests.length, 2);
    assert.deepEqual(requests[1], {
      page: 1,
      profile: '',
      target_mode: undefined
    });

    await act(async () => {
      controls.changeValues({ model_name: 'Llama' }, true);
      controls.changeValues({ gpu_summary: 'A100' }, true);
    });
    await act(async () => context.mock.timers.tick(350));
    assert.deepEqual(requests[2], {
      page: 1,
      model_name: 'Llama',
      gpu_summary: 'A100'
    });
  } finally {
    await act(async () => root.unmount());
    context.mock.timers.reset();
    dom.window.close();
    globals.forEach((key, index) => {
      const descriptor = descriptors[index];
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    });
  }
});
