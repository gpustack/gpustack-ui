import { Flex } from 'antd';
import { createStyles } from 'antd-style';
import { useState, type ReactNode } from 'react';
import useFilterOverflow from '../hooks/use-filter-overflow';

export interface ResponsiveFilterItem<Key extends string = string> {
  key: Key;
  width: number;
  content: ReactNode;
  /** For interactions outside the control, such as a Select dropdown portal. */
  locked?: boolean;
}

interface ResponsiveFiltersProps<Key extends string> {
  items: ResponsiveFilterItem<Key>[];
  renderOverflow: (items: ResponsiveFilterItem<Key>[]) => ReactNode;
  suffix?: ReactNode;
}

const useStyles = createStyles(({ css }) => ({
  row: css`
    width: 100%;
    min-width: 0;
  `,
  fixed: css`
    flex-shrink: 0;
  `
}));

/** Layout only: values, requests, and popover content belong to the caller. */
const ResponsiveFilters = <Key extends string>({
  items,
  renderOverflow,
  suffix
}: ResponsiveFiltersProps<Key>) => {
  const { styles } = useStyles();
  const [focusedKey, setFocusedKey] = useState<Key | null>(null);
  const { containerRef, reservedRef, visibleCount } = useFilterOverflow({
    widths: items.map((item) => item.width),
    locked: focusedKey !== null || items.some((item) => item.locked)
  });

  const renderItem = (item: ResponsiveFilterItem<Key>, overflow = false) => (
    <div
      key={item.key}
      style={{ width: overflow ? '100%' : item.width, flexShrink: 0 }}
      onFocusCapture={() => setFocusedKey(item.key)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocusedKey(null);
        }
      }}
    >
      {item.content}
    </div>
  );

  const overflowItems = items.slice(visibleCount).map((item) => ({
    ...item,
    content: renderItem(item, true)
  }));

  return (
    <Flex ref={containerRef} align="center" gap="small" className={styles.row}>
      {items.slice(0, visibleCount).map((item) => renderItem(item))}
      <Flex
        ref={reservedRef}
        align="center"
        gap="small"
        className={styles.fixed}
      >
        {renderOverflow(overflowItems)}
        {suffix}
      </Flex>
    </Flex>
  );
};

export default ResponsiveFilters;
