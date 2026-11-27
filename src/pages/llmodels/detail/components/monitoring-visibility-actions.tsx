import { ArrowsAltOutlined, ShrinkOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Tooltip } from 'antd';

export default function MonitoringVisibilityActions({
  keys,
  expanded,
  onChange,
  showLabel = false
}: {
  keys: string[];
  expanded: string[];
  onChange: (keys: string[]) => void;
  showLabel?: boolean;
}) {
  const intl = useIntl();
  if (!keys.length) return null;
  const allExpanded = keys.every((key) => expanded.includes(key));
  const label = intl.formatMessage({
    id: allExpanded
      ? 'modelMonitoring.collapseAll'
      : 'modelMonitoring.expandAll'
  });
  const button = (
    <Button
      size="small"
      type={showLabel ? 'default' : 'text'}
      aria-label={label}
      icon={
        showLabel ? undefined : allExpanded ? (
          <ShrinkOutlined />
        ) : (
          <ArrowsAltOutlined />
        )
      }
      style={
        showLabel
          ? {
              height: 28,
              paddingInline: 10,
              fontSize: 'var(--font-size-small)'
            }
          : undefined
      }
      onClick={() => onChange(allExpanded ? [] : keys)}
    >
      {showLabel ? label : null}
    </Button>
  );
  return showLabel ? button : <Tooltip title={label}>{button}</Tooltip>;
}
