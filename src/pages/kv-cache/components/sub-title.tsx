import { createStyles } from 'antd-style';
import React from 'react';

const useStyles = createStyles(({ css }) => ({
  // Same treatment as core-ui's `SectionTitle` (this is the same thing under a
  // different name) — only the vertical rhythm is local, because these headings
  // separate large detail-page blocks rather than form groups. 700 was the
  // heaviest title in the product; the title tier is `medium` now.
  subTitle: css`
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--ant-color-text);
    margin-block: 24px 16px;
  `
}));

// section heading used across the detail page blocks
const SubTitle: React.FC<
  React.PropsWithChildren<{ style?: React.CSSProperties }>
> = ({ children, style }) => {
  const { styles } = useStyles();
  return (
    <div className={styles.subTitle} style={style}>
      {children}
    </div>
  );
};

export default SubTitle;
