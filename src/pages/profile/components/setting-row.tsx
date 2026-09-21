import { Divider } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';

const useStyles = createStyles(({ token, css }) => ({
  /* 24 is the card's content inset. Vertically it is written as 20 because text
     brings 4px of half-leading with it — 20 + 4 lands the same optical 24 on
     all four sides. */
  row: css`
    padding: 20px 24px;
  `,
  /* Inset to the rows' own 24 so the line starts where their text does — a line
     running edge to edge reads as a card-level boundary (which is what the
     header's rule is), not as a break between two peers inside it. */
  divider: css`
    width: auto;
    min-width: 0;
    margin: 0 24px;
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
    /* Same 500 as the section title — the product's title tier is one weight
       (see core-ui SectionTitle). What separates them is size (14 vs 16) and
       position: the section title is outside the card, this one is in it. The
       400 option labels in appearance.tsx sit below this tier because they name
       a choice, not a heading. */
    font-weight: var(--font-weight-medium);
    color: ${token.colorText};
    line-height: 22px;
  `,
  /* 4, the same as the header's title→description (settings-section). It was 2
     here: one relationship with two values, 2px apart — below the threshold
     where anyone reads it as hierarchy, so it was only inconsistency. This pair
     needs the gap more than the header's does, if anything: 14 over 13 is a
     1px size difference to separate them by. */
  description: css`
    margin-top: 4px;
    font-size: 13px;
    /* Secondary for the same reason as the section header's: tertiary is
       3.3:1 here, under AA's 4.5 for normal text. */
    color: ${token.colorTextSecondary};
    line-height: 20px;
  `,
  extra: css`
    flex-shrink: 0;
  `,
  /* The 4px below is optical compensation, not a gap. Text carries half-leading
     ((line-height − font-size) / 2 = 4px here), a box does not, so a row that
     ends in one — the theme tiles — sat 4px shallower off the row's bottom edge
     than a text row does, which put the divider under it off-centre between the
     two things it separates. */
  body: css`
    margin-top: 16px;
    margin-bottom: 4px;
  `
}));

export const SettingDivider: React.FC = () => {
  const { styles } = useStyles();
  return <Divider className={styles.divider} />;
};

SettingDivider.displayName = 'SettingDivider';

interface SettingRowProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  extra?: React.ReactNode;
  children?: React.ReactNode;
  styles?: {
    body?: React.CSSProperties;
  };
}

export const SettingRow: React.FC<SettingRowProps> = ({
  title,
  description,
  extra,
  children,
  styles: rowStyles
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
      {children && (
        <div className={styles.body} style={rowStyles?.body}>
          {children}
        </div>
      )}
    </div>
  );
};

SettingRow.displayName = 'SettingRow';
