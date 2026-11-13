import { useIntl } from '@umijs/max';
import { Col, Flex, Row, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { isPDModel } from '../../config';
import { useDetail } from '../config/context';
import type { ModelMetric } from '../config/types';
import {
  displayUnit,
  displayValue,
  finite,
  metricDimensionsLabel,
  metricValue,
  selectRoleMetric
} from '../utils/metrics';
import { effectiveRequestRole } from '../utils/request-role';
import HelpTooltip from './help-tooltip';
const useStyles = createStyles(({ css }) => ({
  card: css`
    height: 100px;
    padding: 14px 16px;
    border: 1px solid var(--ant-color-border);
    border-radius: var(--ant-border-radius-lg);
    min-width: 0;
  `,
  label: css`
    font-size: 14px;
    color: var(--ant-color-text-tertiary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `,
  value: css`
    font-size: 20px;
    font-weight: 600;
    line-height: 24px;
    margin-top: 8px;
  `,
  note: css`
    font-size: 11px;
    color: var(--ant-color-text-tertiary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `
}));
const sum = (metric?: ModelMetric) => {
  const values = (metric?.summaries || [])
    .map((item) => finite(item.value))
    .filter((value): value is number => value != null);
  return values.length ? values.reduce((a, b) => a + b, 0) : null;
};
const PerformanceStats = () => {
  const { styles } = useStyles();
  const intl = useIntl();
  const { model, instances, runtime, scope } = useDetail();
  const metrics = runtime.data?.metrics || {};
  const pd = isPDModel(model.data || {});
  const requestRole = effectiveRequestRole(scope, instances.data || []);
  const local = (key: string) =>
    selectRoleMetric(metrics[key], pd, requestRole);
  const timingKey = scope.latencyMetric;
  const timing = selectRoleMetric(metrics[timingKey], pd, 'decode');
  const role = requestRole[0].toUpperCase() + requestRole.slice(1);
  const kv = (metrics.kv_usage?.summaries || [])
    .filter((item) => finite(item.value) != null)
    .sort((a, b) => b.value! - a.value!)[0];
  const items = [
    {
      key: 'ttft',
      metric: local('ttft'),
      value: metricValue(local('ttft'), 'p95'),
      note:
        intl.formatMessage({ id: 'modelMonitoring.windowP95' }) +
        (pd ? ` · ${role}` : ''),
      help: true
    },
    {
      key: timingKey,
      metric: timing,
      value: metricValue(timing, 'p95'),
      note:
        intl.formatMessage({ id: 'modelMonitoring.windowP95' }) +
        (pd ? ' · Decode' : ''),
      help: true
    },
    {
      key: 'output_tokens',
      metric: metrics.output_tokens,
      value: sum(metrics.output_tokens),
      note: intl.formatMessage({ id: 'modelMonitoring.windowAverage' })
    },
    {
      key: 'running_requests',
      metric: local('running_requests'),
      value: sum(local('running_requests')),
      note:
        intl.formatMessage({
          id:
            scope.start != null && scope.end != null
              ? 'modelMonitoring.selectedEnd'
              : 'modelMonitoring.current'
        }) + (pd ? ` · ${role}` : '')
    },
    {
      key: 'waiting_requests',
      metric: local('waiting_requests'),
      value: sum(local('waiting_requests')),
      note:
        intl.formatMessage({
          id:
            scope.start != null && scope.end != null
              ? 'modelMonitoring.selectedEnd'
              : 'modelMonitoring.current'
        }) + (pd ? ` · ${role}` : '')
    },
    {
      key: 'kvMaximum',
      metric: metrics.kv_usage,
      value: finite(kv?.value),
      note: kv ? metricDimensionsLabel(kv.dimensions) || '—' : '—'
    }
  ];
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      {items.map((item) => (
        <Col xs={12} md={8} xl={4} key={item.key}>
          <div className={styles.card}>
            <Flex gap={4} align="center">
              <div
                className={styles.label}
                title={
                  item.key === 'ttft'
                    ? `${pd ? role + ' · ' : ''}TTFT`
                    : intl.formatMessage({
                        id: `modelMonitoring.metric.${item.key}`
                      })
                }
              >
                {item.key === 'ttft'
                  ? `${pd ? role + ' · ' : ''}TTFT`
                  : intl.formatMessage({
                      id: `modelMonitoring.metric.${item.key}`
                    })}
              </div>
              {item.help && (
                <HelpTooltip
                  label={`${item.key.toUpperCase()} · ${intl.formatMessage({ id: 'modelMonitoring.definition' })}`}
                  content={
                    <span>
                      {intl.formatMessage({
                        id: `modelMonitoring.help.${item.key}`
                      })}
                      {pd &&
                        ` ${intl.formatMessage({ id: 'modelMonitoring.localLatency' })}`}
                    </span>
                  }
                />
              )}
            </Flex>
            <div className={styles.value}>
              {displayValue(item.value, item.metric?.unit)}
              {item.value != null && (
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 12, marginInlineStart: 4 }}
                >
                  {displayUnit(item.metric?.unit, item.key)}
                </Typography.Text>
              )}
            </div>
            <div className={styles.note} title={item.note}>
              {item.value == null && scope.view === 'instances' && item.help
                ? intl.formatMessage({ id: 'modelMonitoring.byInstance' }) +
                  ' · '
                : ''}
              {item.note}
            </div>
          </div>
        </Col>
      ))}
    </Row>
  );
};
export default PerformanceStats;
