import { useIntl } from '@umijs/max';
import { Col, Flex, Row, Typography } from 'antd';
import { isPDModel } from '../../config';
import { useDetail } from '../config/context';
import type { ModelMetric } from '../config/types';
import { metricStateMessageId } from '../utils/metric-state';
import {
  displayObservationValue,
  displayUnit,
  finite,
  hasMetricSamples,
  metricDimensionsLabel,
  metricLowerBound,
  metricValue,
  selectRoleMetric
} from '../utils/metrics';
import { effectiveRequestRole } from '../utils/request-role';
import HelpTooltip from './help-tooltip';
import useStyles from './performance-stat-styles';

const sum = (metric?: ModelMetric) => {
  const values = (metric?.summaries || []).map((item) => finite(item.value));
  return values.length &&
    values.every((value): value is number => value != null)
    ? values.reduce((a, b) => a + b, 0)
    : null;
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
      value: metricValue(local('ttft'), 'p99'),
      lowerBound: metricLowerBound(local('ttft'), 'p99'),
      note:
        intl.formatMessage({ id: 'modelMonitoring.windowP99' }) +
        (pd ? ` · ${role}` : ''),
      help: true
    },
    {
      key: timingKey,
      metric: timing,
      value: metricValue(timing, 'p99'),
      lowerBound: metricLowerBound(timing, 'p99'),
      note:
        intl.formatMessage({ id: 'modelMonitoring.windowP99' }) +
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
      note: kv
        ? metricDimensionsLabel(kv.dimensions) ||
          intl.formatMessage({
            id:
              scope.start != null && scope.end != null
                ? 'modelMonitoring.selectedEnd'
                : 'modelMonitoring.current'
          })
        : '—'
    }
  ];
  return (
    <Row data-performance-summary gutter={[16, 16]}>
      {items.map((item) => {
        const hasObservations =
          hasMetricSamples(item.metric) ||
          item.metric?.summaries?.some(
            (summary) =>
              finite(summary.value) != null ||
              finite(summary.lower_bound) != null
          );
        const note =
          item.value == null && item.lowerBound == null
            ? intl.formatMessage({
                id:
                  item.metric?.status === 'available' &&
                  !item.metric.reason &&
                  hasObservations
                    ? 'modelMonitoring.summaryUnavailable'
                    : metricStateMessageId(item.metric)
              })
            : item.note;
        return (
          <Col xs={12} md={8} xl={4} key={item.key}>
            <div className={styles.card}>
              <Flex gap={4} align="flex-end">
                <Flex
                  vertical
                  justify="flex-end"
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
                </Flex>
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
                        {item.lowerBound != null &&
                          ` ${intl.formatMessage({ id: 'modelMonitoring.histogramBoundsHelp' })}`}
                      </span>
                    }
                  />
                )}
              </Flex>
              <div className={styles.value}>
                {displayObservationValue(
                  item.value,
                  item.lowerBound,
                  item.metric?.unit
                )}
                {(item.value != null || item.lowerBound != null) && (
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: 12, marginInlineStart: 4 }}
                  >
                    {displayUnit(item.metric?.unit, item.key)}
                  </Typography.Text>
                )}
              </div>
              <div className={styles.note} title={note}>
                {note}
              </div>
            </div>
          </Col>
        );
      })}
    </Row>
  );
};
export default PerformanceStats;
