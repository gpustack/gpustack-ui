import { ArrowsAltOutlined, ShrinkOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Space, Tooltip } from 'antd';

export default function MonitoringVisibilityActions({
  keys,
  expanded,
  onChange,
  single = false
}: {
  keys: string[];
  expanded: string[];
  onChange: (keys: string[]) => void;
  single?: boolean;
}) {
  const intl = useIntl();
  const allExpanded = keys.every((key) => expanded.includes(key));
  const expand = {
    key: 'expandAll',
    icon: <ArrowsAltOutlined />,
    disabled: allExpanded,
    next: keys
  };
  const collapse = {
    key: 'collapseAll',
    icon: <ShrinkOutlined />,
    disabled: keys.every((key) => !expanded.includes(key)),
    next: []
  };
  if (single && !keys.length) return null;
  const actions = single
    ? [allExpanded ? collapse : expand]
    : [expand, collapse];
  return (
    <Space size={4}>
      {actions.map((action) => {
        const label = intl.formatMessage({
          id: `modelMonitoring.${action.key}`
        });
        return (
          <Tooltip key={single ? 'visibility' : action.key} title={label}>
            <Button
              size="small"
              type="text"
              aria-label={label}
              icon={action.icon}
              disabled={action.disabled}
              onClick={() => onChange(action.next)}
            />
          </Tooltip>
        );
      })}
    </Space>
  );
}
