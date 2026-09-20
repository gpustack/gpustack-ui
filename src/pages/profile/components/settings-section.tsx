import { SectionHeader } from '@gpustack/core-ui';
import { createStyles } from 'antd-style';
import React from 'react';

const useStyles = createStyles(({ token, css }) => ({
  /* Clear of the largest gap INSIDE a card — the 40 between two rows — and four
     times the 12 that used to tie a title to the card under it, so a heading
     always reads as belonging downward. */
  section: css`
    & + & {
      margin-top: 48px;
    }
  `,
  /* The card now carries its own heading, so the title has moved back inside
     it — which is what the other three Settings-style pages do.

     That was tried once before and reverted: an in-card heading needs
     something to stop its rule reading as one more row separator (this card
     has an inset SettingDivider between Theme and Language), and the first
     attempt used a tinted band for that. The band ended up the loudest thing
     on a page otherwise made of white and hairlines. SectionHeader’s icon
     does the same job by changing the heading row's SHAPE instead of filling
     it, so the card stays quiet and the two lines stay distinguishable. */
  card: css`
    border: 1px solid ${token.colorBorder};
    /* 6, the theme's borderRadiusLG and what Branding / Billing / License
       all use. 8 was this page's own value. */
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorBgContainer};
    overflow: hidden;
  `,
  /* The header is inset with the card; the rows below it bring their own
     24px padding, so only the header needs it here. */
  header: css`
    padding: 20px 24px 0;
  `
}));

interface SettingsSectionProps {
  icon: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  icon,
  title,
  description,
  children
}) => {
  const { styles } = useStyles();
  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <div className={styles.header}>
          <SectionHeader
            icon={icon}
            title={title}
            description={description}
            style={{ marginBottom: 0 }}
          />
        </div>
        {children}
      </div>
    </section>
  );
};

SettingsSection.displayName = 'SettingsSection';

export default SettingsSection;
