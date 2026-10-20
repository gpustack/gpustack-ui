import { useIntl } from '@umijs/max';
import { Flex } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';

// Tooltip backgrounds stay dark in both themes, so their content uses
// white foreground tokens rather than the page's themed text colours.
const useStyles = createStyles(({ css }) => ({
  content: css`
    min-width: 240px;
    font-size: 13px;
    line-height: 1.5;

    .divider {
      margin: 8px 0;
      border-top: 1px solid var(--color-white-light-1);
    }
    .label {
      flex: none;
      color: var(--color-white-tertiary);
    }
    .label .anticon {
      font-size: 12px;
      color: var(--color-white-quaternary);
    }
    .value {
      color: var(--color-white-secondary);
      word-break: break-all;
      text-align: right;
    }
    .hint {
      font-size: 12px;
      color: var(--color-white-quaternary);
      text-align: right;
    }
    .metric-unit {
      margin-left: 4px;
      font-size: 12px;
      font-weight: 400;
      color: var(--color-white-tertiary);
    }
  `
}));

export interface GroupedInfoTooltipRow {
  label: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  labelValues?: Record<string, string | number>;
  hint?: React.ReactNode;
}

const GroupedInfoTooltipContent: React.FC<{
  groups: GroupedInfoTooltipRow[][];
  /** Whether labels are message ids. Disable for already resolved names. */
  locale?: boolean;
}> = ({ groups, locale = true }) => {
  const intl = useIntl();
  const { styles } = useStyles();

  return (
    <div className={styles.content}>
      {groups
        .filter((rows) => rows.length > 0)
        .map((rows, index) => (
          <React.Fragment key={`${rows[0].label}-${index}`}>
            {index > 0 && <div className="divider" />}
            <Flex vertical gap={6}>
              {rows.map(({ label, icon, value, labelValues, hint }) => (
                <Flex vertical gap={2} key={label}>
                  <Flex align="flex-start" justify="space-between" gap={16}>
                    <Flex align="center" gap={6} className="label">
                      {icon}
                      <span>
                        {locale
                          ? intl.formatMessage({ id: label }, labelValues)
                          : label}
                      </span>
                    </Flex>
                    <span className="value">{value}</span>
                  </Flex>
                  {hint && <span className="hint">{hint}</span>}
                </Flex>
              ))}
            </Flex>
          </React.Fragment>
        ))}
    </div>
  );
};

export default GroupedInfoTooltipContent;
