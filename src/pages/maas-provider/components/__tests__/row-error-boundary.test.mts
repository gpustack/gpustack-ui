import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { act, createElement } from 'react';

const dom = new JSDOM('<div id="root"></div>');
Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true }
});
after(() => dom.window.close());

const { RowErrorBoundary } = await import('../row-error-boundary.tsx');
const { createRoot } = await import('react-dom/client');

// Silence React's expected "logged an error" noise for the throwing child.
const originalError = console.error;
console.error = (...args: unknown[]) => {
  const first = String(args[0] ?? '');
  if (
    first.includes('The above error occurred') ||
    first.includes('Provider row failed to render')
  ) {
    return;
  }
  originalError(...args);
};

const Throwing = () => {
  throw new Error('bad record');
};

test('a failed row re-arms when its resetKey changes after the data is fixed', async () => {
  const root = createRoot(document.getElementById('root')!);

  await act(async () => {
    root.render(
      createElement(
        RowErrorBoundary,
        { fallbackMessage: 'broken', resetKey: '1-old' },
        createElement(Throwing)
      )
    );
  });
  assert.match(document.body.textContent ?? '', /broken/);

  // Same resetKey + still-throwing child stays on the fallback.
  await act(async () => {
    root.render(
      createElement(
        RowErrorBoundary,
        { fallbackMessage: 'broken', resetKey: '1-old' },
        createElement(Throwing)
      )
    );
  });
  assert.match(document.body.textContent ?? '', /broken/);

  // The record was fixed (updated_at bumped → new resetKey) and now renders.
  await act(async () => {
    root.render(
      createElement(
        RowErrorBoundary,
        { fallbackMessage: 'broken', resetKey: '1-new' },
        createElement('tr', null, createElement('td', null, 'healthy'))
      )
    );
  });
  assert.match(document.body.textContent ?? '', /healthy/);

  await act(async () => {
    root.unmount();
  });
});
