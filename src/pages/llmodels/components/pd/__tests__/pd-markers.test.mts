import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const intl = { formatMessage: ({ id }: { id: string }) => id };
const passChildren = ({ children }: any) =>
  createElement(Fragment, null, children);

mock.module('@umijs/max', {
  namedExports: { useIntl: () => intl }
});
mock.module('antd', {
  namedExports: { Flex: passChildren, Tooltip: passChildren }
});

const { default: PDMarkers, markerTexts } = await import('../pd-markers.tsx');

for (const degradations of [undefined, null, [], ['pairing_remote']]) {
  test(`no warning or tooltip for ${JSON.stringify(degradations)}`, () => {
    assert.deepEqual(markerTexts(intl as any, false, degradations), []);
    assert.equal(
      renderToStaticMarkup(createElement(PDMarkers, { degradations })),
      ''
    );
  });
}

for (const [degradations, stale, expected] of [
  [
    ['pairing_remote', 'cache_not_injected'],
    false,
    ['models.pd.degraded.cache']
  ],
  [['pairing_remote'], true, ['models.pd.recreation.paused']],
  [['pairing_remote', 'future_degradation'], false, ['future_degradation']]
] as const) {
  test(`other markers remain visible for ${JSON.stringify({ degradations, stale })}`, () => {
    const reasons = [...degradations];
    assert.deepEqual(markerTexts(intl as any, stale, reasons, true), expected);
    const markup = renderToStaticMarkup(
      createElement(PDMarkers, {
        degradations: reasons,
        stale,
        hasRoles: true
      })
    );
    for (const text of expected) {
      assert.ok(markup.includes(`aria-label="${text}"`));
    }
    assert.doesNotMatch(markup, /pairing_remote|models\.pd\.degraded\.pairing/);
    assert.deepEqual(reasons, degradations);
  });
}
