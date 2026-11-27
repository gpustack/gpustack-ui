import HelpTooltip from '@/pages/llmodels/detail/components/help-tooltip';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Flex, Popover, Typography } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { Fragment, useEffect, useState, type CSSProperties } from 'react';
import { loadAxisLabelId } from '../../config';
import { useDetailContext } from '../../config/detail-context';
import type { BenchmarkMonitoringData } from '../../config/monitoring-types';
import { exactRange, phaseForPoint } from '../../utils/monitoring';
import { configuredSloMetrics, type StagePoint } from './metrics';
import {
  loadOrderedPoints,
  measurementNumber,
  pointFindings,
  searchGroups,
  type LoadMode,
  type PointView
} from './point-navigation';
import styles from './point-navigation.module.less';
import StagePointContent from './stage-point-content';

export default function StageTimeline({
  points,
  selectedId,
  baselineId,
  onSelect,
  data,
  dataForPoint,
  onInspect,
  view = 'load',
  onViewChange
}: {
  points: StagePoint[];
  selectedId?: number | null;
  baselineId?: number | null;
  onSelect: (point: StagePoint) => void;
  data: BenchmarkMonitoringData;
  dataForPoint?: (point: StagePoint) => BenchmarkMonitoringData;
  onInspect?: (point: StagePoint) => void;
  view?: PointView;
  onViewChange?: (view: PointView) => void;
}) {
  const intl = useIntl();
  const { detailData } = useDetailContext();
  const t = (key: string) =>
    intl.formatMessage({ id: `benchmark.monitoring.${key}` });
  const [inspected, setInspected] = useState<number | null>(null);
  useEffect(() => {
    if (inspected == null) return;
    const close = () => setInspected(null);
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('scroll', close, true);
    window.addEventListener('keydown', escape);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('keydown', escape);
    };
  }, [inspected]);
  if (!points.length)
    return (
      <Typography.Text type="secondary">{t('awaitingStages')}</Typography.Text>
    );
  const phases = data.context?.stages || [];
  const selected = points.find((point) => point.id === selectedId) || points[0];
  const unit =
    loadAxisLabelId(detailData) === 'benchmark.form.concurrency'
      ? t('concurrencyUnit')
      : 'req/s';
  const mode: LoadMode = detailData?.auto_tune
    ? 'auto_tune'
    : detailData?.stages?.length || points.length > 1
      ? 'stages'
      : 'single';
  const processGroups = searchGroups(points, phases, mode);
  const loadGroups = loadOrderedPoints(points).reduce<
    { key: string; inputTokens: number | null; points: StagePoint[] }[]
  >((groups, point) => {
    const last = groups.at(-1);
    if (last && (last.inputTokens ?? 0) === (point.raw.input_tokens ?? 0))
      last.points.push(point);
    else
      groups.push({
        key: String(point.raw.input_tokens ?? 0),
        inputTokens: point.raw.input_tokens ?? null,
        points: [point]
      });
    return groups;
  }, []);
  const multipleWorkloads = loadGroups.length > 1;
  const findings = pointFindings(points, selected);
  const ordered =
    view === 'load'
      ? loadOrderedPoints(points)
      : processGroups.flatMap((group) => group.points);
  const hasSlo = points.some((point) => point.sloPass != null);
  const label = (point: StagePoint) => {
    if (point.sloPass == null) return t('sloUnset');
    const checks = configuredSloMetrics(point, detailData as any, (id) =>
      intl.formatMessage({ id })
    );
    return checks.some((check) => check.value == null || check.value <= 0)
      ? t('insufficient')
      : t(point.sloPass ? 'sloPass' : 'sloFail');
  };
  const gridStyle = (count: number, maximum: number) =>
    ({
      '--desktop-columns': Math.max(1, Math.min(count, maximum)),
      '--tablet-columns': Math.max(1, Math.min(count, 8)),
      '--mobile-columns': Math.max(1, Math.min(count, 4))
    }) as CSSProperties;
  const keyDown = (event: React.KeyboardEvent, point: StagePoint) => {
    const index = ordered.findIndex((item) => item.id === point.id);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? ordered.length - 1
          : event.key === 'ArrowRight'
            ? Math.min(ordered.length - 1, index + 1)
            : event.key === 'ArrowLeft'
              ? Math.max(0, index - 1)
              : null;
    if (next == null) return;
    event.preventDefault();
    onSelect(ordered[next]);
    document
      .getElementById(`benchmark-stage-${ordered[next].id}`)
      ?.focus({ preventScroll: true });
  };
  const card = (point: StagePoint) => {
    const range = exactRange(phaseForPoint(point, phases));
    const number = measurementNumber(point, phases);
    const localFindings = pointFindings(points, point);
    const designation =
      point.id === baselineId
        ? 'baseline'
        : localFindings.capacity?.id === point.id
          ? 'capacity'
          : localFindings.breach?.id === point.id
            ? 'breach'
            : localFindings.peak?.id === point.id
              ? 'peak'
              : null;
    return (
      <Popover
        key={point.id}
        placement="topLeft"
        align={{ overflow: { shiftX: true, adjustY: true } }}
        styles={{ root: { paddingInline: 'var(--ant-padding-sm)' } }}
        trigger={['hover', 'focus']}
        open={inspected === point.id}
        onOpenChange={(open) => setInspected(open ? point.id : null)}
        content={
          <StagePointContent
            point={point}
            number={number}
            range={range}
            observation={dataForPoint?.(point)}
            unitLabel={unit}
          />
        }
      >
        <button
          id={`benchmark-stage-${point.id}`}
          type="button"
          className={`${styles.card} stage-segment ${point.id === baselineId ? `${styles.baseline} stage-baseline` : ''}`}
          aria-pressed={point.id === selectedId}
          aria-label={`${t('measurement')} #${number ?? '—'} · ${point.load} ${unit} · ${label(point)}${range ? ` · ${dayjs(range.start * 1000).format('HH:mm:ss')} — ${dayjs(range.end * 1000).format('HH:mm:ss')}` : ''}`}
          onClick={() => onSelect(point)}
          onPointerEnter={() => onInspect?.(point)}
          onFocus={() => onInspect?.(point)}
          onKeyDown={(event) => keyDown(event, point)}
        >
          <Flex
            align="center"
            justify="center"
            gap={4}
            className={`${styles.pointHeader} phase-segment-top`}
          >
            <span>#{number ?? '—'}</span>
            {designation && (
              <span
                className={`${styles.badge} phase-designation`}
                data-kind={designation}
              >
                {t(
                  designation === 'baseline'
                    ? 'baseline'
                    : `designation.${designation}`
                )}
              </span>
            )}
          </Flex>
          <strong className={`${styles.load} stage-load`}>
            {point.load}
            <small> {unit}</small>
          </strong>
          <span
            className={`${styles.verdict} stage-verdict`}
            data-verdict={
              point.sloPass == null || label(point) === t('insufficient')
                ? 'unknown'
                : point.sloPass
                  ? 'pass'
                  : 'fail'
            }
          >
            {point.sloPass == null ? '' : label(point)}
          </span>
        </button>
      </Popover>
    );
  };
  const finding = (key: keyof typeof findings, text: string) => {
    const point = findings[key];
    return point ? (
      <button
        type="button"
        key={key}
        className={styles.finding}
        onClick={() => onSelect(point)}
      >
        <span>{t(text)}</span>
        <strong>{point.load}</strong>
        <small>{unit}</small>
      </button>
    ) : null;
  };
  return (
    <div className={styles.root}>
      <Flex
        align="center"
        justify="space-between"
        gap={12}
        wrap
        className={styles.header}
      >
        <Flex
          align="center"
          className={styles.tabs}
          role="group"
          aria-label={t('pointView')}
        >
          {(['load', 'process'] as const).map((key) => (
            <Flex
              align="center"
              gap={4}
              key={key}
              className={classNames(
                styles.tabItem,
                view === key && styles.tabItemActive
              )}
            >
              <button
                type="button"
                aria-pressed={view === key}
                onClick={() => onViewChange?.(key)}
              >
                {t(key === 'load' ? 'loadComparison' : 'explorationProcess')}
              </button>
              <HelpTooltip
                label={t(
                  key === 'load' ? 'loadComparison' : 'explorationProcess'
                )}
                content={
                  <Flex vertical gap={8}>
                    <span>
                      {t(
                        key === 'load'
                          ? 'loadComparisonHelp'
                          : 'explorationProcessHelp'
                      )}
                    </span>
                    {key === 'load' && <span>{t('segmentHelp')}</span>}
                    <span>
                      {t(
                        key === 'load' ? 'segmentLegendHelp' : 'timeLegendHelp'
                      )}
                    </span>
                  </Flex>
                }
              />
            </Flex>
          ))}
        </Flex>
        <Flex align="center" gap={8} wrap>
          {multipleWorkloads && (
            <Typography.Text type="secondary">
              {selected.raw.input_tokens ?? '—'} tokens
            </Typography.Text>
          )}
          {finding('capacity', 'highestMeasuredPass')}
          {finding('breach', 'adjacentBreach')}
          {finding('peak', 'measuredPeak')}
        </Flex>
      </Flex>
      {view === 'load' ? (
        <Flex vertical gap={12}>
          {loadGroups.map((group) => (
            <div key={group.key}>
              {multipleWorkloads && (
                <Typography.Paragraph type="secondary">
                  {t('inputLength')}: {group.inputTokens ?? '—'} tokens
                </Typography.Paragraph>
              )}
              <div
                className={styles.grid}
                style={gridStyle(group.points.length, 16)}
                role="group"
                aria-label={t('loadComparison')}
              >
                {group.points.map(card)}
              </div>
            </div>
          ))}
        </Flex>
      ) : (
        <div
          className={classNames(
            styles.groups,
            processGroups.length === 1 && styles.singleGroup,
            processGroups.length === 2 && styles.pairGroups
          )}
        >
          {processGroups.map((group, index) => {
            const title = t(
              group.phase === 'refine'
                ? hasSlo
                  ? 'search.refineSlo'
                  : 'search.refinePeak'
                : `search.${group.phase}`
            );
            return (
              <Fragment key={group.key}>
                <section className={styles.group}>
                  <Flex align="center" gap={6} className={styles.groupHeader}>
                    <strong>{title}</strong>
                    <small>
                      {group.points.length} {t('measurements')}
                    </small>
                    {multipleWorkloads && (
                      <small>{group.inputTokens ?? '—'} tokens</small>
                    )}
                    <HelpTooltip
                      label={title}
                      content={t(
                        group.phase === 'expand' || group.phase === 'refine'
                          ? 'searchHistoryHelp'
                          : 'executionHelp'
                      )}
                    />
                    {processGroups.length > 2 &&
                      index < processGroups.length - 1 && (
                        <ArrowRightOutlined className={styles.direction} />
                      )}
                  </Flex>
                  <div
                    className={styles.grid}
                    style={gridStyle(group.points.length, 8)}
                    role="group"
                    aria-label={title}
                  >
                    {group.points.map(card)}
                  </div>
                </section>
                {processGroups.length === 2 && index === 0 && (
                  <span className={styles.connector} aria-hidden>
                    <ArrowRightOutlined />
                  </span>
                )}
              </Fragment>
            );
          })}
        </div>
      )}
      {data.context &&
        points.some((point) => !exactRange(phaseForPoint(point, phases))) && (
          <Typography.Text type="secondary">
            {t('timingUnavailable')}
          </Typography.Text>
        )}
    </div>
  );
}
