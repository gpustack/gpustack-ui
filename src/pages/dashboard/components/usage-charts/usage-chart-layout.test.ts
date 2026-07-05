import { describe, expect, it } from 'vitest';
import { getUsageByModelChartLayout } from './usage-chart-layout';

const assertNoInfinityRadius = (
  layout: ReturnType<typeof getUsageByModelChartLayout>
) => {
  layout.radius.forEach((value) => {
    expect(value).not.toContain('Infinity');
    expect(value).toMatch(/^\d+%$/);
  });
};

describe('getUsageByModelChartLayout', () => {
  it('returns safe radius values when container width is zero', () => {
    const layout = getUsageByModelChartLayout(0, 300);

    assertNoInfinityRadius(layout);
    expect(layout.radius).toEqual(['0%', '0%']);
  });

  it('uses stacked layout below 560px', () => {
    const layout = getUsageByModelChartLayout(400, 300);

    expect(layout.tokenCenter[0]).toBe('50%');
    expect(layout.chartHeightExtra).toBeGreaterThan(0);
    assertNoInfinityRadius(layout);
  });

  it('uses desktop layout at 1200px', () => {
    const layout = getUsageByModelChartLayout(1200, 300);

    expect(layout.tokenCenter).toEqual(['20%', '50%']);
    expect(layout.apiCenter).toEqual(['60%', '50%']);
    expect(layout.chartHeightExtra).toBe(0);
  });
});
