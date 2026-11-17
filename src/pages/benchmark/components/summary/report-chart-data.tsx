import StageTable from './stage-table';
export { default as ReportDataToggle } from '@/pages/_components/monitoring/chart-view-toggle';

export interface ReportDataLabels {
  data: string;
  chart: string;
  lower?: string;
  upper?: string;
}

export function ReportChartData({
  points,
  loadAxisName,
  columns,
  selectedId,
  onSelect
}: {
  points: { id: number; load: number }[];
  loadAxisName: string;
  columns: {
    key: string;
    title: string;
    value: (point: any) => number | null;
    format: (value: number) => string;
  }[];
  selectedId?: number | null;
  onSelect?: (point: any) => void;
}) {
  return (
    <StageTable
      rowKey="id"
      dataSource={points}
      scroll={{ x: true, y: 228 }}
      selectedId={selectedId}
      onSelect={onSelect}
      columns={[
        { key: 'load', title: loadAxisName, minWidth: 120, dataIndex: 'load' },
        ...columns.map((column) => ({
          key: column.key,
          dataIndex: column.key,
          title: column.title,
          minWidth: 120,
          render: (_: unknown, point: (typeof points)[number]) => {
            const value = column.value(point);
            return value == null || !Number.isFinite(value)
              ? '—'
              : column.format(value);
          }
        }))
      ]}
    />
  );
}
