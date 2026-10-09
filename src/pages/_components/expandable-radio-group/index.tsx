import type { RadioGroupProps as AntRadioGroupProps } from 'antd';
import { Flex, Radio } from 'antd';
import { createStyles } from 'antd-style';
import React, { useId } from 'react';

export interface ExpandableRadioGroupItem<T extends string = string> {
  key: T;
  label: React.ReactNode;
  description?: React.ReactNode;
  /** Mounted only while this item is selected. */
  children?: React.ReactNode;
  disabled?: boolean;
}

export type ExpandableRadioGroupSlot = 'item' | 'card' | 'content';

export interface ExpandableRadioGroupProps<T extends string = string>
  extends
    Pick<
      AntRadioGroupProps,
      'id' | 'name' | 'disabled' | 'className' | 'style' | 'onBlur' | 'onFocus'
    >,
    React.AriaAttributes {
  value?: T;
  onChange?: (value: T) => void;
  items: ExpandableRadioGroupItem<T>[];
  /** Keep the selected card's background unchanged, like CardRadioGroup. */
  ghost?: boolean;
  classNames?: Partial<Record<ExpandableRadioGroupSlot, string>>;
  styles?: Partial<Record<ExpandableRadioGroupSlot, React.CSSProperties>>;
}

const useStyles = createStyles(({ css }, { ghost }: { ghost: boolean }) => ({
  root: css`
    width: 100%;
  `,
  item: css`
    min-width: 0;
  `,
  card: css`
    width: 100%;
    min-width: 0;
    border: 1px solid var(--ant-color-border);
    border-radius: var(--ant-border-radius-lg);
    background-color: var(--ant-color-bg-container);
    transition:
      border-color var(--ant-motion-duration-mid),
      background-color var(--ant-motion-duration-mid);

    &:has(> .ant-radio-wrapper:hover):not([data-disabled='true']) {
      border-color: var(--ant-color-primary-hover);
    }

    &[data-selected='true'] {
      border-color: var(--ant-color-border);
      background-color: ${ghost
        ? 'var(--ant-color-bg-container)'
        : 'var(--ant-color-primary-bg)'};

      &:hover {
        border-color: var(--ant-color-border);
      }
    }

    &:has(> .ant-radio-wrapper input:focus-visible) {
      outline: 2px solid var(--ant-color-primary);
      outline-offset: 2px;
    }

    &[data-disabled='true'] {
      border-color: var(--ant-color-border);

      &:hover {
        border-color: var(--ant-color-border);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `,
  header: css`
    && {
      width: 100%;
      min-width: 0;
      margin-inline: 0;
      padding: var(--ant-padding-sm) var(--ant-padding);
      align-items: flex-start;
      border-radius: inherit;
    }

    &.ant-radio-wrapper-disabled {
      opacity: 0.6;
    }
  `,
  radio: css`
    && {
      align-self: flex-start;
      margin-block-start: calc(
        (
            var(--ant-font-size) *
              var(--ant-line-height) - var(--ant-font-size-lg)
          ) /
          2
      );
      border-width: 1.5px;
    }
  `,
  label: css`
    && {
      flex: 1;
      min-width: 0;
      padding-inline-start: var(--ant-padding-xs);
      padding-inline-end: 0;
      overflow-wrap: anywhere;
    }
  `,
  title: css`
    font-weight: var(--font-weight-medium, 500);
    line-height: 1.4;
    color: var(--ant-color-text);
  `,
  description: css`
    color: var(--ant-color-text-secondary);
    font-size: var(--ant-font-size-sm);
    line-height: 1.5;
  `,
  content: css`
    min-width: 0;
    margin-block-start: var(--ant-margin-xs);
    margin-inline: var(--ant-padding);
    padding-block: var(--ant-padding);
    border-block-start: 1px solid var(--ant-color-border-secondary);
    color: var(--ant-color-text);
    font-size: var(--ant-font-size);
    line-height: var(--ant-line-height);
  `
}));

/** Controlled card radios with configuration inside the selected card. */
function ExpandableRadioGroup<T extends string = string>({
  value,
  onChange,
  items,
  ghost = false,
  className,
  classNames,
  styles: slotStyles,
  ...rest
}: ExpandableRadioGroupProps<T>) {
  const { styles, cx } = useStyles({ ghost });
  const groupId = useId();

  return (
    <Radio.Group
      {...rest}
      value={value}
      onChange={(event) => onChange?.(event.target.value as T)}
      className={cx(styles.root, className)}
    >
      <Flex vertical gap="middle">
        {items.map((item) => {
          const itemId = `${groupId}-${encodeURIComponent(item.key)}`;
          const titleId = `${itemId}-title`;
          const descriptionId = `${itemId}-description`;
          const contentId = `${itemId}-content`;
          const selected = value === item.key;
          const disabled = rest.disabled || item.disabled;
          const hasDescription = item.description != null;
          const showContent = selected && item.children != null;

          return (
            <Flex
              key={item.key}
              vertical
              className={cx(styles.item, classNames?.item)}
              style={slotStyles?.item}
            >
              <Flex
                vertical
                data-selected={selected}
                data-disabled={!!disabled}
                className={cx(styles.card, classNames?.card)}
                style={slotStyles?.card}
              >
                <Radio
                  value={item.key}
                  disabled={disabled}
                  aria-labelledby={titleId}
                  aria-describedby={hasDescription ? descriptionId : undefined}
                  aria-controls={showContent ? contentId : undefined}
                  className={styles.header}
                  classNames={{ icon: styles.radio, label: styles.label }}
                >
                  <Flex component="span" vertical gap="var(--ant-padding-xxs)">
                    <span id={titleId} className={styles.title}>
                      {item.label}
                    </span>
                    {hasDescription && (
                      <span id={descriptionId} className={styles.description}>
                        {item.description}
                      </span>
                    )}
                  </Flex>
                </Radio>
                {showContent && (
                  <div
                    id={contentId}
                    role="region"
                    aria-labelledby={titleId}
                    className={cx(styles.content, classNames?.content)}
                    style={slotStyles?.content}
                  >
                    {item.children}
                  </div>
                )}
              </Flex>
            </Flex>
          );
        })}
      </Flex>
    </Radio.Group>
  );
}

export default ExpandableRadioGroup;
