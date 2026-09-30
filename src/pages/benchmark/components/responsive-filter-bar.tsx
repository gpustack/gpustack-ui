import { FilterBar } from '@gpustack/core-ui';
import { createStyles } from 'antd-style';
import type { ComponentProps } from 'react';

const useStyles = createStyles(({ css }) => ({
  bar: css`
    /* FilterBar renders PageTools with left and right direct children. */
    & > div {
      gap: var(--ant-margin);
      flex-wrap: wrap;
    }

    & > div > :first-child {
      flex: 1;
      min-width: min(100%, 180px);
    }

    & > div > :last-child {
      flex-shrink: 0;
      max-width: 100%;
    }
  `
}));

/** Allocates the space left over after the toolbar's right actions. */
const ResponsiveFilterBar = (props: ComponentProps<typeof FilterBar>) => {
  const { styles } = useStyles();
  return (
    <div className={styles.bar}>
      <FilterBar {...props} />
    </div>
  );
};

export default ResponsiveFilterBar;
