import { useIntl } from '@umijs/max';
import { Alert, Empty, Spin } from 'antd';
import type { MetricView, ModelMetric } from '../config/types';
import type { ResourceSnapshot } from '../services/scoped-resource';
const reasonKeys = new Set([
  'prometheus_unavailable',
  'query_failed',
  'no_samples',
  'zero_observations',
  'role_not_applicable',
  'metric_not_provided',
  'source_identity_unresolved',
  'device_identity_unresolved',
  'resource_not_visible',
  'legacy_history_unavailable',
  'partial_metric_data',
  'incompatible_histogram_buckets',
  'partial_source_observations'
]);
export const MetricState = ({ metric }: { metric?: ModelMetric }) => {
  const intl = useIntl();
  const key =
    metric?.reason && reasonKeys.has(metric.reason)
      ? metric.reason
      : (metric?.status === 'available' ? 'no_data' : metric?.status) ||
        'no_data';
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={intl.formatMessage({
        id: `modelMonitoring.state.${key}`,
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
    id: `modelMonitoring.state.${reason && reasonKeys.has(reason) ? reason : 'no_data'}`
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
    metric.status === 'stale' ||
    (metric.status === 'available' &&
      !!metric.reason &&
      metric.reason !== 'no_samples'));

export const MetricNotice = ({ metric }: { metric?: MetricView }) => {
  const intl = useIntl();
  if (!metric || !hasMetricNotice(metric)) return null;
  const warnings = metric.componentWarnings || [];
  const message = (status: string, reason: string | null) =>
    intl.formatMessage({
      id: `modelMonitoring.state.${reason && reasonKeys.has(reason) ? reason : status === 'available' ? 'partial_metric_data' : status}`
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
