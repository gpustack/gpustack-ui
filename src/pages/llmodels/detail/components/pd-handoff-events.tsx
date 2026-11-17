import { useIntl } from '@umijs/max';
import { Flex, Typography } from 'antd';
import type { ModelMetric } from '../config/types';
import { canOmitMetric } from '../utils/metric-state';
import { finite } from '../utils/metrics';
import HelpTooltip from './help-tooltip';
import { MetricNotice, MetricState } from './metric-state';

export const handoffEventLabels = {
  pd_kv_transfer_failures: 'transferFailures',
  pd_kv_bootstrap_failures: 'bootstrapFailures',
  pd_kv_expired: 'expiredKV'
} as const;

// Event counts describe the requested interval, independently of chart cursors.
// Separate roles/instances can report the same failed request: never add them.
export default function PDHandoffEvents({
  metrics
}: {
  metrics: Record<string, ModelMetric>;
}) {
  const intl = useIntl();
  const t = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.pd.${key}` });
  const entries = Object.entries(handoffEventLabels).filter(
    ([key]) => metrics[key] && !canOmitMetric(metrics[key])
  );
  if (!entries.length) return null;
  return (
    <Flex gap={24} wrap align="start" data-pd-handoff-events>
      {entries.map(([key, label]) => {
        const metric = metrics[key];
        return (
          <Flex key={key} vertical gap={4} data-pd-event={key}>
            <Flex align="center" gap={4}>
              <Typography.Text>{t(label)}</Typography.Text>
              <HelpTooltip label={t(label)} content={t('eventsHelp')} />
            </Flex>
            <MetricNotice
              metric={{
                ...metric,
                reason:
                  metric.reason ||
                  (metric.coverage?.partial
                    ? 'partial_source_observations'
                    : null)
              }}
            />
            {metric.summaries.length ? (
              metric.summaries.map((summary, index) => {
                const count = finite(summary.sample_count);
                const dimensions = summary.dimensions;
                const role = dimensions.role
                  ? (
                      { prefill: 'Prefill', decode: 'Decode' } as Record<
                        string,
                        string
                      >
                    )[dimensions.role] || dimensions.role
                  : '';
                const name = [role, dimensions.model_instance_name]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <Flex key={index} gap={8} align="baseline" wrap>
                    {name && (
                      <Typography.Text type="secondary">{name}</Typography.Text>
                    )}
                    <Typography.Text
                      strong={count != null && count > 0}
                      type={count != null && count > 0 ? 'warning' : undefined}
                    >
                      {count == null
                        ? '—'
                        : count.toLocaleString(intl.locale, {
                            maximumSignificantDigits: 4
                          })}
                      {count != null && ` ${t('eventUnit')}`}
                    </Typography.Text>
                  </Flex>
                );
              })
            ) : (
              <MetricState metric={metric} compact />
            )}
          </Flex>
        );
      })}
    </Flex>
  );
}
