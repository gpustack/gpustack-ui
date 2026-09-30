import { CheckOutlined } from '@ant-design/icons';
import { FiltersButton, OverlayScroller } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Popover, theme } from 'antd';
import { createStyles } from 'antd-style';
import { useRef, useState } from 'react';
import { loadTypeOptions, targetModeOptions } from '../config';
import type { BenchmarkFilterValues, TextFilterKey } from '../config/types';
import type { ResponsiveFilterItem } from './responsive-filters';

interface FilterMenuProps {
  values: BenchmarkFilterValues;
  onChange: (values: Partial<BenchmarkFilterValues>) => void;
  overflowItems: ResponsiveFilterItem<TextFilterKey>[];
}

const useStyles = createStyles(({ css }) => ({
  menu: css`
    width: 280px;
    max-width: calc(100vw - 32px);
  `,
  group: css`
    padding: var(--ant-padding-sm);

    & + & {
      border-top: 1px solid var(--ant-color-split);
    }
  `,
  heading: css`
    padding: 0 var(--ant-padding-xs) var(--ant-padding-xs);
    color: var(--ant-color-text-tertiary);
    font-size: 14px;
  `,
  item: css`
    width: 100%;
    min-height: 40px;
    padding: var(--ant-padding-xs);
    border: 0;
    border-radius: var(--ant-border-radius);
    background: transparent;
    color: var(--ant-color-text);
    text-align: left;
    cursor: pointer;

    &:hover,
    &:focus-visible {
      background: var(--ant-color-fill-tertiary);
    }

    &:focus-visible {
      outline: 2px solid var(--ant-color-primary);
      outline-offset: -2px;
    }
  `,
  label: css`
    min-width: 0;
    overflow-wrap: anywhere;
  `,
  check: css`
    flex-shrink: 0;
    width: 16px;
    color: var(--ant-color-text-secondary);
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
      options: targetModeOptions.map((item) => ({
        value: item.value,
        label: intl.formatMessage({ id: item.label })
      }))
    },
    {
      key: 'load_type' as const,
      label: intl.formatMessage({ id: 'benchmark.form.loadType' }),
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
          {overflowItems.length > 0 && (
            <Flex vertical gap="small" className={styles.group}>
              {overflowItems.map(({ key, content }) => (
                <div key={key}>{content}</div>
              ))}
            </Flex>
          )}
          {filters.map((filter) => (
            <div
              key={filter.key}
              role="group"
              aria-label={filter.label}
              className={styles.group}
            >
              <div className={styles.heading}>{filter.label}</div>
              {filter.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={styles.item}
                  aria-pressed={values[filter.key] === option.value}
                  onClick={() =>
                    onChange({
                      [filter.key]:
                        values[filter.key] === option.value
                          ? undefined
                          : option.value
                    })
                  }
                >
                  <Flex align="center" justify="space-between" gap={8}>
                    <span className={styles.label}>{option.label}</span>
                    <span className={styles.check} aria-hidden="true">
                      {values[filter.key] === option.value && <CheckOutlined />}
                    </span>
                  </Flex>
                </button>
              ))}
            </div>
          ))}
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
