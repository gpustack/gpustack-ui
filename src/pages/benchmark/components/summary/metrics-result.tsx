import { Descriptions } from 'antd';
import _, { round } from 'lodash';
import React from 'react';
import styled from 'styled-components';
import { useDetailContext } from '../../config/detail-context';

const Card = styled.div`
  height: 78px;
  padding: 12px 16px;
  border: 1px solid var(--ant-color-border);
  border-radius: var(--ant-border-radius);
  background-color: var(--ant-color-bg-container);
`;

const Box = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
`;

const DescWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24px;
`;

const columns = [
  // {
  //   title: 'Duration',
  //   dataIndex: 'duration',
  //   path: ['raw_metrics', 'benchmarks', '0', 'duration'],
  //   unit: 's',
  //   render: (value: number) => round(value, 2)
  // },

  // {
  //   title: 'Total Requests',
  //   dataIndex: 'total_requests',
  //   path: 'total_requests',
  //   unit: '',
  //   render: (value: number) => round(value, 0)
  // },
  {
    title: 'Total token throughput',
    dataIndex: 'tokens_per_second_mean',
    path: 'tokens_per_second_mean',
    unit: 'Tokens/s',
    render: (value: number) => round(value, 2)
  },
  {
    title: 'Input token throughput ',
    dataIndex: 'input_tokens_per_second_mean',
    path: 'input_tokens_per_second_mean',
    unit: 'Tokens/s',
    render: (value: number) => round(value, 2)
  },
  // {
  //   title: 'Success Requests',
  //   dataIndex: 'successful_requests',
  //   path: ['raw_metrics', 'benchmarks', '0'],
  //   unit: '',
  //   render: (value: number) => {
  //     return (
  //       <span style={{ color: 'var(--ant-color-success)' }}>
  //         {_.get(value, 'metrics.request_totals.successful')}
  //       </span>
  //     );
  //   }
  // },

  {
    title: 'Output token throughput',
    dataIndex: 'output_tokens_per_second_mean',
    path: 'output_tokens_per_second_mean',
    unit: 'Tokens/s',
    render: (value: number) => round(value, 2)
  }
];

const columnsSub = [
  // {
  //   title: 'Failed Requests',
  //   dataIndex: 'failed_requests',
  //   path: ['raw_metrics', 'benchmarks', '0'],
  //   unit: '',
  //   render: (value: number) => {
  //     return (
  //       <span style={{ color: 'var(--ant-color-error)' }}>
  //         {_.get(value, 'metrics.request_totals.errored')}
  //       </span>
  //     );
  //   }
  // },
  // {
  //   title: 'Concurrency',
  //   dataIndex: 'request_concurrency',
  //   path: ['raw_metrics', 'benchmarks', '0'],
  //   unit: '',
  //   render: (value: number) => {
  //     return round(
  //       _.get(value, 'metrics.request_concurrency.successful.mean'),
  //       0
  //     );
  //   }
  // },

  {
    title: 'Average Request Latency',
    dataIndex: 'request_latency_mean',
    path: 'request_latency_mean',
    unit: 'ms',
    render: (value: number) => round(value, 2)
  },
  {
    title: 'Average Time To First Token',
    dataIndex: 'time_to_first_token_mean',
    path: 'time_to_first_token_mean',
    unit: 'ms',
    render: (value: number) => round(value, 2)
  },
  {
    title: 'Average Time Per Output Token',
    dataIndex: 'time_per_output_token_mean',
    path: 'time_per_output_token_mean',
    unit: 'ms',
    render: (value: number) => round(value, 2)
  },
  {
    title: 'Average Inter Token Latency',
    dataIndex: 'inter_token_latency_mean',
    path: 'inter_token_latency_mean',
    unit: 'ms',
    render: (value: number) => round(value, 2)
  }
];

const requestFields = [
  {
    label: 'Total Requests',
    key: 'total_requests',
    dataIndex: 'total_requests',
    path: 'total_requests',
    precision: 0,
    render: (value: number) => round(value, 0) || 0,
    unit: ''
  },
  {
    label: 'Success Requests',
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
    label: 'Failed Requests',
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
    label: 'Concurrency',
    key: 'request_concurrency',
    dataIndex: 'request_concurrency',
    path: ['raw_metrics', 'benchmarks', '0'],
    render: (value: number) =>
      round(_.get(value, 'metrics.request_concurrency.successful.mean'), 0) ||
      0,
    precision: 0,
    unit: ''
  }
];

const PERCENTILES = [
  { key: 'metrics', label: 'Metrics', title: 'N/A' }
] as const;

const PercentileResult: React.FC = () => {
  const { detailData } = useDetailContext();
  const metrics = detailData?.raw_metrics?.benchmarks?.[0]?.metrics || {};

  const buildPercentileTable = (metrics: any) => {
    return PERCENTILES.map(({ key, title }) => {
      const row: any = { metrics: title };

      [...columns, ...columnsSub].forEach(({ dataIndex, path }) => {
        row[dataIndex] = _.get(detailData, path) ?? 0;
      });

      return row;
    });
  };

  const items = [...columns, ...columnsSub].map(
    ({ title, dataIndex, path, render, unit }) => ({
      key: dataIndex,
      label: title,
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

  const throughputItems = columns.map(
    ({ title, dataIndex, path, render, unit }) => ({
      key: dataIndex,
      label: title,
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

  const latencyItems = columnsSub.map(
    ({ title, dataIndex, path, render, unit }) => ({
      key: dataIndex,
      label: title,
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

  const requestItems = requestFields.map(
    ({ label, dataIndex, path, render, unit, color }) => ({
      key: dataIndex,
      label: label,
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
      <span>Metrics</span>
      <Box>
        <Descriptions
          styles={descriptionStyles}
          title="Latency"
          items={latencyItems}
          colon={false}
          column={1}
        ></Descriptions>
        <Descriptions
          styles={descriptionStyles}
          title="Throughput"
          items={throughputItems}
          colon={false}
          column={1}
        ></Descriptions>
        <Descriptions
          styles={descriptionStyles}
          title="Requests"
          items={requestItems}
          colon={false}
          column={1}
        ></Descriptions>
      </Box>
    </div>
  );
};

export default PercentileResult;
