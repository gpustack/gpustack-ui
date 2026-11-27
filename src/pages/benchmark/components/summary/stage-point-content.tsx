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
  const statusTags = [
    isSloCapacityPoint(point)
      ? {
          key: 'recommended',
          label: intl.formatMessage({
            id: 'benchmark.detail.status.recommended'
          }),
          color: 'var(--ant-color-primary)',
          bg: 'var(--ant-color-primary-bg)'
        }
      : null,
    point.isPeak
      ? {
          key: 'peak',
          label: intl.formatMessage({ id: 'benchmark.detail.status.peak' }),
          color: 'var(--color-status-success-text)',
          bg: 'var(--ant-color-success-bg)'
        }
      : null,
    point.isDeclining
      ? {
          key: 'declining',
          label: intl.formatMessage({
            id: 'benchmark.detail.status.declining'
          }),
          color: 'var(--color-status-warning-text)',
          bg: 'var(--ant-color-warning-bg)'
        }
      : null
  ].filter(Boolean) as {
    key: string;
    label: string;
    color: string;
    bg: string;
  }[];
  return (
    <Flex
      vertical
      gap={6}
      style={{
        width: 380,
        maxWidth: 'calc(100vw - 64px)',
        fontSize: 'var(--font-size-caption)',
        lineHeight: 1.5,
        fontVariantNumeric: 'tabular-nums'
      }}
    >
      <Flex justify="space-between" align="center" gap={8} wrap>
        <strong style={{ fontSize: 'var(--font-size-small)' }}>
          {t('measurement')} #{number ?? '—'} · {point.load} {unitLabel}
        </strong>
        <Typography.Text
          type="secondary"
          style={{ fontSize: 'var(--font-size-caption)', whiteSpace: 'nowrap' }}
        >
          {range
            ? `${dayjs(range.start * 1000).format('HH:mm:ss')} — ${dayjs(range.end * 1000).format('HH:mm:ss')}`
            : t('timingUnavailable')}
        </Typography.Text>
      </Flex>
      {statusTags.length > 0 && (
        <Flex gap={6} wrap>
          {statusTags.map((tag) => (
            <span
              key={tag.key}
              style={{
                padding: '1px 6px',
                borderRadius: 'var(--ant-border-radius-sm)',
                background: tag.bg,
                color: tag.color,
                fontSize: 11,
                fontWeight: 500,
                lineHeight: '16px'
              }}
            >
              {tag.label}
            </span>
          ))}
        </Flex>
      )}
      <Row gutter={[12, 6]}>
        {(
          [
            [t('totalThroughput'), point.tps, 'tokens_per_second', 10],
            ['TTFT P99', point.ttftP99, 'ms', 7],
            ['TPOT P99', point.tpotP99, 'ms/token', 7]
          ] as const
        ).map(([title, value, unit, span]) => (
          <Col span={span} key={String(title)}>
            <Flex vertical gap={2}>
              <Typography.Text
                type="secondary"
                style={{ fontSize: 'var(--font-size-caption)' }}
              >
                {title}
              </Typography.Text>
              <Typography.Text
                strong
                style={{
                  fontSize: 'var(--font-size-small)',
                  whiteSpace: 'nowrap'
                }}
              >
                {displayMetricValue(value as number | null, String(unit))}
              </Typography.Text>
            </Flex>
          </Col>
        ))}
      </Row>
      <Divider style={{ marginBlock: 2 }} />
      {slo.length ? (
        slo.map((metric) => {
          const insufficient = metric.value == null || metric.value <= 0;
          const passed = !insufficient && metric.value! <= metric.threshold;
          return (
            <span key={metric.field}>
              {metric.label} ≤ {metric.threshold} ms ·{' '}
              {insufficient ? (
                t('insufficient')
              ) : (
                <span
                  style={{
                    color: passed
                      ? 'var(--color-status-success-text)'
                      : 'var(--color-status-warning-text)',
                    fontWeight: 500
                  }}
                >
                  {`${passed ? '✓' : '✕'} ${metric.value!.toFixed(2)} ms`}
                </span>
              )}
            </span>
          );
        })
      ) : (
        <Typography.Text
          type="secondary"
          style={{ fontSize: 'var(--font-size-caption)' }}
        >
          {t('sloUnset')}
        </Typography.Text>
      )}
      {point.lowSample && (
        <Typography.Text
          type="secondary"
          style={{ fontSize: 'var(--font-size-caption)' }}
        >
          {intl.formatMessage(
            { id: 'benchmark.detail.lowSample' },
            { count: point.sampleCount, tail: tailSamples(point.sampleCount) }
          )}
        </Typography.Text>
      )}
      <Divider style={{ marginBlock: 2 }} />
      <Typography.Text
        type="secondary"
        style={{ fontSize: 'var(--font-size-caption)' }}
      >
        {t('resourceObservations')}
      </Typography.Text>
      <Row gutter={[12, 6]}>
        {[
          ['gpu_utilization', 'gpuPeak', 'percent'],
          ['kv_usage', 'kvPeak', 'percent'],
          ['waiting_requests', 'waitingPeak', 'requests']
        ].map(([key, title, unit]) => (
          <Col span={8} key={key}>
            <Flex vertical gap={2}>
              <Typography.Text
                type="secondary"
                style={{ fontSize: 'var(--font-size-caption)' }}
              >
                {t(title)}
              </Typography.Text>
              <Typography.Text
                strong
                style={{
                  fontSize: 'var(--font-size-small)',
                  whiteSpace: 'nowrap'
                }}
              >
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
