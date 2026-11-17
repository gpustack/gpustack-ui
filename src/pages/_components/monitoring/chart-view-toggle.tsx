import { LineChartOutlined, ProfileOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';

export default function ChartViewToggle({
  table,
  onToggle,
  labels
}: {
  table: boolean;
  onToggle: () => void;
  labels: { data: string; chart: string };
}) {
  const label = table ? labels.chart : labels.data;
  return (
    <Tooltip title={label}>
      <Button
        type="text"
        size="small"
        aria-label={label}
        aria-pressed={table}
        data-active={table}
        icon={table ? <LineChartOutlined /> : <ProfileOutlined />}
        onClick={onToggle}
        style={{
          flexShrink: 0,
          fontSize: 16,
          color: table
            ? 'var(--ant-color-primary)'
            : 'var(--ant-color-text-tertiary)'
        }}
      />
    </Tooltip>
  );
}
