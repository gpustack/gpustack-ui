import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mock, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { GroupedInfoTooltipRow } from '../grouped-info-tooltip-content';

const require = createRequire(import.meta.url);
const { IntlProvider, useIntl } = require(
  require.resolve('react-intl', {
    paths: [require.resolve('@umijs/plugins/package.json')]
  })
);
mock.module('@umijs/max', { namedExports: { useIntl } });
mock.module('antd-style', {
  namedExports: { createStyles: () => () => ({ styles: {} }) }
});
mock.module('antd', {
  namedExports: {
    Flex: ({ children, className }: any) =>
      createElement('div', { className }, children)
  }
});
const { default: GroupedInfoTooltipContent } =
  await import('../grouped-info-tooltip-content.tsx');

const render = (groups: GroupedInfoTooltipRow[][], locale?: boolean) =>
  new JSDOM(
    renderToStaticMarkup(
      createElement(
        IntlProvider,
        {
          locale: 'en-US',
          messages: {
            'known.label': 'Translated label',
            'message.rack': 'Rack {rack}',
            'message.zone': 'Zone {zone}'
          },
          onError: (error: unknown) => {
            throw error;
          }
        },
        createElement(GroupedInfoTooltipContent, { groups, locale })
      )
    )
  );
const texts = (document: Document, selector: string) =>
  [...document.querySelectorAll(selector)].map(
    (element) => element.textContent
  );

test('labels are translated by default with their values, and empty groups add no divider', (t) => {
  const dom = render([
    [
      {
        label: 'message.rack',
        labelValues: { rack: 'R1' },
        icon: null,
        value: '2 workers'
      }
    ],
    [],
    [
      {
        label: 'message.zone',
        labelValues: { zone: 'west' },
        icon: null,
        value: '3 workers'
      }
    ]
  ]);
  t.after(() => dom.window.close());
  assert.deepEqual(texts(dom.window.document, '.label span'), [
    'Rack R1',
    'Zone west'
  ]);
  assert.deepEqual(texts(dom.window.document, '.value'), [
    '2 workers',
    '3 workers'
  ]);
  assert.equal(dom.window.document.querySelectorAll('.divider').length, 1);
});

test('locale=false preserves names that resemble message ids or ICU patterns and keeps group boundaries', (t) => {
  const labels = ['known.label', '{rack}', '可用区', 'rack {name}'];
  const rows = labels.map(
    (label, index): GroupedInfoTooltipRow => ({
      label,
      labelValues: { rack: 'should not interpolate', name: 'should stay raw' },
      icon: null,
      value: `value-${index}`
    })
  );
  const dom = render([[rows[0]], [rows[1], rows[2]], [], [rows[3]]], false);
  t.after(() => dom.window.close());
  assert.deepEqual(texts(dom.window.document, '.label span'), labels);
  assert.deepEqual(texts(dom.window.document, '.value'), [
    'value-0',
    'value-1',
    'value-2',
    'value-3'
  ]);
  assert.equal(dom.window.document.querySelectorAll('.divider').length, 2);
});
