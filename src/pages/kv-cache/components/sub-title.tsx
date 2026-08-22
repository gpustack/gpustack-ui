import { createStyles } from 'antd-style';
import React from 'react';

const useStyles = createStyles(({ css }) => ({
  subTitle: css`
    font-size: var(--font-size-middle);
    font-weight: 700;
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
