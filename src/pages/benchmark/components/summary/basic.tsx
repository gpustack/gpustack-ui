import AutoTooltip from '@/components/auto-tooltip';
import { useIntl } from '@umijs/max';
import { Col, Descriptions, DescriptionsProps, Row, Statistic } from 'antd';
import dayjs from 'dayjs';
import _, { round } from 'lodash';
import React from 'react';
import styled from 'styled-components';
import { useDetailContext } from '../../config/detail-context';
import PercentileResult from './percentile-result';
import Section from './section';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Card = styled.div`
  height: 78px;
  padding: 12px 16px;
  border: 1px solid var(--ant-color-border);
  border-radius: var(--ant-border-radius);
  background-color: var(--ant-color-bg-container);
`;

const Box = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const Summary: React.FC = () => {
  const { detailData, clusterList } = useDetailContext();
  const intl = useIntl();
  const rawMetrics = _.get(detailData, ['raw_metrics', 'benchmarks', '0'], {});

  const items: DescriptionsProps['items'] = [
    {
      key: '1',
      label: 'Model',
      children: <AutoTooltip ghost>{detailData.model_name}</AutoTooltip>
    },
    {
      key: '2',
      label: 'Cluster',
      children: (
        <AutoTooltip ghost>
          {clusterList?.find((item) => item.value === detailData.cluster_id)
            ?.label || detailData.cluster_id}
        </AutoTooltip>
      )
    },
    {
      key: '4',
      label: 'Dataset',
      children: detailData.dataset_name
    },
    {
      key: '5',
      label: 'Duration (s)',
      children: round(rawMetrics.duration || 0, 2)
    },
    {
      key: '3',
      label: 'Update Time',
      children: dayjs(detailData.updated_at).format('YYYY-MM-DD HH:mm:ss')
    }
  ];
  const cardFields = [
    {
      label: 'Total Requests',
      key: 'total_requests',
      value: detailData.total_requests,
      precision: 0,
      unit: ''
    },
    {
      label: 'Success Rate',
      key: 'success_rate',
      value: round(
        (_.get(rawMetrics, 'metrics.request_totals.successful') /
          _.get(rawMetrics, 'metrics.request_totals.total')) *
          100 || 0,
        1
      ),
      color: 'var(--ant-color-success)',
      precision: 0,
      unit: '%'
    },
    {
      label: 'Incomplete Count',
      key: 'incomplete_count',
      value: _.get(rawMetrics, 'metrics.request_totals.incomplete'),
      color: 'var(--ant-color-warning)',
      unit: ''
    },
    // {
    //   label: 'Error Count',
    //   key: 'error_count',
    //   value: _.get(rawMetrics, 'metrics.request_totals.error'),
    //   color: 'var(--ant-color-error)',
    //   unit: ''
    // },
    {
      label: 'Concurrency',
      key: 'concurrency',
      value: _.get(rawMetrics, 'metrics.request_concurrency.successful.mean'),
      precision: 2,
      unit: ''
    },
    {
      label: 'RPS',
      key: 'rps',
      value: detailData.requests_per_second_mean,
      precision: 2,
      unit: 'req/s'
    },
    {
      label: 'ITL',
      key: 'itl',
      value: detailData.inter_token_latency_mean,
      unit: 'ms'
    },
    {
      label: 'TPOT',
      key: 'time_per_output_token_mean',
      value: detailData.time_per_output_token_mean,
      precision: 2,
      unit: 'ms'
    },
    {
      label: 'TTFT',
      key: 'time_to_first_token_mean',
      value: detailData.time_to_first_token_mean,
      precision: 2,
      unit: 'ms'
    }
  ];

  const throughputFields = [
    {
      key: '3',
      label: 'Total token throughput',
      children: `${round(detailData.tokens_per_second_mean || 0, 2)} t/s`
    },
    {
      key: '1',
      label: 'Request token throughput',
      children: `${round(detailData.prompt_tokens_per_second_mean || 0, 2)} t/s`
    },
    {
      key: '2',
      label: 'Output token throughput',
      children: `${round(detailData.output_tokens_per_second_mean || 0, 2)} t/s`
    }
  ];

  const latencyFields = [
    {
      key: '1',
      label: 'Avg Request Latency',
      children: `${round(detailData.request_latency_mean, 2)} ms`
    },
    {
      key: '2',
      label: 'Avg Time to First Token',
      children: `${round(detailData.time_to_first_token_mean, 2)} ms`
    },
    {
      key: '3',
      label: 'Avg Time Per Output Token',
      children: `${round(detailData.time_per_output_token_mean, 2)} ms`
    }
  ];

  return (
    <Container>
      <Row gutter={16}>
        {cardFields.map((field) => (
          <Col span={6} key={field.key} style={{ padding: '8px' }}>
            <Card>
              <Statistic
                title={field.label}
                value={field.value}
                precision={field.precision}
                styles={{
                  content: {
                    color: field.color,
                    fontSize: 16,
                    fontWeight: 500
                  },
                  header: {
                    paddingBottom: 4
                  }
                }}
                suffix={field.unit}
              />
            </Card>
          </Col>
        ))}
      </Row>
      <Section title="Metadata">
        <Descriptions
          items={items}
          colon={false}
          column={3}
          layout="vertical"
          styles={{
            content: {
              justifyContent: 'flex-start'
            }
          }}
        ></Descriptions>
      </Section>

      <Box>
        <Section title="Throughput">
          <Descriptions
            items={throughputFields}
            colon={true}
            column={1}
            styles={{
              content: {
                justifyContent: 'flex-end'
              }
            }}
          ></Descriptions>
        </Section>
        <Section title="Latency">
          <Descriptions
            items={latencyFields}
            colon={true}
            column={1}
            styles={{
              content: {
                justifyContent: 'flex-end'
              }
            }}
          ></Descriptions>
        </Section>
      </Box>
      <PercentileResult />
    </Container>
  );
};

export default Summary;
