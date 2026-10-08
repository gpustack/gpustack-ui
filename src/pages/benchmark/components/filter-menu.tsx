import { FiltersButton, OverlayScroller } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Popover, theme } from 'antd';
import { createStyles } from 'antd-style';
import { useRef, useState } from 'react';
import { loadTypeOptions, targetModeOptions } from '../config';
import type { BenchmarkFilterValues, TextFilterKey } from '../config/types';
import FilterOptionGroup from './filter-option-group';
import type { ResponsiveFilterItem } from './responsive-filters';

interface FilterMenuProps {
  values: BenchmarkFilterValues;
  onChange: (values: Partial<BenchmarkFilterValues>) => void;
  overflowItems: ResponsiveFilterItem<TextFilterKey>[];
}

const useStyles = createStyles(({ css }) => ({
  menu: css`
    width: 220px;
    max-width: calc(100vw - 32px);
  `,
  controls: css`
    padding: var(--ant-padding-sm);
  `
}));

const FilterMenu: React.FC<FilterMenuProps> = ({
  values,
  onChange,
  overflowItems
}) => {
  const intl = useIntl();
  const { token } = theme.useToken();
  const { styles } = useStyles();
  const [open, setOpen] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(64);
  const contentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const changeOpen = (nextOpen: boolean) => {
    if (nextOpen && triggerRef.current) {
      setScrollOffset(
        triggerRef.current.getBoundingClientRect().bottom +
          token.marginXS +
          token.margin
      );
    }
    setOpen(nextOpen);
    if (!nextOpen && contentRef.current?.contains(document.activeElement)) {
      // Closing with Escape must also release the focused control's layout lock.
      triggerRef.current?.querySelector('button')?.focus();
    }
  };

  const filters = [
    {
      key: 'target_mode' as const,
      label: intl.formatMessage({ id: 'benchmark.form.targetMode' }),
      placeholder: intl.formatMessage({
        id: 'benchmark.table.filter.byTargetMode'
      }),
      options: targetModeOptions.map((item) => ({
        value: item.value,
        label: intl.formatMessage({ id: item.label })
      }))
    },
    {
      key: 'load_type' as const,
      label: intl.formatMessage({ id: 'benchmark.form.loadType' }),
      placeholder: intl.formatMessage({
        id: 'benchmark.table.filter.byLoadType'
      }),
      options: loadTypeOptions.map((item) => ({
        value: item.value,
        label: intl.formatMessage({ id: item.label })
      }))
    }
  ];
  const count =
    filters.filter(({ key }) => !!values[key]).length +
    overflowItems.filter(({ key }) => !!values[key]).length;

  const content = (
    <div
      ref={contentRef}
      className={styles.menu}
      onKeyDown={(event) => {
        if (event.key === 'Escape') changeOpen(false);
      }}
    >
      <OverlayScroller
        maxHeight={`max(0px, calc(100vh - ${scrollOffset}px))`}
        styles={{ wrapper: { padding: 0 } }}
      >
        {/* OverlayScroller reparents its direct children. Keep this host stable
            so React inserts/removes dynamic groups within its own container. */}
        <div>
          <Flex vertical gap={8} className={styles.controls}>
            {overflowItems.map(({ key, content }) => (
              <div key={key}>{content}</div>
            ))}
            {filters.map((filter) => (
              <FilterOptionGroup
                key={filter.key}
                mode="select"
                label={filter.label}
                placeholder={filter.placeholder}
                options={filter.options}
                value={values[filter.key]}
                onChange={(value) => onChange({ [filter.key]: value })}
              />
            ))}
          </Flex>
        </div>
      </OverlayScroller>
    </div>
  );

  return (
    <Popover
      open={open}
      onOpenChange={changeOpen}
      trigger="click"
      arrow={false}
      placement="bottomLeft"
      content={content}
      styles={{
        container: {
          padding: 0,
          border: '1px solid var(--ant-color-border)',
          backgroundColor: 'var(--ant-color-bg-container)',
          boxShadow: 'var(--ant-box-shadow-secondary)',
          borderRadius: 6,
          overflow: 'hidden'
        }
      }}
    >
      <div
        ref={triggerRef}
        onKeyDown={(event) => {
          if (event.key === 'Escape') changeOpen(false);
        }}
      >
        <FiltersButton
          onClick={() => {}}
          count={count}
          onClear={() => {
            onChange({
              target_mode: undefined,
              load_type: undefined,
              ...Object.fromEntries(overflowItems.map(({ key }) => [key, '']))
            });
            changeOpen(false);
          }}
        />
      </div>
    </Popover>
  );
};

export default FilterMenu;
