import { Flex } from 'antd';
import { createStyles } from 'antd-style';
import { useState } from 'react';
import FilterControl from './filter-control';
import FilterPopover from './filter-popover';
import { getFilterClearPatch, isFilterActive } from './filter-values';
import type { ResponsiveFilterConfig, ResponsiveFiltersProps } from './types';
import useFilterOverflow from './use-filter-overflow';

export { default as FilterOptionGroup } from './filter-option-group';
export type {
  FilterOption,
  FilterOptionGroupProps
} from './filter-option-group';
export { default as ResponsiveFilterBar } from './responsive-filter-bar';
export type {
  FilterChangeInfo,
  FilterRenderContext,
  ResponsiveFilterConfig,
  ResponsiveFiltersProps
} from './types';

const useStyles = createStyles(({ css }) => ({
  row: css`
    width: 100%;
    min-width: 0;
  `,
  fixed: css`
    flex-shrink: 0;
  `
}));

/** Controlled filters; all layout and popover interactions are owned here. */
const ResponsiveFilters = <Values extends object>({
  filters,
  values,
  onChange,
  suffix,
  popoverWidth
}: ResponsiveFiltersProps<Values>) => {
  const { styles } = useStyles();
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [pressingActions, setPressingActions] = useState(false);
  const autoFilters = filters.filter(
    (filter) => filter.placement !== 'popover'
  );
  const { containerRef, reservedRef, visibleCount } = useFilterOverflow({
    widths: autoFilters.map((filter) => filter.width ?? 160),
    locked:
      pressingActions ||
      filters.some(
        (filter) => filter.key === focusedKey || openKeys.includes(filter.key)
      )
  });

  const hiddenKeys = new Set(
    autoFilters.slice(visibleCount).map((filter) => filter.key)
  );
  const popoverFilters = filters.filter(
    (filter) => filter.placement === 'popover' || hiddenKeys.has(filter.key)
  );

  const renderFilter = (
    filter: ResponsiveFilterConfig<Values>,
    overflow = false
  ) => (
    <div
      key={filter.key}
      style={{
        width: overflow ? '100%' : (filter.width ?? 160),
        flexShrink: 0
      }}
      onFocusCapture={() => setFocusedKey(filter.key)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocusedKey(null);
        }
      }}
    >
      <FilterControl
        filter={filter}
        context={{
          value: values[filter.key],
          onChange: (value) =>
            onChange({ [filter.key]: value } as Partial<Values>, {
              reason: 'change',
              filter
            }),
          onOpenChange: (open) =>
            setOpenKeys((previous) =>
              open
                ? previous.includes(filter.key)
                  ? previous
                  : [...previous, filter.key]
                : previous.filter((key) => key !== filter.key)
            )
        }}
      />
    </div>
  );

  return (
    <Flex ref={containerRef} align="center" gap={8} className={styles.row}>
      {autoFilters.slice(0, visibleCount).map((filter) => renderFilter(filter))}
      <Flex
        ref={reservedRef}
        align="center"
        gap={8}
        className={styles.fixed}
        onPointerDownCapture={(event) => {
          // Blurring an editor can move this button before mouseup. Keep the
          // row stable until click dispatch; portal controls are excluded.
          if (
            event.button === 0 &&
            event.target instanceof Element &&
            event.currentTarget.contains(event.target) &&
            !event.target.closest('button:disabled')
          ) {
            setPressingActions(true);
          }
        }}
        onClickCapture={() => setPressingActions(false)}
        onPointerCancel={() => setPressingActions(false)}
        onPointerLeave={() => setPressingActions(false)}
      >
        <FilterPopover
          width={popoverWidth}
          count={
            popoverFilters.filter((filter) => isFilterActive(filter, values))
              .length
          }
          onClear={() =>
            onChange(getFilterClearPatch(popoverFilters), {
              reason: 'clear',
              filters: popoverFilters
            })
          }
        >
          {popoverFilters.map((filter) => renderFilter(filter, true))}
        </FilterPopover>
        {suffix}
      </Flex>
    </Flex>
  );
};

export default ResponsiveFilters;
