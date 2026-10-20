import { SettingOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Checkbox, Flex, Popover, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { useState } from 'react';
import { TopologyFieldHintMap } from '../../config';
import { LocationField } from './location';

const useStyles = createStyles(({ css }) => ({
  content: css`
    width: 300px;
    padding: 8px 4px;
    .group {
      font-weight: 500;
      margin-bottom: 8px;
    }
    .row {
      min-height: 28px;
      border-radius: var(--ant-border-radius-sm);
      &:hover {
        background: var(--ant-control-item-bg-hover);
      }
    }
    .row .ant-checkbox-wrapper {
      flex: 1;
      min-width: 0;
    }
    .hint {
      margin-left: 6px;
      color: var(--ant-color-text-quaternary);
      font-size: 12px;
    }
  `
}));

interface ColumnSettingsProps {
  /** Every field, chain order; "host" is not among them and always shows. */
  fields: LocationField[];
  isShown: (field: LocationField) => boolean;
  onToggle: (id: string, shown: boolean) => void;
  onReset: () => void;
  disabled?: boolean;
}

/**
 * [M2] The column picker. Ticking a column shows it — an empty column is the
 * invitation to fill it — and unticking only hides it; no data moves either
 * way. Layer management has its own entry in the topology toolbar.
 */
const ColumnSettings: React.FC<ColumnSettingsProps> = ({
  fields,
  isShown,
  onToggle,
  onReset,
  disabled
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const [open, setOpen] = useState(false);

  const title = intl.formatMessage({ id: 'clusters.topology.columns' });

  const content = (
    <div className={styles.content}>
      <Flex align="center" justify="space-between" gap={8} className="group">
        <span>
          {intl.formatMessage({ id: 'clusters.topology.columns.fields' })}
        </span>
        <Button type="link" size="small" onClick={onReset}>
          {intl.formatMessage({ id: 'common.button.resetdefault' })}
        </Button>
      </Flex>
      {fields.map((field) => (
        <Flex key={field.id} align="center" className="row">
          <Checkbox
            checked={isShown(field)}
            onChange={(e) => onToggle(field.id, e.target.checked)}
          >
            {field.label}
            {TopologyFieldHintMap[field.name] && (
              <span className="hint">
                {intl.formatMessage({ id: TopologyFieldHintMap[field.name] })}
              </span>
            )}
          </Checkbox>
        </Flex>
      ))}
    </div>
  );

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      arrow={false}
      placement="bottomRight"
      content={content}
    >
      <Tooltip title={title}>
        <Button
          icon={<SettingOutlined />}
          aria-label={title}
          disabled={disabled}
        />
      </Tooltip>
    </Popover>
  );
};

export default ColumnSettings;
