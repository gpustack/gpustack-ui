import { CheckOutlined } from '@ant-design/icons';
import { BaseSelect } from '@gpustack/core-ui';
import { Flex } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';

export interface FilterOption<Value extends string | number> {
  value: Value;
  label: ReactNode;
  disabled?: boolean;
}

export interface FilterOptionGroupProps<Value extends string | number> {
  label: string;
  placeholder?: ReactNode;
  options: FilterOption<Value>[];
  value?: Value;
  onChange: (value: Value | undefined) => void;
  /** Flat options remain the default; compact groups can use BaseSelect. */
  mode?: 'list' | 'select';
}

const useStyles = createStyles(({ css }) => ({
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

    &:hover:not(:disabled),
    &:focus-visible {
      background: var(--ant-color-fill-tertiary);
    }

    &:focus-visible {
      outline: 2px solid var(--ant-color-primary);
      outline-offset: -2px;
    }

    &:disabled {
      color: var(--ant-color-text-disabled);
      cursor: not-allowed;
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

/** Controlled option presentation, independent of query state and field keys. */
const FilterOptionGroup = <Value extends string | number>({
  label,
  placeholder = label,
  options,
  value,
  onChange,
  mode = 'list'
}: FilterOptionGroupProps<Value>) => {
  const { styles } = useStyles();

  if (mode === 'select') {
    return (
      <BaseSelect
        allowClear
        aria-label={label}
        placeholder={placeholder}
        style={{ width: '100%' }}
        value={value}
        options={options}
        onChange={onChange}
      />
    );
  }

  return (
    <div role="group" aria-label={label}>
      <div className={styles.heading}>{label}</div>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.item}
          disabled={option.disabled}
          aria-pressed={value === option.value}
          onClick={() =>
            onChange(value === option.value ? undefined : option.value)
          }
        >
          <Flex align="center" justify="space-between" gap="small">
            <span className={styles.label}>{option.label}</span>
            <span className={styles.check} aria-hidden="true">
              {value === option.value && <CheckOutlined />}
            </span>
          </Flex>
        </button>
      ))}
    </div>
  );
};

export default FilterOptionGroup;
