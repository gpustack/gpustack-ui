import { QuestionCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Flex, Form, Switch, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { LB_POLICY_PLUGINS } from '../../config';
import type { FormData } from '../../config/types';

const useStyles = createStyles(({ css }) => ({
  section: css`
    border: 1px solid var(--ant-color-border);
    border-radius: 6px;
    padding: 14px 10px 12px;
    margin-bottom: 12px;
  `,
  title: css`
    color: var(--ant-color-text-tertiary);
    font-size: var(--ant-font-size);
  `,
  help: css`
    color: var(--ant-color-text-tertiary);
    cursor: help;
  `
}));

const PolicyPluginSection = ({
  plugin,
  onSwitchChange,
  children
}: {
  plugin: keyof typeof LB_POLICY_PLUGINS;
  onSwitchChange?: (checked: boolean) => void;
  children: ReactNode;
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const form = Form.useFormInstance<FormData>();
  const switchName = ['plugins', plugin, 'enabled'];
  const enabled = !!Form.useWatch(switchName, form);
  const { titleId, tipsId } = LB_POLICY_PLUGINS[plugin];

  return (
    <div className={styles.section}>
      <Flex
        align="center"
        justify="space-between"
        gap="small"
        style={{ marginBottom: enabled ? 'var(--ant-margin)' : 0 }}
      >
        <Flex
          component="span"
          align="center"
          gap="var(--ant-padding-xs)"
          className={styles.title}
        >
          {intl.formatMessage({ id: titleId })}
          <Tooltip title={intl.formatMessage({ id: tipsId })}>
            <QuestionCircleOutlined className={styles.help} />
          </Tooltip>
        </Flex>
        <Form.Item name={switchName} valuePropName="checked" noStyle>
          <Switch size="small" onChange={onSwitchChange} />
        </Form.Item>
      </Flex>
      {enabled && children}
    </div>
  );
};

export default PolicyPluginSection;
