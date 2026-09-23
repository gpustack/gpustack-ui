import { roleLabel } from '@/pages/llmodels/components/pd/role-status';
import { convertFileSize } from '@/utils';
import { AutoTooltip, ThemeTag } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Tag } from 'antd';
export default function useWorkerColumns(): {
  title: string;
  dataIndex: string;
  key: string;
  span: number;
  colStyle?: React.CSSProperties;
  render?: (value: any, record: any) => React.ReactNode;
}[] {
  const intl = useIntl();

  return [
    {
      title: intl.formatMessage({ id: 'benchmark.env.workerName' }),
      dataIndex: 'name',
      key: 'name',
      span: 5,
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
      // Which members of the deployment ran here. The point of the column is a
      // disaggregated group: without it the rows are indistinguishable
      // machines, and the reader cannot tell prefill from decode — nor why the
      // Main row has no driver version (a router holds no card).
      title: intl.formatMessage({ id: 'benchmark.env.hostedMembers' }),
      dataIndex: 'hosted',
      key: 'hosted',
      span: 5,
      render: (hosted: { name: string; role?: string }[]) => {
        if (!hosted?.length) {
          return '-';
        }
        return (
          <Flex gap={4} wrap>
            {hosted.map((member) => (
              <ThemeTag key={member.name}>
                {/* The role when the member has one, the instance name
                    otherwise: a plain model's members carry no role, and there
                    the name is the only thing that tells two replicas apart. */}
                {member.role ? roleLabel(intl, member.role) : member.name}
              </ThemeTag>
            ))}
          </Flex>
        );
      }
    },
    {
      title: intl.formatMessage({ id: 'benchmark.env.system' }),
      dataIndex: 'os',
      key: 'system',
      span: 4,
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
      render: (val: any, record: any) => {
        return <AutoTooltip ghost>{record.runtime_version || ''}</AutoTooltip>;
      }
    },
    {
      title: intl.formatMessage({ id: 'benchmark.env.driverVersion' }),
      dataIndex: 'driver_version',
      key: 'driver_version',
      span: 3,
      render: (val: any, record: any) => {
        return <AutoTooltip ghost>{record.driver_version || ''}</AutoTooltip>;
      }
    },
    {
      title: intl.formatMessage({ id: 'benchmark.env.cpuCounts' }),
      dataIndex: 'cpu_total',
      key: 'cpu_total',
      span: 2
    },
    {
      title: intl.formatMessage({ id: 'resources.table.memory' }),
      dataIndex: 'memory_total',
      key: 'memory_total',
      span: 2,
      render: (value: number) => convertFileSize(value)
    }
  ];
}
