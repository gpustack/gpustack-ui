import AutoTooltip from '@/components/auto-tooltip';
import { convertFileSize } from '@/utils';
import { useIntl } from '@umijs/max';

export default function useGPUColumns(): {
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
      title: intl.formatMessage({ id: 'benchmark.env.gpuName' }),
      dataIndex: 'name',
      key: 'name',
      span: 6,
      colStyle: { paddingLeft: 16 },
      render: (value: string, record: any) => (
        <AutoTooltip ghost>{value}</AutoTooltip>
      )
    },
    {
      title: intl.formatMessage({ id: 'benchmark.env.index' }),
      dataIndex: 'index',
      key: 'index',
      span: 4,
      colStyle: { paddingLeft: 48 }
    },
    {
      title: intl.formatMessage({ id: 'resources.table.vendor' }),
      dataIndex: 'vendor',
      key: 'vendor',
      span: 4,
      colStyle: { paddingLeft: 110 }
    },
    {
      title: intl.formatMessage({ id: 'resources.table.vram' }),
      dataIndex: 'memory_total',
      key: 'memory_total',
      colStyle: { paddingLeft: 40 },
      span: 6,
      render: (value: number, record: any) => convertFileSize(value)
    },
    {
      title: intl.formatMessage({ id: 'resources.table.core' }),
      dataIndex: 'core_total',
      key: 'core_total',
      span: 4,
      colStyle: { paddingLeft: 36 }
    }
  ];
}
