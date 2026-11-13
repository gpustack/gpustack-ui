import {
  ChartInteractionHelp,
  HelpTooltip
} from '@/pages/_components/monitoring';
import { displayValue } from '@/pages/llmodels/detail/utils/metrics';
import { scopeTimeLabel } from '@/pages/llmodels/detail/utils/time-range';
import { ReloadOutlined } from '@ant-design/icons';
import { TextAttribute } from '@gpustack/core-ui';
import { Button, Col, Flex, Row, Typography } from 'antd';
import CollectionNotice from '../components/collection-notice';
import styles from '../components/detail.module.less';
import MetricGrid, { useHardwareCharts } from '../components/metric-grid';
import { useResource } from '../config/context';
import type { ResourceTab } from '../config/types';
import { useResourceIntl } from '../hooks/use-resource-intl';
import InstancesTab from '../instances-tab';
import { reportedGPUCount } from '../utils/metrics';
import { resourceHref } from '../utils/navigation';
import GPUInventory from './components/gpu-inventory';
import overviewStyles from './index.module.less';

export default function OverviewTab() {
  const { detail, scope, target, setTab, refresh } = useResource();
  const t = useResourceIntl(),
    charts = useHardwareCharts();
  const data = detail.data!,
    worker = data.worker;
  const device = data.devices.find((d) => d.id === data.selected_device_id);
  const raw = worker.status?.gpu_devices?.find(
    (g) => g.index === device?.index
  );
  const stats: {
    label: string;
    value?: number | null;
    unit: string;
    bytes?: boolean;
    total?: number | null;
    tab?: ResourceTab;
  }[] = device
    ? [
        {
          label: t('gpuUtilization'),
          value: device.current?.gpu_utilization,
          unit: '%'
        },
        {
          label: t('gpuMemory'),
          value: device.current?.gpu_memory_used,
          unit: 'GiB',
          bytes: true,
          total: device.current?.gpu_memory_total
        },
        { label: t('gpuPower'), value: device.current?.gpu_power, unit: 'W' },
        {
          label: t('gpuTemperature'),
          value: device.current?.gpu_temperature,
          unit: '°C'
        }
      ]
    : [
        {
          label: t('cpu'),
          value: worker.status?.cpu?.utilization_rate,
          unit: '%'
        },
        {
          label: t('hostMemory'),
          value: worker.status?.memory?.used,
          unit: 'GiB',
          bytes: true,
          total: worker.status?.memory?.total
        },
        {
          label: 'GPU',
          value: reportedGPUCount(
            worker.status?.gpu_devices,
            data.devices.length
          ),
          unit: ''
        },
        {
          label: t('relatedInstances'),
          value: data.instances.length,
          unit: '',
          tab: 'instances' as const
        }
      ];
  return (
    <Flex vertical gap={20}>
      <Flex gap={6} align="center" justify="space-between">
        <Flex align="center" gap={4}>
          <Typography.Text type="secondary">{t('current')}</Typography.Text>
          <HelpTooltip label={t('current')} content={t('inventoryHelp')} />
        </Flex>
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined />}
          aria-label={t('refresh')}
          onClick={() => void refresh()}
          loading={detail.loading}
        />
      </Flex>
      <Row gutter={[16, 16]}>
        {stats.map((s) => (
          <Col xs={12} lg={6} key={s.label}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>{s.label}</span>
              <div className={styles.statValue}>
                {s.tab ? (
                  <Typography.Link onClick={() => setTab(s.tab!)}>
                    {s.value ?? '—'}
                  </Typography.Link>
                ) : (
                  displayValue(s.value, s.bytes ? 'bytes' : undefined)
                )}
                {s.unit && <span className={styles.statUnit}>{s.unit}</span>}
              </div>
              {s.total != null && (
                <Typography.Text type="secondary">
                  / {displayValue(s.total, 'bytes')} GiB
                </Typography.Text>
              )}
            </div>
          </Col>
        ))}
      </Row>
      {!device ? (
        <GPUInventory />
      ) : (
        <Flex
          component="dl"
          wrap
          align="baseline"
          className={`${styles.info} ${overviewStyles.resourceSummary}`}
        >
          <Flex
            wrap
            align="baseline"
            gap={8}
            className={overviewStyles.summaryItem}
          >
            <dt className={overviewStyles.summaryLabel}>Worker:</dt>
            <dd className={overviewStyles.summaryValue}>
              <Typography.Link
                href={resourceHref(
                  { kind: 'worker', id: String(worker.id) },
                  scope
                )}
              >
                {worker.name}
              </Typography.Link>
            </dd>
          </Flex>
          <Flex
            wrap
            align="baseline"
            gap={8}
            className={overviewStyles.summaryItem}
          >
            <dt className={overviewStyles.summaryLabel}>GPU UUID:</dt>
            <dd className={overviewStyles.summaryValue}>{raw?.uuid || '—'}</dd>
          </Flex>
          <Flex
            wrap
            align="baseline"
            gap={8}
            className={overviewStyles.summaryItem}
          >
            <Flex
              component="dt"
              align="center"
              gap={4}
              className={overviewStyles.summaryLabel}
            >
              {t('allocatedMemory')}
              <HelpTooltip
                label={t('allocatedMemory')}
                content={t('memoryHelp')}
              />
              <span>:</span>
            </Flex>
            <dd className={overviewStyles.summaryValue}>
              {displayValue(raw?.memory?.allocated, 'bytes')} GiB
            </dd>
          </Flex>
          <Flex
            wrap
            align="baseline"
            gap={8}
            className={overviewStyles.summaryItem}
          >
            <dt className={overviewStyles.summaryLabel}>
              {t('relatedInstances')}:
            </dt>
            <dd className={overviewStyles.summaryValue}>
              <Typography.Link onClick={() => setTab('instances')}>
                {t('instanceCount', { count: data.instances.length })}
              </Typography.Link>
            </dd>
          </Flex>
        </Flex>
      )}
      <Flex justify="space-between" align="center" gap={12}>
        <Flex gap={6} align="center">
          <h2 className={styles.sectionTitle}>{t('trends')}</h2>
          <span title={scopeTimeLabel(scope)}>
            <TextAttribute>
              {scope.start == null ? scope.window : t('custom')}
            </TextAttribute>
          </span>
          <ChartInteractionHelp contextNote={t('physicalHelp')} />
        </Flex>
        <Button type="link" onClick={() => setTab('monitoring')}>
          {t('viewMonitoring')} →
        </Button>
      </Flex>
      <CollectionNotice />
      <MetricGrid
        charts={
          device
            ? charts.gpu.slice(0, 2)
            : [
                charts.host[0],
                data.devices.length ? charts.gpu[0] : charts.host[1]
              ]
        }
      />
      {target.kind === 'gpu' && (
        <>
          <Flex justify="space-between" align="center">
            <h2 className={styles.sectionTitle}>{t('relatedInstances')}</h2>
            <Button type="link" onClick={() => setTab('instances')}>
              {t('viewAll')} →
            </Button>
          </Flex>
          <InstancesTab compact />
        </>
      )}
    </Flex>
  );
}
