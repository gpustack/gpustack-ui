import { createStyles } from 'antd-style';
import React from 'react';

const useStyles = createStyles(({ token, css }) => ({
  group: css`
    /* Match the page panel surface (page-box.less): 8px radius + the
       lighter container border, rather than the heavier component token. */
    border: 1px solid ${token.colorBorder};
    border-radius: 8px;
    background: ${token.colorBgContainer};
    overflow: hidden;
  `,
  row: css`
    padding: 16px 20px;

    & + & {
      border-top: 1px solid ${token.colorBorderSecondary};
    }
  `,
  head: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  `,
  info: css`
    min-width: 0;
  `,
  title: css`
    font-size: 14px;
    font-weight: var(--font-weight-medium);
    color: ${token.colorText};
    line-height: 22px;
  `,
  description: css`
    margin-top: 2px;
    font-size: 13px;
    color: ${token.colorTextTertiary};
    line-height: 20px;
  `,
  extra: css`
    flex-shrink: 0;
  `,
  body: css`
    margin-top: 16px;
  `
}));

export const SettingsGroup: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { styles } = useStyles();
  return <div className={styles.group}>{children}</div>;
};

interface SettingRowProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  extra?: React.ReactNode;
  children?: React.ReactNode;
}

export const SettingRow: React.FC<SettingRowProps> = ({
  title,
  description,
  extra,
  children
}) => {
  const { styles } = useStyles();
  return (
    <div className={styles.row}>
      <div className={styles.head}>
        <div className={styles.info}>
          <div className={styles.title}>{title}</div>
          {description && (
            <div className={styles.description}>{description}</div>
          )}
        </div>
        {extra && <div className={styles.extra}>{extra}</div>}
      </div>
      {children && <div className={styles.body}>{children}</div>}
    </div>
  );
};
