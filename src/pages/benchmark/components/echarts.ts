import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  MarkAreaComponent,
  MarkLineComponent,
  TooltipComponent
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

/**
 * The echarts instance the benchmark charts render through.
 *
 * `echarts/core` + an explicit `use([...])`, never `import * as echarts from
 * 'echarts'`: the barrel registers every chart type and component in the library,
 * and these three charts are the only place in the app that reached for it. Since
 * the registry is process-wide and shared with core-ui's own charts, registering
 * here adds the two mark components without duplicating anything core-ui already
 * installed.
 *
 * Why not core-ui's `Chart` component, which is the house style everywhere else:
 *
 *  - it registers neither `MarkLineComponent` nor `MarkAreaComponent`, so the
 *    best-point guides and the SLA / overload shading would be dropped in
 *    silence — an option echarts does not recognize is not an error;
 *  - it aligns a dual-y-axis chart's gridlines by rewriting `max` on whichever
 *    axis has fewer ticks, computed from `scale.getInterval()`. That interval is
 *    in log space on a log axis, so the operating curve's log TTFT axis (three
 *    decades) would be clamped to single-digit ms, and the fitted domains on the
 *    detail charts' second axis would be overwritten.
 *
 * Both are core-ui's to fix (gate the aligner on two `type: 'value'` axes,
 * register the mark components); until then these charts drive echarts directly
 * and pay only for what they draw.
 */
echarts.use([
  LineChart,
  GridComponent,
  // Pulls AxisPointerComponent in with it, which `tooltip.axisPointer` needs.
  TooltipComponent,
  MarkLineComponent,
  MarkAreaComponent,
  CanvasRenderer
]);

export type { ECharts, EChartsCoreOption } from 'echarts/core';

export default echarts;
