import { Table } from 'antd';
import React from 'react';
import { useDetailContext } from '../../config/detail-context';
import Section from './section';

// Define table columns: Percentile、 TTFT (ms) 、 ITL (ms) 、TPOT (ms)、Latency (ms)、Input Tokens (t/s)、 Output Tokens (t/s)、 Output (t/s)、Total (t/s)

const columns = [
  {
    title: 'Percentile',
    dataIndex: 'percentile',
    key: 'percentile'
  },
  {
    title: 'TTFT (ms)',
    dataIndex: 'ttft',
    key: 'ttft'
  },
  {
    title: 'ITL (ms)',
    dataIndex: 'itl',
    key: 'itl'
  },
  {
    title: 'TPOT (ms)',
    dataIndex: 'tpot',
    key: 'tpot'
  },
  {
    title: 'Latency (ms)',
    dataIndex: 'latency',
    key: 'latency'
  },
  {
    title: 'Input Tokens (t/s)',
    dataIndex: 'inputTokens',
    key: 'inputTokens'
  },
  {
    title: 'Output Tokens (t/s)',
    dataIndex: 'outputTokens',
    key: 'outputTokens'
  },
  {
    title: 'Output (t/s)',
    dataIndex: 'output',
    key: 'output'
  },
  {
    title: 'Total (t/s)',
    dataIndex: 'total',
    key: 'total'
  }
];

// mock data example: three rows of percentiles: 50th, 90th, 99th
const data = [
  {
    key: '1',
    percentile: '50%',
    ttft: 100,
    itl: 50,
    tpot: 20,
    latency: 200,
    inputTokens: 300,
    outputTokens: 400,
    output: 500,
    total: 600
  },
  {
    key: '2',
    percentile: '90%',
    ttft: 150,
    itl: 70,
    tpot: 30,
    latency: 250,
    inputTokens: 350,
    outputTokens: 450,
    output: 550,
    total: 650
  },
  {
    key: '3',
    percentile: '99%',
    ttft: 200,
    itl: 90,
    tpot: 40,
    latency: 300,
    inputTokens: 400,
    outputTokens: 500,
    output: 600,
    total: 700
  }
];

const PercentileResult: React.FC = () => {
  const { detailData, id } = useDetailContext();

  return (
    <Section title="Percentiles Result">
      <Table
        size="small"
        columns={columns}
        dataSource={data}
        rowKey="percentile"
        pagination={false}
        styles={{
          body: {
            cell: {
              height: 54
            }
          }
        }}
      ></Table>
    </Section>
  );
};

export default PercentileResult;
