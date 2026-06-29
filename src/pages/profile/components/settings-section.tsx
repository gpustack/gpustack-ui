import { createStyles } from 'antd-style';
import React from 'react';

const useStyles = createStyles(({ token, css }) => ({
  section: css`
    & + & {
      margin-top: 40px;
    }
  `,
  header: css`
    margin-bottom: 16px;
  `,
  title: css`
    margin: 0;
    font-size: 16px;
    font-weight: var(--font-weight-medium);
    color: ${token.colorTextHeading};
    line-height: 24px;
  `,
  description: css`
    margin: 4px 0 0;
    font-size: 13px;
    color: ${token.colorTextTertiary};
    line-height: 20px;
  `
}));

interface SettingsSectionProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  children
}) => {
  const { styles } = useStyles();
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {children}
    </section>
  );
};

SettingsSection.displayName = 'SettingsSection';

export default SettingsSection;
