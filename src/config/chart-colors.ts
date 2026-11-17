// Shared with Benchmark. Keep measured series separate from neutral capacity
// references; legend swatches, hover markers and lines all use these tokens.
export const CHART_COLORS = {
  blue: '#2563eb',
  amber: '#e0a800',
  red: '#e5484d',
  green: '#16a34a',
  violet: '#7c3aed'
} as const;

// The first five hues come from Benchmark; the remaining accents extend its
// palette for instance comparisons. The order is fixed, independent of the
// number of visible curves. Both modes pass the categorical palette checks;
// amber on light surfaces also has the named legend and table view as relief.
export const CHART_SERIES_COLORS = {
  light: [
    CHART_COLORS.blue,
    CHART_COLORS.green,
    CHART_COLORS.violet,
    CHART_COLORS.amber,
    CHART_COLORS.red,
    '#0891b2',
    '#a855f7',
    '#db2777'
  ],
  dark: [
    '#3987e5',
    '#199e70',
    '#9260e5',
    '#b98a00',
    '#ca2b37',
    '#259ebf',
    '#af5dff',
    '#f04088'
  ]
} as const;
