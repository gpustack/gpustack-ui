import { useIntl } from '@umijs/max';
import { Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { round } from 'lodash';
import React from 'react';
import { loadAxisLabelId, loadValueDecimals } from '../../config';
import { useDetailContext } from '../../config/detail-context';
import { StagePoint, pctDelta } from './metrics';

// One horizontal band: the payoff number on the left, the operating point's six
// defining metrics in a single row, and the "why this one" reasoning on the right.
// Success rate is deliberately NOT here — it belongs on the Detailed metrics
// header as a pill, since a 100% run has nothing to say.
const useStyles = createStyles(({ css }) => ({
  wrapper: css`
    display: flex;
    align-items: stretch;
    gap: 24px;
    flex-wrap: wrap;
    border: 1px solid var(--ant-color-border-secondary);
    border-radius: var(--ant-border-radius);
    padding: 16px 20px;
    .col-hero {
      flex: none;
      min-width: 240px;
      padding-right: 24px;
      border-right: 1px solid var(--ant-color-border-secondary);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .caption {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--ant-color-text);
    }
    .hero {
      display: flex;
      align-items: baseline;
      gap: 7px;
    }
    .hero .v {
      font-size: 40px;
      font-weight: 500;
      line-height: 1;
      letter-spacing: -0.02em;
      color: var(--ant-color-primary);
      font-variant-numeric: tabular-nums;
    }
    .hero .u {
      font-size: 15px;
      color: var(--ant-color-text-tertiary);
    }
    .col-stats {
      flex: 1 1 560px;
      min-width: 0;
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 8px;
      align-items: center;
    }
    @media (max-width: 1100px) {
      .col-stats {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        row-gap: 14px;
      }
    }
    .stat .k {
      font-size: 12px;
      color: var(--ant-color-text-tertiary);
      white-space: nowrap;
    }
    .stat .b {
      display: flex;
      align-items: baseline;
      gap: 3px;
      white-space: nowrap;
    }
    .stat .b .n {
      font-size: 20px;
      color: var(--ant-color-text);
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.015em;
    }
    .stat .b .u {
      font-size: 11px;
      color: var(--ant-color-text-tertiary);
    }
    .col-why {
      flex: 0 1 300px;
      min-width: 220px;
      padding-left: 20px;
      border-left: 1px solid var(--ant-color-border-secondary);
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 8px;
    }
    .why {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 12px;
      line-height: 1.55;
      color: var(--ant-color-text-secondary);
    }
    .why .badge {
      flex: none;
      font-size: 11px;
      font-weight: 600;
      border-radius: 5px;
      padding: 1px 6px;
      font-variant-numeric: tabular-nums;
    }
    .why .badge.up {
      color: var(--ant-color-success);
      background: var(--ant-color-success-bg);
    }
    .why .badge.flat {
      color: var(--ant-color-text-tertiary);
      background: var(--ant-color-fill-quaternary);
    }
    .why .cost {
      color: var(--ant-color-error);
    }
    .why .capacity {
      cursor: help;
    }
    .why .capacity b {
      font-weight: 600;
      color: var(--ant-color-text);
      font-variant-numeric: tabular-nums;
      margin-left: 5px;
    }
    /* SLA budget: pills, so an SLA run makes its thresholds explicit next to the
       point that was chosen to satisfy them. */
    .sla {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .sla .pill {
      font-size: 11px;
      font-weight: 600;
      color: var(--ant-color-primary);
      border: 1px solid var(--ant-color-primary-border);
      border-radius: 10px;
      padding: 0 8px;
      white-space: nowrap;
    }
  `
}));

interface BestPointsProps {
  points: StagePoint[];
  onSelect: (r: StagePoint) => void;
}

const BestPoints: React.FC<BestPointsProps> = ({ points, onSelect }) => {
  const { styles } = useStyles();
  const intl = useIntl();
  const { detailData } = useDetailContext();
  const t = (id: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id }, values);

  const best = points.find((p) => p.isBest);
  if (!best) {
    return null;
  }

  const dec = loadValueDecimals(detailData);
  const isConc = loadAxisLabelId(detailData) === 'benchmark.form.concurrency';
  const loadUnit = t(
    isConc
      ? 'benchmark.table.best.unit.concurrency'
      : 'benchmark.table.best.unit.rate'
  );

  const idx = points.findIndex((p) => p.isBest);
  const prev = idx > 0 ? points[idx - 1] : null;
  const peak = points.find((p) => p.isPeak);

  // Reason 1 — what the extra load bought over the previous stage.
  const gainOverPrev =
    prev && prev.tps != null && best.tps != null
      ? pctDelta(prev.tps, best.tps)
      : null;
  // Reason 2 — what pushing on to the throughput peak would cost. Latency is
  // compared on p99, the metric an SLA is actually written against.
  const peakGain =
    peak && peak.tps != null && best.tps != null
      ? pctDelta(best.tps, peak.tps)
      : null;
  const peakLatencyCost =
    peak && peak.ttftP99 != null && best.ttftP99 != null
      ? pctDelta(best.ttftP99, peak.ttftP99)
      : null;

  // Only meaningful for an SLA run; `sla_boundary_located` is absent for the rest.
  const slaCapacity = detailData?.sla_met_rate ?? null;
  const boundaryLocated = detailData?.validity?.sla_boundary_located === true;

  // TPOT here is the decode-only metric the table shows: the thresholds, the
  // stage verdicts and the server's sla_met_rate all sit on that one basis.
  const slaTargets: string[] = (
    [
      [detailData?.sla_avg_ttft_ms, 'TTFT Avg'],
      [detailData?.sla_p95_ttft_ms, 'TTFT p95'],
      [detailData?.sla_p99_ttft_ms, 'TTFT p99'],
      [detailData?.sla_avg_tpot_ms, 'TPOT Avg'],
      [detailData?.sla_p95_tpot_ms, 'TPOT p95'],
      [detailData?.sla_p99_tpot_ms, 'TPOT p99'],
      [detailData?.sla_avg_latency_ms, 'Latency Avg'],
      [detailData?.sla_p95_latency_ms, 'Latency p95'],
      [detailData?.sla_p99_latency_ms, 'Latency p99']
    ] as Array<[number | undefined, string]>
  )
    .filter(([v]) => v != null)
    .map(([v, label]) => `${label} ≤ ${v} ms`);

  // Sub-millisecond TPOT is normal on small models, so a whole-number render
  // would collapse every value to "0".
  const fmt = (v: number | null, digits?: number) =>
    v == null
      ? '-'
      : round(v, digits ?? (Math.abs(v) < 10 ? 2 : 0)).toLocaleString();

  const stats: Array<{ k: string; v: string; u: string }> = [
    {
      k: t(loadAxisLabelId(detailData)),
      v: String(round(best.load, dec)),
      u: loadUnit
    },
    {
      k: t('benchmark.detail.requests.concurrency'),
      v: fmt(best.conc, 0),
      u: t('benchmark.detail.unit.avg')
    },
    {
      k: t('benchmark.detail.percentile.input'),
      v: fmt(best.inTps, 0),
      u: 'tok/s'
    },
    {
      k: t('benchmark.detail.percentile.output'),
      v: fmt(best.outTps, 0),
      u: 'tok/s'
    },
    { k: 'TTFT p99', v: fmt(best.ttftP99), u: 'ms' },
    { k: t('benchmark.detail.avg.tpot'), v: fmt(best.tpot), u: 'ms' }
  ];

  return (
    <div className={styles.wrapper} onClick={() => onSelect(best)}>
      <div className="col-hero">
        <div className="caption">
          <span>⭐</span>
          {t('benchmark.detail.summary.recommendation')}
        </div>
        <div className="hero">
          {/* Computed from the point, never a fixed string: the moment the hero
              and the chart read different sources they start disagreeing. */}
          <span className="v">{round(best.tps ?? 0, 0).toLocaleString()}</span>
          <span className="u">tok/s</span>
        </div>
        <div className="caption" style={{ fontWeight: 400 }}>
          <span style={{ color: 'var(--ant-color-text-tertiary)' }}>
            {t('benchmark.detail.throughput.totalToken')}
          </span>
        </div>
      </div>

      <div className="col-stats">
        {stats.map((s) => (
          <div className="stat" key={s.k}>
            <div className="k">{s.k}</div>
            <div className="b">
              <span className="n">{s.v}</span>
              <span className="u">{s.u}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="col-why">
        {slaTargets.length > 0 && (
          <div className="sla">
            {slaTargets.map((s) => (
              <span className="pill" key={s}>
                {s}
              </span>
            ))}
          </div>
        )}
        {/* The SLA capacity, stated as what it actually is. Without a measured
            breach above it the number is a FLOOR, not the boundary — rendering
            "256" flat would invent a ceiling nobody measured, and capacity
            planning would then be done against it. */}
        {slaCapacity != null && (
          <div className="why">
            <Tooltip
              title={t(
                boundaryLocated
                  ? 'benchmark.detail.sla.capacity.locatedHint'
                  : 'benchmark.detail.sla.capacity.floorHint'
              )}
            >
              <span className="capacity">
                {t('benchmark.detail.sla.capacity')}
                <b>
                  {boundaryLocated ? '' : '≥ '}
                  {round(slaCapacity, dec)} {loadUnit}
                </b>
              </span>
            </Tooltip>
          </div>
        )}
        {gainOverPrev != null && gainOverPrev > 0 && prev && (
          <div className="why">
            <span className="badge up">+{gainOverPrev}%</span>
            <span>
              {t('benchmark.detail.reason.throughputVsPrev', {
                up: gainOverPrev,
                prevRate: round(prev.load, dec)
              })}
            </span>
          </div>
        )}
        {peak && peakGain != null && (
          <div className="why">
            <span className={`badge ${peakGain > 5 ? 'up' : 'flat'}`}>
              +{peakGain}%
            </span>
            <span>
              {/* The cost half carries the whole point of the sentence, so it is
                  the coloured fragment — hence rich values rather than a plain
                  interpolated string. Without a measured p99 the clause is
                  dropped instead of guessed. */}
              {peakLatencyCost != null
                ? intl.formatMessage(
                    { id: 'benchmark.detail.reason.peakTradeoff' },
                    {
                      rate: round(peak.load, dec),
                      unit: loadUnit,
                      gain: peakGain,
                      cost: (
                        <span className="cost" key="cost">
                          {peakLatencyCost > 0 ? '+' : ''}
                          {peakLatencyCost}%
                        </span>
                      )
                    }
                  )
                : t('benchmark.detail.reason.peakTradeoffPlain', {
                    rate: round(peak.load, dec),
                    unit: loadUnit,
                    gain: peakGain
                  })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BestPoints;
