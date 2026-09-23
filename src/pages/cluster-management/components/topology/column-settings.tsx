import { DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import {
  Button,
  Checkbox,
  Divider,
  Flex,
  Popconfirm,
  Popover,
  Tooltip
} from 'antd';
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
    .delete {
      color: var(--ant-color-text-tertiary);
    }
    .ant-divider {
      margin-block: 8px;
    }
  `
}));

interface ColumnSettingsProps {
  /** Every field, chain order; "host" is not among them and always shows. */
  fields: LocationField[];
  isShown: (field: LocationField) => boolean;
  onToggle: (id: string, shown: boolean) => void;
  /**
   * Models gathering on a custom layer, or undefined when the server does not
   * say — then `onDeleteCustom` finds out itself before deleting.
   */
  referencedBy: (id: string) => string[] | undefined;
  onDeleteCustom: (field: LocationField) => Promise<void>;
  onOpenMapping: () => void;
  disabled?: boolean;
}

/**
 * [M2] The column picker. Ticking a column shows it — an empty column is the
 * invitation to fill it — and unticking only hides it; no data moves either
 * way. It is also the one door to the two rarer things: adding a field the
 * vocabulary lacks and changing which labels the fields read.
 */
const ColumnSettings: React.FC<ColumnSettingsProps> = ({
  fields,
  isShown,
  onToggle,
  referencedBy,
  onDeleteCustom,
  onOpenMapping,
  disabled
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const title = intl.formatMessage({ id: 'clusters.topology.columns' });

  const deleteButton = (field: LocationField) => {
    const referencing = referencedBy(field.id);
    const button = (
      <Button
        type="text"
        size="small"
        className="delete"
        icon={<DeleteOutlined />}
        disabled={!!referencing?.length}
        loading={deleting === field.id}
        aria-label={intl.formatMessage(
          { id: 'clusters.topology.columns.deleteCustom' },
          { name: field.label }
        )}
      />
    );
    if (referencing?.length) {
      return (
        <Tooltip
          title={
            <>
              {intl.formatMessage(
                { id: 'clusters.topology.custom.referenced' },
                { name: field.label }
              )}
              <br />
              {referencing.join('、')}
            </>
          }
        >
          {/* A disabled button swallows hover; the span carries the tooltip. */}
          <span>{button}</span>
        </Tooltip>
      );
    }
    return (
      <Popconfirm
        title={intl.formatMessage(
          { id: 'clusters.topology.columns.deleteCustom.confirm' },
          { name: field.label }
        )}
        okText={intl.formatMessage({ id: 'common.button.delete' })}
        okButtonProps={{ danger: true }}
        cancelText={intl.formatMessage({ id: 'common.button.cancel' })}
        onConfirm={async () => {
          setDeleting(field.id);
          try {
            await onDeleteCustom(field);
          } finally {
            setDeleting(null);
          }
        }}
      >
        {button}
      </Popconfirm>
    );
  };

  const content = (
    <div className={styles.content}>
      <div className="group">
        {intl.formatMessage({ id: 'clusters.topology.columns.fields' })}
      </div>
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
          {!field.builtin && deleteButton(field)}
        </Flex>
      ))}
      {/* The «其它» group is gone with its last member: «卡 / 空闲» and «来源»
          were both removed in review, and a group heading over nothing reads
          as a section that failed to load. */}
      <Divider />
      <Flex orientation="vertical" align="flex-start">
        {/* 🔴 One entry, not two. This popover used to offer «添加层级…»
            beside «标签键映射…», and both ended in the same place — the chain
            editor, which is where a layer is created, renamed, keyed and
            ordered. Splitting «add» out of «manage» made one of those four
            operations look like it lived somewhere else. The popover's own job
            is column visibility; layer management is one topic and gets one
            door. */}
        <Button
          type="link"
          size="small"
          style={{ padding: 0 }}
          onClick={() => {
            setOpen(false);
            onOpenMapping();
          }}
        >
          {intl.formatMessage({ id: 'clusters.topology.columns.manage' })}
        </Button>
      </Flex>
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
