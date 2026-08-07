import {
  CheckCircleFilled,
  DownOutlined,
  QuestionCircleOutlined,
  RightOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Table, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import {
  STOP_REASON_LABEL,
  loadAxisLabelId,
  loadValueDecimals
} from '../../config';
import { useDetailContext } from '../../config/detail-context';
import { RESIDENT_CHARTS, buildChartSpecs } from './chart-specs';
import { StagePoint, fmtDuration, stageTotals, tailSamples } from './metrics';
import OperatingCurve from './operating-curve';
import StageChart, { C } from './stage-chart';
import { Panel, SectionTitle, StatusTag, statusLabelId } from './ui';

const useStyles = createStyles(({ css }) => ({
  wrapper: css`
    display: flex;
    flex-direction: column;
    gap: 16px;
    .hint {
      color: var(--ant-color-text-quaternary);
      cursor: help;
    }
    /* Success rate is a header pill, not a chart. */
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      border-radius: 999px;
      padding: 1px 9px;
      white-space: nowrap;
    }
    .pill.ok {
      color: var(--ant-color-success);
      background: var(--ant-color-success-bg);
    }
    .pill.bad {
      color: var(--ant-color-error);
      background: var(--ant-color-error-bg);
    }
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }
    @media (max-width: 1200px) {
      .charts-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 760px) {
      .charts-grid {
        grid-template-columns: minmax(0, 1fr);
      }
    }
    .totals {
      display: flex;
      gap: 22px;
      align-items: baseline;
    }
    .aux {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 10px 20px 14px;
      border-top: 1px solid var(--ant-color-border-secondary);
    }
    .aux-line {
      display: flex;
      align-items: baseline;
      gap: 10px;
      flex-wrap: wrap;
      font-size: 12px;
      color: var(--ant-color-text-tertiary);
      font-variant-numeric: tabular-nums;
    }
    .aux-line b {
      font-weight: 600;
      color: var(--ant-color-text-secondary);
    }
    .stop-reason {
      font-size: 12px;
      color: var(--ant-color-text-tertiary);
    }
    .stop-reason b {
      font-weight: 600;
      color: var(--ant-color-text-secondary);
      margin-left: 4px;
    }
    .totals .n {
      font-size: 16px;
      font-weight: 600;
      color: var(--ant-color-text);
      font-variant-numeric: tabular-nums;
    }
    .totals .l {
      font-size: 12px;
      color: var(--ant-color-text-tertiary);
      margin-left: 5px;
    }
    .rate-cell {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .rate-cell .n {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    /* Inline throughput bar: proportional columns, bar flexes toward its cap.
       The right gutter is load-bearing — a flexing track runs to the cell edge
       and the bar's end then touches the In TPS figures, reading as one row of
       bar-plus-number rather than two columns. */
    .tps-cell {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-right: 20px;
    }
    .tps-cell .v {
      font-variant-numeric: tabular-nums;
      text-align: right;
      min-width: 58px;
    }
    .tps-cell .track {
      flex: 1;
      min-width: 40px;
      /* Capped, because past a couple hundred pixels a longer track adds no
         resolution — the eye is comparing bar ENDS across rows, and those are
         already separable. Left uncapped it just tracks the viewport and turns
         one column into half the table. */
      max-width: 220px;
      height: 5px;
      border-radius: 3px;
      background: var(--ant-color-fill-quaternary);
      overflow: hidden;
    }
    .tps-cell .track i {
      display: block;
      height: 100%;
      border-radius: 3px;
    }
    /* Table runs to the card edges: a tinted header band, no border of its own
       (the Panel provides it), and rows tall enough for the inline bar. */
    .stage-table .ant-table-thead > tr > th {
      background: var(--ant-color-fill-quaternary) !important;
      border-bottom: 1px solid var(--ant-color-border-secondary);
      color: var(--ant-color-text-secondary);
      font-weight: 600;
      font-size: 12px;
    }
    .stage-table .ant-table-thead > tr > th::before {
      display: none !important;
    }
    .stage-table .ant-table-thead > tr > th:first-child,
    .stage-table .ant-table-tbody > tr > td:first-child {
      padding-left: 20px;
    }
    .stage-table .ant-table-thead > tr > th:last-child,
    .stage-table .ant-table-tbody > tr > td:last-child {
      padding-right: 20px;
    }
    .stage-table .ant-table-tbody > tr > td {
      height: 48px;
      border-bottom: 1px solid var(--ant-color-fill-quaternary);
    }
    .stage-table .ant-table-tbody > tr:last-child > td {
      border-bottom: none;
    }
    .stage-table .col-title {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    .stage-table .col-title .col-unit {
      font-size: 12px;
      font-weight: 400;
      color: var(--ant-color-text-quaternary);
    }
    .selected-row td {
      background-color: var(--ant-color-primary-bg) !important;
    }
    .clickable-row {
      cursor: pointer;
    }
  `
}));

interface OverviewProps {
  points: StagePoint[];
  /** Rows with no load value (the saturation probe) — table only, never charted. */
  probes: StagePoint[];
  selectedId?: number | null;
  onSelect: (r: StagePoint['raw']) => void;
  /** The Best Operating Point band, rendered above the curve. */
  bestPoints?: React.ReactNode;
}

const Overview: React.FC<OverviewProps> = ({
  points,
  probes,
  selectedId,
  onSelect,
  bestPoints
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const { detailData } = useDetailContext();
  const [showMore, setShowMore] = useState(false);
  const t = (id: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id }, values);

  const dec = loadValueDecimals(detailData);
  const loadAxisName = t(loadAxisLabelId(detailData));
  const isConcurrency =
    loadAxisLabelId(detailData) === 'benchmark.form.concurrency';

  // Stages / requests / success rate count the measured stages only; elapsed also
  // covers the probe, which runs first and is time the user waited. See stageTotals.
  const totals = useMemo(() => stageTotals(points, probes), [points, probes]);
  const specs = useMemo(
    () => buildChartSpecs(intl, { points, isConcurrency }),
    [intl, points, isConcurrency]
  );
  const visible = showMore ? specs : specs.slice(0, RESIDENT_CHARTS);
  const moreCount = specs.length - RESIDENT_CHARTS;
  const maxTps = points.reduce((m, p) => Math.max(m, p.tps ?? 0), 0);
  // The soft cap the probe produced, and what it ended up doing. Read from the
  // ramp facts rather than recomputed: `ceil(ceiling * 1.2)`, the Phase-1/2 split
  // and the clamp rule all live in the runner, and re-deriving them here is how
  // the two drift apart.
  const probeCap = detailData?.validity?.probe_bound ?? null;
  const probeCapEffect =
    probeCap == null
      ? null
      : (detailData?.validity?.probe_relaxed ?? 0) > 0
        ? 'benchmark.detail.aux.capRelaxed'
        : (detailData?.validity?.stopped_at ?? -1) >= probeCap
          ? 'benchmark.detail.aux.capClamped'
          : 'benchmark.detail.aux.capUnused';

  // Only once the run is done: mid-sweep there is no termination to report.
  const stopReason = detailData?.validity?.in_progress
    ? null
    : STOP_REASON_LABEL[detailData?.validity?.stop_reason ?? ''];

  if (points.length < 2) {
    return null;
  }

  const num = (v: number | null | undefined, digits = 2) =>
    v == null ? '-' : _.round(v, digits).toLocaleString();
  const unitTitle = (label: string, unit: string) => (
    <span className="col-title">
      <span>{label}</span>
      <span className="col-unit">{unit}</span>
    </span>
  );

  // The verdict itself is derived once in buildStagePoints, alongside every other
  // number on this page — the column only decides how to draw it. `slaPass` is
  // null on a run with no thresholds, which is what hides the column entirely.
  const hasSlaTargets = points.some((p) => p.slaPass != null);

  // Early-stop reason. A stage normally ends at max_requests; anything else means
  // it under-ran, so the shortfall isn't mistaken for lost data.
  const terminationTip = (term: any): string => {
    const map: Record<string, string> = {
      requests_exhausted: 'benchmark.detail.termination.requestsExhausted',
      max_seconds: 'benchmark.detail.termination.maxSeconds',
      max_duration: 'benchmark.detail.termination.maxSeconds',
      max_errors: 'benchmark.detail.termination.maxErrors',
      max_error_rate: 'benchmark.detail.termination.maxErrors'
    };
    return t(map[term?.reason] || 'benchmark.detail.termination.default', {
      reason: term?.reason ?? '-',
      requested: term?.requested ?? '-',
      processed: term?.processed ?? '-'
    });
  };

  // Table rows: the measured stages plus any probe rows, which carry no load
  // value and so are listed last with their strategy name instead.
  // Rows ARE the measured stages now (the probe moved out), so no optional point
  // and no `?? row.raw.x` fallbacks: every cell has a normalized value.
  const rows: StagePoint[] = points;

  // Every column carries a width, and the slack collects in one trailing spacer
  // instead of being split equally between them: `scroll.x` puts the table in
  // fixed layout with `min-width: 100%`, so an unsized column claims an equal
  // share of a 1800px page — which is how a one-digit load value ended up with
  // as much room as "Successful Requests". Widths are sized to the widest value
  // each column can actually hold (a 4-digit TTFT, a "1020/1020" tally), not to
  // the header text.
  //
  // Every column is sized, none absorbs the surplus: a fixed-layout table splits
  // leftover width across sized columns in proportion, so the page fills with no
  // dead block and no column running away with it. The two things that did not
  // work: leaving a column unsized (it takes ALL the surplus — a 500px bar), and
  // a blank trailing spacer (the dead space just moves to the right edge).
  const columns = [
    {
      title: loadAxisName,
      key: 'rate',
      // Fits the load value plus its status tag.
      width: 190,
      render: (_v: unknown, p: StagePoint) => {
        const kind = p.isPeak ? 'peak' : p.status;
        return (
          <span className="rate-cell">
            <span className="n">{_.round(p.load, dec)}</span>
            {kind !== 'ok' && (
              <StatusTag kind={kind} label={t(statusLabelId[kind])} />
            )}
          </span>
        );
      }
    },
    {
      title: unitTitle(
        t('benchmark.detail.requests.concurrency'),
        t('benchmark.detail.unit.avg')
      ),
      key: 'conc',
      width: 130,
      render: (_v: unknown, p: StagePoint) => num(p.conc, 0)
    },
    ...(hasSlaTargets
      ? [
          {
            title: 'SLA',
            key: 'sla',
            width: 70,
            align: 'center' as const,
            render: (_v: unknown, p: StagePoint) =>
              p.slaPass ? (
                <span style={{ color: 'var(--ant-color-success)' }}>✓</span>
              ) : (
                <span style={{ color: 'var(--ant-color-error)' }}>✗</span>
              )
          }
        ]
      : []),
    {
      title: unitTitle('TTFT', 'ms'),
      key: 'ttft',
      width: 110,
      render: (_v: unknown, p: StagePoint) => {
        const v = p.ttft;
        // Overloaded stages get red numbers: their latency describes a queue, so
        // the value should not read as this deployment's response time.
        return (
          <span
            style={
              p.isOverloaded ? { color: 'var(--ant-color-error)' } : undefined
            }
          >
            {num(v)}
          </span>
        );
      }
    },
    {
      // Decode-only TPOT (guidellm's `inter_token_latency_ms`); the tooltip says
      // so, because the same acronym means the includes-TTFT metric in guidellm's
      // own output.
      title: (
        <Tooltip title={t('benchmark.detail.tpot.tip')}>
          {unitTitle('TPOT', 'ms')}
        </Tooltip>
      ),
      key: 'tpot',
      width: 100,
      render: (_v: unknown, p: StagePoint) => (
        <span
          style={
            p.isOverloaded ? { color: 'var(--ant-color-error)' } : undefined
          }
        >
          {num(p.tpot)}
        </span>
      )
    },
    {
      title: unitTitle(t('benchmark.detail.throughput.totalToken'), 'tok/s'),
      key: 'tps',
      // Value + 220px track + the gutter that keeps the bar's end off In TPS.
      width: 310,
      render: (_v: unknown, p: StagePoint) => {
        const v = p.tps;
        const pctWidth = maxTps > 0 && v != null ? (v / maxTps) * 100 : 0;
        // Full-strength fill for the Best row (the bar is how the page shows
        // which stage the recommendation refers to) and for whatever row is
        // selected. Overloaded stages emphasize in red, not blue: brightening
        // them into the throughput colour would read as an endorsement.
        const strong = p.isBest || p.id === selectedId;
        const over = p.isOverloaded;
        return (
          <span className="tps-cell">
            <span className="v">{num(v, 0)}</span>
            <span className="track">
              <i
                style={{
                  width: `${pctWidth.toFixed(1)}%`,
                  background: over
                    ? strong
                      ? C.red
                      : C.redSoft
                    : strong
                      ? C.blue
                      : C.blueSwatch
                }}
              />
            </span>
          </span>
        );
      }
    },
    {
      title: unitTitle(t('benchmark.detail.throughput.inputToken'), 'tok/s'),
      key: 'in',
      width: 110,
      render: (_v: unknown, p: StagePoint) => num(p.inTps, 0)
    },
    {
      title: unitTitle(t('benchmark.detail.throughput.outputToken'), 'tok/s'),
      key: 'out',
      width: 110,
      render: (_v: unknown, p: StagePoint) => num(p.outTps, 0)
    },
    {
      title: t('benchmark.detail.requests.success'),
      key: 'success',
      width: 150,
      render: (_v: unknown, p: StagePoint) => {
        const total = p.total;
        const ok = p.ok;
        const low = total > 0 && ok / total < 0.95;
        const term = (p.raw.raw_metrics as any)?.termination;
        const early = term?.reason && term.reason !== 'max_requests';
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              ...(low ? { color: 'var(--ant-color-error)' } : {})
            }}
          >
            {ok}/{total}
            {p.lowSample && (
              <Tooltip
                title={t('benchmark.detail.lowSample', {
                  count: p.sampleCount,
                  tail: tailSamples(p.sampleCount)
                })}
              >
                <QuestionCircleOutlined className="hint" />
              </Tooltip>
            )}
            {early && (
              <Tooltip title={terminationTip(term)}>
                <WarningOutlined
                  style={{ color: 'var(--ant-color-warning)' }}
                />
              </Tooltip>
            )}
          </span>
        );
      }
    }
  ];

  const successPct =
    totals.successRate == null
      ? null
      : Math.round(totals.successRate * 1000) / 10;

  return (
    <div className={styles.wrapper}>
      {bestPoints}

      <Panel>
        <div className="panel-head">
          <SectionTitle style={{ marginBottom: 0 }}>
            {t('benchmark.detail.chart.operatingCurve')}
          </SectionTitle>
          <span className="sub">
            {t('benchmark.detail.chart.operatingCurve.note')}
          </span>
          <span className="spacer" />
          {/* The two y-axes follow different rules while sharing one grid, which
              has to be said out loud: read the amber line as linear and the
              post-knee blow-up looks an order of magnitude smaller. */}
          <Tooltip title={t('benchmark.detail.chart.dualAxisHint')}>
            <QuestionCircleOutlined className="hint" />
          </Tooltip>
        </div>
        <div className="panel-body">
          <OperatingCurve
            points={points}
            loadAxisName={loadAxisName}
            loadDecimals={dec}
            labels={{
              concurrency: t('benchmark.detail.requests.concurrency'),
              throughput: t('benchmark.detail.throughput.totalToken'),
              throughputAxis: 'Total Tokens/s',
              ttftP99: 'TTFT p99',
              overloaded: t('benchmark.detail.status.overloaded'),
              slaBreached: t('benchmark.detail.chart.slaBreached')
            }}
          />
        </div>
      </Panel>

      <Panel>
        <div className="panel-head">
          <SectionTitle style={{ marginBottom: 0 }}>
            {t('benchmark.detail.summary.supporting')}
          </SectionTitle>
          {successPct != null && (
            <span className={`pill ${totals.hasFailures ? 'bad' : 'ok'}`}>
              {!totals.hasFailures && <CheckCircleFilled />}
              {t('benchmark.detail.successPill', {
                pct: successPct,
                ok: totals.ok.toLocaleString(),
                total: totals.requests.toLocaleString()
              })}
            </span>
          )}
          <span className="spacer" />
          {moreCount > 0 && (
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              icon={showMore ? <DownOutlined /> : <RightOutlined />}
              onClick={() => setShowMore((v) => !v)}
            >
              {showMore
                ? t('benchmark.detail.summary.showLess')
                : t('benchmark.detail.summary.showMore', { n: moreCount })}
            </Button>
          )}
        </div>
        <div className="panel-body">
          <div className="charts-grid">
            {visible.map((spec) => (
              <StageChart
                key={spec.key}
                spec={spec}
                points={points}
                loadAxisName={loadAxisName}
                loadDecimals={dec}
                logHint={t('benchmark.detail.chart.logHint')}
              />
            ))}
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="panel-head divided">
          <SectionTitle style={{ marginBottom: 0 }}>
            {t('benchmark.detail.summary.stages')}
          </SectionTitle>
          <span className="sub">
            {t('benchmark.detail.summary.stagesHint')}
          </span>
          <span className="spacer" />
          {/* Why the search ended here. This sits beside the stage count because
              that is the number it explains — a run that measured 7 of a possible
              12 points used to give the reader nothing to go on. */}
          {stopReason && (
            <span className="stop-reason">
              {t('benchmark.detail.stopReason.label')}
              <b>{t(stopReason)}</b>
            </span>
          )}
          <span className="totals">
            {[
              {
                n: String(totals.stages),
                l: 'benchmark.detail.summary.totalStages'
              },
              {
                n: totals.requests.toLocaleString(),
                l: 'benchmark.detail.summary.totalRequests'
              },
              {
                n: fmtDuration(totals.seconds),
                l: 'benchmark.detail.summary.totalDuration'
              }
            ].map((s) => (
              <span key={s.l}>
                <span className="n">{s.n}</span>
                <span className="l">{t(s.l)}</span>
              </span>
            ))}
          </span>
        </div>
        <div className="panel-body flush">
          <Table
            className="stage-table scroll-table"
            size="small"
            rowKey={(p: StagePoint) => p.id}
            pagination={false}
            columns={columns}
            dataSource={rows}
            scroll={{ x: 'max-content' }}
            onRow={(p: StagePoint) => ({ onClick: () => onSelect(p.raw) })}
            rowClassName={(p: StagePoint) =>
              ['clickable-row', p.id === selectedId ? 'selected-row' : ''].join(
                ' '
              )
            }
          />
        </div>
        {probes.length > 0 && (
          <div className="aux">
            {/* Kept out of the table above because every column there is a
                per-load metric and these rows have no load. Only the fields that
                mean something for a burst measurement are stated: what it ran,
                and the ceiling it read — which is the number that shaped the
                search. */}
            {probes.map((q) => (
              <div className="aux-line" key={q.id}>
                <b>
                  {q.raw.strategy_type === 'throughput'
                    ? t('benchmark.detail.stage.saturationProbe')
                    : (q.raw.strategy_type ?? '-')}
                </b>
                <span>
                  {t('benchmark.detail.aux.measured', {
                    requests: q.total,
                    seconds: q.duration == null ? '-' : _.round(q.duration, 2)
                  })}
                </span>
                {q.achievedRate != null && (
                  <span>
                    {t('benchmark.detail.aux.ceiling', {
                      rate: _.round(q.achievedRate, 2)
                    })}
                  </span>
                )}
                {probeCap != null && (
                  <span>
                    {t('benchmark.detail.aux.cap', { cap: probeCap })}
                    {probeCapEffect && ` · ${t(probeCapEffect)}`}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
};

export default Overview;
