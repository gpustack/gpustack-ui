import { useIntl } from '@umijs/max';
import { Button, Flex, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { round } from 'lodash';
import React from 'react';
import { loadAxisLabelId } from '../../config';
import { useDetailContext } from '../../config/detail-context';
import {
  getPrimaryResultRate,
  hasSloTargets
} from '../../utils/primary-result';
import LatencySummary from './latency-summary';
import {
  SLO_SUCCESS_FLOOR,
  StagePoint,
  configuredSloMetrics,
  isSloCapacityPoint,
  sloBoundary
} from './metrics';
import { formatThresholdComparison } from './threshold-comparison';

// One summary band: capacity, operating metrics, compact latency groups, and
// SLO evidence. Reserve space for the latency groups instead of squeezing them
// into the same equal-width tracks as the throughput metrics.
// The success rate on the right is THIS POINT's, standing as a credential on the
// headline throughput; the RUN-wide rate is a separate pill on the Detailed
// metrics header, where a 100% run has nothing to say.
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
      justify-content: center;
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
      padding: 0;
      border: 0;
      height: auto;
      align-self: flex-start;
      font: inherit;
    }
    .hero.ant-btn:hover {
      background: transparent;
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
      color: var(--ant-color-text-secondary);
    }
    .col-stats {
      flex: 1 1 560px;
      min-width: 0;
      align-items: center;
    }
    .col-stats:not(.slo-stats) {
      display: grid;
      grid-template-columns: repeat(var(--stat-count), minmax(0, 1fr));
      gap: 8px;
    }
    &.slo-summary .col-hero {
      min-width: 180px;
      max-width: 220px;
    }
    .col-stats.slo-stats {
      align-items: start;
      align-self: start;
    }
    .operating-stats {
      flex: 1 1 calc(4 * 112px + 3 * var(--ant-margin));
      min-width: 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));
      gap: var(--ant-margin);
      align-items: start;
    }
    .latency-stats {
      flex: 1 1
        calc(var(--latency-count) * 112px + (var(--latency-count) - 1) * 36px);
      min-width: 0;
      max-width: min(100%, var(--latency-width, 540px));
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));
      column-gap: 36px;
      row-gap: var(--ant-margin);
    }
    &.slo-summary .col-why {
      flex: 0 0 380px;
      min-width: 0;
      max-width: 100%;
      padding-left: var(--ant-padding-lg);
      justify-content: flex-start;
    }
    .stat .k {
      font-size: 12px;
      color: var(--ant-color-text-secondary);
      white-space: normal;
      margin-bottom: 8px;
      line-height: 20px;
    }
    .stat .b {
      display: flex;
      align-items: baseline;
      gap: 4px;
      white-space: nowrap;
    }
    .stat .b .n {
      font-size: 16px;
      color: var(--ant-color-text);
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.015em;
      font-weight: 500;
    }
    .stat .b .u {
      font-size: 11px;
      color: var(--ant-color-text-secondary);
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
      color: var(--color-status-success-text);
      background: var(--ant-color-success-bg);
    }
    .why .badge.flat {
      color: var(--ant-color-text-tertiary);
      background: var(--ant-color-fill-quaternary);
    }
    .why .badge.warn {
      color: var(--color-status-warning-text);
      background: var(--ant-color-warning-bg);
    }
    .why .cost {
      color: var(--color-status-error-text);
    }
    .why .improvement {
      color: var(--color-status-success-text);
    }
    .slo-boundary {
      padding-top: var(--ant-padding-xs);
      border-top: 1px solid var(--ant-color-border-secondary);
    }
    .boundary-heading {
      width: 100%;
    }
    .boundary-heading strong {
      font-size: 12px;
      font-weight: 500;
    }
    .boundary-load {
      color: var(--ant-color-text-secondary);
      white-space: nowrap;
    }
    .boundary-load .ant-btn {
      font-size: 12px;
    }
    .failure-line {
      font-variant-numeric: tabular-nums;
    }
    /* SLO budget: pills, so an SLO run makes its thresholds explicit next to the
       point that was chosen to satisfy them. */
    .slo {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .slo .pill {
      font-size: 11px;
      font-weight: 600;
      color: var(--ant-color-primary);
      border: 1px solid var(--ant-color-primary-border);
      border-radius: 10px;
      padding: 0 8px;
      white-space: nowrap;
    }
    @media (max-width: 1680px) {
      .col-stats:not(.slo-stats) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        row-gap: var(--ant-margin);
      }
    }
    @media (max-width: 1200px) {
      &.slo-summary .col-why {
        flex-basis: 100%;
        padding-left: 0;
        border-left: none;
        padding-top: var(--ant-padding);
        border-top: 1px solid var(--ant-color-border-secondary);
      }
    }
    @media (max-width: 600px) {
      .col-hero,
      &.slo-summary .col-hero {
        min-width: 0;
        max-width: 100%;
        width: 100%;
        padding-right: 0;
        border-right: none;
      }
      .col-stats {
        flex-basis: 100%;
      }
      .col-stats:not(.slo-stats) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .col-why {
        min-width: 0;
        padding-left: 0;
        border-left: none;
        flex-basis: 100%;
      }
      .stat .b .n {
        font-size: 14px;
      }
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
  const hasSlo = hasSloTargets(detailData);
  if (!best) {
    const awaitingPrimary = getPrimaryResultRate(detailData) != null;
    return hasSlo && points.length > 0 && !awaitingPrimary ? (
      <Flex className={styles.wrapper} role="status">
        {t('benchmark.detail.result.noSloPoint')}
      </Flex>
    ) : null;
  }
  if (hasSlo && !isSloCapacityPoint(best)) return null;

  const isConc = loadAxisLabelId(detailData) === 'benchmark.form.concurrency';
  const isSearch = detailData?.auto_tune === true;
  const loadUnit = t(
    isConc
      ? 'benchmark.table.best.unit.concurrency'
      : 'benchmark.table.best.unit.rate'
  );
  const bracket = detailData?.validity?.slo_bracket;
  const okRate = best.total > 0 ? best.ok / best.total : null;
  const okPct = okRate == null ? null : round(okRate * 100, 1);
  const configured = configuredSloMetrics(
    best,
    detailData as unknown as Record<string, unknown>,
    t
  );
  const fmt = (v: number | null | undefined, digits?: number) =>
    v == null
      ? '-'
      : round(v, digits ?? (Math.abs(v) < 10 ? 2 : 0)).toLocaleString();
  // Match stage labels in the table and charts without rounding or locale changes.
  const fmtLoad = (value: number) => String(value);
  const title = hasSlo
    ? isConc
      ? 'benchmark.detail.result.sloConcurrency'
      : 'benchmark.detail.result.sloRate'
    : isSearch
      ? 'benchmark.detail.result.totalPeak'
      : 'benchmark.detail.result.measured';
  const stats = [
    ...(!hasSlo
      ? [
          {
            k: t(
              isConc
                ? 'benchmark.detail.stage.configuredConcurrency'
                : 'benchmark.detail.stage.configuredRate'
            ),
            v: fmtLoad(best.load),
            u: loadUnit
          },
          {
            k: t('benchmark.detail.stage.measuredRate'),
            v: fmt(best.achievedRate, 2),
            u: 'req/s'
          }
        ]
      : []),
    {
      k: t('benchmark.detail.stage.measuredConcurrency'),
      v: fmt(best.conc, 2)
    },
    ...(hasSlo
      ? [
          {
            k: t('benchmark.detail.percentile.total'),
            v: fmt(best.tps),
            u: 'tok/s'
          }
        ]
      : []),
    {
      k: t('benchmark.detail.percentile.input'),
      v: fmt(best.inTps),
      u: 'tok/s'
    },
    {
      k: t('benchmark.detail.percentile.output'),
      v: fmt(best.outTps),
      u: 'tok/s'
    },
    ...(!hasSlo
      ? [
          {
            k: t('benchmark.detail.metric.ttftP99'),
            v: fmt(best.ttftP99),
            u: 'ms'
          },
          {
            k: t('benchmark.detail.metric.tpotP99'),
            v: fmt(best.tpotP99),
            u: 'ms'
          },
          {
            k: t('benchmark.detail.metric.itlP99'),
            v: fmt(best.itlP99),
            u: 'ms'
          }
        ]
      : [])
  ];
  const latencyMetrics = [
    'ttft',
    'tpot',
    'itl',
    ...(configured.some((m) => m.field.includes('_latency_'))
      ? ['latency' as const]
      : [])
  ] as const;
  const boundary = sloBoundary(
    points,
    detailData as unknown as Record<string, unknown>
  );
  const failed = boundary.point
    ? configuredSloMetrics(
        boundary.point,
        detailData as unknown as Record<string, unknown>,
        t
      ).filter((m) => boundary.failed.some((check) => check.field === m.field))
    : [];
  const failureValue = (m: (typeof failed)[number]) => {
    if (m.value == null || !Number.isFinite(m.value) || m.value <= 0) {
      return t('benchmark.detail.slo.measurementUnavailable');
    }
    const comparison = formatThresholdComparison(m.value, m.threshold);
    return comparison
      ? `${comparison.actual} > ${comparison.threshold} ms`
      : t('benchmark.detail.slo.measurementUnavailable');
  };
  const failureText = (m: (typeof failed)[number]) =>
    `${m.label}: ${failureValue(m)}`;
  const successComparison =
    boundary.successFailed && boundary.point && boundary.point.total > 0
      ? formatThresholdComparison(
          (boundary.point.ok / boundary.point.total) * 100,
          SLO_SUCCESS_FLOOR * 100
        )
      : null;
  const boundaryLocated = detailData?.validity?.slo_boundary_located === true;
  const capacityHint = hasSlo ? (
    <>
      {t(
        boundaryLocated
          ? 'benchmark.detail.slo.capacity.locatedHint'
          : 'benchmark.detail.slo.capacity.floorHint'
      )}
      {boundaryLocated && bracket?.[0] != null && bracket?.[1] != null && (
        <>
          {' '}
          {t('benchmark.detail.result.boundaryPair', {
            pass: fmtLoad(bracket[0]),
            fail: fmtLoad(bracket[1]),
            unit: loadUnit
          })}
        </>
      )}
    </>
  ) : undefined;

  const statisticItems = stats.map((s) => (
    <div className="stat" key={s.k}>
      <Flex gap={4} align="center" className="k">
        <span>{s.k}</span>
        {s.u && <span>({s.u})</span>}
      </Flex>
      <span className="b">
        <span className="n">{s.v}</span>
      </span>
    </div>
  ));

  return (
    <Flex
      className={[styles.wrapper, hasSlo && 'slo-summary']
        .filter(Boolean)
        .join(' ')}
    >
      <Flex vertical className="col-hero">
        <div className="caption">{t(title)}</div>
        <Tooltip title={capacityHint} trigger={['hover', 'focus']}>
          <Button
            type="text"
            className="hero"
            aria-label={t('benchmark.detail.result.selectMeasuredPoint', {
              load: fmtLoad(best.load),
              unit: loadUnit
            })}
            onClick={() => onSelect(best)}
          >
            <Flex component="span" align="baseline" gap={8}>
              <span className="v">
                {hasSlo ? fmtLoad(best.load) : fmt(best.tps, 0)}
              </span>
              <span className="u">{hasSlo ? loadUnit : 'tok/s'}</span>
            </Flex>
          </Button>
        </Tooltip>
      </Flex>
      <Flex
        wrap={hasSlo}
        gap={hasSlo ? 'var(--ant-margin-lg)' : undefined}
        className={hasSlo ? 'col-stats slo-stats' : 'col-stats'}
        style={
          {
            '--stat-count': stats.length + (hasSlo ? latencyMetrics.length : 0),
            '--latency-width': latencyMetrics.length > 3 ? '700px' : '540px'
          } as React.CSSProperties
        }
      >
        {hasSlo ? (
          <>
            <div className="operating-stats">{statisticItems}</div>
            <div
              className="latency-stats"
              style={
                {
                  '--latency-count': latencyMetrics.length
                } as React.CSSProperties
              }
            >
              {latencyMetrics.map((metric) => (
                <LatencySummary key={metric} metric={metric} point={best} />
              ))}
            </div>
          </>
        ) : (
          statisticItems
        )}
      </Flex>
      <Flex vertical gap={8} className="col-why">
        {hasSlo && (
          <>
            <Flex wrap="wrap" gap={6} className="slo">
              {configured.slice(0, 2).map((m) => (
                <span
                  className="pill"
                  key={m.field}
                >{`${m.label} ≤ ${m.threshold} ms`}</span>
              ))}
              {configured.length > 2 && (
                <Tooltip
                  title={
                    <Flex vertical gap={4}>
                      {configured.slice(2).map((m) => (
                        <span
                          key={m.field}
                        >{`${m.label} ≤ ${m.threshold} ms`}</span>
                      ))}
                    </Flex>
                  }
                  trigger={['hover', 'focus']}
                >
                  <span
                    className="pill"
                    tabIndex={0}
                    aria-label={t('benchmark.detail.slo.moreTargets', {
                      count: configured.length - 2
                    })}
                  >
                    +{configured.length - 2}
                  </span>
                </Tooltip>
              )}
            </Flex>
          </>
        )}
        {okPct != null && (
          <Flex gap={8} className="why">
            <span
              className={
                okRate! >= SLO_SUCCESS_FLOOR ? 'badge up' : 'badge warn'
              }
            >
              {okPct}%
            </span>
            <span>
              {t('benchmark.detail.reason.requestsSucceeded', {
                ok: best.ok,
                total: best.total
              })}
            </span>
          </Flex>
        )}
        {hasSlo && (
          <Flex vertical gap={4} className="why slo-boundary" role="note">
            {boundary.point ? (
              <>
                <Flex
                  align="center"
                  justify="space-between"
                  gap={12}
                  className="boundary-heading"
                >
                  <strong>{t('benchmark.detail.slo.boundary')}</strong>
                  <span className="boundary-load">
                    {t('benchmark.detail.slo.firstBreachLoad')}{' '}
                    <Button
                      type="link"
                      style={{ padding: 0, height: 'auto' }}
                      onClick={() => onSelect(boundary.point!)}
                    >
                      {fmtLoad(boundary.point.load)}
                    </Button>{' '}
                    {loadUnit}
                  </span>
                </Flex>
                {failed.slice(0, 2).map((m) => (
                  <Flex
                    gap={8}
                    align="baseline"
                    className="failure-line"
                    key={m.field}
                  >
                    <span>{m.label}</span>
                    <span className="cost">{failureValue(m)}</span>
                  </Flex>
                ))}
                {failed.length > 2 && (
                  <Tooltip
                    title={failed.slice(2).map(failureText).join('; ')}
                    trigger={['hover', 'focus']}
                  >
                    <span tabIndex={0}>
                      {t('benchmark.detail.slo.moreFailures', {
                        count: failed.length - 2
                      })}
                    </span>
                  </Tooltip>
                )}
                {boundary.successFailed && (
                  <span className="cost">
                    {successComparison
                      ? t('benchmark.detail.slo.successBelow', {
                          actual: successComparison.actual,
                          threshold: successComparison.threshold
                        })
                      : t('benchmark.detail.slo.measurementUnavailable')}
                  </span>
                )}
              </>
            ) : (
              <span>
                {t(
                  points.every((p) => p.sloPass === true)
                    ? 'benchmark.detail.slo.allMeasuredPassed'
                    : 'benchmark.detail.slo.noHigherBreach'
                )}
              </span>
            )}
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};

export default BestPoints;
