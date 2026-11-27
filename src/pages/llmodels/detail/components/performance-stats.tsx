import { TextAttribute } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Col, Flex, Row, Tooltip, Typography } from 'antd';
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
  const fixedRange = scope.start != null && scope.end != null;
  const pointBadge = intl.formatMessage({
    id: fixedRange
      ? 'modelMonitoring.badge.selectedEnd'
      : 'modelMonitoring.badge.current'
  });
  const pointTooltip = intl.formatMessage({
    id: fixedRange ? 'modelMonitoring.selectedEnd' : 'modelMonitoring.current'
  });
  const kvSource = kv ? metricDimensionsLabel(kv.dimensions) : '';
  const items = [
    {
      key: 'ttft',
      metric: local('ttft'),
      value: metricValue(local('ttft'), 'p99'),
      lowerBound: metricLowerBound(local('ttft'), 'p99'),
      badge: 'P99',
      badgeTooltip:
        intl.formatMessage({ id: 'modelMonitoring.windowP99' }) +
        (pd ? ` · ${role}` : ''),
      note: '',
      help: true
    },
    {
      key: timingKey,
      metric: timing,
      value: metricValue(timing, 'p99'),
      lowerBound: metricLowerBound(timing, 'p99'),
      badge: 'P99',
      badgeTooltip:
        intl.formatMessage({ id: 'modelMonitoring.windowP99' }) +
        (pd ? ' · Decode' : ''),
      note: '',
      help: true
    },
    {
      key: 'output_tokens',
      metric: metrics.output_tokens,
      value: sum(metrics.output_tokens),
      badge: intl.formatMessage({ id: 'modelMonitoring.badge.avg' }),
      badgeTooltip: intl.formatMessage({ id: 'modelMonitoring.windowAverage' }),
      note: ''
    },
    {
      key: 'running_requests',
      metric: local('running_requests'),
      value: sum(local('running_requests')),
      badge: pointBadge,
      badgeTooltip: pointTooltip + (pd ? ` · ${role}` : ''),
      note: ''
    },
    {
      key: 'waiting_requests',
      metric: local('waiting_requests'),
      value: sum(local('waiting_requests')),
      badge: pointBadge,
      badgeTooltip: pointTooltip + (pd ? ` · ${role}` : ''),
      note: ''
    },
    {
      key: 'kvMaximum',
      metric: metrics.kv_usage,
      value: finite(kv?.value),
      badge: pointBadge,
      badgeTooltip: pointTooltip,
      note: kvSource
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
          <Col xs={12} md={8} xxl={4} key={item.key}>
            <div className={styles.card}>
              <Flex
                justify="space-between"
                gap={6}
                align="center"
                className={styles.labelRow}
              >
                <Flex gap={4} align="center" className={styles.labelMain}>
                  <span
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
                  </span>
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
                <Tooltip title={item.badgeTooltip}>
                  <span>
                    <TextAttribute variant="filled" className={styles.badge}>
                      {item.badge}
                    </TextAttribute>
                  </span>
                </Tooltip>
              </Flex>
              <div className={styles.value}>
                {displayObservationValue(
                  item.value,
                  item.lowerBound,
                  item.metric?.unit
                )}
                {(item.value != null || item.lowerBound != null) && (
                  <Typography.Text type="secondary" className={styles.unit}>
                    {displayUnit(item.metric?.unit, item.key)}
                  </Typography.Text>
                )}
              </div>
              {note && (
                <div className={styles.note} title={note}>
                  {note}
                </div>
              )}
            </div>
          </Col>
        );
      })}
    </Row>
  );
};
export default PerformanceStats;
