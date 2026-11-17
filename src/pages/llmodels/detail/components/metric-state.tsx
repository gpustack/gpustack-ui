import { useIntl } from '@umijs/max';
import { Alert, Empty, Spin, Typography } from 'antd';
import type { MetricView, ModelMetric } from '../config/types';
import type { ResourceSnapshot } from '../services/scoped-resource';
import { metricStateMessageId } from '../utils/metric-state';
export const MetricState = ({
  metric,
  selected = false,
  compact = false
}: {
  metric?: ModelMetric;
  selected?: boolean;
  compact?: boolean;
}) => {
  const intl = useIntl();
  if (compact)
    return (
      <Typography.Text type="secondary">
        {intl.formatMessage({
          id: selected
            ? 'modelMonitoring.selectedSeriesNoSamples'
            : metricStateMessageId(metric)
        })}
      </Typography.Text>
    );
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={intl.formatMessage({
        id: selected
          ? 'modelMonitoring.selectedSeriesNoSamples'
          : metricStateMessageId(metric),
        defaultMessage: intl.formatMessage({
          id: 'modelMonitoring.state.no_data'
        })
      })}
    />
  );
};
export const RequestNotice = <T,>({
  state
}: {
  state: ResourceSnapshot<T>;
}) => {
  const intl = useIntl();
  if (state.stale)
    return (
      <Alert
        showIcon
        type="warning"
        title={intl.formatMessage({ id: 'modelMonitoring.stale' })}
      />
    );
  if (state.error)
    return (
      <Alert
        showIcon
        type="warning"
        title={intl.formatMessage({
          id:
            (state.error as any)?.response?.status === 403
              ? 'modelMonitoring.state.restricted'
              : 'modelMonitoring.requestError'
        })}
      />
    );
  return state.loading && !state.data ? <Spin size="small" /> : null;
};

export const AvailabilityNotice = ({
  available,
  reason,
  history = false
}: {
  available?: boolean;
  reason?: string | null;
  history?: boolean;
}) => {
  const intl = useIntl();
  if (available !== false) return null;
  const message = intl.formatMessage({
    id: metricStateMessageId({ reason })
  });
  return (
    <Alert
      type="info"
      showIcon
      title={
        (history
          ? intl.formatMessage({ id: 'modelMonitoring.history' }) + ': '
          : '') + message
      }
    />
  );
};

export const hasMetricNotice = (metric?: MetricView) =>
  !!metric &&
  (!!metric.componentWarnings?.length ||
    ['stale', 'query_error', 'restricted'].includes(metric.status) ||
    (metric.status === 'available' &&
      !!metric.reason &&
      metric.reason !== 'no_samples'));

export const MetricNotice = ({ metric }: { metric?: MetricView }) => {
  const intl = useIntl();
  if (!metric || !hasMetricNotice(metric)) return null;
  const warnings = metric.componentWarnings || [];
  const message = (status: string, reason: string | null) =>
    intl.formatMessage({
      id: metricStateMessageId({ status, reason }, 'partial_metric_data')
    });
  return (
    <Alert
      type="warning"
      showIcon
      title={
        warnings.length
          ? intl.formatMessage({
              id: 'modelMonitoring.state.partial_metric_data'
            })
          : message(metric.status, metric.reason)
      }
      description={
        warnings.length ? (
          <ul style={{ margin: 0, paddingInlineStart: 18 }}>
            {warnings.map((warning, index) => (
              <li key={index}>
                {warning.label}: {message(warning.status, warning.reason)}
              </li>
            ))}
          </ul>
        ) : undefined
      }
    />
  );
};
