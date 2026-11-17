import { GSDrawer } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex, Select, Space, Tabs } from 'antd';
import { createStyles } from 'antd-style';
import type { BenchmarkMonitoringData } from '../../config/monitoring-types';
import { exactRange, phaseForPoint } from '../../utils/monitoring';
import type { StagePoint } from './metrics';
import Overview from './overview';
import { measurementNumber, type ComparisonBasis } from './point-navigation';
import SelectedStage from './selected-stage';
import StageComparison from './stage-comparison';
import StageObservations, { StageResourceDetails } from './stage-observations';

export interface StageDrawerState {
  open: boolean;
  mode: 'results' | 'detail';
  resultsTab: 'results' | 'resources';
  detailTab: 'statistics' | 'resources' | 'compare';
}

const useStyles = createStyles(({ css }) => ({
  drawer: css`
    --benchmark-drawer-max-width: 88vw;
    @media (max-width: 650px) {
      --benchmark-drawer-max-width: 100vw;
    }
  `
}));

export default function StageResultsDrawer({
  state,
  onState,
  points,
  orderedPoints = points,
  probes,
  selected,
  onSelect,
  data,
  dataForPoint,
  baselineId,
  comparisonBasis = 'adjacent',
  onComparisonBasis,
  onBaseline,
  onShowBands,
  onEvidence
}: {
  state: StageDrawerState;
  onState: (state: StageDrawerState) => void;
  points: StagePoint[];
  orderedPoints?: StagePoint[];
  probes: StagePoint[];
  selected: StagePoint | null;
  onSelect: (point: StagePoint) => void;
  data: BenchmarkMonitoringData;
  dataForPoint: (point: StagePoint) => BenchmarkMonitoringData;
  baselineId: number | null;
  comparisonBasis?: ComparisonBasis;
  onComparisonBasis?: (basis: ComparisonBasis) => void;
  onBaseline: (id: number | null) => void;
  onShowBands: (baselineId: number) => void;
  onEvidence: () => void;
}) {
  const intl = useIntl();
  const { styles } = useStyles();
  const t = (key: string) =>
    intl.formatMessage({ id: `benchmark.monitoring.${key}` });
  const index = orderedPoints.findIndex((point) => point.id === selected?.id);
  const width =
    state.mode === 'results' ? 1120 : state.detailTab === 'compare' ? 800 : 960;
  const openDetail = (point: StagePoint, tab: 'statistics' | 'resources') => {
    onSelect(point);
    onState({ ...state, mode: 'detail', detailTab: tab });
  };
  return (
    <GSDrawer
      rootClassName={styles.drawer}
      open={state.open}
      onClose={() => onState({ ...state, open: false })}
      title={t(state.mode === 'results' ? 'stageResults' : 'stageDetails')}
      styles={{
        wrapper: { width, maxWidth: 'var(--benchmark-drawer-max-width)' },
        body: { paddingInline: 'var(--ant-padding-lg)' }
      }}
    >
      {state.mode === 'results' ? (
        <Tabs
          activeKey={state.resultsTab}
          onChange={(key) =>
            onState({
              ...state,
              resultsTab: key as StageDrawerState['resultsTab']
            })
          }
          items={[
            {
              key: 'results',
              label: t('stageResults'),
              children: (
                <Overview
                  points={points}
                  probes={probes}
                  selectedId={selected?.id}
                  onSelect={(raw) => {
                    const point = [...points, ...probes].find(
                      (item) => item.id === raw.id
                    );
                    if (point) openDetail(point, 'statistics');
                  }}
                  stageTableOnly
                />
              )
            },
            {
              key: 'resources',
              label: t('resourceObservations'),
              children: (
                <StageObservations
                  points={orderedPoints}
                  selectedId={selected?.id}
                  onSelect={(point) => openDetail(point, 'resources')}
                  data={data}
                  dataForPoint={dataForPoint}
                />
              )
            }
          ]}
        />
      ) : (
        selected && (
          <Flex vertical gap={16}>
            <Flex align="center" justify="space-between" gap={12} wrap>
              <Button onClick={() => onState({ ...state, mode: 'results' })}>
                ← {t('backResults')}
              </Button>
              <Space wrap>
                <Button
                  disabled={index <= 0}
                  onClick={() => onSelect(orderedPoints[index - 1])}
                >
                  {t('previousPoint')}
                </Button>
                <Select
                  aria-label={t('stage')}
                  value={selected.id}
                  onChange={(id) => {
                    const point = [...orderedPoints, ...probes].find(
                      (item) => item.id === id
                    );
                    if (point) {
                      onSelect(point);
                      if (point.raw.rate == null)
                        onState({ ...state, detailTab: 'statistics' });
                    }
                  }}
                  options={[
                    ...orderedPoints.map((point) => ({
                      value: point.id,
                      label: `${t('measurement')} #${measurementNumber(point, data.context?.stages || []) ?? '—'} · ${point.load}`
                    })),
                    ...probes.map((point) => ({
                      value: point.id,
                      label: intl.formatMessage({
                        id: 'benchmark.detail.stage.saturationProbe'
                      })
                    }))
                  ]}
                />
                <Button
                  disabled={index < 0 || index >= orderedPoints.length - 1}
                  onClick={() => onSelect(orderedPoints[index + 1])}
                >
                  {t('nextPoint')}
                </Button>
              </Space>
            </Flex>
            <Tabs
              activeKey={state.detailTab}
              onChange={(key) =>
                onState({
                  ...state,
                  detailTab: key as StageDrawerState['detailTab']
                })
              }
              items={[
                {
                  key: 'statistics',
                  label: t('statistics'),
                  children: <SelectedStage point={selected} />
                },
                {
                  key: 'resources',
                  disabled: !exactRange(
                    phaseForPoint(selected, data.context?.stages || [])
                  ),
                  label: t('resourceObservations'),
                  children: (
                    <StageResourceDetails
                      range={exactRange(
                        phaseForPoint(selected, data.context?.stages || [])
                      )}
                      data={dataForPoint(selected)}
                    />
                  )
                },
                {
                  key: 'compare',
                  disabled: index < 0,
                  label: t('stageComparison'),
                  children: (
                    <StageComparison
                      point={selected}
                      points={orderedPoints}
                      baselineId={baselineId}
                      basis={comparisonBasis}
                      onBasisChange={onComparisonBasis}
                      onBaseline={onBaseline}
                      data={dataForPoint(selected)}
                      dataForPoint={dataForPoint}
                      onShowBands={onShowBands}
                      onEvidence={onEvidence}
                    />
                  )
                }
              ]}
            />
          </Flex>
        )
      )}
    </GSDrawer>
  );
}
