type LegendLayout = Record<string, unknown>;

export type UsageByModelChartLayout = {
  tokenCenter: [string, string];
  apiCenter: [string, string];
  radius: [string, string];
  legend: LegendLayout;
  chartHeightExtra: number;
  centerLabelFontSize: number;
};

/** Below this width the two donuts stack vertically with a bottom legend. */
const STACKED_MAX_WIDTH = 560;

/** Below this width side-by-side donuts use a tighter compact layout. */
const COMPACT_MAX_WIDTH = 960;

const STACKED_HEIGHT_EXTRA = 96;
const STACKED_LEGEND_BAND = 72;
const STACKED_DONUT_GAP = 16;
const STACKED_TOP_MARGIN = 12;

const desktopLayout: UsageByModelChartLayout = {
  tokenCenter: ['20%', '50%'],
  apiCenter: ['60%', '50%'],
  radius: ['50%', '70%'],
  chartHeightExtra: 0,
  centerLabelFontSize: 18,
  legend: {
    orient: 'vertical',
    right: 0,
    top: 18,
    bottom: 18,
    itemWidth: 8,
    itemHeight: 8,
    itemGap: 12,
    textStyle: {
      overflow: 'truncate',
      width: 180
    }
  }
};

const compactLayout: UsageByModelChartLayout = {
  tokenCenter: ['22%', '50%'],
  apiCenter: ['56%', '50%'],
  radius: ['40%', '54%'],
  chartHeightExtra: 0,
  centerLabelFontSize: 16,
  legend: {
    orient: 'vertical',
    right: 0,
    top: 18,
    bottom: 18,
    itemWidth: 8,
    itemHeight: 8,
    itemGap: 10,
    textStyle: {
      overflow: 'truncate',
      width: 120
    }
  }
};

const pxToRadiusPct = (
  px: number,
  containerWidth: number,
  chartHeight: number
) => `${Math.round((px / (Math.min(containerWidth, chartHeight) / 2)) * 100)}%`;

function buildStackedLayout(
  containerWidth: number,
  baseHeight: number
): UsageByModelChartLayout {
  const chartHeight = baseHeight + STACKED_HEIGHT_EXTRA;
  const plotHeight = chartHeight - STACKED_LEGEND_BAND;
  const halfMin = Math.min(containerWidth, chartHeight) / 2;

  // Two donuts stacked vertically: each needs 2×outerRadius, plus a fixed gap.
  const maxOuterByHeight =
    (plotHeight - STACKED_TOP_MARGIN - STACKED_DONUT_GAP) / 4;
  const maxOuterByWidth = containerWidth * 0.36;
  const outerRadiusPx = Math.max(
    24,
    Math.min(maxOuterByHeight, maxOuterByWidth, halfMin * 0.38)
  );
  const innerRadiusPx = outerRadiusPx * 0.72;

  const tokenCyPx = STACKED_TOP_MARGIN + outerRadiusPx;
  const apiCyPx = tokenCyPx + 2 * outerRadiusPx + STACKED_DONUT_GAP;
  const tokenCy = Math.round((tokenCyPx / chartHeight) * 100);
  const apiCy = Math.round((apiCyPx / chartHeight) * 100);
  const legendTextWidth = Math.max(
    72,
    Math.min(120, Math.floor((containerWidth - 48) / 3))
  );

  return {
    tokenCenter: ['50%', `${tokenCy}%`],
    apiCenter: ['50%', `${apiCy}%`],
    radius: [
      pxToRadiusPct(innerRadiusPx, containerWidth, chartHeight),
      pxToRadiusPct(outerRadiusPx, containerWidth, chartHeight)
    ],
    chartHeightExtra: STACKED_HEIGHT_EXTRA,
    centerLabelFontSize: containerWidth < 400 ? 14 : 16,
    legend: {
      orient: 'horizontal',
      type: 'scroll',
      bottom: 8,
      left: 'center',
      width: '94%',
      height: STACKED_LEGEND_BAND - 16,
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 10,
      pageIconSize: 10,
      pageTextStyle: {
        fontSize: 10
      },
      textStyle: {
        overflow: 'truncate',
        width: legendTextWidth
      }
    }
  };
}

export function getUsageByModelChartLayout(
  containerWidth: number,
  baseHeight = 300
): UsageByModelChartLayout {
  if (containerWidth < STACKED_MAX_WIDTH) {
    return buildStackedLayout(containerWidth, baseHeight);
  }
  if (containerWidth < COMPACT_MAX_WIDTH) return compactLayout;
  return desktopLayout;
}
