import { createStyles } from 'antd-style';
import React from 'react';

const useStyles = createStyles(({ token, css }) => ({
  /* Clear of the largest gap INSIDE a card — the 40 between two rows — and four
     times the 12 that ties a title to the card under it, so a heading always
     reads as belonging downward. */
  section: css`
    & + & {
      margin-top: 48px;
    }
  `,
  /* The title sits OUTSIDE the card, level with its left edge. Being outside
     the box is a difference in kind, and it is the whole hierarchy signal — no
     tint, no rule, no extra weight needed. Inside the card it took a recessed
     band to stop reading as a peer of the row titles, and that band ended up
     the loudest thing on a page otherwise made of white and hairlines.
     The cost, accepted knowingly: a section title lands on the card's border
     box while row titles sit 25px further in (1px border + 24 padding), so the
     two heading levels do not share a left edge. What the title aligns to is
     the structural left margin every card on the page starts from. */
  header: css`
    margin-bottom: 12px;
  `,
  title: css`
    margin: 0;
    font-size: 16px;
    /* 500, the one weight the product's title tier sits at — page title, drawer
       title, core-ui's SectionTitle. That component states the remedy for a
       section needing more emphasis: more space or a rule, not more weight.
       Here position does it, so neither is needed. */
    font-weight: var(--font-weight-medium);
    color: ${token.colorTextHeading};
    line-height: 24px;
  `,
  description: css`
    margin: 4px 0 0;
    font-size: 13px;
    /* Secondary, not tertiary: 13px is normal text, so AA wants 4.5:1 and
       tertiary measures 3.3 here. visual-refresh.md already ruled on the same
       token for the sidebar's resting text. */
    color: ${token.colorTextSecondary};
    line-height: 20px;
  `,
  card: css`
    border: 1px solid ${token.colorBorder};
    border-radius: 8px;
    background: ${token.colorBgContainer};
    overflow: hidden;
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
      <div className={styles.card}>{children}</div>
    </section>
  );
};

SettingsSection.displayName = 'SettingsSection';

export default SettingsSection;
