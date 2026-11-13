import { MetricChart } from '@/pages/_components/monitoring';
import type { ModelMetric } from '@/pages/llmodels/detail/config/types';
import { gpuDeviceLabel } from '@/pages/llmodels/detail/utils/resources';
import { Col, Row } from 'antd';
import { useResource } from '../config/context';
import { useResourceIntl } from '../hooks/use-resource-intl';
import {
  combineMemory,
  memoryPercentage,
  samplingIsStale
} from '../utils/metrics';
import styles from './detail.module.less';

export interface HardwareChart {
  key: string;
  title: string;
  metric?: ModelMetric;
  measures?: string[];
  neutralMeasures?: string[];
  note?: string;
}
export const useHardwareCharts = () => {
  const { metrics, detail, target } = useResource();
  const t = useResourceIntl();
  const m = metrics.data?.metrics || {};
  const label = (metric?: ModelMetric): ModelMetric | undefined =>
    metric && {
      ...metric,
      series: metric.series.map((s) => ({
        ...s,
        name:
          s.dimensions.mount_point ||
          (s.dimensions.device_id
            ? (() => {
                const d = detail.data?.devices.find(
                  (d) => d.id === s.dimensions.device_id
                );
                return d ? gpuDeviceLabel(d, t('chip')) : s.name;
              })()
            : detail.data?.worker.name || s.name)
      }))
    };
  const used = t('actualUsed'),
    total = t('physicalTotal');
  const memory = (host: boolean): HardwareChart => ({
    key: host ? 'host_memory' : 'gpu_memory',
    title: host ? t('hostMemory') : t('gpuMemory'),
    metric: combineMemory(
      label(m[host ? 'host_memory_used' : 'gpu_memory_used']),
      label(m[host ? 'host_memory_total' : 'gpu_memory_total']),
      used,
      total
    ),
    measures: [used, total],
    neutralMeasures: [total],
    note: t('memoryHelp')
  });
  const item = (key: string, title: string, note: string): HardwareChart => ({
    key,
    title,
    metric: label(m[key]),
    note
  });
  return {
    host: [item('host_cpu', t('cpu'), t('hostHelp')), memory(true)],
    gpu: [
      item('gpu_utilization', t('gpuUtilization'), t('physicalHelp')),
      target.kind === 'gpu'
        ? memory(false)
        : {
            key: 'gpu_memory_usage',
            title: t('gpuMemoryUsage'),
            metric: label(
              memoryPercentage(m.gpu_memory_used, m.gpu_memory_total)
            ),
            note: t('memoryHelp')
          },
      item('gpu_power', t('gpuPower'), t('physicalHelp')),
      item('gpu_temperature', t('gpuTemperature'), t('physicalHelp'))
    ],
    storage: [item('filesystem_usage', t('filesystem'), t('filesystemHelp'))]
  };
};
export default function MetricGrid({ charts }: { charts: HardwareChart[] }) {
  const { detail, metrics } = useResource();
  const domain = (detail.data?.devices || []).map((d) => `device:${d.id}`);
  return (
    <Row gutter={[16, 16]}>
      {charts.map((chart) => (
        <Col
          xs={24}
          lg={charts.length === 1 ? 24 : 12}
          key={chart.key}
          className={styles.cardCol}
        >
          <MetricChart
            metricKey={chart.key}
            title={chart.title}
            metric={chart.metric}
            measures={chart.measures}
            neutralMeasures={chart.neutralMeasures}
            suppressStaleNotice={samplingIsStale(metrics.data?.metrics)}
            note={chart.note}
            colorDomain={domain}
          />
        </Col>
      ))}
    </Row>
  );
}
