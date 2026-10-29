import { useIntl } from '@umijs/max';
import { Button, Flex, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { round } from 'lodash';
import React from 'react';
import { loadAxisLabelId, loadValueDecimals } from '../../config';
import { useDetailContext } from '../../config/detail-context';
import {
  getPrimaryResultRate,
  hasSloTargets
} from '../../utils/primary-result';
import {
  SLO_SUCCESS_FLOOR,
  StagePoint,
  configuredSloMetrics,
  isSloCapacityPoint,
  pctDelta
} from './metrics';

// One horizontal band: the payoff number on the left, the operating point's six
// defining metrics in a single row, and the "why this one" reasoning on the right.
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
      color: var(--ant-color-text-tertiary);
    }
    .col-stats {
      flex: 1 1 560px;
      min-width: 0;
      display: grid;
      grid-template-columns: repeat(var(--stat-count), minmax(0, 1fr));
      gap: 8px;
      align-items: center;
    }
    @media (max-width: 1680px) {
      .col-stats {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        row-gap: 16px;
      }
    }
    @media (max-width: 600px) {
      .col-hero {
        min-width: 0;
        max-width: 100%;
        width: 100%;
        padding-right: 0;
        border-right: none;
      }
      .col-stats {
        flex-basis: 100%;
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
    .stat .k {
      font-size: 12px;
      color: var(--ant-color-text-tertiary);
      white-space: normal;
      margin-bottom: 8px;
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

  const dec = loadValueDecimals(detailData);
  const isConc = loadAxisLabelId(detailData) === 'benchmark.form.concurrency';
  const isSearch = detailData?.auto_tune === true;
  const loadUnit = t(
    isConc
      ? 'benchmark.table.best.unit.concurrency'
      : 'benchmark.table.best.unit.rate'
  );
  const peak = points.find((p) => p.isPeak);
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
            v: fmt(best.load, dec),
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
    { k: t('benchmark.detail.metric.ttftP99'), v: fmt(best.ttftP99), u: 'ms' },
    { k: t('benchmark.detail.metric.tpotP99'), v: fmt(best.tpotP99), u: 'ms' },
    { k: t('benchmark.detail.metric.itlP99'), v: fmt(best.itlP99), u: 'ms' }
  ];
  const peakGain =
    peak && peak !== best && peak.tps != null && best.tps != null
      ? pctDelta(best.tps, peak.tps)
      : null;
  const peakLatencyCost =
    peak && peak.ttftP99 != null && best.ttftP99 != null
      ? pctDelta(best.ttftP99, peak.ttftP99)
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
            pass: fmt(bracket[0], dec),
            fail: fmt(bracket[1], dec),
            unit: loadUnit
          })}
        </>
      )}
    </>
  ) : undefined;

  return (
    <Flex className={styles.wrapper}>
      <Flex vertical className="col-hero">
        <div className="caption">{t(title)}</div>
        <Tooltip title={capacityHint} trigger={['hover', 'focus']}>
          <Button
            type="text"
            className="hero"
            aria-label={t('benchmark.detail.result.selectMeasuredPoint', {
              load: fmt(best.load, dec),
              unit: loadUnit
            })}
            onClick={() => onSelect(best)}
          >
            <Flex component="span" align="baseline" gap={8}>
              <span className="v">
                {fmt(hasSlo ? best.load : best.tps, hasSlo ? dec : 0)}
              </span>
              <span className="u">{hasSlo ? loadUnit : 'tok/s'}</span>
            </Flex>
          </Button>
        </Tooltip>
      </Flex>
      <div
        className="col-stats"
        style={{ '--stat-count': stats.length } as React.CSSProperties}
      >
        {stats.map((s) => (
          <div className="stat" key={s.k}>
            <Flex gap={4} align="center" className="k">
              <span>{s.k}</span>
              {s.u && <span>({s.u})</span>}
            </Flex>
            <span className="b">
              <span className="n">{s.v}</span>
            </span>
          </div>
        ))}
      </div>
      <Flex vertical gap={8} className="col-why">
        {hasSlo && (
          <>
            <Flex wrap="wrap" gap={6} className="slo">
              {configured.map((m) => (
                <span
                  className="pill"
                  key={m.field}
                >{`${m.label} ≤ ${m.threshold} ms`}</span>
              ))}
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
        {hasSlo && peak && peakGain != null && (
          <Flex gap={8} className="why">
            <span className={`badge ${peakGain > 5 ? 'up' : 'flat'}`}>
              {peakGain > 0 ? '+' : ''}
              {peakGain}%
            </span>
            <span>
              {intl.formatMessage(
                {
                  id:
                    peakLatencyCost != null
                      ? 'benchmark.detail.reason.peakTradeoff'
                      : 'benchmark.detail.reason.peakTradeoffPlain'
                },
                {
                  rate: (
                    <Button
                      type="link"
                      style={{ padding: 0, height: 'auto' }}
                      onClick={() => onSelect(peak)}
                    >
                      {fmt(peak.load, dec)}
                    </Button>
                  ),
                  unit: loadUnit,
                  gain: `${peakGain > 0 ? '+' : ''}${peakGain}`,
                  cost:
                    peakLatencyCost == null ? (
                      ''
                    ) : (
                      <span
                        className={
                          peakLatencyCost < 0
                            ? 'improvement'
                            : peakLatencyCost > 0
                              ? 'cost'
                              : undefined
                        }
                      >
                        {peakLatencyCost > 0 ? '+' : ''}
                        {peakLatencyCost}%
                      </span>
                    )
                }
              )}
            </span>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};

export default BestPoints;
