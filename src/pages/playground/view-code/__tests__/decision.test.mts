import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

// The code generators import MODEL_PROXY from ../apis, whose module pulls
// umi's request — stub the whole module before the import.
mock.module(new URL('../../apis/index.ts', import.meta.url).href, {
  namedExports: { MODEL_PROXY: '/model/proxy' }
});

// generateDecisionCode reads window.location.origin.
const dom = new JSDOM('<!doctype html>', { url: 'http://localhost:8080/' });
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: dom.window
});

test('formatPyObject serializes booleans and nulls the Python way', async () => {
  const { formatPyObject } = await import('../utils');
  assert.equal(
    formatPyObject({ flag: true, off: false, nothing: null }),
    ['{', '  "flag": True,', '  "off": False,', '  "nothing": None', '}'].join(
      '\n'
    )
  );
});

test('formatPyObject nests objects and arrays', async () => {
  const { formatPyObject } = await import('../utils');
  const rendered = formatPyObject({
    state: { messages: [{ role: 'user', content: 'hi', pinned: true }] },
    tags: ['a', 'b'],
    empty: {}
  });
  assert.match(rendered, /"state": \{\n\s+"messages": \[/);
  assert.match(rendered, /"pinned": True/);
  assert.match(rendered, /"tags": \[\n\s+"a",\n\s+"b"\n\s+\]/);
  assert.match(rendered, /"empty": \{\}/);
});

test('the decision python snippet posts Python literals, not JSON', async () => {
  const { generateDecisionCode } = await import('../decision');
  const { pythonCode } = generateDecisionCode({
    api: '/v1/systemone',
    parameters: {
      model: 'jev-1.13.0',
      state: { escalate: false, context: null, hints: ['fast'] },
      questions: { severity: { type: 'score' } }
    }
  });
  // Python spellings for the JSON trio…
  assert.match(pythonCode, /"escalate": False/);
  assert.match(pythonCode, /"context": None/);
  assert.match(pythonCode, /"hints": \[\n\s+"fast"\n\s+\]/);
  // …and no bare JSON spellings anywhere in the snippet.
  assert.doesNotMatch(pythonCode, /\b(false|true|null)\b/);
});
