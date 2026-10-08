import { FiltersButton, OverlayScroller } from '@gpustack/core-ui';
import { ConfigProvider, Flex, Popover, theme } from 'antd';
import { createStyles } from 'antd-style';
import { Children, useRef, useState, type ReactNode } from 'react';

const useStyles = createStyles(({ css }) => ({
  menu: css`
    max-width: calc(100vw - 32px);
  `,
  controls: css`
    padding: var(--ant-padding-sm);
  `
}));

const FilterPopover = ({
  children,
  count,
  onClear,
  width = 220
}: {
  children: ReactNode;
  count: number;
  onClear: () => void;
  width?: number;
}) => {
  const { token } = theme.useToken();
  const { styles } = useStyles();
  const [open, setOpen] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(64);
  const contentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const hasFilters = Children.count(children) > 0;

  const changeOpen = (nextOpen: boolean) => {
    if (nextOpen && !hasFilters) return;
    if (nextOpen && triggerRef.current) {
      setScrollOffset(
        triggerRef.current.getBoundingClientRect().bottom +
          token.marginXS +
          token.margin
      );
    }
    setOpen(nextOpen);
    if (!nextOpen && contentRef.current?.contains(document.activeElement)) {
      // Release the focused control's layout lock when closing with Escape.
      triggerRef.current?.querySelector('button')?.focus();
    }
  };

  return (
    <Popover
      open={open && hasFilters}
      onOpenChange={changeOpen}
      trigger="click"
      arrow={false}
      placement="bottomLeft"
      content={
        <div
          ref={contentRef}
          className={styles.menu}
          style={{ width }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') changeOpen(false);
          }}
        >
          <OverlayScroller
            maxHeight={`max(0px, calc(100vh - ${scrollOffset}px))`}
            styles={{ wrapper: { padding: 0 } }}
          >
            {/* OverlayScroller reparents its direct children. All dynamic
                controls must remain inside this single, stable host. */}
            <div>
              <Flex vertical gap={8} className={styles.controls}>
                {children}
              </Flex>
            </div>
          </OverlayScroller>
        </div>
      }
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
        <ConfigProvider componentDisabled={hasFilters ? undefined : true}>
          <FiltersButton
            onClick={() => {}}
            count={count}
            onClear={() => {
              onClear();
              changeOpen(false);
            }}
          />
        </ConfigProvider>
      </div>
    </Popover>
  );
};

export default FilterPopover;
