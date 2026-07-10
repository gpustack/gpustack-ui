import { convertFileSize } from '@/utils';
import { AutoTooltip, type TableColumnProps } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Tag } from 'antd';
export default function useWorkerColumns(): TableColumnProps[] {
  const intl = useIntl();

  return [
    {
      title: intl.formatMessage({ id: 'benchmark.env.workerName' }),
      dataIndex: 'name',
      key: 'name',
      span: 6,
      mobileCard: 'primary',
      render: (value: string, record: any) => {
        return (
          <>
            <AutoTooltip ghost>{value}</AutoTooltip>
            {record.isMain && (
              <Tag color="geekblue" style={{ marginLeft: 8 }}>
                Main
              </Tag>
            )}
          </>
        );
      }
    },
    {
      title: intl.formatMessage({ id: 'benchmark.env.system' }),
      dataIndex: 'os',
      key: 'system',
      span: 5,
      mobileTitle: intl.formatMessage({ id: 'benchmark.env.system' }),
      render: (os: { name: string; version: string }, record: any) => {
        return (
          <AutoTooltip
            ghost
          >{`${record.os?.name || ''} (${record.os?.version || ''})`}</AutoTooltip>
        );
      }
    },
    {
      title: intl.formatMessage({ id: 'benchmark.env.runtimeVersion' }),
      dataIndex: 'runtime_version',
      key: 'runtime_version',
      span: 3,
      mobileTitle: intl.formatMessage({ id: 'benchmark.env.runtimeVersion' }),
      responsive: { hideBelow: 'md' },
      render: (val: any, record: any) => {
        return <AutoTooltip ghost>{record.runtime_version || ''}</AutoTooltip>;
      }
    },
    {
      title: intl.formatMessage({ id: 'benchmark.env.driverVersion' }),
      dataIndex: 'driver_version',
      key: 'driver_version',
      span: 3,
      mobileTitle: intl.formatMessage({ id: 'benchmark.env.driverVersion' }),
      responsive: { hideBelow: 'md' },
      render: (val: any, record: any) => {
        return <AutoTooltip ghost>{record.driver_version || ''}</AutoTooltip>;
      }
    },
    {
      title: intl.formatMessage({ id: 'benchmark.env.cpuCounts' }),
      dataIndex: 'cpu_total',
      key: 'cpu_total',
      span: 3,
      mobileTitle: intl.formatMessage({ id: 'benchmark.env.cpuCounts' })
    },
    {
      title: intl.formatMessage({ id: 'resources.table.memory' }),
      dataIndex: 'memory_total',
      key: 'memory_total',
      span: 4,
      mobileTitle: intl.formatMessage({ id: 'resources.table.memory' }),
      render: (value: number) => convertFileSize(value)
    }
  ];
}
