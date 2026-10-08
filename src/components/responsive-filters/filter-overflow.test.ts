import assert from 'node:assert/strict';
import test from 'node:test';
import { getVisibleFilterCount } from './filter-overflow';

const layout = {
  widths: [200, 160, 160, 160],
  reservedWidth: 160,
  gap: 8,
  visibleCount: 4
};

test('accounts for the filter button, refresh and gaps before removing controls', () => {
  assert.equal(getVisibleFilterCount({ ...layout, availableWidth: 872 }), 4);
  assert.equal(getVisibleFilterCount({ ...layout, availableWidth: 871 }), 3);
  assert.equal(getVisibleFilterCount({ ...layout, availableWidth: 703 }), 2);
  assert.equal(getVisibleFilterCount({ ...layout, availableWidth: 535 }), 1);
});

test('restores controls only with spare room, avoiding oscillation at the boundary', () => {
  assert.equal(
    getVisibleFilterCount({ ...layout, availableWidth: 879, visibleCount: 3 }),
    3
  );
  assert.equal(
    getVisibleFilterCount({ ...layout, availableWidth: 880, visibleCount: 3 }),
    4
  );
});

test('moves the name control last when even the first control cannot fit', () => {
  assert.equal(getVisibleFilterCount({ ...layout, availableWidth: 367 }), 0);
});

test('uses the measured action width instead of assuming a button width', () => {
  assert.equal(
    getVisibleFilterCount({
      ...layout,
      availableWidth: 872,
      reservedWidth: 188
    }),
    3
  );
});
