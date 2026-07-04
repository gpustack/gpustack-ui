import { convertFileSize } from '@/utils';
import { AutoTooltip, type TableColumnProps } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
export default function useGPUColumns(): TableColumnProps[] {
  const intl = useIntl();

  return [
    {
      title: intl.formatMessage({ id: 'benchmark.env.gpuName' }),
      dataIndex: 'name',
      key: 'name',
      span: 6,
      mobileCard: 'primary',
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
      mobileTitle: intl.formatMessage({ id: 'benchmark.env.index' }),
      colStyle: { paddingLeft: 48 }
    },
    {
      title: intl.formatMessage({ id: 'resources.table.vendor' }),
      dataIndex: 'vendor',
      key: 'vendor',
      span: 4,
      mobileTitle: intl.formatMessage({ id: 'resources.table.vendor' }),
      colStyle: { paddingLeft: 110 }
    },
    {
      title: intl.formatMessage({ id: 'resources.table.vram' }),
      dataIndex: 'memory_total',
      key: 'memory_total',
      colStyle: { paddingLeft: 40 },
      span: 6,
      mobileTitle: intl.formatMessage({ id: 'resources.table.vram' }),
      render: (value: number, record: any) => convertFileSize(value)
    },
    {
      title: intl.formatMessage({ id: 'resources.table.core' }),
      dataIndex: 'core_total',
      key: 'core_total',
      span: 4,
      mobileTitle: intl.formatMessage({ id: 'resources.table.core' }),
      colStyle: { paddingLeft: 36 }
    }
  ];
}
