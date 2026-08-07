import { echarts } from '@gpustack/core-ui/charts';

/**
 * The echarts instance the benchmark charts render through — core-ui's, shared
 * with every other chart in the app.
 *
 * `echarts/core` is a process-wide singleton: whoever calls `use()` registers
 * into the one registry every consumer then sees. core-ui installs a superset of
 * what these charts draw — line + grid + tooltip + markLine + markArea, against
 * its line / bar / scatter / pie / gauge / legend / title / canvas — so a second
 * `use([...])` here bought nothing and left two places deciding which echarts
 * modules the app has. (It was written when core-ui registered neither mark
 * component; it now registers both.)
 *
 * These charts still call `echarts.init` themselves rather than rendering through
 * core-ui's `Chart` component, and that part is deliberate. Two of them are
 * dual-axis — the operating curve pairs linear tok/s with a LOG TTFT axis, and
 * the concurrency chart puts its shortfall on a right axis scaled to itself,
 * because a 9-request gap out of 384 is under a pixel tall on the axis the two
 * absolute lines share. `Chart` aligns a dual-axis grid by rewriting `max` on
 * whichever axis has fewer ticks, computed from `scale.getInterval()`; that
 * interval is in log space on a log axis, so the TTFT axis (three decades) would
 * be clamped to single-digit ms. Driving the instance directly skips the aligner.
 * `Chart` remains the right default anywhere a single value axis will do.
 */
export type { ECharts, EChartsCoreOption } from 'echarts/core';

export default echarts;
