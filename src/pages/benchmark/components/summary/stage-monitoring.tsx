import HelpTooltip from '@/pages/llmodels/detail/components/help-tooltip';
import { pdCacheFeaturesFromInstances } from '@/pages/llmodels/detail/utils/pd-cache-features';
import {
  ClockCircleOutlined,
  ProfileOutlined,
  ReloadOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Flex, Select, Space, Tooltip, Typography } from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { loadAxisLabelId } from '../../config';
import { useDetailContext } from '../../config/detail-context';
import type { BenchmarkMonitoring } from '../../config/monitoring-types';
import type { BenchmarkResultItem } from '../../config/types';
import type { UpdateBenchmarkInspection } from '../../hooks/use-benchmark-inspection-url';
import useMonitoring from '../../services/use-monitoring';
import usePhaseObservations from '../../services/use-phase-observations';
import {
  benchmarkInspectionCursor,
  benchmarkInspectionQuery,
  benchmarkInspectionRun,
  browserInspectionParams,
  readBenchmarkInspection,
  resolveBenchmarkInspection,
  type BenchmarkInspection
} from '../../utils/inspection-url';
import {
  chronologicalPoints,
  exactRange,
  hasUnavailableRunIdentity,
  phaseForPoint
} from '../../utils/monitoring';
import type { StagePoint } from './metrics';
import MonitoringArchiveStatus from './monitoring-archive-status';
import MonitoringCharts, {
  type MonitoringChartsHandle
} from './monitoring-charts';
import {
  comparisonPoint,
  loadOrderedPoints,
  measurementNumber,
  monitoredLoadPoints,
  sameWorkload,
  type ComparisonBasis
} from './point-navigation';
import StageResultsDrawer, {
  type StageDrawerState
} from './stage-results-drawer';
import StageTimeline from './stage-timeline';

const useStyles = createStyles(({ css }) => ({
  console: css`
    background: var(--ant-color-bg-container);
    border-bottom: 1px solid var(--ant-color-border-secondary);
    padding-block: var(--ant-padding-sm) var(--ant-padding);
  `,
  controls: css`
    .scope-button {
      border: 0;
      border-radius: 0;
      padding-inline: 0;
      height: 30px;
      color: var(--ant-color-text-tertiary);
    }
    .scope-button[aria-pressed='true'] {
      color: var(--ant-color-primary);
      border-bottom: 2px solid var(--ant-color-primary);
    }
  `,
  identity: css`
    min-width: 0;
    font-size: 12px;
  `,
  actions: css`
    .ant-btn {
      font-size: 12px;
    }
  `,
  container: css`
    padding-block-start: var(--ant-padding-lg);
    border-block-start: 1px solid var(--ant-color-border-secondary);
    .benchmark-selected-stage {
      background: var(--ant-color-primary-bg);
    }
    .ant-collapse-header {
      padding-inline: 0 !important;
    }
    .ant-collapse-body {
      padding-inline: 0 !important;
    }
  `
}));

export interface StageMonitoringHandle {
  selectPoint: (point: StagePoint) => void;
  restoreResults: (results: BenchmarkResultItem[]) => void;
}

const StageMonitoring = forwardRef<
  StageMonitoringHandle,
  {
    points: StagePoint[];
    probes: StagePoint[];
    selected: StagePoint | null;
    onSelect: (point: StagePoint) => void;
    inspection: BenchmarkInspection;
    onInspectionChange: UpdateBenchmarkInspection;
  }
>(function StageMonitoring(
  { points, probes, selected, onSelect, inspection, onInspectionChange },
  ref
) {
  const intl = useIntl();
  const { id, refreshToken, detailData } = useDetailContext();
  const inspectionRun = benchmarkInspectionRun(browserInspectionParams());
  const chartsRef = useRef<MonitoringChartsHandle>(null);
  const pointView = inspection.pointView;
  const view = inspection.view;
  const activeScope = useRef('run');
  const inspectionPoints = useRef([...points, ...probes]);
  inspectionPoints.current = [...points, ...probes];
  const lastContext = useRef<BenchmarkMonitoring | null>(null);
  const [comparisonBasis, setComparisonBasis] =
    useState<ComparisonBasis>('adjacent');
  const refreshArchive = useRef<() => Promise<void>>();
  const observations = usePhaseObservations(id, refreshToken, () => {
    void refreshArchive.current?.();
  });
  const data = useMonitoring(
    id,
    refreshToken,
    (context) => {
      observations.updateContext(context);
      if (!context || hasUnavailableRunIdentity(context)) return;
      if (
        drawer.open &&
        drawer.mode === 'results' &&
        drawer.resultsTab === 'resources'
      )
        void observations.loadAll(
          points.flatMap((point) => {
            const phase = phaseForPoint(point, context.stages);
            return phase ? [phase] : [];
          })
        );
      if (selected) {
        void observations.load(phaseForPoint(selected, context.stages));
        const previous =
          comparisonBasis === 'custom'
            ? points.find(
                (point) =>
                  point.id === baselineId && sameWorkload(point, selected)
              )
            : comparisonPoint(
                points,
                selected,
                context.stages,
                comparisonBasis
              );
        if (previous)
          void observations.load(phaseForPoint(previous, context.stages));
      }
    },
    (context, query) => {
      const requested = resolveBenchmarkInspection(
        readBenchmarkInspection(
          browserInspectionParams(),
          id,
          inspectionPoints.current
        ),
        id,
        inspectionPoints.current,
        context
      );
      activeScope.current = requested.zoom
        ? `phase:${requested.phaseId}`
        : 'run';
      return benchmarkInspectionQuery(requested, context, query);
    },
    {
      deferInactive: true,
      runId: inspectionRun || detailData.run_id,
      reportRunId: detailData.run_id
    }
  );
  refreshArchive.current = data.refresh;
  if (data.context || !data.loading) lastContext.current = data.context;
  const inspectionContext = data.context || lastContext.current;
  const resolvedInspection = resolveBenchmarkInspection(
    inspection,
    id,
    [...points, ...probes],
    inspectionContext
  );
  const zoom = resolvedInspection.zoom;
  const setPointView = (next: BenchmarkInspection['pointView']) =>
    onInspectionChange({ pointView: next, cursor: null });
  const setZoom = (next: boolean) =>
    onInspectionChange({
      zoom: next,
      pointId: selected?.id ?? null,
      phaseId: phaseForPoint(selected, data.context?.stages || [])?.id ?? null,
      cursor: null
    });
  // Back/forward is a navigation action. Listen once; ordinary URL rendering and
  // pointer movement do not request data or run a synchronization effect.
  const onHistoryNavigation = useRef(() => {});
  const restoreUrlInspection = (nextPoints = [...points, ...probes]) => {
    if (!inspectionContext) return;
    const requested = resolveBenchmarkInspection(
      readBenchmarkInspection(browserInspectionParams(), id, nextPoints),
      id,
      nextPoints,
      inspectionContext
    );
    const scope = requested.zoom ? `phase:${requested.phaseId}` : 'run';
    const moved =
      requested.zoom || requested.pointId !== comparison?.selectedId;
    if (scope !== activeScope.current || (comparison?.paged && moved)) {
      if (moved) setComparison(null);
      activeScope.current = scope;
      void data.load(benchmarkInspectionQuery(requested, inspectionContext));
    } else void data.ensureView(requested.view);
  };
  onHistoryNavigation.current = () => restoreUrlInspection();
  useEffect(() => {
    const navigate = () => onHistoryNavigation.current();
    globalThis.window.addEventListener('popstate', navigate);
    return () => globalThis.window.removeEventListener('popstate', navigate);
  }, []);
  const dataForPoint = (point: StagePoint) =>
    observations.get(phaseForPoint(point, data.context?.stages || []), data);
  const chronological = chronologicalPoints(points, data.context?.stages || []);
  const ordered =
    pointView === 'load' ? loadOrderedPoints(points) : chronological;
  const unit =
    loadAxisLabelId(detailData) === 'benchmark.form.concurrency'
      ? 'requests'
      : 'req/s';
  const { styles } = useStyles();
  const t = (key: string) =>
    intl.formatMessage({ id: `benchmark.monitoring.${key}` });
  const [baselineId, setBaselineId] = useState<number | null>(null);
  const [comparison, setComparison] = useState<{
    paged: boolean;
    selectedId: number | null;
    baselineId: number;
  } | null>(null);
  const comparing =
    !!comparison &&
    (!comparison.paged ||
      (comparison.selectedId === selected?.id &&
        comparison.baselineId === baselineId));
  const [drawer, setDrawer] = useState<StageDrawerState>({
    open: false,
    mode: 'results',
    resultsTab: 'results',
    detailTab: 'statistics'
  });
  const selectedPhase = phaseForPoint(selected, data.context?.stages || []);
  const range = exactRange(selectedPhase);
  const baseline = points.find((point) => point.id === baselineId);
  const baselineRange = exactRange(
    phaseForPoint(baseline, data.context?.stages || [])
  );
  const selectedIndex = ordered.findIndex((point) => point.id === selected?.id);
  const maximum = data.context?.capabilities.max_query_seconds || Infinity;
  const run = data.context?.run_window;
  const paged =
    !(
      data.context?.observation_storage?.source === 'archive' &&
      data.context?.query_capabilities?.run_replay
    ) &&
    !!run &&
    run.end - run.start > maximum;
  const window = data.window || run;
  const endComparison = () => {
    setComparison(null);
    if (comparison?.paged) void data.load({ view });
  };
  const chooseBaseline = (id: number | null) => {
    if (comparison?.paged && id !== comparison.baselineId) endComparison();
    setBaselineId(id);
  };
  const requestSelectedPhase = (point: StagePoint) => {
    const phase = phaseForPoint(point, data.context?.stages || []);
    if (!phase || !exactRange(phase) || !data.context) return;
    void data.load(
      benchmarkInspectionQuery(
        { ...resolvedInspection, zoom: true, phaseId: phase.id },
        data.context
      )
    );
  };
  useImperativeHandle(ref, () => ({
    restoreResults: (results) => {
      // A live results response can introduce a point named by an already-open
      // link. Restore from that response's identities in the completion action.
      const nextPoints = results.map(
        (raw) => ({ id: raw.id, raw }) as StagePoint
      );
      inspectionPoints.current = nextPoints;
      restoreUrlInspection(nextPoints);
    },
    selectPoint: (point) => {
      const phase = phaseForPoint(point, data.context?.stages || []);
      onInspectionChange(
        {
          pointId: point.id,
          phaseId: phase?.id ?? null,
          zoom: zoom && !!exactRange(phase),
          cursor: null
        },
        'push'
      );
      if (point.raw.rate == null) setComparison(null);
      if (!exactRange(phaseForPoint(point, data.context?.stages || []))) {
        setComparison(null);
        if (zoom) void data.load({ view });
      }
      if (point.id === baselineId) setComparison(null);
      void observations.load(phaseForPoint(point, data.context?.stages || []));
      const previous =
        comparisonBasis === 'custom'
          ? points.find(
              (item) =>
                item.id === baselineId &&
                item.id !== point.id &&
                sameWorkload(item, point)
            )
          : comparisonPoint(
              points,
              point,
              data.context?.stages || [],
              comparisonBasis
            );
      if (
        comparison?.paged &&
        (point.id !== comparison.selectedId ||
          previous?.id !== comparison.baselineId)
      )
        endComparison();
      setBaselineId(previous?.id ?? null);
      if (!previous) setComparison(null);
      if (previous)
        void observations.load(
          phaseForPoint(previous, data.context?.stages || [])
        );
      if (zoom) requestSelectedPhase(point);
    }
  }));
  const segmented = pointView === 'load' && !zoom && selected?.raw.rate != null;
  const segments = monitoredLoadPoints(
    points,
    selected,
    data.context?.stages || []
  ).map(({ point, phase, number }) => ({
    id: phase.id,
    start: phase.start!,
    end: phase.end!,
    label: String(point.load),
    caption: `#${number ?? '—'}`,
    description: `${point.load} ${unit === 'requests' ? t('concurrencyUnit') : unit} · ${t('measurement')} #${number ?? '—'}`
  }));
  const untimed = selected
    ? points.filter((point) => sameWorkload(point, selected)).length -
      segments.length
    : 0;
  const bands = [
    ...(range
      ? [
          {
            ...range,
            label:
              selectedIndex < 0
                ? intl.formatMessage({
                    id: 'benchmark.detail.stage.saturationProbe'
                  })
                : `${t('measurement')} #${selected ? (measurementNumber(selected, data.context?.stages || []) ?? '—') : '—'}`,
            kind: 'selected' as const
          }
        ]
      : []),
    ...(comparing && baselineRange
      ? [
          {
            ...baselineRange,
            label: `${t('baseline')} · ${t('measurement')} #${baseline ? (measurementNumber(baseline, data.context?.stages || []) ?? '—') : '—'}`,
            kind: 'baseline' as const
          }
        ]
      : [])
  ];
  const changeView = (next: 'aggregate' | 'instances') => {
    onInspectionChange({ view: next, cursor: null });
    void data.ensureView(next);
  };
  const changeDrawer = (next: StageDrawerState) => {
    setDrawer(next);
    if (next.open && next.mode === 'results' && next.resultsTab === 'resources')
      void observations.loadAll(
        ordered.flatMap((point) => {
          const phase = phaseForPoint(point, data.context?.stages || []);
          return phase ? [phase] : [];
        })
      );
  };
  const curveControls = (
    <Flex align="center" justify="space-between" gap={12} wrap>
      <Space wrap>
        {selected && (
          <Select
            size="small"
            variant="borderless"
            aria-label={t('selectedStage')}
            data-benchmark-measurement-switcher
            value={selected.id}
            popupMatchSelectWidth={false}
            style={{ minWidth: 130, maxWidth: 190 }}
            options={[...ordered, ...probes]
              .filter((point) => sameWorkload(point, selected))
              .map((point) => ({
                value: point.id,
                label:
                  point.raw.rate == null
                    ? intl.formatMessage({
                        id: 'benchmark.detail.stage.saturationProbe'
                      })
                    : `${point.load} ${unit === 'requests' ? t('concurrencyUnit') : unit} · #${measurementNumber(point, data.context?.stages || []) ?? '—'}`
              }))}
            onChange={(id) => {
              const point = [...points, ...probes].find(
                (point) => point.id === id
              );
              if (point) onSelect(point);
            }}
          />
        )}
        <Button
          size="small"
          type="text"
          icon={<ReloadOutlined />}
          aria-label={t('refreshMonitoring')}
          title={t('refreshMonitoring')}
          onClick={() => {
            observations.reset();
            void data.refresh();
          }}
        />
        <MonitoringArchiveStatus
          key={`${id}:${data.context?.observation_storage?.run_id || ''}`}
          id={id}
          context={data.context}
          errors={data.errors}
          samplingData={data}
          onRefresh={async () => {
            observations.reset();
            await data.refresh();
          }}
        />
        <Space size={12} className={styles.controls}>
          {[
            ['run', t(pointView === 'load' ? 'allMeasurements' : 'fullRun')],
            ['stage', t(pointView === 'load' ? 'zoomMeasurement' : 'zoomStage')]
          ].map(([value, label]) => (
            <Button
              key={value}
              type="text"
              size="small"
              className="scope-button"
              aria-pressed={zoom === (value === 'stage')}
              disabled={value === 'stage' && !range}
              onClick={() => {
                setZoom(value === 'stage');
                if (value === 'stage' || comparison?.paged) setComparison(null);
                if (value === 'stage' && selected)
                  requestSelectedPhase(selected);
                else if (
                  value === 'run' &&
                  (zoom || paged || !run || comparison?.paged)
                )
                  void data.load({ view });
              }}
            >
              {label}
            </Button>
          ))}
        </Space>
        <Typography.Text type="secondary">
          {!segmented && <ClockCircleOutlined />}{' '}
          {segmented && !paged
            ? intl.formatMessage(
                { id: 'benchmark.monitoring.segmentCount' },
                { count: segments.length }
              )
            : (() => {
                const visible = zoom ? range : window;
                return visible
                  ? `${dayjs(visible.start * 1000).format('HH:mm:ss')} — ${dayjs(visible.end * 1000).format('HH:mm:ss')}`
                  : '—';
              })()}
        </Typography.Text>
      </Space>
      {paged && window && run && (
        <Space>
          <Typography.Text type="secondary">
            {t('segmentedHistory')}
          </Typography.Text>
          <Button
            disabled={window.start <= run.start}
            onClick={() => {
              setZoom(false);
              setComparison(null);
              const start = Math.max(run.start, window.start - maximum);
              void data.load({
                view,
                start,
                end: Math.min(run.end, start + maximum)
              });
            }}
          >
            ←
          </Button>
          <Button
            disabled={window.end >= run.end}
            onClick={() => {
              setZoom(false);
              setComparison(null);
              void data.load({
                view,
                start: window.end,
                end: Math.min(run.end, window.end + maximum)
              });
            }}
          >
            →
          </Button>
        </Space>
      )}
    </Flex>
  );
  return (
    <Flex
      vertical
      gap={16}
      className={styles.container}
      data-benchmark-stage-monitoring
      aria-busy={data.loading}
    >
      <Flex align="center" gap={8}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {t('title')}
        </Typography.Title>
        <HelpTooltip label={t('title')} content={t('recordedRuntime')} />
      </Flex>
      <Flex
        vertical
        gap={12}
        className={styles.console}
        data-benchmark-stage-console
      >
        <Flex align="center" justify="space-between" gap={12} wrap>
          <Flex vertical gap={4} className={styles.identity}>
            <Flex align="center" gap={12} wrap>
              <Typography.Text strong>
                {selected
                  ? selectedIndex < 0
                    ? intl.formatMessage({
                        id: 'benchmark.detail.stage.saturationProbe'
                      })
                    : `${selected.load} ${unit === 'requests' ? t('concurrencyUnit') : unit} · ${t('measurement')} #${measurementNumber(selected, data.context?.stages || []) ?? '—'}`
                  : t('awaitingStages')}
              </Typography.Text>
              <Typography.Text type="secondary">
                {range
                  ? `${dayjs(range.start * 1000).format('HH:mm:ss')} — ${dayjs(range.end * 1000).format('HH:mm:ss')}`
                  : t('timingUnavailable')}
              </Typography.Text>
            </Flex>
            {selected && (
              <Typography.Text type="secondary">
                {selected.ok.toLocaleString()} /{' '}
                {selected.total.toLocaleString()} {t('successfulRequests')}
              </Typography.Text>
            )}
          </Flex>
          <Space wrap size={4} className={styles.actions}>
            {probes.map((probe) => (
              <Tooltip
                key={probe.id}
                title={intl.formatMessage({
                  id: 'benchmark.detail.stage.saturationProbe'
                })}
              >
                <Button
                  size="small"
                  type={selected?.id === probe.id ? 'primary' : 'default'}
                  aria-pressed={selected?.id === probe.id}
                  onClick={() => onSelect(probe)}
                  onFocus={() => {
                    void observations.load(
                      phaseForPoint(probe, data.context?.stages || [])
                    );
                  }}
                >
                  {intl.formatMessage({
                    id: 'benchmark.detail.stage.saturationProbe'
                  })}
                  {probes.length > 1 && probe.raw.input_tokens != null
                    ? ` · ${probe.raw.input_tokens}`
                    : ''}
                </Button>
              </Tooltip>
            ))}
            <Button
              type="text"
              size="small"
              disabled={
                !comparisonPoint(
                  points,
                  selected,
                  data.context?.stages || [],
                  pointView === 'load' ? 'adjacent' : 'previous'
                )
              }
              onClick={() => {
                const basis = pointView === 'load' ? 'adjacent' : 'previous';
                setComparisonBasis(basis);
                const candidate = comparisonPoint(
                  points,
                  selected,
                  data.context?.stages || [],
                  basis
                );
                chooseBaseline(candidate?.id ?? null);
                if (candidate)
                  void observations.load(
                    phaseForPoint(candidate, data.context?.stages || [])
                  );
                setDrawer({
                  ...drawer,
                  open: true,
                  mode: 'detail',
                  detailTab: 'compare'
                });
              }}
            >
              {t(
                pointView === 'load'
                  ? 'compareAdjacentLoad'
                  : 'comparePreviousMeasurement'
              )}
            </Button>
            <Button
              type="text"
              size="small"
              icon={<ProfileOutlined />}
              onClick={() =>
                setDrawer({
                  ...drawer,
                  open: true,
                  mode: 'results',
                  resultsTab: 'results'
                })
              }
            >
              {t('stageResults')}
            </Button>
            <Button
              type="link"
              size="small"
              disabled={!selected}
              onClick={() =>
                setDrawer({
                  ...drawer,
                  open: true,
                  mode: 'detail',
                  detailTab: 'statistics'
                })
              }
            >
              {t('stageDetails')} <RightOutlined />
            </Button>
          </Space>
        </Flex>
        <StageTimeline
          points={chronological}
          view={pointView}
          onViewChange={setPointView}
          selectedId={selected?.id}
          baselineId={comparing ? baselineId : null}
          onSelect={onSelect}
          data={data}
          dataForPoint={dataForPoint}
          onInspect={(point) => {
            void observations.load(
              phaseForPoint(point, data.context?.stages || [])
            );
          }}
        />
        {comparing && baseline && selected && (
          <Space wrap>
            <Typography.Text type="secondary">
              {t('baseline')} #
              {measurementNumber(baseline, data.context?.stages || []) ?? '—'} ·{' '}
              {baseline.load}{' '}
              {unit === 'requests' ? t('concurrencyUnit') : unit} →{' '}
              {t('selectedStage')} #
              {measurementNumber(selected, data.context?.stages || []) ?? '—'} ·{' '}
              {selected.load}{' '}
              {unit === 'requests' ? t('concurrencyUnit') : unit}
            </Typography.Text>
            <Button type="text" size="small" onClick={endComparison}>
              {t('endComparison')}
            </Button>
          </Space>
        )}
      </Flex>
      <MonitoringCharts
        cacheFeatures={pdCacheFeaturesFromInstances(
          Object.values(detailData.snapshot?.instances || {})
        )}
        benchmarkId={id}
        targetMode={detailData.target_mode || 'model_instance'}
        controls={curveControls}
        ref={chartsRef}
        data={data}
        backend={
          Object.values(detailData.snapshot?.instances || {}).find(
            (instance) => instance.role === 'prefill'
          )?.backend ||
          Object.values(detailData.snapshot?.instances || {})[0]?.backend
        }
        range={zoom ? range : window || null}
        bands={bands}
        view={view}
        latencyStatistics={inspection.latencyStatistics}
        onLatencyStatisticsChange={(latencyStatistics) =>
          onInspectionChange({ latencyStatistics })
        }
        onViewChange={changeView}
        onResourcesRequest={() => void data.ensureResources()}
        timeSegments={segmented ? segments : undefined}
        inspectionScope={`${pointView}:${zoom}:${selected?.id}:${view}:${window?.start}:${window?.end}`}
        pinnedTimestamp={benchmarkInspectionCursor(
          resolvedInspection,
          points,
          selected,
          data
        )}
        onPinnedTimestampChange={(cursor) =>
          onInspectionChange(
            {
              pointId: selected?.id ?? null,
              phaseId:
                phaseForPoint(selected, data.context?.stages || [])?.id ?? null,
              cursor
            },
            'push'
          )
        }
        untimedCount={segmented ? Math.max(0, untimed) : 0}
      />
      <StageResultsDrawer
        state={drawer}
        onState={changeDrawer}
        points={points}
        orderedPoints={ordered}
        probes={probes}
        selected={selected}
        onSelect={onSelect}
        data={data}
        dataForPoint={dataForPoint}
        baselineId={baselineId}
        comparisonBasis={comparisonBasis}
        onComparisonBasis={(basis) => {
          setComparisonBasis(basis);
          const candidate =
            basis === 'custom'
              ? baseline
              : comparisonPoint(
                  points,
                  selected,
                  data.context?.stages || [],
                  basis
                );
          chooseBaseline(candidate?.id ?? null);
          if (candidate)
            void observations.load(
              phaseForPoint(candidate, data.context?.stages || [])
            );
        }}
        onBaseline={(id) => {
          chooseBaseline(id);
          const point = points.find((item) => item.id === id);
          if (point)
            void observations.load(
              phaseForPoint(point, data.context?.stages || [])
            );
        }}
        onEvidence={() => {
          setDrawer({ ...drawer, open: false });
          requestAnimationFrame(() => chartsRef.current?.openSection('stages'));
        }}
        onShowBands={(targetId) => {
          const targetPhase = phaseForPoint(
            points.find((point) => point.id === targetId),
            data.context?.stages || []
          );
          setBaselineId(targetId);
          setZoom(false);
          const comparePaged = !!(
            paged &&
            selectedPhase &&
            range &&
            targetPhase &&
            exactRange(targetPhase)
          );
          setComparison({
            paged: comparePaged,
            selectedId: selected?.id ?? null,
            baselineId: targetId
          });
          if (comparePaged) {
            void data.load({
              view,
              comparisonPhaseIds: [targetPhase.id, selectedPhase.id]
            });
          } else if (zoom || comparison?.paged) void data.load({ view });
          setDrawer({ ...drawer, open: false });
        }}
      />
    </Flex>
  );
});
export default StageMonitoring;
