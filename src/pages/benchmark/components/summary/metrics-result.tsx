import { useIntl } from '@umijs/max';
import { Descriptions } from 'antd';
import _, { round } from 'lodash';
import React from 'react';
import styled from 'styled-components';
import { useDetailContext } from '../../config/detail-context';

const Box = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
`;

const throughputColumns = [
  {
    title: 'benchmark.detail.throughput.totalToken',
    dataIndex: 'tokens_per_second_mean',
    path: 'tokens_per_second_mean',
    unit: 'Tokens/s',
    render: (value: number) => round(value, 2)
  },
  {
    title: 'benchmark.detail.throughput.inputToken',
    dataIndex: 'input_tokens_per_second_mean',
    path: 'input_tokens_per_second_mean',
    unit: 'Tokens/s',
    render: (value: number) => round(value, 2)
  },
  {
    title: 'benchmark.detail.throughput.outputToken',
    dataIndex: 'output_tokens_per_second_mean',
    path: 'output_tokens_per_second_mean',
    unit: 'Tokens/s',
    render: (value: number) => round(value, 2)
  }
];

const latencyColumns = [
  {
    title: 'benchmark.detail.avg.reqLatency',
    dataIndex: 'request_latency_mean',
    path: 'request_latency_mean',
    unit: 'ms',
    render: (value: number) => round(value, 2)
  },
  {
    title: 'benchmark.detail.avg.ttft',
    dataIndex: 'time_to_first_token_mean',
    path: 'time_to_first_token_mean',
    unit: 'ms',
    render: (value: number) => round(value, 2)
  },
  {
    title: 'benchmark.detail.avg.tpot',
    dataIndex: 'time_per_output_token_mean',
    path: 'time_per_output_token_mean',
    unit: 'ms',
    render: (value: number) => round(value, 2)
  },
  {
    title: 'benchmark.detail.avg.itl',
    dataIndex: 'inter_token_latency_mean',
    path: 'inter_token_latency_mean',
    unit: 'ms',
    render: (value: number) => round(value, 2)
  }
];

const requestColumns = [
  {
    title: 'benchmark.detail.requests.total',
    key: 'total_requests',
    dataIndex: 'total_requests',
    path: 'total_requests',
    precision: 0,
    render: (value: number) => round(value, 0) || 0,
    unit: ''
  },
  {
    title: 'benchmark.detail.requests.success',
    key: 'total_requests',
    dataIndex: 'successful_requests',
    path: ['raw_metrics', 'benchmarks', '0'],
    render: (value: number) =>
      round(_.get(value, ['metrics', 'request_totals', 'successful']), 0) || 0,
    precision: 0,
    color: 'var(--ant-color-success)',
    unit: ''
  },
  {
    title: 'benchmark.detail.requests.failed',
    key: 'total_requests',
    dataIndex: 'failed_requests',
    path: ['raw_metrics', 'benchmarks', '0'],
    render: (value: number) =>
      round(_.get(value, ['metrics', 'request_totals', 'errored']), 0) || 0,
    precision: 0,
    color: 'var(--ant-color-error)',
    unit: ''
  },
  {
    title: 'benchmark.detail.requests.incomplete',
    key: 'total_requests',
    dataIndex: 'failed_requests',
    path: ['raw_metrics', 'benchmarks', '0'],
    render: (value: number) =>
      round(_.get(value, ['metrics', 'request_totals', 'incomplete']), 0) || 0,
    precision: 0,
    color: 'var(--ant-color-warning)',
    unit: ''
  },
  {
    title: 'benchmark.detail.requests.concurrency',
    key: 'request_concurrency',
    dataIndex: 'request_concurrency',
    path: ['raw_metrics', 'benchmarks', '0'],
    render: (value: number) =>
      round(_.get(value, 'metrics.request_concurrency.successful.mean'), 0) ||
      0,
    precision: 0,
    unit: ''
  },
  {
    title: 'benchmark.detail.result.duration',
    key: 'duration',
    dataIndex: 'duration',
    path: ['raw_metrics', 'benchmarks', '0', 'duration'],
    precision: 0,
    render: (value: number) => (value ? `${round(value, 2)} (s)` : 0),
    unit: ''
  }
];

const PercentileResult: React.FC = () => {
  const { detailData } = useDetailContext();
  const intl = useIntl();

  const throughputItems = throughputColumns.map(
    ({ title, dataIndex, path, render, unit }) => ({
      key: dataIndex,
      label: intl.formatMessage({ id: title }),
      children: unit ? (
        <span className="flex-center">
          {render(_.get(detailData, path) ?? 0)}{' '}
          <span className="m-l-4">({unit})</span>
        </span>
      ) : (
        render(_.get(detailData, path) ?? 0)
      )
    })
  );

  const latencyItems = latencyColumns.map(
    ({ title, dataIndex, path, render, unit }) => ({
      key: dataIndex,
      label: intl.formatMessage({ id: title }),
      children: unit ? (
        <span className="flex-center">
          {render(_.get(detailData, path) ?? 0)}{' '}
          <span className="m-l-4">({unit})</span>
        </span>
      ) : (
        render(_.get(detailData, path) ?? 0)
      )
    })
  );

  const requestItems = requestColumns.map(
    ({ title, dataIndex, path, render, unit, color }) => ({
      key: dataIndex,
      label: intl.formatMessage({ id: title }),
      children: unit ? (
        <span className="flex-center" style={{ color: color }}>
          {render(_.get(detailData, path) ?? 0)}{' '}
          <span className="m-l-4">({unit})</span>
        </span>
      ) : (
        <span style={{ color: color }}>
          {render(_.get(detailData, path) ?? 0)}
        </span>
      )
    })
  );

  const descriptionStyles = {
    header: {
      marginBottom: 8
    },
    title: {
      fontWeight: 500,
      color: 'var(--ant-color-text-secondary)',
      fontSize: 14
    },
    content: {
      justifyContent: 'flex-start'
    }
  };

  return (
    <div>
      <Box>
        <Descriptions
          styles={descriptionStyles}
          title={intl.formatMessage({ id: 'benchmark.detail.result.basic' })}
          items={requestItems}
          colon={false}
          column={1}
        ></Descriptions>
        <Descriptions
          styles={descriptionStyles}
          title={intl.formatMessage({
            id: 'benchmark.detail.summary.throughput'
          })}
          items={throughputItems}
          colon={false}
          column={1}
        ></Descriptions>
        <Descriptions
          styles={descriptionStyles}
          title={intl.formatMessage({ id: 'benchmark.detail.summary.latency' })}
          items={latencyItems}
          colon={false}
          column={1}
        ></Descriptions>
      </Box>
    </div>
  );
};

export default PercentileResult;
