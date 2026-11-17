import { useIntl } from '@umijs/max';
import { Col, Flex, Row, Typography } from 'antd';
import { useDetail } from '../config/context';
import { metricStateMessageId } from '../utils/metric-state';
import {
  displayObservationValue,
  displayUnit,
  metricLowerBound
} from '../utils/metrics';
import {
  pdIngressMetric,
  pdIngressStatistic,
  pdMetricValue,
  pdRoleMetric
} from '../utils/pd-metrics';
import HelpTooltip from './help-tooltip';
import useStyles from './performance-stat-styles';

/** Service-ingress observations never borrow a role-local request timer. */
const PDPerformanceStats = () => {
  const { runtime, scope } = useDetail();
  const intl = useIntl();
  const { styles } = useStyles();
  const t = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.${key}` });
  const metrics = runtime.data?.metrics || {};
  const ingressTTFT = pdIngressMetric(metrics.ingress_ttft);
  const ingressE2E = pdIngressMetric(metrics.ingress_e2e);
  const input = pdRoleMetric(metrics.input_tokens, 'prefill');
  const output = pdRoleMetric(metrics.output_tokens, 'decode');
  const router = pdRoleMetric(metrics.router_requests, 'router');
  const prefill = pdRoleMetric(metrics.waiting_requests, 'prefill');
  const decode = pdRoleMetric(metrics.waiting_requests, 'decode');
  const current = t(
    scope.start != null && scope.end != null ? 'selectedEnd' : 'current'
  );
  const items = [
    {
      key: 'ingressTTFT',
      metric: ingressTTFT,
      metricKey: 'ttft',
      value: pdMetricValue(ingressTTFT, pdIngressStatistic(ingressTTFT)),
      lowerBound: metricLowerBound(
        ingressTTFT,
        pdIngressStatistic(ingressTTFT)
      ),
      note: t(
        pdIngressStatistic(ingressTTFT) === 'avg'
          ? 'windowAverage'
          : 'windowP99'
      ),
      help: t('pd.ingressHelp'),
      ingress: true
    },
    {
      key: 'ingressE2E',
      metric: ingressE2E,
      metricKey: 'e2e',
      value: pdMetricValue(ingressE2E, pdIngressStatistic(ingressE2E)),
      lowerBound: metricLowerBound(ingressE2E, pdIngressStatistic(ingressE2E)),
      note: t(
        pdIngressStatistic(ingressE2E) === 'avg' ? 'windowAverage' : 'windowP99'
      ),
      help: t('pd.ingressHelp'),
      ingress: true
    },
    {
      key: 'input',
      metric: input,
      metricKey: 'input_tokens',
      value: pdMetricValue(input, 'sum'),
      note: t('windowAverage'),
      help: t('pd.prefillResponsibility')
    },
    {
      key: 'output',
      metric: output,
      metricKey: 'output_tokens',
      value: pdMetricValue(output, 'sum'),
      note: t('windowAverage'),
      help: t('pd.decodeResponsibility')
    },
    {
      key: 'routerRequests',
      metric: router,
      metricKey: 'router_requests',
      value: pdMetricValue(router, 'sum'),
      note: t('windowAverage'),
      help: t('pd.routerRequestHelp')
    },
    {
      key: 'pWaiting',
      metric: prefill,
      metricKey: 'waiting_requests',
      value: pdMetricValue(prefill, 'sum'),
      note: current,
      help: t('pd.poolCurrent')
    },
    {
      key: 'dWaiting',
      metric: decode,
      metricKey: 'waiting_requests',
      value: pdMetricValue(decode, 'sum'),
      note: current,
      help: t('pd.poolCurrent')
    }
  ];
  const noteFor = (item: (typeof items)[number]) =>
    item.value != null || item.lowerBound != null
      ? item.note
      : item.ingress && (!item.metric || item.metric.status === 'unsupported')
        ? t('pd.ingressUnavailable')
        : intl.formatMessage({ id: metricStateMessageId(item.metric) });
  return (
    <Row data-performance-summary gutter={[16, 16]} data-pd-performance>
      {items.map((item) => (
        <Col
          xs={24}
          sm={12}
          md={8}
          xl={{ span: 24, flex: '1 1 0px' }}
          key={item.key}
        >
          <div className={styles.card} data-pd-kpi={item.key}>
            <Flex gap={4} align="flex-end">
              <Flex vertical justify="flex-end" className={styles.label}>
                <span>{t(`pd.${item.key}`)}</span>
              </Flex>
              <HelpTooltip
                label={t(`pd.${item.key}`)}
                content={
                  <Flex vertical gap={8}>
                    <span>{item.note}</span>
                    <span>{item.help}</span>
                    {item.lowerBound != null && (
                      <span>{t('histogramBoundsHelp')}</span>
                    )}
                  </Flex>
                }
              />
            </Flex>
            <div className={styles.value}>
              <span style={{ whiteSpace: 'nowrap' }}>
                {displayObservationValue(
                  item.value,
                  item.lowerBound,
                  item.metric?.unit
                )}
              </span>
              {(item.value != null || item.lowerBound != null) && (
                <Typography.Text
                  type="secondary"
                  style={{
                    fontSize: 12,
                    marginInlineStart: 4,
                    display: 'inline-block',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {displayUnit(item.metric?.unit, item.metricKey)}
                </Typography.Text>
              )}
            </div>
            {item.value == null && item.lowerBound == null && (
              <div className={styles.note} title={noteFor(item)}>
                {noteFor(item)}
              </div>
            )}
          </div>
        </Col>
      ))}
    </Row>
  );
};

export default PDPerformanceStats;
