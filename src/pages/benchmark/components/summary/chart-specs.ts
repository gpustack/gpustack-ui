import {
  StagePoint,
  fmtInt,
  fmtMs,
  fmtPct,
  fmtSec,
  fmtTps,
  linearMax
} from './metrics';
import { C, ChartSpec } from './stage-chart';

// ── The eight detail charts ───────────────────────────────────────────────────
// Order IS importance: the first three answer a distinct question each and stay
// visible; the rest expand on demand. Every entry is declarative — the shared
// renderer owns axes, tooltips and legends, so a chart here is a data contract,
// not a drawing.
//
// Log vs linear follows one rule: a span over roughly 50x (max/min) goes log.
// Latency spans three orders of magnitude across a saturating sweep; throughput
// spans about 4x. Bounds come from the data (see logDomain/linearMax) rather
// than fixed 40k-style ceilings, which stop covering the range the moment the
// model changes.

interface SpecOpts {
  points: StagePoint[];
  isConcurrency: boolean;
}

// Only formatMessage is needed; typed structurally so this module doesn't depend
// on react-intl's shape.
type Formatter = { formatMessage: (descriptor: { id: string }) => string };

export const buildChartSpecs = (
  intl: Formatter,
  { points, isConcurrency }: SpecOpts
): ChartSpec[] => {
  const t = (id: string) => intl.formatMessage({ id });
  // Percentile labels and pure units are the same string in every locale, so
  // they stay literals instead of becoming translation keys.
  const p50 = 'p50';
  const p90 = 'p90';
  const p99 = 'p99';
  const iqr = 'p25–p75';
  const TPS = 'Tokens/s';

  const specs: ChartSpec[] = [
    // 1. Where does my SLA still hold. The IQR band is the robust spread signal
    //    (p25/p75 shrug off outliers), the p99 dashed line owns the tail — two
    //    signals with separate jobs, so "the band widens" means the bulk of the
    //    distribution is diverging, not that one request was slow.
    {
      key: 'ttft-dist',
      title: t('benchmark.detail.chart.ttftDist'),
      note: t('benchmark.detail.chart.ttftDist.note'),
      yName: 'TTFT (ms)',
      log: true,
      fmt: fmtMs,
      bands: [
        {
          name: iqr,
          lo: (p) => p.ttftP25,
          hi: (p) => p.ttftP75,
          fill: C.blueBand,
          swatch: C.blueSwatch
        }
      ],
      series: [
        { name: p50, value: (p) => p.ttftP50, color: C.blue },
        { name: p99, value: (p) => p.ttftP99, color: C.red, dashed: true }
      ]
    },
    // 2. Did the run apply the load it was configured with — the sanity check the
    //    rest of the report rests on. WHICH pair is charted follows the load axis,
    //    because only one of the two knobs exists per run: a fixed-rate run
    //    configures req/s and can fall behind it once the server saturates; a
    //    concurrency run configures how many requests stay in flight and reports
    //    the mean it actually held. Charting the rate pair on a concurrency run
    //    plots the configured CONCURRENCY on a Requests/s axis — the same number
    //    relabelled as a different quantity, which is worse than showing nothing.
    //
    //    On the concurrency axis the two lines COINCIDE, and no styling changes
    //    that: a closed-loop client holds its target to within a few percent, so
    //    384 against 375 is under a pixel on an axis that also has to fit 4. The
    //    levels stay as they are — they are what the chart claims to show — and
    //    the difference moves to a right-hand axis scaled to itself, where a
    //    9-request gap is 9 requests tall instead of invisible.
    isConcurrency
      ? {
          key: 'concurrency-shortfall',
          title: t('benchmark.detail.chart.concShortfall'),
          note: t('benchmark.detail.chart.concShortfall.note'),
          yName: t('benchmark.detail.chart.axis.inFlight'),
          log: true,
          fmt: fmtInt,
          series: [
            {
              name: t('benchmark.detail.chart.legend.configured'),
              value: (p) => p.confConc,
              color: C.slate,
              dashed: true
            },
            {
              name: t('benchmark.detail.chart.legend.actual'),
              value: (p) => p.conc,
              color: C.blue
            }
          ],
          y2: {
            name: t('benchmark.detail.chart.axis.shortfall'),
            fmt: fmtInt,
            series: [
              {
                name: t('benchmark.detail.chart.legend.shortfall'),
                // Clamped at zero: a mean marginally ABOVE the target is
                // measurement noise, and letting it dip negative would put a
                // meaningless sign on the one quantity the axis exists for.
                value: (p) =>
                  p.conc == null || p.confConc == null
                    ? null
                    : Math.max(0, p.confConc - p.conc),
                color: C.red,
                fill: C.redBand
              }
            ]
          },
          // The gap in requests answers "how many", the percentage answers "does
          // it matter" — 9 short of 384 and 9 short of 16 are not the same event.
          tooltipExtra: (p) => [
            {
              color: C.redSwatch,
              label: `${t('benchmark.detail.chart.legend.attainment')}  ${
                p.conc == null || !p.confConc
                  ? '-'
                  : fmtPct((p.conc / p.confConc) * 100)
              }`
            }
          ]
        }
      : {
          key: 'rate-shortfall',
          title: t('benchmark.detail.chart.rateShortfall'),
          note: t('benchmark.detail.chart.rateShortfall.note'),
          yName: 'Requests/s',
          fmt: fmtInt,
          max: linearMax(
            points.map((p) => Math.max(p.load, p.achievedRate ?? 0))
          ),
          bands: [
            {
              name: t('benchmark.detail.chart.legend.shortfall'),
              lo: (p) => p.achievedRate,
              hi: (p) => p.load,
              fill: C.redBand,
              swatch: C.redSwatch,
              tooltip: false
            }
          ],
          series: [
            {
              name: t('benchmark.detail.chart.legend.configured'),
              value: (p) => p.load,
              color: C.slate,
              dashed: true
            },
            {
              name: t('benchmark.detail.chart.legend.achieved'),
              value: (p) => p.achievedRate,
              color: C.blue
            }
          ]
        },
    // 3. Is the latency growth queueing or generation. Two real curves with the
    //    gap filled — a `latency - ttft` difference line would read as an
    //    independently reported metric, which it is not. "Generation", not
    //    "Decode": the span also contains scheduling preemption and batch waits.
    {
      key: 'latency-composition',
      title: t('benchmark.detail.chart.latencyComposition'),
      note: t('benchmark.detail.chart.latencyComposition.note'),
      yName: t('benchmark.detail.chart.axis.latencyMs'),
      log: true,
      fmt: fmtMs,
      bands: [
        {
          name: t('benchmark.detail.chart.legend.generation'),
          lo: (p) => p.ttft,
          hi: (p) => (p.latency == null ? null : p.latency * 1000),
          fill: C.violetBand,
          swatch: C.violetSwatch
        }
      ],
      series: [
        {
          name: t('benchmark.detail.avg.ttft'),
          value: (p) => p.ttft,
          color: C.red
        },
        {
          name: t('benchmark.detail.avg.reqLatency'),
          value: (p) => (p.latency == null ? null : p.latency * 1000),
          color: C.violet
        }
      ]
    },
    // 4. The trade-off frontier: throughput is the RESULT, so it belongs on the
    //    x-axis. Reading right to left shows what each extra tok/s costs in tail
    //    latency; a curve that turns back on itself is past the useful ceiling.
    {
      key: 'frontier',
      title: t('benchmark.detail.chart.frontier'),
      note: t('benchmark.detail.chart.frontier.note'),
      yName: 'TTFT p99 (ms)',
      log: true,
      fmt: fmtMs,
      marks: true,
      series: [{ name: 'TTFT p99', value: (p) => p.ttftP99, color: C.blue }],
      x: {
        name: 'Total Tokens/s',
        value: (p) => p.tps,
        fmt: fmtTps
      }
    },
    // 5. Prefill-heavy or decode-heavy.
    {
      key: 'throughput-split',
      title: t('benchmark.detail.chart.throughputSplit'),
      note: t('benchmark.detail.chart.throughputSplit.note'),
      yName: TPS,
      fmt: fmtTps,
      marks: true,
      series: [
        {
          name: t('benchmark.detail.percentile.total'),
          value: (p) => p.tps,
          color: C.blue
        },
        {
          name: t('benchmark.detail.percentile.input'),
          value: (p) => p.inTps,
          color: C.green
        },
        {
          name: t('benchmark.detail.percentile.output'),
          value: (p) => p.outTps,
          color: C.amber
        }
      ]
    },
    // 6. Throughput per in-flight request. Diminishing returns show up here
    //    earlier and more sharply than as a bend in the total-throughput curve.
    {
      key: 'efficiency',
      title: t('benchmark.detail.chart.efficiency'),
      note: t('benchmark.detail.chart.efficiency.note'),
      yName: TPS,
      log: true,
      fmt: fmtTps,
      marks: true,
      series: [
        {
          name: t('benchmark.detail.chart.legend.perRequest'),
          value: (p) => (p.tps == null || !p.conc ? null : p.tps / p.conc),
          color: C.violet
        }
      ],
      x: {
        name: t('benchmark.detail.requests.concurrency'),
        value: (p) => p.conc,
        fmt: fmtInt,
        log: true
      }
    },
    // 7. End-to-end latency: what one caller waits, first token included. TTFT
    //    answers "when does it start", this one "when is it done".
    {
      key: 'latency-dist',
      title: t('benchmark.detail.chart.latencyDist'),
      note: t('benchmark.detail.chart.latencyDist.note'),
      yName: t('benchmark.detail.chart.axis.latencySec'),
      log: true,
      fmt: fmtSec,
      bands: [
        {
          name: iqr,
          lo: (p) => p.latP25,
          hi: (p) => p.latP75,
          fill: C.violetBand,
          swatch: C.violetSwatch
        }
      ],
      series: [
        { name: p50, value: (p) => p.latP50, color: C.violet },
        { name: p99, value: (p) => p.latP99, color: C.red, dashed: true }
      ]
    },
    // 8. How decode speed degrades with load. NOT a stutter chart: guidellm
    //    computes one TPOT per REQUEST (its `inter_token_latency_ms`) and takes
    //    the percentiles over those per-request means — token-weighted, so a
    //    128-token request contributes one value replicated 127 times. p99 here
    //    is "the request whose average decode was slowest", not "the worst gap
    //    between two tokens". The per-chunk arrival deltas that would show a
    //    stall are discarded at collection time and cannot be recovered.
    {
      key: 'tpot-percentiles',
      title: t('benchmark.detail.chart.tpotPercentiles'),
      note: t('benchmark.detail.chart.tpotPercentiles.note'),
      yName: 'TPOT (ms)',
      log: true,
      fmt: fmtMs,
      series: [
        { name: p50, value: (p) => p.tpotP50, color: C.blue },
        { name: p90, value: (p) => p.tpotP90, color: C.green },
        { name: p99, value: (p) => p.tpotP99, color: C.red }
      ]
    }
  ];

  // The success-rate chart is earned, not scheduled: a flat 100% line spends a
  // whole panel saying nothing happened. It appears only once something failed.
  if (points.some((p) => p.errored > 0 || p.incomplete > 0)) {
    specs.push({
      key: 'success',
      title: t('benchmark.detail.chart.success'),
      note: t('benchmark.detail.chart.success.note'),
      yName: t('benchmark.detail.chart.axis.successRate'),
      fmt: (v) => `${Math.round(v)}%`,
      max: 100,
      series: [
        {
          name: t('benchmark.detail.chart.success'),
          value: (p) => (p.total > 0 ? (p.ok / p.total) * 100 : null),
          color: C.blue
        }
      ]
    });
  }

  return specs;
};

/** Charts 1–3 stay visible; the rest hide behind "Show N more". */
export const RESIDENT_CHARTS = 3;
