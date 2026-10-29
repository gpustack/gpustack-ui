import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { HeadlessCollapse } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Col, Flex, Row } from 'antd';
import { createStyles } from 'antd-style';
import { round } from 'lodash';
import React, { useId, useState } from 'react';
import { loadAxisLabelId, loadValueDecimals } from '../../config';
import { useDetailContext } from '../../config/detail-context';
import { recordedNumber } from '../../utils/stage-detail-metrics';
import StageStatisticsTable from './stage-statistics-table';
import { SectionTitle } from './ui';

const useStyles = createStyles(({ css }) => ({
  box: css`
    container-type: inline-size;
    min-width: 0;
    .stage-meta {
      padding-bottom: var(--ant-padding, 16px);
      margin-bottom: var(--ant-margin-lg, 24px);
      border-bottom: 1px solid var(--ant-color-border-secondary);
    }
    .meta-label,
    .meta-unit,
    .request-size-note {
      color: var(--ant-color-text-secondary);
      font-size: 12px;
    }
    .meta-value {
      color: var(--ant-color-text);
      font-size: 13px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }
    .meta-status {
      font-size: 12px;
      color: var(--color-status-error-text);
    }
    .load-col,
    .latency-col {
      min-width: 0;
    }
    .latency-col {
      border-top: 1px solid var(--ant-color-border-secondary);
      padding-top: var(--ant-padding-lg, 24px);
      margin-top: var(--ant-margin-lg, 24px);
    }
    .request-size {
      border-top: 1px solid var(--ant-color-border-secondary);
      margin-top: var(--ant-margin-lg, 24px);
      padding-top: var(--ant-padding-sm, 12px);
    }
    .request-size-toggle {
      padding: 0;
      height: auto;
    }
    .request-size-table {
      padding-top: var(--ant-padding-sm, 12px);
    }
    @container (min-width: 1520px) {
      .load-col {
        flex: 0 0 36%;
        max-width: 36%;
        padding-inline-end: 40px;
      }
      .latency-col {
        flex: 0 0 64%;
        max-width: 64%;
        border-top: none;
        border-inline-start: 1px solid var(--ant-color-border-secondary);
        padding-top: 0;
        padding-inline-start: 40px;
        margin-top: 0;
      }
    }
  `
}));

const MetricsResult: React.FC<{ data?: any }> = (props) => {
  const { styles } = useStyles();
  const { detailData } = useDetailContext();
  const data = props.data ?? detailData;
  const intl = useIntl();
  const t = (id: string) => intl.formatMessage({ id });
  const [requestSizeOpen, setRequestSizeOpen] = useState(false);
  const requestSizeId = useId();
  const benchmark = data?.raw_metrics?.benchmarks?.[0] ?? data?.raw_metrics;
  const totals = benchmark?.metrics?.request_totals;
  const success =
    recordedNumber(data?.request_successful) ??
    recordedNumber(totals?.successful);
  const failed =
    recordedNumber(data?.request_errored) ?? recordedNumber(totals?.errored);
  const incomplete =
    recordedNumber(data?.request_incomplete) ??
    recordedNumber(totals?.incomplete);
  const total =
    recordedNumber(data?.request_total) ??
    recordedNumber(totals?.total) ??
    (success != null && failed != null && incomplete != null
      ? success + failed + incomplete
      : null);
  const duration = recordedNumber(benchmark?.duration);
  const target =
    recordedNumber(data?.rate) ??
    (props.data == null ? recordedNumber(data?.request_rate) : null);
  const count = (value: number | null) =>
    value == null
      ? '-'
      : value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const isConcurrency =
    loadAxisLabelId(detailData) === 'benchmark.form.concurrency';
  const meta = (
    key: string,
    label: string,
    value: React.ReactNode,
    unit?: string
  ) => (
    <Flex key={key} align="baseline" gap={8} wrap className="meta-item">
      <span className="meta-label">{label}</span>
      <span className="meta-value">{value}</span>
      {unit && <span className="meta-unit">{unit}</span>}
    </Flex>
  );

  return (
    <div className={styles.box}>
      <Flex
        wrap
        gap="8px 24px"
        align="center"
        className="stage-meta"
        role="group"
        aria-label={t('benchmark.detail.result.basic')}
      >
        {target != null &&
          meta(
            'target',
            t(
              isConcurrency
                ? 'benchmark.detail.stage.configuredConcurrency'
                : 'benchmark.detail.stage.configuredRate'
            ),
            round(target, loadValueDecimals(detailData)),
            t(
              isConcurrency
                ? 'benchmark.table.best.unit.concurrency'
                : 'benchmark.table.best.unit.rate'
            )
          )}
        {meta(
          'requests',
          t('benchmark.detail.statistics.successTotal'),
          <Flex wrap gap={4}>
            <span>
              {count(success)} / {count(total)}
            </span>
            {failed != null && failed > 0 && (
              <span className="meta-status">
                · {count(failed)} {t('benchmark.detail.requests.failed')}
              </span>
            )}
            {incomplete != null && incomplete > 0 && (
              <span className="meta-status">
                · {count(incomplete)}{' '}
                {t('benchmark.detail.requests.incomplete')}
              </span>
            )}
          </Flex>
        )}
        {meta(
          'duration',
          t('benchmark.detail.result.duration'),
          duration == null ? '-' : round(duration, 2).toLocaleString(),
          's'
        )}
      </Flex>
      <Row>
        <Col span={24} className="load-col">
          <SectionTitle
            style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}
          >
            {t('benchmark.detail.statistics.load')}
          </SectionTitle>
          <StageStatisticsTable kind="load" data={data} />
        </Col>
        <Col span={24} className="latency-col">
          <SectionTitle
            style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}
          >
            {t('benchmark.detail.statistics.latency')}
          </SectionTitle>
          <StageStatisticsTable kind="latency" data={data} />
        </Col>
      </Row>
      <div className="request-size">
        <Button
          type="link"
          size="small"
          className="request-size-toggle"
          icon={requestSizeOpen ? <DownOutlined /> : <RightOutlined />}
          onClick={() => setRequestSizeOpen((open) => !open)}
          aria-label={t('benchmark.detail.statistics.requestSize')}
          aria-expanded={requestSizeOpen}
          aria-controls={requestSizeId}
        >
          <Flex align="center" wrap gap={8}>
            <span>{t('benchmark.detail.statistics.requestSize')}</span>
            <span className="request-size-note">
              {t('benchmark.detail.statistics.requestSizeNote')}
            </span>
          </Flex>
        </Button>
        <div id={requestSizeId}>
          <HeadlessCollapse open={requestSizeOpen}>
            {requestSizeOpen && (
              <div className="request-size-table">
                <StageStatisticsTable kind="tokens" data={data} />
              </div>
            )}
          </HeadlessCollapse>
        </div>
      </div>
    </div>
  );
};

export default MetricsResult;
