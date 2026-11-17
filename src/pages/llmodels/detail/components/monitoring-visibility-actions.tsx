import { ArrowsAltOutlined, ShrinkOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Space, Tooltip } from 'antd';

export default function MonitoringVisibilityActions({
  keys,
  expanded,
  onChange
}: {
  keys: string[];
  expanded: string[];
  onChange: (keys: string[]) => void;
}) {
  const intl = useIntl();
  return (
    <Space size={4}>
      {[
        {
          key: 'expandAll',
          icon: <ArrowsAltOutlined />,
          disabled: keys.every((key) => expanded.includes(key)),
          next: keys
        },
        {
          key: 'collapseAll',
          icon: <ShrinkOutlined />,
          disabled: keys.every((key) => !expanded.includes(key)),
          next: []
        }
      ].map((action) => {
        const label = intl.formatMessage({
          id: `modelMonitoring.${action.key}`
        });
        return (
          <Tooltip key={action.key} title={label}>
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
