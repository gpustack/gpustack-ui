import { displayMetricValue } from '@/pages/llmodels/detail/utils/metrics';
import { useIntl } from '@umijs/max';
import { Col, Divider, Flex, Row, Typography } from 'antd';
import dayjs from 'dayjs';
import { useDetailContext } from '../../config/detail-context';
import type {
  BenchmarkMonitoringData,
  BenchmarkTimeRange
} from '../../config/monitoring-types';
import { phaseObservationSummary } from '../../utils/monitoring';
import {
  configuredSloMetrics,
  isSloCapacityPoint,
  tailSamples,
  type StagePoint
} from './metrics';

export default function StagePointContent({
  point,
  number,
  range,
  observation,
  unitLabel
}: {
  point: StagePoint;
  number: number | null;
  range: BenchmarkTimeRange | null;
  observation?: BenchmarkMonitoringData;
  unitLabel: string;
}) {
  const intl = useIntl();
  const { detailData } = useDetailContext();
  const t = (key: string) =>
    intl.formatMessage({ id: `benchmark.monitoring.${key}` });
  const slo = configuredSloMetrics(point, detailData as any, (id) =>
    intl.formatMessage({ id })
  );
  return (
    <Flex
      vertical
      gap={8}
      style={{ width: 360, maxWidth: 'calc(100vw - 64px)' }}
    >
      <strong>
        {t('measurement')} #{number ?? '—'} · {point.load} {unitLabel}
      </strong>
      {(point.isPeak || isSloCapacityPoint(point) || point.isDeclining) && (
        <span>
          {[
            isSloCapacityPoint(point)
              ? intl.formatMessage({
                  id: 'benchmark.detail.status.recommended'
                })
              : '',
            point.isPeak
              ? intl.formatMessage({ id: 'benchmark.detail.status.peak' })
              : '',
            point.isDeclining
              ? intl.formatMessage({
                  id: 'benchmark.detail.status.declining'
                })
              : ''
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      )}
      <span>
        {range
          ? `${dayjs(range.start * 1000).format('HH:mm:ss')} — ${dayjs(range.end * 1000).format('HH:mm:ss')}`
          : t('timingUnavailable')}
      </span>
      <Row gutter={[12, 12]}>
        {[
          [t('totalThroughput'), point.tps, 'tokens_per_second'],
          ['TTFT P99', point.ttftP99, 'ms'],
          ['TPOT P99', point.tpotP99, 'ms/token']
        ].map(([title, value, unit]) => (
          <Col span={8} key={String(title)}>
            <Flex vertical gap={4}>
              <Typography.Text type="secondary">{title}</Typography.Text>
              <Typography.Text strong>
                {displayMetricValue(value as number | null, String(unit))}
              </Typography.Text>
            </Flex>
          </Col>
        ))}
      </Row>
      <Divider style={{ marginBlock: 4 }} />
      {slo.length ? (
        slo.map((metric) => (
          <span key={metric.field}>
            {metric.label} ≤ {metric.threshold} ms ·{' '}
            {metric.value == null || metric.value <= 0
              ? t('insufficient')
              : `${metric.value <= metric.threshold ? '✓' : '✕'} ${metric.value.toFixed(2)} ms`}
          </span>
        ))
      ) : (
        <span>{t('sloUnset')}</span>
      )}
      {point.lowSample && (
        <span>
          {intl.formatMessage(
            { id: 'benchmark.detail.lowSample' },
            { count: point.sampleCount, tail: tailSamples(point.sampleCount) }
          )}
        </span>
      )}
      <Divider style={{ marginBlock: 4 }} />
      <Typography.Text type="secondary">
        {t('resourceObservations')}
      </Typography.Text>
      <Row gutter={[12, 12]}>
        {[
          ['gpu_utilization', 'gpuPeak', 'percent'],
          ['kv_usage', 'kvPeak', 'percent'],
          ['waiting_requests', 'waitingPeak', 'requests']
        ].map(([key, title, unit]) => (
          <Col span={8} key={key}>
            <Flex vertical gap={4}>
              <Typography.Text type="secondary">{t(title)}</Typography.Text>
              <Typography.Text strong>
                {displayMetricValue(
                  phaseObservationSummary(
                    (key === 'gpu_utilization'
                      ? observation?.resources
                      : observation?.runtime) || null,
                    key,
                    range
                  ).peak,
                  unit
                )}
              </Typography.Text>
            </Flex>
          </Col>
        ))}
      </Row>
    </Flex>
  );
}
