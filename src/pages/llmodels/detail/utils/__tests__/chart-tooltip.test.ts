import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { chartTooltip } from '../chart-tooltip';

const dom = new JSDOM('');
Object.defineProperty(globalThis, 'document', {
  configurable: true,
  value: dom.window.document
});
after(() => dom.window.close());

test('chart readouts keep untrusted series labels as literal text and preserve zero and gaps', () => {
  const name = '<img src=x onerror="alert(1)">';
  const tooltip = chartTooltip(
    '<script>header</script>',
    [
      { name, value: '0 %', color: '#2563eb' },
      { name: 'Missing', value: '— %', color: '#e5484d' }
    ],
    'More series in the table'
  );
  assert.equal(tooltip.querySelector('img,script'), null);
  assert.ok(tooltip.textContent?.includes(name));
  assert.ok(tooltip.textContent?.includes('0 %'));
  assert.ok(tooltip.textContent?.includes('— %'));
  assert.equal(tooltip.querySelectorAll('[aria-hidden="true"]').length, 2);
  assert.equal(
    tooltip.lastElementChild?.textContent,
    'More series in the table'
  );
});
